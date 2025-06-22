// models/VoiceCheckin.js
const mongoose = require('mongoose');

const VoiceCheckinSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References your User model (assuming you have one)
    required: true,
    index: true
  },
  callId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  assistantId: { // Stores the Vapi assistant ID that handled this specific call
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'in-progress', 'completed', 'failed', 'transcribed'],
    default: 'initiated',
    required: true
  },
  pregnancyContext: { // Context passed to the assistant for this call
    trimester: { type: Number, min: 1, max: 3 },
    weekOfPregnancy: { type: Number, min: 1, max: 40 }
  },
  startedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  endedAt: {
    type: Date
  },
  transcriptChunks: [{
    role: { type: String, enum: ['user', 'assistant'] },
    text: String,
    startTime: Number,
    endTime: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  fullTranscript: {
    type: String,
    default: ''
  },
  recordingUrl: {
    type: String
  },
  sentiment: {
    type: String
  },
  summary: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

module.exports = mongoose.model('VoiceCheckin', VoiceCheckinSchema);
