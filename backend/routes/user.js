// const express = require('express');
// const router = express.Router();
// const ProfileController = require('../controllers/ProfileController');
// const verifyToken = require('../middleware/verifyToken');

// // All user profile routes require authentication
// router.use(verifyToken);

// // Get user profile with pregnancy stats
// router.get('/profile', ProfileController.getProfile);

// // Update user profile (pregnancy stage, conception date, etc.)
// router.put('/profile', ProfileController.updateProfile);

// module.exports = router;



// const express = require('express');
// const router = express.Router();
// const UserController = require('../controllers/UserController');
// const verifyToken = require('../middleware/verifyToken');

// // @route   GET /api/profile
// // @desc    Get user profile, trimester, and pregnancy stats
// // @access  Private
// router.get('/', verifyToken, UserController.getProfile);

// // @route   POST /api/profile/intake
// // @desc    Intake or update user profile info (pregnancy stage, conception date, etc.)
// // @access  Private
// router.post('/intake', verifyToken, UserController.intakeProfile);

// module.exports = router;
