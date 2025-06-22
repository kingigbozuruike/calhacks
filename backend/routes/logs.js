const express = require('express');
const router = express.Router();
const LogController = require('../controllers/LogController');
const verifyToken = require('../middleware/verifyToken');

// @route   POST /api/logs
// @desc    Create a new daily log
// @access  Private
router.post('/', verifyToken, LogController.createLog);

// @route   GET /api/logs
// @desc    Get user logs (optionally by date range)
// @access  Private
router.get('/', verifyToken, LogController.getLogs);

module.exports = router;
