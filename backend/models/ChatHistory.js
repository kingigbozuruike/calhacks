// TODO: Developer A - Replace with actual Mongoose model once MongoDB is set up
// const mongoose = require('mongoose');

// Import required models and utilities at the top level
const User = require('./User');
const { getTrimester, getWeekOfPregnancy, calculateDueDate } = require('../utils/pregnancyUtils');

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
    console.log(`🔍 [getUserContext] Looking for context for user: ${userId}`);
    console.log(`📋 [getUserContext] All stored user IDs:`, Array.from(this.userContexts.keys()));
    console.log(`🔢 [getUserContext] Total contexts stored: ${this.userContexts.size}`);

    // Ensure we're working with string userId
    const userIdString = String(userId).trim();
    console.log(`🔄 [getUserContext] Converted userId to string: ${userIdString}`);

    // For new users, return null to ensure fresh context
    const context = this.userContexts.get(userIdString);

    if (!context) {
      console.log(`❌ [getUserContext] No context found for user: ${userIdString} - This is CORRECT for new users`);
      console.log(`🔍 [getUserContext] Checking if any stored IDs match:`,
        Array.from(this.userContexts.keys()).map(id => ({ stored: id, matches: id === userIdString })));
      return null;
    }

    console.log(`✅ [getUserContext] Found EXISTING context for user ${userIdString}:`, context);
    console.log(`⚠️ [getUserContext] WARNING: This user has previous conversation history`);
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
    // Ensure consistent string conversion
    const userIdString = String(userId);
    console.log(`🔄 [updateUserContext] Converting userId to string: ${userIdString}`);

    const existingContext = this.userContexts.get(userIdString) || {
      userId: userIdString,
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

    console.log(`📝 [updateUserContext] Existing context for user ${userIdString}:`, existingContext);
    console.log(`📝 [updateUserContext] New context data:`, contextData);

    // Merge new context data
    const updatedContext = {
      ...existingContext,
      ...contextData,
      userId: userIdString, // Ensure userId is always string
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

    this.userContexts.set(userIdString, updatedContext);
    console.log(`✅ [updateUserContext] Updated context for user: ${userIdString}`);
    console.log(`📊 [updateUserContext] Final updated context:`, updatedContext);

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
  /**
   * Get pregnancy context for AI conversations
   * Combines actual user pregnancy data with conversation context
   * IMPORTANT: This method ensures complete user isolation
   */
  async getPregnancyContextForUser(userId) {
    // Import User model
    const User = require('../models/User');
    const { getTrimester, getWeekOfPregnancy, calculateDueDate } = require('../utils/pregnancyUtils');

    try {
      console.log(`🎯 [getPregnancyContextForUser] Getting pregnancy context for user: ${userId}`);
      console.log(`🔍 [getPregnancyContextForUser] User ID type: ${typeof userId}, length: ${userId?.length}`);

      // Ensure we have a clean string userId for consistency
      const cleanUserId = String(userId).trim();
      console.log(`🧹 [getPregnancyContextForUser] Clean user ID: ${cleanUserId}`);

      // Ensure userId is a valid ObjectId string
      if (!cleanUserId || typeof cleanUserId !== 'string' || cleanUserId.length !== 24) {
        console.log(`❌ [getPregnancyContextForUser] Invalid user ID format: ${cleanUserId}`);
        return {
          trimester: 1,
          weekOfPregnancy: 8,
          isFirstTime: true,
          userId: cleanUserId,
          source: 'default-invalid-id'
        };
      }

      // Get actual user data from database
      const user = await User.findById(cleanUserId);

      if (!user) {
        console.log(`❌ [getPregnancyContextForUser] User not found in database: ${cleanUserId}`);
        return {
          trimester: 1,
          weekOfPregnancy: 8,
          isFirstTime: true,
          userId: cleanUserId,
          source: 'default-user-not-found'
        };
      }

      console.log(`✅ [getPregnancyContextForUser] Found user in database:`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Name: ${user.firstName} ${user.lastName}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Conception Date: ${user.conceptionDate}`);
      console.log(`   - Has Previous Pregnancy: ${user.hasHadPreviousPregnancy}`);

      // Calculate pregnancy details if conception date exists
      let pregnancyContext = {
        trimester: 1,
        weekOfPregnancy: 8,
        isFirstTime: true,
        firstName: user.firstName,
        userId: cleanUserId,
        source: 'database-defaults'
      };

      if (user.conceptionDate) {
        console.log(`📅 [getPregnancyContextForUser] Calculating pregnancy details from conception date: ${user.conceptionDate}`);

        const weekOfPregnancy = getWeekOfPregnancy(user.conceptionDate);
        const trimester = getTrimester(weekOfPregnancy);
        const dueDate = calculateDueDate(user.conceptionDate);

        console.log(`   - Week of pregnancy: ${weekOfPregnancy}`);
        console.log(`   - Trimester: ${trimester}`);
        console.log(`   - Due date: ${dueDate}`);

        pregnancyContext = {
          trimester,
          weekOfPregnancy,
          dueDate: dueDate.toISOString().split('T')[0],
          isFirstTime: !user.hasHadPreviousPregnancy || false,
          firstName: user.firstName,
          userId: cleanUserId,
          source: 'database-calculated'
        };
      } else {
        console.log(`⚠️ [getPregnancyContextForUser] No conception date found for user ${cleanUserId}, using defaults`);
      }

      console.log(`📊 [getPregnancyContextForUser] Final calculated pregnancy context for user ${cleanUserId}:`, pregnancyContext);

      // CRITICAL: Check for conversation context using the EXACT same userId format
      console.log(`🔍 [getPregnancyContextForUser] Checking for existing conversation context for user: ${cleanUserId}`);
      console.log(`🗂️ [getPregnancyContextForUser] Current stored contexts:`, Array.from(this.userContexts.keys()));

      const userContext = await this.getUserContext(cleanUserId);

      if (!userContext) {
        console.log(`🆕 [getPregnancyContextForUser] No existing conversation context for user ${cleanUserId}, returning fresh context`);
        const finalContext = {
          ...pregnancyContext,
          commonConcerns: [],
          preferences: [],
          recentTopics: [],
          contextSource: 'fresh-no-conversation-history'
        };
        console.log(`🎯 [getPregnancyContextForUser] Final fresh context for user ${cleanUserId}:`, finalContext);
        return finalContext;
      }

      console.log(`💬 [getPregnancyContextForUser] Found existing conversation context for user ${cleanUserId}:`, userContext);

      // Combine actual pregnancy data with conversation context
      const finalContext = {
        ...pregnancyContext,
        commonConcerns: userContext?.conversationSummary?.commonConcerns || [],
        preferences: userContext?.conversationSummary?.preferences || [],
        recentTopics: userContext?.conversationSummary?.lastDiscussed || [],
        contextSource: 'combined-with-conversation-history'
      };

      console.log(`🎯 [getPregnancyContextForUser] Final combined context for user ${cleanUserId}:`, finalContext);
      return finalContext;
    } catch (error) {
      console.error(`❌ [getPregnancyContextForUser] Error getting pregnancy context for user ${userId}:`, error);
      console.error(`❌ [getPregnancyContextForUser] Error stack:`, error.stack);
      // Return safe defaults with user ID for debugging
      return {
        trimester: 1,
        weekOfPregnancy: 8,
        isFirstTime: true,
        userId: String(userId),
        source: 'error-fallback',
        error: `Failed to get context for user ${userId}: ${error.message}`
      };
    }
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
