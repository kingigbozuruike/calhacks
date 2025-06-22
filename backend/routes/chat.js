const express = require('express');
const router = express.Router();

// Import chat controller
const {
  handleChatMessage,
  getChatHistory,
  clearChatHistory
} = require('../controllers/ChatController');

// Import authentication middleware
const verifyToken = require('../middleware/verifyToken');

// Add authentication middleware to all routes
router.use(verifyToken);

/**
 * POST /api/chatbot/message
 * Handle chatbot messages and return AI responses
 * Body:
 * - message (string, required): User's message to the chatbot
 * - context (object, optional): Additional context like trimester, weekOfPregnancy, etc.
 * - sessionId (string, optional): Session ID for conversation continuity
 */
router.post('/message', handleChatMessage);

/**
 * GET /api/chatbot/history
 * Get chat history for the authenticated user
 * Query params:
 * - limit (number, optional): Number of messages to return (default: 50)
 * - offset (number, optional): Number of messages to skip (default: 0)
 */
router.get('/history', getChatHistory);

/**
 * DELETE /api/chatbot/history
 * Clear chat history for the authenticated user
 */
router.delete('/history', clearChatHistory);

module.exports = router;
