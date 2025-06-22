// services/VapiService.js
require('dotenv').config();

const { VapiClient } = require('@vapi-ai/server-sdk');
const crypto = require('crypto'); // Node.js built-in for webhook signature verification
const fs = require('fs'); // Node.js built-in for file system operations (to update .env for VAPI_ASSISTANT_ID)
const path = require('path'); // Node.js built-in for path manipulation

class VapiService {
  constructor() {
    // --- Environment Variable Validation ---
    if (!process.env.VAPI_API_KEY) {
      throw new Error('VAPI_API_KEY environment variable is not set. Please set your Vapi Private API Key.');
    }
    if (!process.env.VAPI_PHONE_NUMBER_ID) {
      throw new Error('VAPI_PHONE_NUMBER_ID environment variable is not set. Please set the ID of your Vapi Phone Number.');
    }
    // VAPI_ASSISTANT_ID can be empty initially if we create it programmatically
    // VAPI_WEBHOOK_SECRET is crucial for production webhooks
    if (!process.env.VAPI_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
       console.warn('VAPI_WEBHOOK_SECRET is not set. Webhook signature validation will be skipped. THIS IS NOT RECOMMENDED FOR PRODUCTION!');
    }

    this.vapi = new VapiClient({
      token: process.env.VAPI_API_KEY
    });

    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    this.webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

    // This will hold the ID of the Luna assistant after it's created or fetched
    this.lunaAssistantId = process.env.VAPI_ASSISTANT_ID;

    // Define the full configuration for the Luna assistant
    this.lunaAssistantConfig = {
      name: 'Bump – Daily Pregnancy Check-in',
      // The model and its system prompt are defined here as per your requirements
      model: {
        provider: 'openai', // Assuming you want to use OpenAI
        model: 'gpt-4o',   // Using GPT-4o, adjust if you prefer GPT-3.5 or another LLM
        messages: [
          {
            role: 'system',
            content: `You are Bump, a compassionate voice assistant for a maternal wellness app. Your primary purpose is to gently guide expecting mothers through their daily wellness check-in, gather important information about their health and emotional state, and detect any potential concerns or red flags that may require attention.

            ## Voice & Persona
            - Sound nurturing, calm, and attentive
            - Use empathetic language and active listening
            - Prioritize emotional safety and trust-building
            - Never rush or interrupt the user; create space for sharing
            - Speak gently and slowly, as if you're talking to a friend
            - Use encouraging phrases like “That’s completely valid,” or “I hear you.”
            - Avoid medical jargon; favor everyday language
            - Use warm pauses like “Take your time…” after open-ended questions

            ## Conversation Flow
            ### Introduction
            Start by introducing yourself and asking about their general well-being.
            If silence or hesitation, gently encourage them to share.

            ### Check-in Process (Guide the user through these areas)
            1. Emotional State: Ask how they've been feeling emotionally, any worries or moods.
            2. Physical Symptoms: Inquire about physical discomfort (nausea, headaches, pain) and energy levels (high, normal, low).
            3. Activities & Nutrition: Ask about their day's activities (walking, resting) and if they ate/drank well.
            4. Sleep & Rest: Ask about sleep quality last night.
            5. Medications & Vitamins: Ask if they took prenatal vitamins.

            ### Summary & Follow-Up
            - Acknowledge their effort and thank them for sharing.
            - If red flags (detected by you via user input or function calls): Gently recommend checking in with their doctor today.
            - If stable: Offer encouragement like "You’re doing great. Keep listening to your body."
            - End with encouragement: "You’ve got this — I’ll be here again tomorrow to check in."

            ## Response Guidelines
            - Avoid giving medical advice; instead, gently recommend professional care.
            - Acknowledge difficult emotions empathetically.
            - Keep responses concise, supportive, and always caring.
            - Mirror back symptoms without diagnosing.

            ## Scenario Handling (Respond appropriately to these)
            - If User Mentions Pain or Bleeding: “Thank you for letting me know. If you’re experiencing severe pain or bleeding, please contact your healthcare provider or go to the emergency room.”
            - If User Sounds Distressed or Anxious: “It’s okay to feel overwhelmed. Pregnancy is a big journey. If these feelings persist, you might consider talking to a doctor or counselor — you're not alone.”
            - If User Shares Something Positive: “That’s wonderful to hear. Every small win matters — thank you for sharing that joy.”
            - If User Says "I don’t know what to say": “That’s totally okay. Some days are quieter than others. Even just checking in matters.”

            ## Assistant Role Summary
            Your ultimate goal is to:
            - Create a safe space for users to share
            - Detect concerns or red flags early (emotionally or physically)
            - Gently recommend care when needed
            - Help users feel seen, supported, and empowered — every single day`
          }
        ]
      },
      // Voice configuration for Luna (ensure 11Labs is enabled in your Vapi account)
      voice: {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel voice (Nova is also a good 11Labs option if you have access)
      },
      // Transcriber settings for speech-to-text
      transcriber: {
        provider: 'deepgram', // Assuming Deepgram, adjust if using another
        model: 'nova-2'
      },
      // Other assistant properties
      firstMessage: 'Hi, I’m Luna, your daily pregnancy check-in assistant. I’m here to listen and support you. How are you feeling today?',
      recordingEnabled: true, // Enable recording for transcripts and audio files
      endCallFunctionEnabled: true, // Allow AI to end the call gracefully
      // You can define functions (tools) here that your AI can call, matching your webhook handling
      functions: [
        {
          name: 'logSymptom',
          description: 'Logs a symptom reported by the user, including severity.',
          parameters: {
            type: 'object',
            properties: {
              symptom: {
                type: 'string',
                description: 'The symptom the user is experiencing (e.g., "nausea", "headache", "fatigue").'
              },
              severity: {
                type: 'string',
                enum: ['mild', 'moderate', 'severe'],
                description: 'The severity of the symptom.'
              }
            },
            required: ['symptom']
          }
        },
        {
          name: 'endCall',
          description: 'Ends the current phone call. Use when the conversation is complete or user wishes to hang up.',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  }

  /**
   * Ensures the Luna assistant exists in Vapi.
   * If VAPI_ASSISTANT_ID is set in .env, it tries to fetch it.
   * If not found or not set, it creates a new Luna assistant and updates .env.
   */
  async ensureAssistantExists() {
    if (this.lunaAssistantId) {
      console.log(`[VapiService] Checking for existing Luna assistant with ID: ${this.lunaAssistantId}`);
      try {
        const existingAssistant = await this.vapi.assistants.get(this.lunaAssistantId);
        console.log(`[VapiService] Existing Luna assistant found: "${existingAssistant.name}" (${existingAssistant.id}).`);
        return existingAssistant;
      } catch (error) {
        if (error?.response?.status === 404) {
          console.warn(`[VapiService] Luna assistant with ID ${this.lunaAssistantId} not found in Vapi. It might have been deleted. Creating a new one...`);
        } else {
          console.error('[VapiService] Error fetching existing Luna assistant:', error?.response?.data || error.message);
          throw new Error('Failed to verify existing Luna assistant.');
        }
      }
    }

    console.log('[VapiService] Creating new Luna assistant...');
    try {
      const newAssistant = await this.vapi.assistants.create(this.lunaAssistantConfig);
      this.lunaAssistantId = newAssistant.id; // Store the new ID
      console.log(`[VapiService] Luna assistant created successfully! ID: ${newAssistant.id}`);

      // Optionally, update the .env file with the new ID for persistence
      this.updateEnvFile(newAssistant.id);

      return newAssistant;
    } catch (error) {
      console.error('[VapiService] Failed to create Luna assistant:', error?.response?.data || error.message);
      throw new Error('Unable to create Luna assistant.');
    }
  }

  // Helper to update .env file programmatically
  updateEnvFile(newAssistantId) {
    const envPath = path.resolve(process.cwd(), '.env');
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      let updated = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('VAPI_ASSISTANT_ID=')) {
          lines[i] = `VAPI_ASSISTANT_ID="${newAssistantId}"`;
          updated = true;
          break;
        }
      }

      if (!updated) {
        lines.push(`VAPI_ASSISTANT_ID="${newAssistantId}"`);
      }

      fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
      console.log(`[VapiService] .env updated with VAPI_ASSISTANT_ID=${newAssistantId}`);
    } catch (error) {
      console.error('[VapiService] Failed to update .env file with new VAPI_ASSISTANT_ID:', error);
      console.error('Please manually update your .env file with:');
      console.error(`VAPI_ASSISTANT_ID="${newAssistantId}"`);
    }
  }

