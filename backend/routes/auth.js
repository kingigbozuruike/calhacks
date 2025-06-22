const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', AuthController.register);

// @route   POST /api/auth/login
// @desc    Login user and return JWT
// @access  Public
router.post('/login', AuthController.login);

module.exports = router;
