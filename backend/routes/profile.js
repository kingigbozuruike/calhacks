const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const verifyToken = require('../middleware/verifyToken');

// @route   GET /api/profile
// @desc    Get user profile, trimester, and pregnancy stats
// @access  Private
router.get('/', verifyToken, ProfileController.getProfile);

// @route   POST /api/profile/intake
// @desc    Intake or update user profile info (pregnancy stage, conception date, etc.)
// @access  Private
router.post('/intake', verifyToken, ProfileController.intakeProfile);

module.exports = router;
