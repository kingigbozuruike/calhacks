// server.js
require('dotenv').config(); // Load environment variables FIRST and FOREMOST

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const VapiService = require('./services/VapiService'); // Import VapiService

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Custom JSON body parser to capture raw body for webhook signature verification.
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/voice-checkin/webhook') {
      req.rawBody = buf.toString();
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
  process.exit(1);
});

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/chatbot', require('./routes/chat'));

// Your voice check-in routes
app.use('/api/voice-checkin', require('./routes/voiceCheckin'));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// 404 Not Found Handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access health check: http://localhost:${PORT}/api/health`);
  console.log('Remember to expose your webhook endpoint to the internet (e.g., using ngrok)');

  // Ensure the Vapi assistant is created/exists on server startup
  VapiService.ensureAssistantExists()
    .then(() => console.log('Vapi assistant ensured/created successfully.'))
    .catch(err => console.error('Failed to ensure Vapi assistant exists:', err));
});

module.exports = app;
