// server.js
require('dotenv').config(); // Load environment variables FIRST and FOREMOST

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Custom JSON body parser to capture raw body for webhook signature verification.
// This middleware MUST be placed BEFORE any specific route handlers or other
// body parsing middleware (like a generic express.json()) if those routes
// also need the raw body.
app.use(express.json({
  verify: (req, res, buf) => {
    // Only capture raw body for the Vapi webhook path to optimize
    if (req.originalUrl === '/api/voice-checkin/webhook') {
      req.rawBody = buf.toString(); // Store raw body as string
    }
  }
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit process if MongoDB connection fails
});

// --- ROUTES ---
// Mount your routers here. The order of these `app.use` calls matters.
// They should come AFTER your body parsing middleware but BEFORE your 404 handler.

// Developer A Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/logs', require('./routes/logs'));

// Developer B Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/chatbot', require('./routes/chat'));

// Your voice check-in routes, using the refined router.
// This includes the /api/voice-checkin/webhook endpoint.
app.use('/api/voice-checkin', require('./routes/voiceCheckin'));

// Health check endpoint (general public route)
app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware (should be placed before the 404 handler)
app.use((err, _req, res, _next) => {
  console.error(err.stack); // Log the full stack trace for debugging
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// 404 Not Found Handler (MUST be the absolute LAST middleware/route)
// If no other route or middleware has handled the request by this point,
// it means the route doesn't exist.
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access health check: http://localhost:${PORT}/api/health`);
  console.log('Remember to expose your webhook endpoint to the internet (e.g., using ngrok)');
});

module.exports = app;