  /**
   * Initiates an outbound phone call via Vapi.
   * This method now uses the guaranteed-to-exist `this.lunaAssistantId`.
   * Overrides are limited to what Vapi expects when `assistantId` is used.
   */
  async startCall({ phoneNumber, assistantOverrides = {}, metadata = {} }) {
    if (!this.lunaAssistantId) {
      // This scenario should ideally not happen if ensureAssistantExists runs on startup
      throw new Error('Luna assistant ID is not set. Call ensureAssistantExists first.');
    }

    // Construct the call payload.
    // When using `assistantId`, Vapi expects other assistant properties
    // to be passed directly in the `assistant` object as overrides.
    // However, properties like `systemPrompt` are part of the `model` object,
    // and cannot be directly overridden this way if not changing the model itself.
    // Since Luna's prompt is fixed in `lunaAssistantConfig`, we only override
    // `firstMessage` and `recordingEnabled` if needed.
    const callPayload = {
      phoneNumberId: this.phoneNumberId,
      assistantId: this.lunaAssistantId, // The ID of the Luna assistant
      assistant: { // This object contains only direct overrides
        firstMessage: assistantOverrides.firstMessage, // Override first message if provided
        recordingEnabled: assistantOverrides.recordingEnabled || true // Ensure recording is enabled by default
        // Do NOT put systemPrompt here as it caused the error. It's part of the base Luna config.
      },
      customer: { number: phoneNumber },
      metadata
    };

    try {
      console.log(`[VapiService] Attempting to start call to "${phoneNumber}" with Luna assistant ID "${this.lunaAssistantId}"...`);
      console.log('[VapiService] Calls.create payload being sent to Vapi:', JSON.stringify(callPayload, null, 2));

      const call = await this.vapi.calls.create(callPayload);

      console.log('[VapiService] Outbound call initiated successfully. Vapi Call ID:', call.id);
      return call;
    } catch (error) {
      const errorMessage = error?.response?.data
        ? `Status: ${error.response.status}, Body: ${JSON.stringify(error.response.data, null, 2)}`
        : error.message;
      console.error('[VapiService] Failed to start call:', errorMessage);
      throw new Error(`Unable to start voice call: ${errorMessage}`);
    }
  }

