const express = require('express');
const router = express.Router();

// Import chat controller
const {
  handleChatMessage,
  getChatHistory,
  clearChatHistory
} = require('../controllers/ChatController');

// TODO: Developer A - Import authentication middleware once implemented
// const { verifyToken } = require('../middleware/auth');

// TODO: Developer A - Add authentication middleware to all routes
// router.use(verifyToken);

/**
 * POST /api/chatbot/message
 * Handle chatbot messages and return AI responses
 * Body:
 * - userId (string, optional): User ID for development (remove when auth is implemented)
 * - message (string, required): User's message to the chatbot
 * - context (object, optional): Additional context like trimester, weekOfPregnancy, etc.
 */
router.post('/message', handleChatMessage);

/**
 * GET /api/chatbot/history
 * Get chat history for the authenticated user
 * Query params:
 * - userId (string, optional): User ID for development (remove when auth is implemented)
 * - limit (number, optional): Number of messages to return (default: 50)
 * - offset (number, optional): Number of messages to skip (default: 0)
 */
router.get('/history', getChatHistory);

/**
 * DELETE /api/chatbot/history
 * Clear chat history for the authenticated user
 * Body/Query params:
 * - userId (string, optional): User ID for development (remove when auth is implemented)
 */
router.delete('/history', clearChatHistory);

module.exports = router;
