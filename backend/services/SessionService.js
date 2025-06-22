/**
 * Session-based conversation storage service
 * Handles temporary conversation storage and session management
 */

class SessionService {
  constructor() {
    // In-memory storage for active sessions
    // TODO: Replace with Redis in production for scalability
    this.sessions = new Map();

    // Session configuration
    this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    this.MAX_MESSAGES_PER_SESSION = 50; // Prevent memory bloat

    // Auto-cleanup expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Generate a unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create a new session for a user
   * @param {string} userId - User ID
   * @param {Object} initialContext - Initial pregnancy context
   * @returns {string} Session ID
   */
  createSession(userId, initialContext = {}) {
    const sessionId = this.generateSessionId();

    this.sessions.set(sessionId, {
      userId,
      messages: [],
      context: initialContext,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.SESSION_TIMEOUT
    });

    console.log(`Created new session: ${sessionId} for user: ${userId}`);
    return sessionId;
  }

  /**
   * Get session data
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session data or null if not found/expired
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      console.log(`Session expired and removed: ${sessionId}`);
      return null;
    }

    return session;
  }

  /**
   * Add a message to the session
   * @param {string} sessionId - Session ID
   * @param {string} role - 'user' or 'assistant'
   * @param {string} message - Message content
   * @param {Object} metadata - Additional metadata
   * @returns {boolean} Success status
   */
  addMessage(sessionId, role, message, metadata = {}) {
    const session = this.getSession(sessionId);

    if (!session) {
      console.error(`Cannot add message to non-existent session: ${sessionId}`);
      return false;
    }

    // Prevent memory bloat by limiting messages per session
    if (session.messages.length >= this.MAX_MESSAGES_PER_SESSION) {
      // Remove oldest messages (keep recent conversation context)
      session.messages = session.messages.slice(-40); // Keep last 40 messages
    }

    const messageObj = {
      role,
      message,
      timestamp: Date.now(),
      ...metadata
    };

    session.messages.push(messageObj);

    // Update session activity
    session.lastActivity = Date.now();
    session.expiresAt = Date.now() + this.SESSION_TIMEOUT;

    console.log(`Added ${role} message to session ${sessionId}. Total messages: ${session.messages.length}`);
    return true;
  }

  /**
   * Get conversation history for AI context (recent messages only)
   * @param {string} sessionId - Session ID
   * @param {number} limit - Number of recent messages to return
   * @returns {Array} Recent messages for AI context
   */
  getConversationContext(sessionId, limit = 10) {
    const session = this.getSession(sessionId);

    if (!session) {
      return [];
    }

    // Return recent messages for AI context
    return session.messages.slice(-limit).map(msg => ({
      role: msg.role,
      content: msg.message,
      timestamp: msg.timestamp
    }));
  }

  /**
   * Get full conversation history (for summarization)
   * @param {string} sessionId - Session ID
   * @returns {Array} All messages in the session
   */
  getFullConversation(sessionId) {
    const session = this.getSession(sessionId);

    if (!session) {
      return [];
    }

    return session.messages;
  }

  /**
   * Update session context (pregnancy info, preferences, etc.)
   * @param {string} sessionId - Session ID
   * @param {Object} contextUpdate - Context updates
   * @returns {boolean} Success status
   */
  updateSessionContext(sessionId, contextUpdate) {
    const session = this.getSession(sessionId);

    if (!session) {
      return false;
    }

    session.context = {
      ...session.context,
      ...contextUpdate
    };

    session.lastActivity = Date.now();
    return true;
  }

  /**
   * End a session and return conversation data for summarization
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session data for summarization
   */
  endSession(sessionId) {
    const session = this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const sessionData = {
      userId: session.userId,
      messages: session.messages,
      context: session.context,
      duration: Date.now() - session.createdAt,
      messageCount: session.messages.length
    };

    // Remove session from memory
    this.sessions.delete(sessionId);
    console.log(`Ended session: ${sessionId}. Messages: ${sessionData.messageCount}, Duration: ${Math.round(sessionData.duration / 1000)}s`);

    return sessionData;
  }

  /**
   * Check if session exists and is active
   * @param {string} sessionId - Session ID
   * @returns {boolean} Session exists and is active
   */
  isSessionActive(sessionId) {
    return this.getSession(sessionId) !== null;
  }

  /**
   * Extend session timeout (user is actively chatting)
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  extendSession(sessionId) {
    const session = this.getSession(sessionId);

    if (!session) {
      return false;
    }

    session.expiresAt = Date.now() + this.SESSION_TIMEOUT;
    session.lastActivity = Date.now();
    return true;
  }

  /**
   * Clean up expired sessions
   * @private
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Get session statistics (for monitoring)
   * @returns {Object} Session statistics
   */
  getStats() {
    const activeSessions = this.sessions.size;
    const totalMessages = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.messages.length, 0);

    return {
      activeSessions,
      totalMessages,
      averageMessagesPerSession: activeSessions > 0 ? Math.round(totalMessages / activeSessions) : 0
    };
  }
}

// Create singleton instance
const sessionService = new SessionService();

module.exports = sessionService;
