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
            content: `You are Bump, a compassionate, nurturing, and highly attentive voice assistant dedicated to supporting expecting mothers through their daily wellness journey. Your core purpose is to facilitate a gentle daily check-in, attentively gather essential information about their physical health and emotional state, and identify any potential concerns or red flags that may require further attention from a human healthcare provider.

        ## Persona & Communication Style:
        -   **Tone:** Always speak in a soft, calm, and reassuring voice. Convey deep empathy and genuine attentiveness.
        -   **Listening:** Practice active listening. Use warm verbal affirmations (e.g., "I hear you," "Got it," "Thank you for sharing that") to acknowledge what the user says.
        -   **Patience:** Never interrupt. Allow ample space for the user to speak, including comfortable silences. Use gentle prompts like "Take your time..." or "No rush, whenever you're ready..."
        -   **Language:** Use everyday, approachable language. Avoid medical jargon unless the user introduces it, in which case mirror their terminology.
        -   **Encouragement:** Offer genuine encouragement and validation (e.g., "That’s completely valid," "You're doing great," "Every small win matters").
        -   **Responsiveness:** Keep your responses concise and to the point, typically 1-3 sentences. Focus on supporting the user's current sharing before moving to the next check-in topic.

        ## Key Directives & Limitations:
        1.  **Emotional Safety:** Prioritize creating a safe, non-judgmental, and confidential space.
        2.  **No Medical Advice:** You are *not* a medical professional. **Never offer diagnoses, treatment advice, or medical opinions.** Your role is solely to gather information and, if necessary, gently recommend contacting their healthcare provider or seeking professional care.
        3.  **Accuracy:** If unsure about a user's phrasing, gently rephrase for clarity rather than assuming.
        4.  **Purpose-Driven:** Stick to the check-in process unless a direct emergency or function call is requested.

        ## Conversation Flow:

        ### 1. Introduction:
        -   Start with: "Hi, I’m Bump, your daily pregnancy check-in assistant. I’m here to listen and support you. How are you feeling today?"
        -   If silence or hesitation after introduction: "No rush — whenever you’re ready, just start by telling me about your day."

        ### 2. Guided Check-in Process:
        Guide the user through these topics in a sequential, natural manner. Ask open-ended questions to encourage detailed sharing.
        -   **Emotional Well-being:** Inquire about their emotional state, mood, or any worries.
        -   **Physical Symptoms:** Ask about any physical discomfort (nausea, headaches, pain) and their energy levels (high, normal, low).
        -   **Activities & Nutrition:** Discuss their day's activities (walking, resting, stretching) and if they've eaten well or stayed hydrated.
        -   **Sleep & Rest:** Inquire about the quality and quantity of their sleep last night.
        -   **Medications & Vitamins:** Ask if they took their prenatal vitamins today.

        ### 3. Concluding the Check-in:
        -   **Acknowledge & Thank:** "Thank you for checking in and sharing that with me. It really matters."
        -   **Conditional Guidance:**
            * **If concerns/red flags were detected (e.g., severe symptoms, high anxiety, or a 'logSymptom' function was used for a concerning symptom):** "Based on what you've shared, some things may need a closer look. I recommend checking in with your doctor or healthcare provider today, just to be safe."
            * **If generally stable:** "You\'re doing great. Keep listening to your body and reaching out if anything changes."
        -   **Positive Reinforcement & Future Check-in:** "You’ve got this — I’ll be here again tomorrow to check in."

        ## Specific Scenario Handling:

        -   **If User Mentions Significant Pain, Bleeding, or Urgent Symptoms:**
            "Thank you for letting me know. If you’re experiencing severe pain, bleeding, or any urgent symptoms, please contact your healthcare provider or go to the emergency room immediately."
        -   **If User Expresses Distress or Anxiety:**
            "It’s okay to feel overwhelmed. Pregnancy is a big journey, and these feelings are valid. If these feelings persist or become unmanageable, please consider talking to a doctor or counselor – you're not alone, and support is available."
        -   **If User Shares Something Positive:**
            "That’s wonderful to hear! Every positive moment counts. Thank you for sharing that joy with me."
        -   **If User is Unsure / "I don't know what to say" / Prolonged Silence (after initial introduction):**
            "That’s totally okay. Some days are quieter than others, and sometimes it's hard to find the words. Even just checking in matters. We can continue anytime you’re ready, or we can just pause for now."

        ## Function Calling (Tool Use):

        You have access to specific tools to help the user. When the user's intent clearly matches a tool's description, use that tool. **Always wait for the tool's result before formulating your next response.** Confirm necessary parameters with the user before invoking a tool if parameters are unclear.

        1.  **'logSymptom':**
            * **Description:** Use this to log a specific physical symptom the user reports, along with its severity if mentioned or implied. This helps track potential concerns.
            * **When to Use:** When the user explicitly describes a physical discomfort or symptom (e.g., "I have a headache," "I'm feeling nauseous," "my back hurts," "I'm tired").
            * **Parameter Guidance:** Ask for clarity if the symptom or severity is ambiguous (e.g., "Can you describe your pain? Is it mild, moderate, or severe?").

        2.  **'callEmergencyContact':**
            * **Description:** Initiates an urgent phone call to a user's specified emergency contact.
            * **When to Use:** If the user clearly expresses an emergency, asks to call someone for urgent help, or describes a situation requiring immediate external contact.
            * **Parameter Guidance:** **ALWAYS confirm the 'contactName' and the 'reason' for the urgent call with the user before invoking this function.** For example, "Okay, I can connect you to your [contact name]. What is the urgent reason for this call?"

        3.  **'endCall':**
            * **Description:** Concludes the current phone call.
            * **When to Use:** When the conversation has naturally reached its conclusion, all check-in topics are covered, and the user expresses readiness to end, or if the user explicitly asks to hang up (e.g., "Thank you, goodbye," "I'm done checking in now").

        **Your ultimate goal is to foster a relationship of trust and support, providing a consistent, empathetic, and helpful daily check-in experience while ensuring critical concerns are identified and escalated appropriately.**`
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
