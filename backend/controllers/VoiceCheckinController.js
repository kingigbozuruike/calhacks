// controllers/VoiceCheckinController.js
const VapiService = require('../services/VapiService'); // Path to your VapiService
const VoiceCheckin = require('../models/VoiceCheckin'); // Path to your Mongoose VoiceCheckin model
const User = require('../models/User'); // Path to your Mongoose User model (assuming it exists)

class VoiceCheckinController {
  /**
   * Handler for POST /api/voice-checkin/start.
   * Initiates an outbound voice check-in call to a user via Vapi.
   * It will now rely on the VapiService to manage the single Luna assistant.
   */
  async startDailyCheckin(req, res) {
    try {
      const { phoneNumber, userId, trimester, weekOfPregnancy } = req.body;

      if (!phoneNumber || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and user ID are required in the request body to start a call.'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found for the provided userId.'
        });
      }

      // Determine the specific pregnancy context for the assistant's first message
      const effectiveTrimester = trimester || user.pregnancyStage?.trimester || 1;
      const effectiveWeekOfPregnancy = weekOfPregnancy || user.pregnancyStage?.weekOfPregnancy || 1;

      // Prepare minimal assistant overrides for this specific call.
      // We are no longer overriding the `systemPrompt` here, as the base assistant
      // (created/managed by VapiService) will have the comprehensive prompt.
      // We only override the `firstMessage` and ensure `recordingEnabled`.
      const assistantOverrides = {
        firstMessage: `Hi ${user.name || 'there'}! I'm calling for your daily check-in. You're in your ${effectiveTrimester} trimester, week ${effectiveWeekOfPregnancy}. How are you feeling today?`,
        recordingEnabled: true // Ensure recording is enabled
      };

      // Initiate the outbound call. VapiService will automatically use the correct Luna assistant.
      const call = await VapiService.startCall({
        phoneNumber,
        assistantOverrides: assistantOverrides,
        metadata: { userId, pregnancyContext: { trimester: effectiveTrimester, weekOfPregnancy: effectiveWeekOfPregnancy } }
      });

