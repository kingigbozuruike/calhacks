require('dotenv').config(); // Ensure this is at the very top of your application's entry file

const { VapiClient } = require('@vapi-ai/server-sdk');
const crypto = require('crypto');

class VapiService {
  constructor() {
    // Ensure API keys are loaded from environment variables
    if (!process.env.VAPI_API_KEY) {
      throw new Error('VAPI_API_KEY environment variable is not set.');
    }
    if (!process.env.VAPI_PHONE_NUMBER_ID) {
      throw new Error('VAPI_PHONE_NUMBER_ID environment variable is not set.');
    }
    if (!process.env.VAPI_ASSISTANT_ID) { // Now this is crucial
      throw new Error('VAPI_ASSISTANT_ID environment variable is not set.');
    }
    if (!process.env.VAPI_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
       console.warn('VAPI_WEBHOOK_SECRET is not set. Webhook signature validation will be skipped. This is not NOT recommended for production.');
    }

    this.vapi = new VapiClient({
      token: process.env.VAPI_API_KEY
    });

    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    this.defaultAssistantId = process.env.VAPI_ASSISTANT_ID; // Store your existing assistant ID
    this.webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

    // No need for assistantCache or baseLlmModelConfig/baseVoiceConfig
    // if you are purely using pre-existing assistants.
    // The assistant's model and voice are configured in the Vapi dashboard.
  }

  /**
   * Initiate a phone call via Vapi using an existing assistant.
   *
   * @param {object} options
   * @param {string} options.phoneNumber - The customer's phone number to call.
   * @param {string} [options.assistantId] - Optional. The ID of the specific Vapi assistant to use.
   * Defaults to `this.defaultAssistantId` if not provided.
   * @param {object} [options.assistantOverrides] - Optional. Overrides for the assistant's properties
   * for this specific call (e.g., firstMessage, systemPrompt).
   * @param {object} [options.metadata] - Optional. Custom metadata to attach to the call.
   */
  async startCall({ phoneNumber, assistantId, assistantOverrides = {}, metadata = {} }) {
    // Use the provided assistantId, or fall back to the default one from .env
    const finalAssistantId = assistantId || this.defaultAssistantId;

    if (!finalAssistantId) {
      throw new Error('No assistant ID provided or configured as default. Cannot start call.');
    }

    try {
      const call = await this.vapi.calls.create({
        phoneNumberId: this.phoneNumberId,
        // The `assistant` property needs to contain either the ID, or the ID plus overrides.
        assistant: {
          id: finalAssistantId,
          ...assistantOverrides // Apply any dynamic overrides for this specific call
        },
        customer: { number: phoneNumber },
        metadata
      });

      return call;
    } catch (error) {
      console.error('[VapiService] Failed to start call:', error?.response?.data || error.message || error);
      throw new Error(`Unable to start voice call: ${error?.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature for secure Vapi integration.
   * The `payload` must be the *raw request body* string, not a parsed JSON object.
   * The signature header usually comes as `x-vapi-signature`.
   */
  validateWebhookSignature(payload, signatureHeader) {
    if (!this.webhookSecret) {
      console.warn('Webhook secret is not set. Skipping signature validation. THIS IS UNSAFE IN PRODUCTION.');
      return true; // Or throw an error if validation is mandatory
    }

    // signatureHeader typically looks like 'sha256=abcdef...'
    const [algorithm, signature] = signatureHeader.split('=');

    if (algorithm !== 'sha256') {
        console.error('Unsupported webhook signature algorithm:', algorithm);
        return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    // Use crypto.timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Fetch call metadata from Vapi
   */
  async getCall(callId) {
    try {
      return await this.vapi.calls.get(callId);
    } catch (error) {
      console.error('[VapiService] Failed to fetch call:', error?.response?.data || error.message || error);
      throw new Error('Unable to fetch call information');
    }
  }
}

// Export a singleton instance of the service
module.exports = new VapiService();
