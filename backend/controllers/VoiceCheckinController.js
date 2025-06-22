const VapiService = require('../services/VapiService');
const VoiceCheckin = require('../models/VoiceCheckin');
const User = require('../models/User');

class VoiceCheckinController {
  // Start a daily voice check-in call
  async startDailyCheckin(req, res) {
    try {
      const { phoneNumber, userId } = req.body;

      if (!phoneNumber || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and user ID are required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const pregnancyContext = user.pregnancyStage || {};

      const assistant = await VapiService.createDailyAssistant(pregnancyContext);
      const call = await VapiService.startCall({
        phoneNumber,
        assistantId: assistant.id,
        metadata: { userId, pregnancyContext }
      });

      const record = await VoiceCheckin.create({
        userId,
        callId: call.id,
        assistantId: assistant.id,
        status: 'initiated',
        pregnancyContext,
        startedAt: new Date()
      });

      res.json({
        success: true,
        data: {
          callId: call.id,
          checkinId: record._id
        }
      });
    } catch (error) {
      console.error('Error starting voice checkin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start voice checkin'
      });
    }
  }

  // Handle Vapi webhooks
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-vapi-signature'];
      const payload = JSON.stringify(req.body);

      if (!VapiService.validateWebhookSignature(payload, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { message } = req.body;

      switch (message.type) {
        case 'call-start':
          await VoiceCheckin.findOneAndUpdate(
            { callId: message.call.id },
            { status: 'in-progress' }
          );
          break;
        case 'call-end':
          await VoiceCheckin.findOneAndUpdate(
            { callId: message.call.id },
            {
              status: 'completed',
              endedAt: new Date(message.call.endedAt),
              transcript: message.call.transcript
            }
          );
          break;
        case 'transcript':
          await VoiceCheckin.findOneAndUpdate(
            { callId: message.call.id },
            { transcript: message.transcript }
          );
          break;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook'
      });
    }
  }

  // Get check-in history for a user
  async getCheckinHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const checkins = await VoiceCheckin.find({ userId })
        .sort({ startedAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      res.json({
        success: true,
        data: checkins
      });
    } catch (error) {
      console.error('Error getting checkin history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checkin history'
      });
    }
  }

  // Get specific check-in by ID
  async getCheckinById(req, res) {
    try {
      const { checkinId } = req.params;

      if (!checkinId) {
        return res.status(400).json({
          success: false,
          error: 'Checkin ID is required'
        });
      }

      const checkin = await VoiceCheckin.findById(checkinId);

      if (!checkin) {
        return res.status(404).json({
          success: false,
          error: 'Check-in not found'
        });
      }

      res.json({
        success: true,
        data: checkin
      });
    } catch (error) {
      console.error('Error getting checkin details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checkin details'
      });
    }
  }

  // Get wellness trends analysis
  async getWellnessTrends(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // TODO: Implement wellness trends analysis based on check-in data
      res.json({
        success: true,
        message: 'Wellness trends analysis not implemented yet.',
        data: {
          userId,
          trends: []
        }
      });
    } catch (error) {
      console.error('Error getting wellness trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wellness trends'
      });
    }
  }

  // Get check-ins that need attention
  async getCheckinsNeedingAttention(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // TODO: Implement logic to identify checkins needing attention
      // This could be based on sentiment analysis, missed checkins, etc.
      res.json({
        success: true,
        message: 'Check-ins needing attention analysis not implemented yet.',
        data: {
          userId,
          needsAttention: []
        }
      });
    } catch (error) {
      console.error('Error getting checkins needing attention:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checkins needing attention'
      });
    }
  }
}

module.exports = new VoiceCheckinController();
