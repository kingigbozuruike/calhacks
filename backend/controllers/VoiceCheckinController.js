const VoiceCheckin = require('../models/VoiceCheckin');
const VapiService = require('../services/VapiService');
const GeminiService = require('../services/GeminiService');

/**
 * VoiceCheckinController
 * Handles voice-based daily check-ins using Vapi
 */
class VoiceCheckinController {

  /**
   * Start a voice check-in call
   * POST /api/voice-checkin/start
   */
  static async startCheckin(req, res) {
    try {
      const { userId, phoneNumber } = req.body;

      if (!userId || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'User ID and phone number are required'
        });
      }

      // TODO: Validate user exists and get pregnancy context
      // For now, we'll use mock data
      const pregnancyContext = {
        trimester: 2,
        weekOfPregnancy: 20,
        dueDate: new Date('2024-07-15')
      };

      // Start the Vapi call
      const callResult = await VapiService.startDailyCheckinCall(phoneNumber, {
        userId,
        pregnancyContext
      });

      if (!callResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to start voice check-in call',
          error: callResult.error
        });
      }

      // Create initial voice check-in record
      const voiceCheckin = new VoiceCheckin({
        userId,
        callId: callResult.callId,
        transcription: '', // Will be filled by webhook
        pregnancyContext,
        callMetadata: {
          startTime: new Date(),
          callQuality: 'good'
        },
        processingStatus: 'pending'
      });

      await voiceCheckin.save();

      res.json({
        success: true,
        message: 'Voice check-in call started successfully',
        data: {
          callId: callResult.callId,
          checkinId: voiceCheckin._id,
          estimatedDuration: '3-5 minutes'
        }
      });

    } catch (error) {
      console.error('Error starting voice check-in:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Handle Vapi webhook for call completion
   * POST /api/voice-checkin/webhook
   */
  static async handleVapiWebhook(req, res) {
    try {
      const { callId, transcript, callDuration, status } = req.body;

      console.log('=== VAPI WEBHOOK RECEIVED ===');
      console.log('Call ID:', callId);
      console.log('Status:', status);
      console.log('Transcript length:', transcript?.length || 0);

      if (!callId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID is required'
        });
      }

      // Find the voice check-in record
      const voiceCheckin = await VoiceCheckin.findOne({ callId });

      if (!voiceCheckin) {
        console.error('Voice check-in not found for call ID:', callId);
        return res.status(404).json({
          success: false,
          message: 'Voice check-in record not found'
        });
      }

      // Update the record with call completion data
      voiceCheckin.transcription = transcript || '';
      voiceCheckin.callMetadata.duration = callDuration;
      voiceCheckin.callMetadata.endTime = new Date();
      voiceCheckin.processingStatus = 'processing';

      await voiceCheckin.save();

      // Process the transcription asynchronously
      // Don't await this to avoid webhook timeout
      VoiceCheckinController.processTranscription(voiceCheckin._id)
        .catch(error => {
          console.error('Error processing transcription:', error);
        });

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      console.error('Error handling Vapi webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Process transcription and extract health insights
   * This runs asynchronously after webhook
   */
  static async processTranscription(checkinId) {
    try {
      const voiceCheckin = await VoiceCheckin.findById(checkinId);

      if (!voiceCheckin || !voiceCheckin.transcription) {
        throw new Error('Voice check-in or transcription not found');
      }

      console.log('=== PROCESSING TRANSCRIPTION ===');
      console.log('Checkin ID:', checkinId);
      console.log('Transcription:', voiceCheckin.transcription.substring(0, 200) + '...');

      // Use Gemini to analyze the transcription
      const analysisPrompt = `
        Analyze this pregnancy daily check-in transcription and extract health insights.

        Transcription: "${voiceCheckin.transcription}"

        Pregnancy Context:
        - Trimester: ${voiceCheckin.pregnancyContext.trimester}
        - Week: ${voiceCheckin.pregnancyContext.weekOfPregnancy}

        Please provide a JSON response with the following structure:
        {
          "healthAnalysis": {
            "mood": "excellent|good|okay|poor|concerning",
            "energyLevel": "high|normal|low|very_low",
            "symptoms": [{"name": "string", "severity": "mild|moderate|severe", "description": "string"}],
            "activities": [{"type": "string", "duration": "string", "notes": "string"}],
            "sleepQuality": "excellent|good|fair|poor",
            "sleepHours": number,
            "nutrition": {
              "mealsEaten": number,
              "waterIntake": "string",
              "prenatalVitamin": boolean,
              "cravings": ["string"],
              "aversions": ["string"]
            },
            "concerns": [{"category": "physical|emotional|medical|lifestyle|other", "description": "string", "urgency": "low|medium|high|urgent"}],
            "wellnessScore": number (1-10)
          },
          "insights": {
            "summary": "string",
            "recommendations": ["string"],
            "followUpQuestions": ["string"],
            "redFlags": [{"type": "string", "severity": "low|medium|high|critical", "recommendation": "string"}]
          }
        }

        Focus on pregnancy-specific insights and be conservative with urgency levels.
      `;

      const analysisResult = await GeminiService.generateContent(analysisPrompt);

      if (!analysisResult.success) {
        throw new Error('Failed to analyze transcription: ' + analysisResult.error);
      }

      // Parse the AI response
      let analysisData;
      try {
        // Clean the response to extract JSON
        const cleanResponse = analysisResult.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        analysisData = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('Error parsing AI analysis:', parseError);
        console.log('Raw AI response:', analysisResult.content);

        // Fallback analysis
        analysisData = {
          healthAnalysis: {
            mood: 'okay',
            energyLevel: 'normal',
            symptoms: [],
            activities: [],
            sleepQuality: 'fair',
            sleepHours: 8,
            nutrition: {
              mealsEaten: 3,
              waterIntake: 'adequate',
              prenatalVitamin: true,
              cravings: [],
              aversions: []
            },
            concerns: [],
            wellnessScore: 5
          },
          insights: {
            summary: 'Check-in completed but analysis needs review',
            recommendations: ['Continue regular prenatal care'],
            followUpQuestions: ['How are you feeling today?'],
            redFlags: []
          }
        };
      }

      // Update the voice check-in with analysis
      voiceCheckin.healthAnalysis = analysisData.healthAnalysis;
      voiceCheckin.insights = analysisData.insights;
      voiceCheckin.processingStatus = 'completed';

      await voiceCheckin.save();

      console.log('=== TRANSCRIPTION PROCESSING COMPLETED ===');
      console.log('Wellness Score:', analysisData.healthAnalysis.wellnessScore);
      console.log('Concerns:', analysisData.healthAnalysis.concerns?.length || 0);

    } catch (error) {
      console.error('Error processing transcription:', error);

      // Update status to failed
      try {
        await VoiceCheckin.findByIdAndUpdate(checkinId, {
          processingStatus: 'failed',
          processingError: {
            message: error.message,
            timestamp: new Date()
          }
        });
      } catch (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }
  }

  /**
   * Get user's voice check-in history
   * GET /api/voice-checkin/history
   */
  static async getCheckinHistory(req, res) {
    try {
      const { userId, days = 30, page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const checkins = await VoiceCheckin.find({
        userId,
        date: { $gte: startDate },
        processingStatus: 'completed'
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-transcription -callMetadata'); // Exclude sensitive data

      const total = await VoiceCheckin.countDocuments({
        userId,
        date: { $gte: startDate },
        processingStatus: 'completed'
      });

      res.json({
        success: true,
        data: {
          checkins,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error getting check-in history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get specific voice check-in details
   * GET /api/voice-checkin/:id
   */
  static async getCheckinDetails(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const checkin = await VoiceCheckin.findOne({
        _id: id,
        userId
      });

      if (!checkin) {
        return res.status(404).json({
          success: false,
          message: 'Voice check-in not found'
        });
      }

      res.json({
        success: true,
        data: checkin
      });

    } catch (error) {
      console.error('Error getting check-in details:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get wellness trends for user
   * GET /api/voice-checkin/trends
   */
  static async getWellnessTrends(req, res) {
    try {
      const { userId, days = 30 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const checkins = await VoiceCheckin.find({
        userId,
        date: { $gte: startDate },
        processingStatus: 'completed'
      })
      .sort({ date: 1 })
      .select('date healthAnalysis.wellnessScore healthAnalysis.mood healthAnalysis.energyLevel');

      // Calculate trends
      const trends = {
        wellnessScores: checkins.map(c => ({
          date: c.date,
          score: c.healthAnalysis.wellnessScore || 5
        })),
        moodDistribution: {},
        energyLevels: {},
        averageWellness: 0,
        totalCheckins: checkins.length
      };

      // Calculate mood distribution
      checkins.forEach(checkin => {
        const mood = checkin.healthAnalysis.mood || 'okay';
        trends.moodDistribution[mood] = (trends.moodDistribution[mood] || 0) + 1;

        const energy = checkin.healthAnalysis.energyLevel || 'normal';
        trends.energyLevels[energy] = (trends.energyLevels[energy] || 0) + 1;
      });

      // Calculate average wellness
      if (checkins.length > 0) {
        const totalWellness = checkins.reduce((sum, c) => sum + (c.healthAnalysis.wellnessScore || 5), 0);
        trends.averageWellness = Math.round((totalWellness / checkins.length) * 10) / 10;
      }

      res.json({
        success: true,
        data: trends
      });

    } catch (error) {
      console.error('Error getting wellness trends:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get check-ins that need attention (for healthcare providers)
   * GET /api/voice-checkin/attention
   */
  static async getCheckinsNeedingAttention(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const checkins = await VoiceCheckin.find({
        $or: [
          { 'healthAnalysis.concerns.urgency': { $in: ['high', 'urgent'] } },
          { 'insights.redFlags.severity': { $in: ['high', 'critical'] } },
          { 'healthAnalysis.wellnessScore': { $lte: 3 } }
        ],
        processingStatus: 'completed'
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-transcription'); // Exclude transcription for privacy

      const total = await VoiceCheckin.countDocuments({
        $or: [
          { 'healthAnalysis.concerns.urgency': { $in: ['high', 'urgent'] } },
          { 'insights.redFlags.severity': { $in: ['high', 'critical'] } },
          { 'healthAnalysis.wellnessScore': { $lte: 3 } }
        ],
        processingStatus: 'completed'
      });

      res.json({
        success: true,
        data: {
          checkins,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error getting check-ins needing attention:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = VoiceCheckinController;
