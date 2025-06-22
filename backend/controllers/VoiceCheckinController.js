// controllers/VoiceCheckinController.js
const VapiService = require('../services/VapiService'); // Adjust path if necessary
const VoiceCheckin = require('../models/VoiceCheckin'); // Adjust path if necessary
const User = require('../models/User'); // Adjust path if necessary (assuming you have a Mongoose User model)

class VoiceCheckinController {
  /**
   * Start a daily voice check-in call using a pre-configured Vapi assistant.
   * This endpoint receives a request from your frontend or internal system to initiate a call.
   * @route POST /api/voice-checkin/start
   * @body { phoneNumber: string, userId: string, trimester?: number, weekOfPregnancy?: number }
   */
  async startDailyCheckin(req, res) {
    try {
      const { phoneNumber, userId, trimester, weekOfPregnancy } = req.body;

      if (!phoneNumber || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and user ID are required in the request body.'
        });
      }

      // Fetch user details to get pregnancy context (assuming User model exists)
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found for the provided userId.'
        });
      }

      // Determine the specific pregnancy context for the assistant's first message/prompt
      const effectiveTrimester = trimester || user.pregnancyStage?.trimester || 1;
      const effectiveWeekOfPregnancy = weekOfPregnancy || user.pregnancyStage?.weekOfPregnancy || 1;

      // Prepare assistant overrides for this specific call.
      // These properties will temporarily override those defined on your base Vapi assistant
      // in the dashboard, for the duration of this call only.
      const assistantOverrides = {
        firstMessage: `Hi ${user.name || 'there'}! I'm calling for your daily check-in. You're in your ${effectiveTrimester} trimester, week ${effectiveWeekOfPregnancy}. How are you feeling today?`,
        systemPrompt: `You are a helpful and empathetic pregnancy assistant. Your primary goal is to conduct a daily check-in with a pregnant person (who is currently in their ${effectiveTrimester} trimester, week ${effectiveWeekOfPregnancy}). Ask about their physical and emotional well-being, and offer support or relevant information where appropriate. Keep the conversation concise, supportive, and caring. If the user expresses a need for immediate medical attention or severe symptoms, gently guide them to seek professional medical advice.`,
        recordingEnabled: true // Ensure recording is enabled if you want call transcripts and recordings
      };

      // Initiate the outbound call using the VapiService.
      // It will use the default assistant ID from VapiService (from .env)
      // and apply the `assistantOverrides` for this specific call.
      const call = await VapiService.startCall({
        phoneNumber,
        assistantOverrides: assistantOverrides,
        metadata: { userId, pregnancyContext: { trimester: effectiveTrimester, weekOfPregnancy: effectiveWeekOfPregnancy } }
      });

      // Create a record in your MongoDB to track this voice check-in
      const record = await VoiceCheckin.create({
        userId,
        callId: call.id,
        assistantId: VapiService.defaultAssistantId, // Store the ID of the assistant used
        status: 'initiated', // Initial status
        pregnancyContext: { trimester: effectiveTrimester, weekOfPregnancy: effectiveWeekOfPregnancy },
        startedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Voice check-in call initiated successfully!',
        data: {
          callId: call.id,
          checkinRecordId: record._id // Your MongoDB record ID for this check-in
        }
      });
    } catch (error) {
      console.error('Error starting voice checkin:', error?.response?.data || error.message || error);
      res.status(500).json({
        success: false,
        error: 'Failed to start voice check-in. Please check server logs for more details.'
      });
    }
  }

  /**
   * Handle Vapi webhook events.
   * Vapi sends POST requests to this endpoint for various call lifecycle events.
   * @route POST /api/voice-checkin/webhook
   * @body Vapi webhook payload (e.g., { "message": { "type": "call-start", ... } })
   */
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-vapi-signature'];
      const rawBody = req.rawBody; // Captured by the express.json({ verify: ... }) middleware

      // --- Webhook Signature Validation (CRITICAL FOR SECURITY) ---
      if (!signature || !rawBody) {
        console.warn('Webhook received without signature or raw body. Possible malicious request or misconfiguration.');
        return res.status(400).json({ error: 'Bad Request: Missing signature or body for validation.' });
      }

      if (!VapiService.validateWebhookSignature(rawBody, signature)) {
        console.warn('Webhook received with invalid signature! Request potentially tampered with.');
        return res.status(401).json({ error: 'Unauthorized: Invalid signature.' });
      }
      // --- End Signature Validation ---

      const { message } = req.body; // The actual Vapi event object is nested under 'message'

      if (!message || !message.type) {
        console.warn('Webhook received without a valid "message" object or "type" property.');
        return res.status(400).json({ error: 'Invalid webhook message format.' });
      }

      console.log(`Received Vapi webhook event: "${message.type}" for call ID: ${message.call?.id}`);

      let updateQuery = {}; // Object to build MongoDB update operations
      let transcriptUpdate = {}; // Separate object for transcript array push

      switch (message.type) {
        case 'call-start':
          updateQuery = { status: 'in-progress' };
          break;

        case 'call-end':
          // This event contains the final call details, including the full transcript and recording URL
          updateQuery = {
            status: message.call.status === 'success' ? 'completed' : 'failed', // Mark call status based on Vapi's final status
            endedAt: message.call.endedAt ? new Date(message.call.endedAt) : new Date(),
            fullTranscript: message.call.transcript || '', // Store the full conversation transcript
            recordingUrl: message.call.recordingUrl || null // Store the recording URL if available
          };
          break;

        case 'transcript':
          // This event provides individual turns of speech in real-time
          // Accumulate these into an array in your database
          transcriptUpdate = {
            $push: {
              transcriptChunks: {
                role: message.transcript.role, // 'user' or 'assistant'
                text: message.transcript.transcript,
                startTime: message.transcript.startTime,
                endTime: message.transcript.endTime,
                timestamp: new Date() // Record when this chunk was received
              }
            }
          };
          break;

        case 'function-call':
          console.log(`Vapi assistant requested function: "${message.functionCall.name}" with parameters:`, message.functionCall.parameters);

          // --- IMPORTANT: Implement your custom function (tool) handling here ---
          // The AI decides to call a function. Your backend executes the logic,
          // then sends a 'result' object back to Vapi to tell the AI what to say next.

          if (message.functionCall.name === 'logSymptom') {
            const { symptom, severity } = message.functionCall.parameters;
            const userId = message.call.metadata?.userId; // Retrieve userId from call metadata

            if (userId && symptom) {
              console.log(`[Function Handler] User ${userId} reported symptom: ${symptom} (Severity: ${severity || 'not specified'}).`);
              // TODO: Implement actual logic to save this symptom to your database
              // Example: await SymptomModel.create({ userId, symptom, severity, timestamp: new Date() });

              // Send a response back to Vapi that the assistant can speak to the user
              return res.json({
                result: {
                  message: `Okay, I've noted down your ${symptom}. Is there anything else I can help you with regarding your health?`
                }
              });
            } else {
              console.warn(`[Function Handler] logSymptom: Missing required parameters (userId or symptom).`);
              return res.json({
                result: {
                  message: `I couldn't log the symptom due to missing information. Could you please clarify?`
                }
              });
            }
          } else if (message.functionCall.name === 'endCall') {
            console.log('[Function Handler] Assistant explicitly requested to end the call.');
            // This tells Vapi to hang up the phone
            return res.json({
              result: {
                endCall: true
              }
            });
          }
          // Add more `else if` blocks for other custom functions your assistant might call

          // Fallback for unhandled functions - Important for graceful degradation
          console.warn(`[Function Handler] Unhandled function call: "${message.functionCall.name}". No specific action defined.`);
          return res.json({
            result: {
              message: `I received a request to perform "${message.functionCall.name}", but I'm not configured to handle that specific action yet. Is there something else I can assist you with?`
            }
          });

        default:
          console.log(`Webhook: Unhandled Vapi message type encountered: "${message.type}".`);
          break;
      }

      // Apply the accumulated updates to the VoiceCheckin record in MongoDB
      if (Object.keys(updateQuery).length > 0 || Object.keys(transcriptUpdate).length > 0) {
        await VoiceCheckin.findOneAndUpdate(
          { callId: message.call.id }, // Find the record by Vapi's call ID
          { ...updateQuery, ...transcriptUpdate }, // Merge all updates (status, endedAt, fullTranscript, pushed chunks)
          { new: true, upsert: true } // Return the updated document, create if not found
        );
      }

      res.status(200).json({ success: true, message: 'Webhook event processed successfully.' }); // Acknowledge receipt
    } catch (error) {
      console.error('Error processing webhook:', error?.response?.data || error.message || error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook event. Please check server logs for details.'
      });
    }
  }

  /**
   * Retrieve a user's voice check-in history.
   * @route GET /api/voice-checkin/history?userId=<id>&limit=<n>&offset=<m>
   */
  async getCheckinHistory(req, res) {
    try {
      const { userId, limit = 10, offset = 0 } = req.query; // Query parameters for user ID and pagination

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required in query parameters.' });
      }

      const parsedLimit = parseInt(limit, 10);
      const parsedOffset = parseInt(offset, 10);

      const checkins = await VoiceCheckin.find({ userId })
        .sort({ startedAt: -1 }) // Sort by most recent first
        .limit(parsedLimit)
        .skip(parsedOffset);

      const totalCount = await VoiceCheckin.countDocuments({ userId });

      res.json({
        success: true,
        data: checkins,
        pagination: {
          total: totalCount,
          limit: parsedLimit,
          offset: parsedOffset,
          page: Math.floor(parsedOffset / parsedLimit) + 1, // Calculate current page number
          pages: Math.ceil(totalCount / parsedLimit) // Calculate total pages
        }
      });
    } catch (error) {
      console.error('Error getting checkin history:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve check-in history.' });
    }
  }

  /**
   * Retrieve details for a specific voice check-in record by its ID.
   * @route GET /api/voice-checkin/:id
   * @params { id: string } - The MongoDB _id of the VoiceCheckin record.
   */
  async getCheckinById(req, res) {
    try {
      const { id } = req.params; // Matches the ':id' parameter in the route definition

      if (!id) {
        return res.status(400).json({ success: false, error: 'Check-in record ID is required in path parameters.' });
      }

      const checkin = await VoiceCheckin.findById(id);

      if (!checkin) {
        return res.status(404).json({ success: false, error: 'Check-in record not found for the provided ID.' });
      }

      res.json({ success: true, data: checkin });
    } catch (error) {
      console.error('Error getting checkin details:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve check-in details.' });
    }
  }

  /**
   * Placeholder for retrieving wellness trends analysis for a user.
   * @route GET /api/voice-checkin/trends?userId=<id>&days=<n>
   */
  async getWellnessTrends(req, res) {
    try {
      const { userId, days } = req.query; // userId and days from query parameters

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required in query parameters.' });
      }

      console.log(`[Placeholder] Fetching wellness trends for user ${userId} for the last ${days || 'all'} days.`);

      // TODO: Implement actual wellness trends analysis here.
      // This typically involves:
      // - Querying VoiceCheckin records for the user.
      // - Analyzing transcripts (e.g., using sentiment analysis, keyword extraction, or an LLM for summarization).
      // - Aggregating data over the specified 'days' period.

      res.json({
        success: true,
        message: 'Wellness trends analysis not yet implemented. Returning placeholder data.',
        data: {
          userId,
          trends: [
            { date: '2025-06-15', sentiment: 'positive', notableMentions: ['good energy', 'restful sleep'] },
            { date: '2025-06-16', sentiment: 'neutral', notableMentions: ['mild fatigue'] }
          ]
        }
      });
    } catch (error) {
      console.error('Error getting wellness trends:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve wellness trends.' });
    }
  }

  /**
   * Placeholder for retrieving check-ins that may need attention (e.g., for healthcare providers).
   * @route GET /api/voice-checkin/attention?page=<n>&limit=<m>
   */
  async getCheckinsNeedingAttention(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query; // Pagination for the list

      console.log(`[Placeholder] Fetching check-ins needing attention (Page: ${page}, Limit: ${limit}).`);

      // TODO: Implement logic to identify check-ins that need attention.
      // This could be based on:
      // - Specific keywords/phrases in transcripts.
      // - Sentiment analysis scores.
      // - User-reported symptoms of a certain severity.
      // - Missed check-ins.

      res.json({
        success: true,
        message: 'Check-ins needing attention analysis not yet implemented. Returning placeholder data.',
        data: {
          needsAttention: [
            { checkinId: '6677a2c3d4e5f6a7b8c9d0e1', userId: 'userA', reason: 'High negative sentiment in last check-in' },
            { checkinId: '6677b1c2d3e4f5a6b7c8d9e0', userId: 'userB', reason: 'Mention of severe pain' }
          ]
        }
      });
    } catch (error) {
      console.error('Error getting check-ins needing attention:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve check-ins needing attention.' });
    }
  }
}

module.exports = new VoiceCheckinController();
