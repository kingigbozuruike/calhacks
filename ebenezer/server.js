// Express server setup and MongoDB connection
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const logsRoutes = require('./routes/logs');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// API routes
app.use('/api/auth', authRoutes); // Registration & login
app.use('/api/profile', userRoutes); // Profile intake & stats
app.use('/api/logs', logsRoutes); // Daily logs

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// TODO: Add your MongoDB connection string and JWT secret to a .env file in the backend folder:
// MONGO_URI=your_mongodb_connection_string
// JWT_SECRET=your_jwt_secret
