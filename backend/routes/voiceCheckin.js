// routes/voiceCheckin.js
const express = require('express');
const router = express.Router();
const VoiceCheckinController = require('../controllers/VoiceCheckinController');
// const { verifyToken } = require('../middleware/verifyToken'); // Uncomment and implement if you add authentication for secure endpoints

/**
 * Voice Check-in Routes
 * This file defines the API endpoints related to voice-based daily check-ins using Vapi.
 */

/**
 * @route   POST /api/voice-checkin/start
 * @desc    Initiate a voice check-in call with a user.
 * @access  Public (Highly recommend adding authentication/authorization middleware for production)
 * @body    { userId: string, phoneNumber: string, trimester?: number, weekOfPregnancy?: number }
 */
router.post('/start', VoiceCheckinController.startDailyCheckin);

/**
 * @route   POST /api/voice-checkin/webhook
 * @desc    This endpoint receives webhook events from Vapi for various call lifecycle states
 * (e.g., call started, call ended, real-time transcripts, function-call).
 * @access  Public (Security is handled by Vapi's signature verification within the controller)
 * @body    Vapi webhook event payload (JSON)
 */
router.post('/webhook', VoiceCheckinController.handleWebhook);

/**
 * @route   GET /api/voice-checkin/history
 * @desc    Retrieve a paginated list of a user's past voice check-in records.
 * @access  Public (Recommend adding authentication/authorization middleware)
 * @query   { userId: string, limit?: number, offset?: number }
 */
router.get('/history', VoiceCheckinController.getCheckinHistory);

/**
 * @route   GET /api/voice-checkin/trends
 * @desc    Get wellness trends derived from a user's voice check-in data.
 * (Implementation is currently a placeholder).
 * @access  Public (Recommend adding authentication/authorization middleware)
 * @query   { userId: string, days?: number }
 */
router.get('/trends', VoiceCheckinController.getWellnessTrends);

/**
 * @route   GET /api/voice-checkin/attention
 * @desc    Get check-ins that may require attention (e.g., for healthcare providers review).
 * (Implementation is currently a placeholder).
 * @access  Public (Requires specific authentication/authorization for providers)
 * @query   { page?: number, limit?: number }
 */
router.get('/attention', VoiceCheckinController.getCheckinsNeedingAttention);

/**
 * @route   GET /api/voice-checkin/:id
 * @desc    Retrieve detailed information for a specific voice check-in record by its MongoDB ID.
 * @access  Public (Recommend adding authentication/authorization middleware)
 * @params  { id: string } - The MongoDB _id of the VoiceCheckin record.
 */
router.get('/:id', VoiceCheckinController.getCheckinById);

module.exports = router;
