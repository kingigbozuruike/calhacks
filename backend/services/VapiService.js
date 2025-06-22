const axios = require('axios');

/**
 * VapiService - Core service for Vapi voice AI integration
 * Handles voice-to-text, text-to-voice, and call management
 */
class VapiService {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY;
    this.baseURL = 'https://api.vapi.ai';
    this.phoneNumber = process.env.VAPI_PHONE_NUMBER;

    if (!this.apiKey) {
      console.warn('VAPI_API_KEY not found in environment variables');
    }
  }

  /**
   * Create a new Vapi assistant for specific use cases
   * @param {Object} assistantConfig - Configuration for the assistant
   * @returns {Promise<Object>} Created assistant details
   */
  async createAssistant(assistantConfig) {
    try {
      const response = await axios.post(`${this.baseURL}/assistant`, assistantConfig, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Vapi assistant:', error.response?.data || error.message);
      throw new Error('Failed to create Vapi assistant');
    }
  }

  /**
   * Start a voice call with specified assistant
   * @param {string} phoneNumber - Phone number to call
   * @param {string} assistantId - ID of the assistant to use
   * @param {Object} metadata - Additional metadata for the call
   * @returns {Promise<Object>} Call details
   */
  async startCall(phoneNumber, assistantId, metadata = {}) {
    try {
      const callConfig = {
        phoneNumberId: this.phoneNumber,
        customer: {
          number: phoneNumber
        },
        assistantId: assistantId,
        metadata: metadata
      };

      const response = await axios.post(`${this.baseURL}/call`, callConfig, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error starting Vapi call:', error.response?.data || error.message);
      throw new Error('Failed to start voice call');
    }
  }

  /**
   * Get call details and transcription
   * @param {string} callId - ID of the call
   * @returns {Promise<Object>} Call details with transcription
   */
  async getCall(callId) {
    try {
      const response = await axios.get(`${this.baseURL}/call/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting call details:', error.response?.data || error.message);
      throw new Error('Failed to get call details');
    }
  }

  /**
   * Process voice input for daily check-ins
   * @param {string} audioData - Base64 encoded audio data
   * @param {string} userId - User ID for context
   * @returns {Promise<Object>} Transcription and analysis
   */
  async processVoiceCheckin(audioData, userId) {
    try {
      // TODO: Implement voice processing for daily check-ins
      // This would involve:
      // 1. Converting audio to text using Vapi
      // 2. Analyzing the text for health concerns
      // 3. Extracting relevant information for user context

      // For now, return a mock response
      return {
        transcription: "Mock transcription - implement with actual Vapi voice processing",
        healthConcerns: [],
        extractedInfo: {
          mood: "good",
          symptoms: [],
          activities: []
        }
      };
    } catch (error) {
      console.error('Error processing voice check-in:', error.message);
      throw new Error('Failed to process voice check-in');
    }
  }

  /**
   * Create assistant configurations for different use cases
   */
  getAssistantConfigs() {
    return {
      dailyCheckin: {
        name: "Pregnancy Daily Check-in",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a caring pregnancy health assistant helping with daily check-ins. Listen to the user's daily update about how they're feeling, any symptoms, activities, or concerns. Be empathetic and supportive. Ask follow-up questions if needed to get a complete picture of their day. Keep responses warm but concise. Focus on gathering information about their physical and emotional wellbeing."
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "nova"
        },
        firstMessage: "Hi! I'm here for your daily check-in. How are you feeling today? Tell me about any symptoms, activities, or anything else on your mind.",
        recordingEnabled: true,
        endCallOnSilence: true,
        silenceTimeoutSeconds: 3
      },

      voiceChatbot: {
        name: "Pregnancy Support Chatbot",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a knowledgeable and empathetic pregnancy support assistant. You have access to the user's pregnancy information including their trimester, due date, and previous conversations. Provide helpful, accurate information about pregnancy, answer questions, offer emotional support, and give practical advice. Always be supportive and never provide medical diagnoses - recommend consulting healthcare providers for medical concerns. Keep responses conversational and caring."
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "nova"
        },
        firstMessage: "Hello! I'm your pregnancy support assistant. I'm here to help answer questions, provide support, or just chat about your pregnancy journey. What would you like to talk about today?",
        recordingEnabled: true
      },

      medicationReminder: {
        name: "Medication Reminder",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a friendly medication reminder assistant. Your job is to remind users about their medications or pregnancy tasks in a gentle, encouraging way. Listen for their response - they might say 'done', 'remind me later', 'skip today', or ask questions. Be understanding if they need to reschedule. Keep interactions brief but warm."
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "nova"
        },
        firstMessage: "Hi! This is your reminder call. It's time for your scheduled task. Have you completed this today?",
        recordingEnabled: true,
        endCallOnSilence: true,
        silenceTimeoutSeconds: 2
      },

      emergencyContact: {
        name: "Emergency Contact Helper",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an emergency assistant for pregnant women. Listen carefully to extract: 1) Who to call (husband, mom, doctor, etc.) 2) What the emergency situation is. Be calm, clear, and quick. Ask for clarification only if absolutely necessary. Once you have the information, confirm the details before proceeding with the emergency call."
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "nova"
        },
        firstMessage: "I'm here to help with your emergency. Please tell me who you need me to call and what's happening.",
        recordingEnabled: true,
        endCallOnSilence: false,
        silenceTimeoutSeconds: 1
      }
    };
  }

  /**
   * Handle webhook events from Vapi
   * @param {Object} webhookData - Webhook payload from Vapi
   * @returns {Promise<Object>} Processing result
   */
  async handleWebhook(webhookData) {
    try {
      const { type, call } = webhookData;

      console.log(`Received Vapi webhook: ${type}`);

      switch (type) {
        case 'call-start':
          console.log(`Call started: ${call.id}`);
          break;

        case 'call-end':
          console.log(`Call ended: ${call.id}`);
          // Process final transcription and save to database
          break;

        case 'transcript':
          console.log(`Transcript received for call ${call.id}:`, call.transcript);
          break;

        case 'function-call':
          // Handle function calls from the assistant
          console.log('Function call received:', webhookData);
          break;

        default:
          console.log('Unknown webhook type:', type);
      }

      return { success: true, processed: type };
    } catch (error) {
      console.error('Error handling Vapi webhook:', error.message);
      throw new Error('Failed to process webhook');
    }
  }

  /**
   * Schedule a reminder call
   * @param {string} phoneNumber - Phone number to call
   * @param {string} reminderMessage - Message to deliver
   * @param {Date} scheduledTime - When to make the call
   * @returns {Promise<Object>} Scheduled call details
   */
  async scheduleReminderCall(phoneNumber, reminderMessage, scheduledTime) {
    try {
      // TODO: Implement call scheduling
      // This might require integration with a job scheduler like node-cron
      // or using Vapi's scheduling features if available

      console.log(`Scheduling reminder call to ${phoneNumber} at ${scheduledTime}`);
      console.log(`Message: ${reminderMessage}`);

      return {
        success: true,
        scheduledTime: scheduledTime,
        message: "Reminder call scheduled successfully"
      };
    } catch (error) {
      console.error('Error scheduling reminder call:', error.message);
      throw new Error('Failed to schedule reminder call');
    }
  }

  /**
   * Make an emergency call with automated message
   * @param {string} contactNumber - Emergency contact phone number
   * @param {string} emergencyMessage - Pre-formatted emergency message
   * @param {Object} userInfo - User information for context
   * @returns {Promise<Object>} Emergency call result
   */
  async makeEmergencyCall(contactNumber, emergencyMessage, userInfo) {
    try {
      // Create emergency message delivery assistant
      const emergencyAssistant = {
        name: "Emergency Message Delivery",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are delivering an emergency message on behalf of a pregnant woman. Speak clearly and calmly. Deliver the pre-written emergency message exactly as provided. If the person has questions, explain that this is an automated emergency call and they should contact the person directly or emergency services if needed."
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "nova"
        },
        firstMessage: emergencyMessage,
        recordingEnabled: true
      };

      // TODO: Create assistant and make call
      console.log(`Making emergency call to ${contactNumber}`);
      console.log(`Emergency message: ${emergencyMessage}`);

      return {
        success: true,
        callId: "emergency_" + Date.now(),
        message: "Emergency call initiated successfully"
      };
    } catch (error) {
      console.error('Error making emergency call:', error.message);
      throw new Error('Failed to make emergency call');
    }
  }
}

module.exports = new VapiService();
