// services/VapiService.js
require('dotenv').config(); // Ensure this runs at the very beginning of your app's loading process

const { VapiClient } = require('@vapi-ai/server-sdk');
const crypto = require('crypto'); // Node.js built-in module for cryptographic functions (used for webhook signature)

class VapiService {
  constructor() {
    // --- Environment Variable Validation (Good practice for robust applications) ---
    if (!process.env.VAPI_API_KEY) {
      throw new Error('VAPI_API_KEY environment variable is not set. Please set your Vapi Private API Key.');
    }
    if (!process.env.VAPI_PHONE_NUMBER_ID) {
      throw new Error('VAPI_PHONE_NUMBER_ID environment variable is not set. Please set the ID of your Vapi Phone Number (for outbound calls).');
    }
    if (!process.env.VAPI_ASSISTANT_ID) {
      throw new Error('VAPI_ASSISTANT_ID environment variable is not set. Please set the ID of your existing Vapi Assistant that you want to use.');
    }
    // Webhook secret is crucial for verifying Vapi's webhook requests are legitimate.
    if (!process.env.VAPI_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
       console.warn('VAPI_WEBHOOK_SECRET is not set. Webhook signature validation will be skipped. THIS IS NOT RECOMMENDED FOR PRODUCTION!');
    }

    // Initialize the VapiClient with your Private API Key
    this.vapi = new VapiClient({
      token: process.env.VAPI_API_KEY
    });

    // Store essential Vapi IDs from environment variables
    this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    this.defaultAssistantId = process.env.VAPI_ASSISTANT_ID; // The ID of your pre-existing Vapi Assistant
    this.webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  }

  /**
   * Initiates an outbound phone call via Vapi.
   * This method uses an existing Vapi assistant and can apply temporary overrides for the call.
   *
   * @param {object} options
   * @param {string} options.phoneNumber - The target phone number to call (e.g., "+1234567890").
   * @param {string} [options.assistantId] - Optional. The ID of a *different* existing Vapi assistant to use for this specific call,
   * overriding the `this.defaultAssistantId`.
   * @param {object} [options.assistantOverrides] - Optional. An object containing properties
   * to temporarily override on the chosen assistant for this specific call.
   * Examples: `{ firstMessage: "Hi there!", systemPrompt: "...", model: {...}, voice: {...} }`.
   * @param {object} [options.metadata] - Optional. Custom metadata to attach to the Vapi call record,
   * useful for correlating calls with your internal user IDs, etc.
   * @returns {Promise<object>} A Promise that resolves with the Vapi Call object if the call is initiated successfully.
   * @throws {Error} If the call initiation fails (e.g., invalid ID, insufficient credits, Vapi API error).
   */
  async startCall({ phoneNumber, assistantId, assistantOverrides = {}, metadata = {} }) {
    // Determine which assistant ID to use: explicitly provided, or the default from .env
    const finalAssistantId = assistantId || this.defaultAssistantId;

    if (!finalAssistantId) {
      throw new Error('No assistant ID provided or configured as default in environment variables. Cannot start call.');
    }

    // --- FIX FOR "assistant.property id should not exist" ERROR ---
    // When an `id` is provided for the `assistant` property in `vapi.calls.create`,
    // other properties like `systemPrompt`, `firstMessage`, `model`, `voice` etc.,
    // should be directly nested within that same `assistant` object.
    // They act as temporary overrides for the existing assistant's configuration for this call.
    const assistantConfigForCall = {
      id: finalAssistantId, // This tells Vapi to use the existing assistant
      ...assistantOverrides // Spread any overrides directly onto this object
    };

    try {
      console.log(`[VapiService] Attempting to start call to "${phoneNumber}" with assistant ID "${finalAssistantId}"...`);
      // Log the exact assistant configuration being sent to Vapi for debugging
      console.log('[VapiService] Assistant config sent to Vapi:', JSON.stringify(assistantConfigForCall, null, 2));

      const call = await this.vapi.calls.create({
        phoneNumberId: this.phoneNumberId, // The Vapi phone number ID configured to make outbound calls
        assistant: assistantConfigForCall, // The constructed assistant configuration for this specific call
        customer: { number: phoneNumber }, // The recipient's phone number
        metadata // Any custom metadata you want associated with the Vapi call record
      });

      console.log('[VapiService] Outbound call initiated successfully. Vapi Call ID:', call.id);
      return call;
    } catch (error) {
      // Improved error logging to capture details from Vapi's API response
      const errorMessage = error?.response?.data
        ? `Status: ${error.response.status}, Body: ${JSON.stringify(error.response.data, null, 2)}`
        : error.message;
      console.error('[VapiService] Failed to start call:', errorMessage);
      throw new Error(`Unable to start voice call: ${errorMessage}`);
    }
  }

  /**
   * Validates the authenticity of incoming Vapi webhook requests using the shared secret.
   * This is a critical security measure to ensure webhook events are from Vapi and not spoofed.
   *
   * @param {string} payload - The raw request body as a string (VERY IMPORTANT: must be unparsed).
   * @param {string} signatureHeader - The value of the 'x-vapi-signature' HTTP header from the request.
   * @returns {boolean} True if the signature is valid, false otherwise.
   */
  validateWebhookSignature(payload, signatureHeader) {
    if (!this.webhookSecret) {
      // In a production environment, you should probably throw an error here
      // or at least have a very clear warning/monitoring if the secret is missing.
      console.warn('Webhook secret is not configured. Webhook signature validation skipped. DANGER: This is INSECURE in production!');
      return true; // Allow validation to pass if secret is not set (for dev/testing)
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

    // Compute the expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    // Use a timing-safe comparison to prevent timing attacks (important for security)
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isValid) {
        console.error('Webhook signature mismatch. Calculated:', expectedSignature, 'Received:', signature);
    }
    return isValid;
  }

  /**
   * Fetches detailed information about a specific Vapi call by its ID.
   * @param {string} callId - The unique ID of the Vapi call.
   * @returns {Promise<object>} A Promise that resolves with the Vapi Call object.
   * @throws {Error} If the call cannot be fetched (e.g., callId is invalid, not found).
   */
  async getCall(callId) {
    try {
      console.log(`[VapiService] Fetching call details for Vapi Call ID: ${callId}...`);
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

// Export a singleton instance of the VapiService class
module.exports = new VapiService();
