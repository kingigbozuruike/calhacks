const express = require('express');
const router = express.Router();

// Import task controller
const {
  getDailyTasks,
  getTasksByTrimester,
  toggleTaskCompletion,
  createTask,
  getAllTasks
} = require('../controllers/TaskController');

// TODO: Developer A - Import authentication middleware once implemented
// const { verifyToken } = require('../middleware/auth');

// TODO: Developer A - Add authentication middleware to all routes
// router.use(verifyToken);

/**
 * GET /api/tasks/daily
 * Get daily tasks for the authenticated user
 * Query params:
 * - userId (string, optional): User ID for development (remove when auth is implemented)
 * - date (string, optional): Date in ISO format, defaults to today
 */
router.get('/daily', getDailyTasks);

/**
 * GET /api/tasks/trimester
 * Get tasks by trimester for the authenticated user
 * Query params:
 * - userId (string, optional): User ID for development (remove when auth is implemented)
 * - trimester (number, required): Trimester number (1, 2, or 3)
 */
router.get('/trimester', getTasksByTrimester);

/**
 * GET /api/tasks
 * Get all tasks for the authenticated user with optional filtering
 * Query params:
 * - userId (string, optional): User ID for development (remove when auth is implemented)
 * - trimester (number, optional): Filter by trimester
 * - category (string, optional): Filter by category
 * - isCompleted (boolean, optional): Filter by completion status
 * - isDaily (boolean, optional): Filter by daily tasks
 */
router.get('/', getAllTasks);

/**
 * POST /api/tasks
 * Create a new task for the authenticated user
 * Body:
 * - userId (string, optional): User ID for development (remove when auth is implemented)
 * - title (string, required): Task title
 * - description (string, optional): Task description
 * - trimester (number, required): Trimester number (1, 2, or 3)
 * - category (string, optional): Task category
 * - priority (string, optional): Priority level (low, medium, high)
 * - dueDate (string, optional): Due date in ISO format
 * - isDaily (boolean, optional): Whether this is a daily recurring task
 */
router.post('/', createTask);

/**
 * POST /api/tasks/check
 * Mark a task as completed or incomplete
 * Body:
 * - userId (string, optional): User ID for development (remove when auth is implemented)
 * - taskId (string, required): Task ID to update
 * - isCompleted (boolean, required): Completion status
 */
router.post('/check', toggleTaskCompletion);

module.exports = router;
