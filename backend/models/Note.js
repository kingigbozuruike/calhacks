const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000 // Limit note length
  },
  date: {
    type: Date,
    default: Date.now
  },
  weekOfPregnancy: {
    type: Number,
    required: false
  },
  trimester: {
    type: Number,
    required: false,
    min: 1,
    max: 3
  },
  mood: {
    type: String,
    enum: ['happy', 'excited', 'anxious', 'tired', 'grateful', 'worried', 'peaceful', 'other'],
    required: false
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  isPrivate: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
noteSchema.index({ userId: 1, date: -1 });
noteSchema.index({ userId: 1, weekOfPregnancy: 1 });

// Virtual for formatted date
noteSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to get notes for a specific date range
noteSchema.statics.getNotesForDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Method to get recent notes
noteSchema.statics.getRecentNotes = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ date: -1 })
    .limit(limit);
};

// Method to get notes by week of pregnancy
noteSchema.statics.getNotesByWeek = function(userId, weekOfPregnancy) {
  return this.find({
    userId,
    weekOfPregnancy
  }).sort({ date: -1 });
};

module.exports = mongoose.model('Note', noteSchema);
