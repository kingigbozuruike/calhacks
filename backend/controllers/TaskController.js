// TODO: Developer A - Import Task model once mongoose is set up
// const Task = require('../models/Task');

// Import mock Task model for development
const Task = require('../models/Task');

// Import Gemini AI service for generating tasks
const GeminiService = require('../services/GeminiService');

// TODO: Developer A - Import User model for user validation
// const User = require('../models/User');

/**
 * Get daily tasks for the authenticated user
 * GET /api/tasks/daily
 */
const getDailyTasks = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const _userId = req.query.userId || 'user123'; // Mock user ID for development (unused until auth integration)

    const date = req.query.date ? new Date(req.query.date) : new Date();

    // TODO: Developer A - Get user's pregnancy information from database
    // const user = await User.findById(userId);
    // const userContext = {
    //   trimester: user.trimester,
    //   weekOfPregnancy: user.weekOfPregnancy,
    //   dueDate: user.dueDate
    // };

    // Mock user pregnancy data for development
    const userContext = {
      trimester: parseInt(req.query.trimester) || 1,
      weekOfPregnancy: parseInt(req.query.weekOfPregnancy) || 8,
      dueDate: req.query.dueDate || new Date(Date.now() + 7 * 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Generate AI-powered daily tasks based on user's pregnancy context
    const aiGeneratedTasks = await GeminiService.generateDailyTasks(userContext);

    // Add AI-generated tasks to our task model for persistence
    Task.addAIGeneratedTasks(_userId, aiGeneratedTasks, 'daily');

    // Get today's AI-generated tasks (only AI-generated, not mock data)
    const todaysAITasks = Task.mockTasks.filter(task =>
      task.userId === _userId &&
      task.source === 'ai-generated' &&
      task.taskType === 'daily' &&
      task.assignedDate.split('T')[0] === date.toISOString().split('T')[0]
    );

    // Add these debug logs after the filtering:
    console.log('=== DEBUG: AI Task Generation ===');
    console.log('Generated AI tasks:', aiGeneratedTasks);
    console.log('Total tasks in mockTasks after adding:', Task.mockTasks.length);
    console.log('All tasks in mockTasks:', Task.mockTasks.map(t => ({ id: t.id, title: t.title, source: t.source })));
    console.log('Filtered AI tasks:', todaysAITasks);
    console.log('Date comparison:', {
      today: new Date().toISOString().split('T')[0],
      filterDate: date.toISOString().split('T')[0]
    });
    console.log('=== END DEBUG ===');

    res.json({
      success: true,
      data: {
        tasks: todaysAITasks, // Return only AI-generated tasks with IDs for completion
        date: date.toISOString(),
        userContext,
        totalTasks: todaysAITasks.length,
        completedTasks: todaysAITasks.filter(task => task.isCompleted).length,
        source: 'ai-generated' // Indicate these are AI-generated tasks
      }
    });
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get tasks by trimester for the authenticated user
 * GET /api/tasks/trimester
 */
const getTasksByTrimester = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const _userId = req.query.userId || 'user123'; // Mock user ID for development (unused until auth integration)

    const trimester = parseInt(req.query.trimester);

    // Validate trimester parameter
    if (!trimester || trimester < 1 || trimester > 3) {
      return res.status(400).json({
        success: false,
        message: 'Valid trimester (1, 2, or 3) is required'
      });
    }

    // TODO: Developer A - Get user's pregnancy information from database
    // const user = await User.findById(userId);
    // const userContext = {
    //   trimester: user.trimester,
    //   weekOfPregnancy: user.weekOfPregnancy,
    //   dueDate: user.dueDate
    // };

    // Mock user pregnancy data for development
    const userContext = {
      trimester,
      weekOfPregnancy: parseInt(req.query.weekOfPregnancy) || (trimester === 1 ? 8 : trimester === 2 ? 20 : 32),
      dueDate: req.query.dueDate || new Date(Date.now() + 7 * 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Generate AI-powered trimester tasks based on user's pregnancy context
    const aiGeneratedTasks = await GeminiService.generateTrimesterTasks(userContext);

    // Add AI-generated tasks to our task model for persistence
    Task.addAIGeneratedTasks(_userId, aiGeneratedTasks, 'trimester');

    // Get current trimester's AI-generated tasks (only AI-generated, not mock data)
    const trimesterAITasks = Task.mockTasks.filter(task =>
      task.userId === _userId &&
      task.source === 'ai-generated' &&
      task.taskType === 'trimester' &&
      task.trimester === trimester
    );

    res.json({
      success: true,
      data: {
        tasks: trimesterAITasks, // Return only AI-generated tasks with IDs for completion
        trimester,
        userContext,
        totalTasks: trimesterAITasks.length,
        completedTasks: trimesterAITasks.filter(task => task.isCompleted).length,
        pendingTasks: trimesterAITasks.filter(task => !task.isCompleted).length,
        source: 'ai-generated' // Indicate these are AI-generated tasks
      }
    });
  } catch (error) {
    console.error('Error fetching trimester tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trimester tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Mark a task as completed or incomplete
 * POST /api/tasks/check
 */
const toggleTaskCompletion = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const userId = req.body.userId || 'user123'; // Mock user ID for development

    const { taskId, isCompleted } = req.body;

    // Validate required fields
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    if (typeof isCompleted !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isCompleted must be a boolean value'
      });
    }

    // TODO: Developer A - Replace with actual database operations once mongoose is set up
    /*
    const task = await Task.findOne({ _id: taskId, userId: userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or does not belong to user'
      });
    }

    if (isCompleted) {
      await task.markCompleted();
    } else {
      await task.markIncomplete();
    }
    */

    // Mock implementation for development
    const taskIndex = Task.mockTasks.findIndex(task =>
      task.id == taskId && task.userId === userId
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or does not belong to user'
      });
    }

    Task.mockTasks[taskIndex].isCompleted = isCompleted;
    Task.mockTasks[taskIndex].completedAt = isCompleted ? new Date().toISOString() : null;

    const updatedTask = Task.mockTasks[taskIndex];

    res.json({
      success: true,
      message: `Task ${isCompleted ? 'completed' : 'marked as incomplete'}`,
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    console.error('Error toggling task completion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create a new task for the authenticated user
 * POST /api/tasks
 */
const createTask = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const userId = req.body.userId || 'user123'; // Mock user ID for development

    const { title, description, trimester, category, priority, dueDate, isDaily } = req.body;

    // Validate required fields
    if (!title || !trimester) {
      return res.status(400).json({
        success: false,
        message: 'Title and trimester are required'
      });
    }

    if (trimester < 1 || trimester > 3) {
      return res.status(400).json({
        success: false,
        message: 'Trimester must be 1, 2, or 3'
      });
    }

    // TODO: Developer A - Replace with actual database operations once mongoose is set up
    /*
    const newTask = new Task({
      userId,
      title,
      description,
      trimester,
      category,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      isDaily: isDaily || false
    });

    const savedTask = await newTask.save();
    */

    // Mock implementation for development
    const newTask = {
      id: Task.mockTasks.length + 1,
      userId,
      title,
      description: description || '',
      trimester,
      category: category || 'other',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      isDaily: isDaily || false,
      isCompleted: false,
      assignedDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    Task.mockTasks.push(newTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: newTask
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all tasks for the authenticated user with optional filtering
 * GET /api/tasks
 */
const getAllTasks = async (req, res) => {
  try {
    // TODO: Developer A - Replace with actual user ID from JWT token
    // const userId = req.user.id;
    const userId = req.query.userId || 'user123'; // Mock user ID for development

    const { trimester, category, isCompleted, isDaily } = req.query;

    // TODO: Developer A - Replace with actual database query once mongoose is set up
    // let query = { userId };
    // if (trimester) query.trimester = parseInt(trimester);
    // if (category) query.category = category;
    // if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true';
    // if (isDaily !== undefined) query.isDaily = isDaily === 'true';
    // const tasks = await Task.find(query).sort({ priority: -1, createdAt: 1 });

    // Mock implementation for development
    let tasks = Task.mockTasks.filter(task => task.userId === userId);

    if (trimester) {
      tasks = tasks.filter(task => task.trimester === parseInt(trimester));
    }
    if (category) {
      tasks = tasks.filter(task => task.category === category);
    }
    if (isCompleted !== undefined) {
      tasks = tasks.filter(task => task.isCompleted === (isCompleted === 'true'));
    }
    if (isDaily !== undefined) {
      tasks = tasks.filter(task => task.isDaily === (isDaily === 'true'));
    }

    res.json({
      success: true,
      data: {
        tasks,
        totalTasks: tasks.length,
        filters: {
          trimester: trimester ? parseInt(trimester) : null,
          category: category || null,
          isCompleted: isCompleted !== undefined ? isCompleted === 'true' : null,
          isDaily: isDaily !== undefined ? isDaily === 'true' : null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getDailyTasks,
  getTasksByTrimester,
  toggleTaskCompletion,
  createTask,
  getAllTasks
};
