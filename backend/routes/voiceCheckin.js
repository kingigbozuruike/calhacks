// routes/voiceCheckin.js
const express = require('express');
const router = express.Router();
const VoiceCheckinController = require('../controllers/VoiceCheckinController');
// const { verifyToken } = require('../middleware/verifyToken'); // Uncomment and implement if you add authentication

/**
 * Voice Check-in Routes
 * Handles voice-based daily check-ins using Vapi
 */

/**
 * @route   POST /api/voice-checkin/start
 * @desc    Start a voice check-in call with a user.
 * @access  Public (Consider adding verifyToken middleware for production)
 * @body    { userId: string, phoneNumber: string, trimester?: number, weekOfPregnancy?: number }
 */
router.post('/start', VoiceCheckinController.startDailyCheckin);

/**
 * @route   POST /api/voice-checkin/webhook
 * @desc    Endpoint for Vapi to send webhook events (call start, end, transcript, function-call, etc.).
 * @access  Public (Secured by Vapi signature verification in controller)
 * @body    Vapi webhook event payload (will be validated for authenticity)
 */
router.post('/webhook', VoiceCheckinController.handleWebhook);

/**
 * @route   GET /api/voice-checkin/history
 * @desc    Retrieve a user's voice check-in history.
 * @access  Public (Consider adding verifyToken middleware for production)
 * @query   { userId: string, limit?: number, offset?: number }
 */
router.get('/history', VoiceCheckinController.getCheckinHistory);

/**
 * @route   GET /api/voice-checkin/trends
 * @desc    Get wellness trends derived from a user's voice check-ins.
 * @access  Public (Consider adding verifyToken middleware for production)
 * @query   { userId: string, days?: number }
 */
router.get('/trends', VoiceCheckinController.getWellnessTrends);

/**
 * @route   GET /api/voice-checkin/attention
 * @desc    Get check-ins that may require attention (e.g., for healthcare providers review).
 * @access  Public (Implement specific authentication for providers in production)
 * @query   { page?: number, limit?: number }
 */
router.get('/attention', VoiceCheckinController.getCheckinsNeedingAttention);

/**
 * @route   GET /api/voice-checkin/:id
 * @desc    Get details for a specific voice check-in record by its ID.
 * @access  Public (Consider adding verifyToken middleware for production)
 * @params  { id: string } - The ID of the voice check-in record (from your MongoDB).
 */
router.get('/:id', VoiceCheckinController.getCheckinById);

module.exports = router;
