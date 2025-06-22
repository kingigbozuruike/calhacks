// Import User model for user validation
const User = require('../models/User');

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
    // Get actual user ID from JWT token
    const userId = req.user.id;

    const { message, context, sessionId } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string'
      });
    }

    // Get user's actual pregnancy information from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate current pregnancy context from user's actual data
    let userContext = {
      trimester: 1,
      weekOfPregnancy: 1,
      dueDate: null
    };

    if (user.conceptionDate) {
      const now = new Date();
      const conception = new Date(user.conceptionDate);

      console.log(`DEBUG - User ${userId} conception date:`, user.conceptionDate);
      console.log(`DEBUG - Parsed conception date:`, conception);
      console.log(`DEBUG - Current date:`, now);

      const daysSinceConception = Math.floor((now - conception) / (1000 * 60 * 60 * 24));
      const weekOfPregnancy = Math.floor(daysSinceConception / 7) + 1; // +1 because pregnancy starts at week 1

      console.log(`DEBUG - Days since conception:`, daysSinceConception);
      console.log(`DEBUG - Week of pregnancy:`, weekOfPregnancy);

      // Calculate trimester based on weeks
      let trimester = 1;
      if (weekOfPregnancy > 27) trimester = 3;
      else if (weekOfPregnancy > 13) trimester = 2;

      console.log(`DEBUG - Calculated trimester:`, trimester);

      // Calculate due date (40 weeks from conception)
      const dueDate = new Date(conception);
      dueDate.setDate(dueDate.getDate() + (40 * 7)); // 40 weeks = 280 days

      userContext = {
        trimester,
        weekOfPregnancy: Math.max(1, weekOfPregnancy),
        dueDate: dueDate.toISOString(),
        firstName: user.firstName,
        lastName: user.lastName
      };
    }


    console.log(`Chat context for user ${userId}:`, userContext);

    // Get or create session for conversation continuity
    const currentSessionId = sessionId || SessionService.createSession(userId);

    // Add user message to session
    SessionService.addMessage(currentSessionId, 'user', message, {
      timestamp: new Date().toISOString()
    });

    // Get user's stored context for personalization
    const storedContext = await ChatHistory.getUserContext(userId);
    const enhancedContext = {
      ...userContext,
      ...(storedContext || {})
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
    // Get actual user ID from JWT token
    const userId = req.user.id;

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
    // Get actual user ID from JWT token
    const userId = req.user.id;

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
