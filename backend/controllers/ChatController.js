// TODO: Developer A - Import User model for user validation once mongoose is set up
// const User = require('../models/User');

// Import services for session-based conversations
const GeminiService = require('../services/GeminiService');
const SessionService = require('../services/SessionService');
const ChatHistory = require('../models/ChatHistory');

/**
 * Handle chatbot messages with session-based conversation
 * POST /api/chatbot/message
 */
const handleChatMessage = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const userId = req.body.userId || 'user123'; // Mock user ID for development

    const { message, context, sessionId } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string'
      });
    }

    // TODO: Developer A - Get user's pregnancy information for context
    // const user = await User.findById(userId);
    // const trimester = user.trimester;
    // const weekOfPregnancy = user.weekOfPregnancy;

    // Mock user context for development
    const userContext = {
      trimester: context?.trimester || 1,
      weekOfPregnancy: context?.weekOfPregnancy || 8,
      dueDate: context?.dueDate || new Date(Date.now() + 7 * 30 * 24 * 60 * 60 * 1000) // ~7 months from now
    };

    // Get or create session for conversation continuity
    const currentSessionId = sessionId || SessionService.createSession(userId);

    // Add user message to session
    SessionService.addMessage(currentSessionId, 'user', message, {
      timestamp: new Date().toISOString()
    });

    // Get user's stored context for personalization
    const storedContext = await ChatHistory.getPregnancyContext(userId);
    const enhancedContext = {
      ...userContext,
      ...storedContext
    };

    // Generate response using Gemini AI service with conversation context
    const response = await GeminiService.generateResponse(message, enhancedContext);

    // Add bot response to session
    SessionService.addMessage(currentSessionId, 'assistant', response.text, {
      type: response.type,
      suggestions: response.suggestions,
      timestamp: new Date().toISOString()
    });

    // Check if session should be summarized and stored
    const sessionMessages = SessionService.getFullConversation(currentSessionId);
    if (sessionMessages.length >= 10) { // Summarize after 10 messages
      try {
        const summary = await GeminiService.extractConversationSummary(sessionMessages, enhancedContext);
        await ChatHistory.addSessionInsights(userId, summary);

        // End session after summarizing to prevent memory buildup
        SessionService.endSession(currentSessionId);
        console.log(`Session ${currentSessionId} summarized and cleared for user ${userId}`);
      } catch (summaryError) {
        console.error('Error summarizing session:', summaryError);
        // Continue without summarizing - don't break the chat flow
      }
    }

    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        userMessage: message,
        botResponse: response.text,
        responseType: response.type,
        suggestions: response.suggestions || [],
        context: userContext,
        conversationLength: sessionMessages.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get chat history for the authenticated user
 * GET /api/chatbot/history
 */
const getChatHistory = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const userId = req.query.userId || 'user123'; // Mock user ID for development

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // TODO: Developer A - Implement actual chat history storage and retrieval
    // const chatHistory = await ChatHistory.find({ userId })
    //   .sort({ createdAt: -1 })
    //   .limit(limit)
    //   .skip(offset);

    // Mock chat history for development
    const mockChatHistory = [
      {
        id: 1,
        userId: userId,
        userMessage: "How much water should I drink?",
        botResponse: "During pregnancy, it's recommended to drink 8-10 glasses of water daily. This helps support your growing baby and prevents dehydration.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 2,
        userId: userId,
        userMessage: "What foods should I avoid?",
        botResponse: "During pregnancy, avoid raw fish, unpasteurized dairy, high-mercury fish, and excessive caffeine. Focus on nutritious whole foods.",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ];

    const paginatedHistory = mockChatHistory.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        chatHistory: paginatedHistory,
        pagination: {
          limit,
          offset,
          total: mockChatHistory.length,
          hasMore: offset + limit < mockChatHistory.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


/**
 * Clear chat history for the authenticated user
 * DELETE /api/chatbot/history
 */
const clearChatHistory = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const userId = req.body.userId || req.query.userId || 'user123'; // Mock user ID for development

    // TODO: Developer A - Implement actual chat history deletion
    // await ChatHistory.deleteMany({ userId });

    // Mock implementation for development
    console.log(`Chat history cleared for user: ${userId}`);

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  handleChatMessage,
  getChatHistory,
  clearChatHistory
};
