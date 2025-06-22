// controllers/VoiceCheckinController.js
const VapiService = require('../services/VapiService');
const VoiceCheckin = require('../models/VoiceCheckin');
const User = require('../models/User'); // Assuming you have this Mongoose User model

class VoiceCheckinController {
  /**
   * Start a daily voice check-in call using a pre-configured Vapi assistant.
   * @route POST /api/voice-checkin/start
   * @body { phoneNumber: string, userId: string, trimester?: number, weekOfPregnancy?: number }
   */
  async startDailyCheckin(req, res) {
    try {
      const { phoneNumber, userId, trimester, weekOfPregnancy } = req.body;

      if (!phoneNumber || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and user ID are required.'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.'
        });
      }

      // Determine pregnancy context from user or request body
      const effectiveTrimester = trimester || user.pregnancyStage?.trimester || 1;
      const effectiveWeekOfPregnancy = weekOfPregnancy || user.pregnancyStage?.weekOfPregnancy || 1;

      // Prepare assistant overrides for this specific call
      // These override properties defined on your base Vapi assistant for this call only.
      const assistantOverrides = {
        firstMessage: `Hi ${user.name || 'there'}! You're in your ${effectiveTrimester} trimester, week ${effectiveWeekOfPregnancy}. How are you feeling today?`,
        systemPrompt: `You are a helpful and empathetic pregnancy assistant. Your goal is to check in daily with a pregnant person (who is currently in their ${effectiveTrimester} trimester, week ${effectiveWeekOfPregnancy}). Ask about their physical and emotional well-being, and offer support or information where appropriate. Keep the conversation concise and caring.`,
        recordingEnabled: true // Ensure recording is enabled for transcripts
      };

      // Initiate the call using the default Vapi assistant ID (from .env)
      // and apply the specific overrides for this call.
      const call = await VapiService.startCall({
        phoneNumber,
        assistantOverrides: assistantOverrides,
        metadata: { userId, pregnancyContext: { trimester: effectiveTrimester, weekOfPregnancy: effectiveWeekOfPregnancy } }
      });

