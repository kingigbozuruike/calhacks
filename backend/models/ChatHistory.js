// TODO: Developer A - Replace with actual Mongoose model once MongoDB is set up
// const mongoose = require('mongoose');

/**
 * ChatHistory Model - Stores user conversation context and summaries
 * This stores persistent context between sessions, NOT full conversation history
 */

// TODO: Developer A - Uncomment and use this Mongoose schema once MongoDB is connected
/*
const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  pregnancyContext: {
    trimester: { type: Number, min: 1, max: 3 },
    weekOfPregnancy: { type: Number, min: 1, max: 42 },
    dueDate: Date,
    conceptionDate: Date
  },
  conversationSummary: {
    commonConcerns: [String], // ['morning sickness', 'fatigue', 'anxiety']
    preferences: [String], // ['natural remedies', 'gentle exercise']
    medicalHistory: [String], // Important medical info mentioned
    keyTopics: [String], // Main topics discussed
    lastDiscussed: [String] // Recent conversation themes
  },
  behaviorInsights: {
    preferredResponseStyle: String, // 'detailed', 'concise', 'supportive'
    timeOfDayActive: [String], // ['morning', 'evening']
    frequentQuestions: [String] // Common question patterns
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  sessionCount: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

chatHistorySchema.index({ userId: 1, lastUpdated: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
*/

// Mock implementation for development (until MongoDB is set up)
class ChatHistory {
  constructor() {
    // Mock storage for user conversation contexts
    this.userContexts = new Map();
  }

  /**
   * Get user's conversation context and summary
   * @param {string} userId - User ID
   * @returns {Object|null} User context or null if not found
   */
  async getUserContext(userId) {
    const context = this.userContexts.get(userId);

    if (!context) {
      return null;
    }

    // Return a copy to prevent direct modification
    return JSON.parse(JSON.stringify(context));
  }

  /**
   * Create or update user's conversation context
   * @param {string} userId - User ID
   * @param {Object} contextData - Context data to store
   * @returns {Object} Updated context
   */
  async updateUserContext(userId, contextData) {
    const existingContext = this.userContexts.get(userId) || {
      userId,
      pregnancyContext: {},
      conversationSummary: {
        commonConcerns: [],
        preferences: [],
        medicalHistory: [],
        keyTopics: [],
        lastDiscussed: []
      },
      behaviorInsights: {
        preferredResponseStyle: 'supportive',
        timeOfDayActive: [],
        frequentQuestions: []
      },
      sessionCount: 0,
      totalMessages: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Merge new context data
    const updatedContext = {
      ...existingContext,
      ...contextData,
      pregnancyContext: {
        ...existingContext.pregnancyContext,
        ...(contextData.pregnancyContext || {})
      },
      conversationSummary: {
        ...existingContext.conversationSummary,
        ...(contextData.conversationSummary || {})
      },
      behaviorInsights: {
        ...existingContext.behaviorInsights,
        ...(contextData.behaviorInsights || {})
      },
      lastUpdated: new Date().toISOString()
    };

    this.userContexts.set(userId, updatedContext);
    console.log(`Updated context for user: ${userId}`);

    return updatedContext;
  }

  /**
   * Add conversation insights from a completed session
   * @param {string} userId - User ID
   * @param {Object} sessionSummary - Summary extracted from conversation
   * @returns {Object} Updated context
   */
  async addSessionInsights(userId, sessionSummary) {
    const existingContext = await this.getUserContext(userId) || {};

    const updatedContext = {
      ...existingContext,
      userId,
      sessionCount: (existingContext.sessionCount || 0) + 1,
      totalMessages: (existingContext.totalMessages || 0) + (sessionSummary.messageCount || 0),
      conversationSummary: {
        commonConcerns: this.mergeArrays(
          existingContext.conversationSummary?.commonConcerns || [],
          sessionSummary.concerns || []
        ),
        preferences: this.mergeArrays(
          existingContext.conversationSummary?.preferences || [],
          sessionSummary.preferences || []
        ),
        medicalHistory: this.mergeArrays(
          existingContext.conversationSummary?.medicalHistory || [],
          sessionSummary.medicalInfo || []
        ),
        keyTopics: this.mergeArrays(
          existingContext.conversationSummary?.keyTopics || [],
          sessionSummary.topics || []
        ),
        lastDiscussed: sessionSummary.recentTopics || []
      },
      pregnancyContext: {
        ...existingContext.pregnancyContext,
        ...(sessionSummary.pregnancyContext || {})
      }
    };

    return await this.updateUserContext(userId, updatedContext);
  }

  /**
   * Get user's pregnancy context for AI personalization
   * @param {string} userId - User ID
   * @returns {Object} Pregnancy context for AI
   */
  async getPregnancyContext(userId) {
    const userContext = await this.getUserContext(userId);

    if (!userContext) {
      return {
        trimester: 1,
        weekOfPregnancy: 8,
        isFirstTime: true
      };
    }

    return {
      ...userContext.pregnancyContext,
      commonConcerns: userContext.conversationSummary?.commonConcerns || [],
      preferences: userContext.conversationSummary?.preferences || [],
      recentTopics: userContext.conversationSummary?.lastDiscussed || []
    };
  }

  /**
   * Clear user's conversation context (privacy/reset)
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async clearUserContext(userId) {
    const deleted = this.userContexts.delete(userId);

    if (deleted) {
      console.log(`Cleared context for user: ${userId}`);
    }

    return deleted;
  }

  /**
   * Get all users with stored contexts (for admin/analytics)
   * @returns {Array} Array of user IDs with context
   */
  async getAllUserIds() {
    return Array.from(this.userContexts.keys());
  }

  /**
   * Get context statistics
   * @returns {Object} Context storage statistics
   */
  getStats() {
    const totalUsers = this.userContexts.size;
    const contexts = Array.from(this.userContexts.values());

    const totalSessions = contexts.reduce((sum, ctx) => sum + (ctx.sessionCount || 0), 0);
    const totalMessages = contexts.reduce((sum, ctx) => sum + (ctx.totalMessages || 0), 0);

    return {
      totalUsers,
      totalSessions,
      totalMessages,
      averageSessionsPerUser: totalUsers > 0 ? Math.round(totalSessions / totalUsers) : 0,
      averageMessagesPerUser: totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0
    };
  }

  /**
   * Helper method to merge arrays and remove duplicates
   * @private
   */
  mergeArrays(existing, newItems) {
    const combined = [...existing, ...newItems];
    return [...new Set(combined)]; // Remove duplicates
  }
}

// Create singleton instance for mock implementation
const chatHistory = new ChatHistory();

module.exports = chatHistory;
