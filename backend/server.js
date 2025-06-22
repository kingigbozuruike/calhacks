// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Custom JSON body parser to capture raw body for webhook verification
// This must come BEFORE any routes that need the parsed JSON body
app.use(express.json({
  verify: (req, res, buf) => {
    // Only capture raw body for specific webhook path to avoid issues with other JSON payloads
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
.catch(err => console.error('MongoDB connection error:', err));

// Routes
// Developer A Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/logs', require('./routes/logs'));

// Developer B Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/chatbot', require('./routes/chat'));
app.use('/api/voice-checkin', require('./routes/voiceCheckin')); // Your voice check-in routes

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler (this should be the LAST middleware)
app.use((_req, res) => { // Removed '*' as it's not needed here
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