      // Create a record in your database for this voice check-in
      const record = await VoiceCheckin.create({
        userId,
        callId: call.id,
        assistantId: VapiService.defaultAssistantId, // Store the ID of the assistant used
        status: 'initiated',
        pregnancyContext: { trimester: effectiveTrimester, weekOfPregnancy: effectiveWeekOfPregnancy },
        startedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Voice check-in call initiated successfully.',
        data: {
          callId: call.id,
          checkinId: record._id
        }
      });
    } catch (error) {
      console.error('Error starting voice checkin:', error?.response?.data || error.message || error);
      res.status(500).json({
        success: false,
        error: 'Failed to start voice checkin. Please check server logs for details.'
      });
    }
  }

  /**
   * Handle Vapi webhook events.
   * @route POST /api/voice-checkin/webhook
   * @body Vapi webhook payload
   */
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-vapi-signature'];
      const rawBody = req.rawBody; // Get the raw body captured by server.js middleware

      if (!signature || !rawBody) {
        console.warn('Webhook received without signature or raw body.');
        return res.status(400).json({ error: 'Bad Request: Missing signature or body.' });
      }

      // Validate the webhook signature for security
      if (!VapiService.validateWebhookSignature(rawBody, signature)) {
        console.warn('Webhook received with invalid signature!');
        return res.status(401).json({ error: 'Unauthorized: Invalid signature.' });
      }

      const { message } = req.body; // Vapi wraps the actual event data in a 'message' property

      if (!message || !message.type) {
        console.warn('Webhook received without a valid message object or type.');
        return res.status(400).json({ error: 'Invalid webhook message format.' });
      }

      console.log(`Received Vapi webhook event: ${message.type} for call ${message.call?.id}`);

      let updateQuery = {};
      let transcriptUpdate = {};

      switch (message.type) {
        case 'call-start':
          updateQuery = { status: 'in-progress' };
          break;

        case 'call-end':
          // This event contains the final call details, including the full transcript and recording URL
          updateQuery = {
            status: message.call.status === 'success' ? 'completed' : 'failed', // Mark as failed if Vapi status isn't 'success'
            endedAt: message.call.endedAt ? new Date(message.call.endedAt) : new Date(),
            fullTranscript: message.call.transcript || '', // Final full transcript
            recordingUrl: message.call.recordingUrl || null // If recording was enabled
          };
          break;

        case 'transcript':
          // This event provides individual turns of speech in real-time
          transcriptUpdate = {
            $push: {
              transcriptChunks: {
                role: message.transcript.role, // 'user' or 'assistant'
                text: message.transcript.transcript,
                startTime: message.transcript.startTime,
                endTime: message.transcript.endTime,
                // Add timestamp if needed: timestamp: new Date()
              }
            }
          };
          break;

        case 'function-call':
          console.log(`Vapi assistant requested function: "${message.functionCall.name}" with parameters:`, message.functionCall.parameters);

          // --- Implement your custom function (tool) handling here ---
          // The AI decides to call a function, and your backend executes it.
          // Then, send a 'result' object back to Vapi to tell the AI what to say next.

          if (message.functionCall.name === 'logSymptom') {
            const { symptom, severity } = message.functionCall.parameters;
            const userId = message.call.metadata?.userId; // Get userId from call metadata

            if (userId && symptom) {
              console.log(`[Function] User ${userId} reported symptom: ${symptom} (Severity: ${severity || 'not specified'}).`);
              // Example: Save symptom to your user's health record or a dedicated log
              // await SymptomModel.create({ userId, symptom, severity, timestamp: new Date() });
              return res.json({
                result: {
                  message: `Okay, I've noted down your ${symptom}. Is there anything else I can help you with regarding your health?`
                }
              });
            } else {
              console.warn('[Function] logSymptom: Missing userId or symptom.');
              return res.json({
                result: {
                  message: `I couldn't log the symptom due to missing information. Could you please clarify?`
                }
              });
            }
          }
          if (message.functionCall.name === 'endCall') {
            console.log('[Function] Assistant requested to end the call.');
            return res.json({
              result: {
                endCall: true // This tells Vapi to hang up the call
              }
            });
          }

          // Fallback for unhandled functions
          console.warn(`[Function] Unhandled function call: ${message.functionCall.name}`);
          return res.json({
            result: {
              message: `I received a request to perform "${message.functionCall.name}", but I'm not configured to handle that specific action yet. Is there something else I can assist you with?`
            }
          });

        default:
          console.log(`Webhook: Unhandled Vapi message type: ${message.type}`);
          break;
      }

      // Update the VoiceCheckin record in MongoDB
      if (Object.keys(updateQuery).length > 0 || Object.keys(transcriptUpdate).length > 0) {
        await VoiceCheckin.findOneAndUpdate(
          { callId: message.call.id },
          { ...updateQuery, ...transcriptUpdate }, // Merge updates
          { new: true, upsert: true } // Return updated doc, create if not found
        );
      }

      res.status(200).json({ success: true, message: 'Webhook processed.' }); // Acknowledge receipt
    } catch (error) {
      console.error('Error processing webhook:', error?.response?.data || error.message || error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook.'
      });
    }
  }

  /**
   * Get user's voice check-in history.
   * @route GET /api/voice-checkin/history?userId=<id>&limit=<n>&offset=<m>
   */
  async getCheckinHistory(req, res) {
    try {
      const { userId, limit = 10, offset = 0 } = req.query; // userId from query params

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      const parsedLimit = parseInt(limit, 10);
      const parsedOffset = parseInt(offset, 10);

      const checkins = await VoiceCheckin.find({ userId })
        .sort({ startedAt: -1 })
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
          page: Math.floor(parsedOffset / parsedLimit) + 1,
          pages: Math.ceil(totalCount / parsedLimit)
        }
      });
    } catch (error) {
      console.error('Error getting checkin history:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve check-in history.' });
    }
  }

  /**
   * Get specific voice check-in details by ID.
   * @route GET /api/voice-checkin/:id
   * @params { id: string } (the VoiceCheckin record ID)
   */
  async getCheckinById(req, res) {
    try {
      const { id } = req.params; // Matches the ':id' in the route

      if (!id) {
        return res.status(400).json({ success: false, error: 'Check-in ID is required.' });
      }

      const checkin = await VoiceCheckin.findById(id);

      if (!checkin) {
        return res.status(404).json({ success: false, error: 'Check-in record not found.' });
      }

      res.json({ success: true, data: checkin });
    } catch (error) {
        error_name_here
        console.error('Error getting checkin details:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve check-in details.' });
    }
  }

  /**
   * Get wellness trends analysis for a user.
   * @route GET /api/voice-checkin/trends?userId=<id>&days=<n>
   */
  async getWellnessTrends(req, res) {
    try {
      const { userId, days } = req.query; // userId from query params

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      console.log(`Fetching wellness trends for user ${userId} for the last ${days || 'all'} days.`);

      // TODO: Implement actual wellness trends analysis based on VoiceCheckin data
      // This might involve:
      // - Fetching multiple VoiceCheckin records for the user
      // - Extracting relevant data from transcripts (e.g., sentiment, keywords)
      // - Aggregating data over time
      // - Using NLP libraries or another LLM call for deeper analysis if needed.

      res.json({
        success: true,
        message: 'Wellness trends analysis not yet implemented. Returning placeholder data.',
        data: {
          userId,
          trends: [
            { date: '2025-06-15', sentiment: 'positive', notableMentions: ['energy', 'good sleep'] },
            { date: '2025-06-16', sentiment: 'neutral', notableMentions: ['tiredness'] }
          ]
        }
      });
    } catch (error) {
      console.error('Error getting wellness trends:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve wellness trends.' });
    }
  }

  /**
   * Get check-ins that need attention (e.g., for healthcare providers).
   * @route GET /api/voice-checkin/attention?page=<n>&limit=<m>
   */
  async getCheckinsNeedingAttention(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query; // Pagination for attention list

      console.log(`Fetching check-ins needing attention (Page: ${page}, Limit: ${limit}).`);

      // TODO: Implement logic to identify check-ins needing attention.
      // This could involve:
      // - Filtering VoiceCheckin records based on flags, sentiment analysis (if stored),
      //   keywords in transcripts (e.g., "pain", "bleeding", "worried").
      // - Complex queries or external processing.

      res.json({
        success: true,
        message: 'Check-ins needing attention analysis not yet implemented. Returning placeholder data.',
        data: {
          needsAttention: [
            { checkinId: 'dummyId1', userId: 'userA', reason: 'High negative sentiment in last check-in' },
            { checkinId: 'dummyId2', userId: 'userB', reason: 'Mention of severe symptom' }
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
