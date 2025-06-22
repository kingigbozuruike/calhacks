const express = require('express');
const router = express.Router();
const VoiceCheckinController = require('../controllers/VoiceCheckinController');
const { verifyToken } = require('../middleware/verifyToken');

/**
 * Voice Check-in Routes
 * Handles voice-based daily check-ins using Vapi
 */

/**
 * @route   POST /api/voice-checkin/start
 * @desc    Start a voice check-in call
 * @access  Public (TODO: Add authentication middleware)
 * @body    { userId: string, phoneNumber: string }
 */

console.log('VoiceCheckinController:', VoiceCheckinController);


router.post('/start', VoiceCheckinController.startDailyCheckin);

/**
 * @route   POST /api/voice-checkin/webhook
 * @desc    Handle Vapi webhook for call completion
 * @access  Public (Vapi webhook)
 * @body    { callId: string, transcript: string, callDuration: number, status: string }
 */
router.post('/webhook', VoiceCheckinController.handleWebhook);

/**
 * @route   GET /api/voice-checkin/history
 * @desc    Get user's voice check-in history
 * @access  Public (TODO: Add authentication middleware)
 * @query   { userId: string, days?: number, page?: number, limit?: number }
 */
router.get('/history', VoiceCheckinController.getCheckinHistory);

/**
 * @route   GET /api/voice-checkin/trends
 * @desc    Get wellness trends for user
 * @access  Public (TODO: Add authentication middleware)
 * @query   { userId: string, days?: number }
 */
router.get('/trends', VoiceCheckinController.getWellnessTrends);

/**
 * @route   GET /api/voice-checkin/attention
 * @desc    Get check-ins that need attention (for healthcare providers)
 * @access  Public (TODO: Add authentication middleware for healthcare providers)
 * @query   { page?: number, limit?: number }
 */
router.get('/attention', VoiceCheckinController.getCheckinsNeedingAttention);

/**
 * @route   GET /api/voice-checkin/:id
 * @desc    Get specific voice check-in details
 * @access  Public (TODO: Add authentication middleware)
 * @params  { id: string }
 * @query   { userId: string }
 */
router.get('/:id', VoiceCheckinController.getCheckinById);

module.exports = router;