      // Create a record in your MongoDB to track this voice check-in.
      const record = await VoiceCheckin.create({
        userId,
        callId: call.id,
        assistantId: VapiService.defaultAssistantId, // Use the ID of the single Luna assistant
        status: 'initiated',
        pregnancyContext: { trimester: effectiveTrimester, weekOfPregnancy: effectiveWeekOfPregnancy },
        startedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Voice check-in call initiated successfully!',
        data: {
          callId: call.id,
          checkinRecordId: record._id
        }
      });
    } catch (error) {
      console.error('Error starting voice checkin:', error?.response?.data || error.message || error);
      res.status(500).json({
        success: false,
        error: 'Failed to start voice check-in. An internal server error occurred.'
      });
    }
  }

  /**
   * Handler for POST /api/voice-checkin/webhook.
   * Receives and processes webhook events from Vapi during a call's lifecycle.
   */
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-vapi-signature'];
      const rawBody = req.rawBody; // Captured by the express.json({ verify: ... }) middleware

      if (!signature || !rawBody) {
        console.warn('Webhook received without signature or raw body. Possible malicious request or misconfiguration.');
        return res.status(400).json({ error: 'Bad Request: Missing signature or body for validation.' });
      }

      if (!VapiService.validateWebhookSignature(rawBody, signature)) {
        console.warn('Webhook received with invalid signature! Request potentially tampered with. Rejecting.');
        return res.status(401).json({ error: 'Unauthorized: Invalid signature.' });
      }

      const { message } = req.body;

      if (!message || !message.type) {
        console.warn('Webhook received without a valid "message" object or "type" property. Invalid format.');
        return res.status(400).json({ error: 'Invalid webhook message format.' });
      }

      console.log(`Received Vapi webhook event: "${message.type}" for call ID: ${message.call?.id}`);

      let updateQuery = {};
      let transcriptUpdate = {};

      switch (message.type) {
        case 'call-start':
          updateQuery = { status: 'in-progress' };
          break;

        case 'call-end':
          updateQuery = {
            status: message.call.status === 'success' ? 'completed' : 'failed',
            endedAt: message.call.endedAt ? new Date(message.call.endedAt) : new Date(),
            fullTranscript: message.call.transcript || '',
            recordingUrl: message.call.recordingUrl || null
          };
          break;

        case 'transcript':
          transcriptUpdate = {
            $push: {
              transcriptChunks: {
                role: message.transcript.role,
                text: message.transcript.transcript,
                startTime: message.transcript.startTime,
                endTime: message.transcript.endTime,
                timestamp: new Date()
              }
            }
          };
          break;

        case 'function-call':
          console.log(`Vapi assistant requested function: "${message.functionCall.name}" with parameters:`, message.functionCall.parameters);

          if (message.functionCall.name === 'logSymptom') {
            const { symptom, severity } = message.functionCall.parameters;
            const userId = message.call.metadata?.userId;

            if (userId && symptom) {
              console.log(`[Function Handler] User ${userId} reported symptom: "${symptom}" (Severity: ${severity || 'not specified'}).`);
              // TODO: Implement actual database logic to save this symptom
              return res.json({
                result: {
                  message: `Okay, I've noted down that you are experiencing ${symptom}. Is there anything else I can help you with regarding your health today?`
                }
              });
            } else {
              console.warn(`[Function Handler] logSymptom: Missing required parameters.`);
              return res.json({
                result: {
                  message: `I couldn't log the symptom due to some missing information. Could you please clarify?`
                }
              });
            }
          } else if (message.functionCall.name === 'endCall') {
            console.log('[Function Handler] Assistant explicitly requested to end the call.');
            return res.json({
              result: {
                endCall: true
              }
            });
          }

          console.warn(`[Function Handler] Unhandled function call: "${message.functionCall.name}".`);
          return res.json({
            result: {
              message: `I received a request to perform "${message.functionCall.name}", but I'm not configured to handle that specific action yet.`
            }
          });

        default:
          console.log(`Webhook: Unhandled Vapi message type encountered: "${message.type}".`);
          break;
      }

      if (Object.keys(updateQuery).length > 0 || Object.keys(transcriptUpdate).length > 0) {
        await VoiceCheckin.findOneAndUpdate(
          { callId: message.call.id },
          { ...updateQuery, ...transcriptUpdate },
          { new: true, upsert: true }
        );
      }

      res.status(200).json({ success: true, message: 'Webhook event processed successfully.' });
    } catch (error) {
      console.error('Error processing webhook:', error?.response?.data || error.message || error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook event due to an internal server error.'
      });
    }
  }

  // --- (Other controller methods: getCheckinHistory, getCheckinById, getWellnessTrends, getCheckinsNeedingAttention) ---
  // These are unchanged and omitted for brevity, but include them from the previous "full refined code".

  async getCheckinHistory(req, res) {
    try {
      const { userId, limit = 10, offset = 0 } = req.query;
      if (!userId) return res.status(400).json({ success: false, error: 'User ID is required.' });
      const parsedLimit = parseInt(limit, 10);
      const parsedOffset = parseInt(offset, 10);
      const checkins = await VoiceCheckin.find({ userId }).sort({ startedAt: -1 }).limit(parsedLimit).skip(parsedOffset);
      const totalCount = await VoiceCheckin.countDocuments({ userId });
      res.json({ success: true, data: checkins, pagination: { total: totalCount, limit: parsedLimit, offset: parsedOffset, page: Math.floor(parsedOffset / parsedLimit) + 1, pages: Math.ceil(totalCount / parsedLimit) } });
    } catch (error) {
      console.error('Error getting checkin history:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve check-in history.' });
    }
  }

  async getCheckinById(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, error: 'Check-in record ID is required.' });
      const checkin = await VoiceCheckin.findById(id);
      if (!checkin) return res.status(404).json({ success: false, error: 'Check-in record not found.' });
      res.json({ success: true, data: checkin });
    } catch (error) {
      console.error('Error getting checkin details:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve check-in details.' });
    }
  }

  async getWellnessTrends(req, res) {
    try {
      const { userId, days } = req.query;
      if (!userId) return res.status(400).json({ success: false, error: 'User ID is required.' });
      console.log(`[Placeholder] Fetching wellness trends for user ${userId} for the last ${days || 'all'} days.`);
      res.json({
        success: true,
        message: 'Wellness trends analysis not yet implemented. Returning placeholder data.',
        data: { userId, trends: [{ date: '2025-06-20', sentiment: 'positive', notableMentions: ['feeling great'] }] }
      });
    } catch (error) {
      console.error('Error getting wellness trends:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve wellness trends.' });
    }
  }

  async getCheckinsNeedingAttention(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      console.log(`[Placeholder] Fetching check-ins needing attention (Page: ${page}, Limit: ${limit}).`);
      res.json({
        success: true,
        message: 'Check-ins needing attention analysis not yet implemented. Returning placeholder data.',
        data: { needsAttention: [{ checkinId: '6677a2c3d4e5f6a7b8c9d0e1', userId: 'userA', reason: 'High negative sentiment' }] }
      });
    } catch (error) {
      console.error('Error getting check-ins needing attention:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve check-ins needing attention.' });
    }
  }
}

module.exports = new VoiceCheckinController();
