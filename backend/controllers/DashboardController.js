// Import User model for user validation
const User = require('../models/User');

// Import Gemini AI service for generating daily content
const GeminiService = require('../services/GeminiService');

// Import pregnancy utilities
const getTrimester = require('../utils/getTrimester');
const dayjs = require('dayjs');

/**
 * Get dashboard data for the authenticated user
 * GET /api/dashboard
 */
const getDashboardData = async (req, res) => {
  console.log('🚀 Dashboard API called');
  console.log('📋 Request headers:', req.headers);
  console.log('🔐 Request user from JWT:', req.user);

  try {
    // Get user ID from JWT token (now that authentication is enabled)
    const userId = req.user.id || req.user._id;
    console.log('👤 Extracted userId:', userId);

    // Get user's pregnancy information from database
    console.log('🔍 Searching for user in database...');
    const user = await User.findById(userId);
    console.log('👥 Found user:', user ? 'Yes' : 'No');
    console.log('📅 User conception date:', user?.conceptionDate);

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate pregnancy data from user's conception date
    let userPregnancyData;
    if (user.conceptionDate) {
      const conceptionDate = new Date(user.conceptionDate);
      const today = new Date();
      const daysSinceConception = Math.floor((today - conceptionDate) / (1000 * 60 * 60 * 24));
      const weekOfPregnancy = Math.floor(daysSinceConception / 7);
      const trimester = getTrimester(conceptionDate);
      const dueDate = dayjs(conceptionDate).add(40, 'week').toDate();

      userPregnancyData = {
        trimester,
        weekOfPregnancy,
        dueDate: dueDate.toISOString(),
        conceptionDate: user.conceptionDate.toISOString()
      };
    } else {
      // If no conception date, return error asking user to complete setup
      return res.status(400).json({
        success: false,
        message: 'Please complete your pregnancy information setup',
        redirectTo: '/pregnancy-info'
      });
    }

    // Get trimester progress
    const trimesterProgress = calculateTrimesterProgress(userPregnancyData);

    // Get AI-generated daily content (tips, affirmations, todos) - cached per day
    const dailyContent = await getAIGeneratedDailyContent(userPregnancyData, userId);

    // Generate and store AI tasks, then retrieve them from the Task model
    const aiDailyTasks = await GeminiService.generateDailyTasks(userPregnancyData);
    const aiTrimesterTasks = await GeminiService.generateTrimesterTasks(userPregnancyData);

    // Add AI-generated tasks to our task model for persistence
    const Task = require('../models/Task');
    Task.addAIGeneratedTasks(userId, aiDailyTasks, 'daily');
    Task.addAIGeneratedTasks(userId, aiTrimesterTasks, 'trimester');

    // Get persisted tasks from the Task model with limits
    const todaysTasks = Task.mockTasks.filter(task =>
      task.userId === userId &&
      task.source === 'ai-generated' &&
      task.taskType === 'daily' &&
      task.assignedDate.split('T')[0] === new Date().toISOString().split('T')[0]
    ).slice(0, 7); // Limit to 7 daily tasks

    const trimesterTasks = Task.mockTasks.filter(task =>
      task.userId === userId &&
      task.source === 'ai-generated' &&
      task.taskType === 'trimester' &&
      task.trimester === userPregnancyData.trimester
    ).slice(0, 15); // Limit to 15 trimester tasks

    // Compile dashboard data
    const dashboardData = {
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        trimester: userPregnancyData.trimester,
        weekOfPregnancy: userPregnancyData.weekOfPregnancy,
        dueDate: userPregnancyData.dueDate,
        conceptionDate: userPregnancyData.conceptionDate
      },
      trimesterProgress,
      dailyContent,
      tasks: {
        today: todaysTasks,
        trimester: trimesterTasks,
        summary: {
          totalTodayTasks: todaysTasks.length,
          completedTodayTasks: todaysTasks.filter(task => task.isCompleted).length,
          totalTrimesterTasks: trimesterTasks.length,
          completedTrimesterTasks: trimesterTasks.filter(task => task.isCompleted).length
        }
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get trimester-specific content (tips, affirmations, todos)
 * GET /api/dashboard/content
 */
const getTrimesterContent = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const _userId = req.query.userId || 'user123'; // Mock user ID for development

    const trimester = parseInt(req.query.trimester);
    const contentType = req.query.type; // 'tip', 'affirmation', 'todo', or 'all'

    // Validate trimester parameter
    if (!trimester || trimester < 1 || trimester > 3) {
      return res.status(400).json({
        success: false,
        message: 'Valid trimester (1, 2, or 3) is required'
      });
    }

    // Validate content type if provided
    const validTypes = ['tip', 'affirmation', 'todo', 'all'];
    if (contentType && !validTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Content type must be one of: tip, affirmation, todo, all'
      });
    }

    // Create user context for AI generation
    const userContext = {
      trimester,
      weekOfPregnancy: parseInt(req.query.weekOfPregnancy) || (trimester === 1 ? 8 : trimester === 2 ? 20 : 32),
      dueDate: req.query.dueDate || new Date(Date.now() + 7 * 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Get content based on type
    let content;
    if (contentType === 'all' || !contentType) {
      content = await getAIGeneratedDailyContent(userContext);
    } else {
      content = await getAIGeneratedContentByType(userContext, contentType);
    }

    res.json({
      success: true,
      data: {
        trimester,
        contentType: contentType || 'all',
        content
      }
    });
  } catch (error) {
    console.error('Error fetching trimester content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trimester content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get pregnancy statistics and milestones
 * GET /api/dashboard/stats
 */
const getPregnancyStats = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const _userId = req.query.userId || 'user123'; // Mock user ID for development

    // TODO: Developer A - Get user's pregnancy information from database
    // const user = await User.findById(userId);

    // Mock user pregnancy data for development
    const userPregnancyData = {
      trimester: parseInt(req.query.trimester) || 1,
      weekOfPregnancy: parseInt(req.query.weekOfPregnancy) || 8,
      dueDate: req.query.dueDate || new Date(Date.now() + 7 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      conceptionDate: req.query.conceptionDate || new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const stats = calculatePregnancyStats(userPregnancyData);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching pregnancy stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pregnancy stats',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Calculate trimester progress based on user's pregnancy data
 */
function calculateTrimesterProgress(pregnancyData) {
  const { trimester, weekOfPregnancy, dueDate } = pregnancyData;

  // Calculate progress within current trimester
  let trimesterStartWeek, trimesterEndWeek;
  switch (trimester) {
    case 1:
      trimesterStartWeek = 1;
      trimesterEndWeek = 13;
      break;
    case 2:
      trimesterStartWeek = 14;
      trimesterEndWeek = 27;
      break;
    case 3:
      trimesterStartWeek = 28;
      trimesterEndWeek = 40;
      break;
    default:
      trimesterStartWeek = 1;
      trimesterEndWeek = 13;
  }

  const weeksInTrimester = trimesterEndWeek - trimesterStartWeek + 1;
  const weeksCompleted = Math.max(0, weekOfPregnancy - trimesterStartWeek + 1);
  const progressPercentage = Math.min(100, Math.round((weeksCompleted / weeksInTrimester) * 100));

  // Calculate days until due date
  const today = new Date();
  const dueDateObj = new Date(dueDate);
  const daysUntilDue = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));

  return {
    currentTrimester: trimester,
    currentWeek: weekOfPregnancy,
    trimesterProgress: progressPercentage,
    weeksInTrimester,
    weeksCompleted,
    weeksRemaining: Math.max(0, trimesterEndWeek - weekOfPregnancy),
    daysUntilDue: Math.max(0, daysUntilDue),
    overallProgress: Math.round((weekOfPregnancy / 40) * 100)
  };
}

// Simple in-memory cache for daily content (in production, use Redis or database)
const dailyContentCache = new Map();

/**
 * Get AI-generated daily content (tips, affirmations, todos) using Gemini
 * Cached per user per day to ensure consistency
 * @param {Object} userContext - User's pregnancy context
 * @param {string} userId - User ID for caching
 * @returns {Promise<Object>} - Daily content object
 */
async function getAIGeneratedDailyContent(userContext, userId) {
  // Create cache key based on user ID and current date
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const cacheKey = `${userId}-${today}`;

  console.log('🗄️ Checking daily content cache for key:', cacheKey);

  // Check if we have cached content for today
  if (dailyContentCache.has(cacheKey)) {
    console.log('✅ Found cached daily content');
    return dailyContentCache.get(cacheKey);
  }

  console.log('🔄 Generating new daily content...');

  // Generate all content in parallel for better performance
  // GeminiService handles its own fallbacks internally
  const [tip, affirmation, todo, didYouKnow] = await Promise.all([
    GeminiService.generateDailyTip(userContext),
    GeminiService.generateDailyAffirmation(userContext),
    GeminiService.generateDailyTodo(userContext),
    GeminiService.generateDidYouKnowFact(userContext)
  ]);

  const dailyContent = {
    tip: typeof tip === 'object' ? tip.content || tip.title : tip,
    affirmation: typeof affirmation === 'object' ? affirmation.content || affirmation.title : affirmation,
    todo: typeof todo === 'object' ? todo.content || todo.title : todo,
    didYouKnow: typeof didYouKnow === 'string' ? didYouKnow : (didYouKnow?.content || didYouKnow?.title || 'Did you know your baby is growing every day?'),
    generatedAt: new Date().toISOString(),
    cacheKey
  };

  // Cache the content for the day
  dailyContentCache.set(cacheKey, dailyContent);
  console.log('💾 Cached daily content for today');

  // Clean up old cache entries (keep only last 7 days)
  cleanupOldCacheEntries();

  return dailyContent;
}

/**
 * Clean up old cache entries to prevent memory leaks
 */
function cleanupOldCacheEntries() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

  for (const [key, value] of dailyContentCache.entries()) {
    const entryDate = key.split('-').slice(-3).join('-'); // Extract YYYY-MM-DD from key
    if (entryDate < cutoffDate) {
      dailyContentCache.delete(key);
      console.log('🗑️ Cleaned up old cache entry:', key);
    }
  }
}

/**
 * Get AI-generated content by specific type using Gemini
 * @param {Object} userContext - User's pregnancy context
 * @param {string} contentType - Type of content to generate
 * @returns {Promise<Object>} - Generated content
 */
async function getAIGeneratedContentByType(userContext, contentType) {
  // GeminiService handles its own fallbacks internally
  switch (contentType) {
    case 'tip':
      return await GeminiService.generateDailyTip(userContext);
    case 'affirmation':
      return await GeminiService.generateDailyAffirmation(userContext);
    case 'todo':
      return await GeminiService.generateDailyTodo(userContext);
    default:
      return null;
  }
}

/**
 * Calculate comprehensive pregnancy statistics
 */
function calculatePregnancyStats(pregnancyData) {
  const { trimester, weekOfPregnancy, dueDate, conceptionDate } = pregnancyData;

  const today = new Date();
  const dueDateObj = new Date(dueDate);
  const conceptionDateObj = new Date(conceptionDate);

  const daysPregnant = Math.floor((today - conceptionDateObj) / (1000 * 60 * 60 * 24));
  const daysUntilDue = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));
  const totalPregnancyDays = 280; // 40 weeks

  return {
    trimester,
    weekOfPregnancy,
    dayOfWeek: daysPregnant % 7,
    daysPregnant,
    daysUntilDue: Math.max(0, daysUntilDue),
    overallProgress: Math.round((daysPregnant / totalPregnancyDays) * 100),
    trimesterProgress: calculateTrimesterProgress(pregnancyData),
    milestones: {
      nextMilestone: getNextMilestone(weekOfPregnancy),
      recentMilestone: getRecentMilestone(weekOfPregnancy)
    }
  };
}

/**
 * Get the next pregnancy milestone
 */
function getNextMilestone(weekOfPregnancy) {
  const milestones = [
    { week: 12, description: "End of first trimester" },
    { week: 16, description: "Anatomy scan possible" },
    { week: 20, description: "Halfway point!" },
    { week: 24, description: "Viability milestone" },
    { week: 28, description: "Third trimester begins" },
    { week: 32, description: "Baby's bones hardening" },
    { week: 36, description: "Baby considered full-term soon" },
    { week: 40, description: "Due date!" }
  ];

  return milestones.find(milestone => milestone.week > weekOfPregnancy) || null;
}

/**
 * Get the most recent pregnancy milestone
 */
function getRecentMilestone(weekOfPregnancy) {
  const milestones = [
    { week: 4, description: "Missed period" },
    { week: 6, description: "Baby's heart starts beating" },
    { week: 8, description: "Baby is now a fetus" },
    { week: 12, description: "End of first trimester" },
    { week: 16, description: "Baby's sex can be determined" },
    { week: 20, description: "Halfway point reached" },
    { week: 24, description: "Viability milestone reached" },
    { week: 28, description: "Third trimester began" },
    { week: 32, description: "Baby's bones are hardening" },
    { week: 36, description: "Baby is full-term" }
  ];

  // Find the most recent milestone that has passed
  const passedMilestones = milestones.filter(milestone => milestone.week <= weekOfPregnancy);
  return passedMilestones[passedMilestones.length - 1] || null;
}

module.exports = {
  getDashboardData,
  getTrimesterContent,
  getPregnancyStats
};
