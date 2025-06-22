const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  console.log('🔐 Auth middleware called');
  console.log('📋 All headers:', req.headers);

  // Get token from header
  const authHeader = req.header('Authorization');
  console.log('🎫 Authorization header:', authHeader);

  const token = authHeader?.replace('Bearer ', '');
  console.log('🔑 Extracted token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    console.log('🔍 Verifying token with JWT_SECRET...');
    console.log('🔐 JWT_SECRET exists:', !!process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully:', decoded);

    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
// Use this middleware to protect routes that require authentication