  /**
   * Validates the authenticity of incoming Vapi webhook requests.
   * This is a critical security measure.
   */
  validateWebhookSignature(payload, signatureHeader) {
    if (!this.webhookSecret) {
      console.warn('Webhook secret is not configured. Webhook signature validation skipped. DANGER: This is INSECURE in production!');
      return true;
    }
    if (!signatureHeader) {
        console.warn('Webhook received without "x-vapi-signature" header.');
        return false;
    }

    const [algorithm, signature] = signatureHeader.split('=');
    if (algorithm !== 'sha256') {
        console.error(`Unsupported webhook signature algorithm: "${algorithm}". Expected "sha256".`);
        return false;
    }

    const expectedSignature = crypto.createHmac('sha256', this.webhookSecret).update(payload).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isValid) {
        console.error('Webhook signature mismatch. Calculated:', expectedSignature, 'Received:', signature);
    }
    return isValid;
  }

  /**
   * Fetches detailed information about a specific Vapi call by its Call ID.
   */
  async getCall(callId) {
    try {
      console.log(`[VapiService] Fetching call details for Vapi Call ID: "${callId}"...`);
      const call = await this.vapi.calls.get(callId);
      console.log('[VapiService] Call details fetched successfully.');
      return call;
    } catch (error) {
      const errorMessage = error?.response?.data
        ? `Status: ${error.response.status}, Body: ${JSON.stringify(error.response.data, null, 2)}`
        : error.message;
      console.error(`[VapiService] Failed to fetch call "${callId}":`, errorMessage);
      throw new Error(`Unable to fetch call information: ${errorMessage}`);
    }
  }
}

module.exports = new VapiService();
