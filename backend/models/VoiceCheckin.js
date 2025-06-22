const mongoose = require('mongoose');

/**
 * VoiceCheckin Model
 * Stores daily voice check-in data from users
 */
const voiceCheckinSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Date of the check-in
  date: {
    type: Date,
    default: Date.now,
    required: true
  },

  // Vapi call information
  callId: {
    type: String,
    required: true,
    unique: true
  },

  // Voice transcription from Vapi
  transcription: {
    type: String,
    required: false
  },

  // AI-analyzed health data from the voice input
  healthAnalysis: {
    // Overall mood assessment
    mood: {
      type: String,
      enum: ['excellent', 'good', 'okay', 'poor', 'concerning'],
      default: 'okay'
    },

    // Energy level
    energyLevel: {
      type: String,
      enum: ['high', 'normal', 'low', 'very_low'],
      default: 'normal'
    },

    // Reported symptoms
    symptoms: [{
      name: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
      },
      description: String
    }],

    // Physical activities mentioned
    activities: [{
      type: String,
      duration: String, // e.g., "30 minutes", "1 hour"
      notes: String
    }],

    // Sleep quality
    sleepQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'fair'
    },

    // Hours of sleep
    sleepHours: {
      type: Number,
      min: 0,
      max: 24
    },

    // Nutrition mentions
    nutrition: {
      mealsEaten: Number,
      waterIntake: String, // e.g., "8 glasses", "plenty"
      prenatalVitamin: Boolean,
      cravings: [String],
      aversions: [String]
    },

    // Concerns or questions raised
    concerns: [{
      category: {
        type: String,
        enum: ['physical', 'emotional', 'medical', 'lifestyle', 'other'],
        default: 'other'
      },
      description: String,
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'low'
      }
    }],

    // Overall wellness score (1-10)
    wellnessScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  },

  // AI-generated insights and recommendations
  insights: {
    // Key insights from the check-in
    summary: String,

    // Recommendations for the user
    recommendations: [String],

    // Follow-up questions for next check-in
    followUpQuestions: [String],

    // Red flags that need attention
    redFlags: [{
      type: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
      },
      recommendation: String
    }]
  },

  // Pregnancy context at time of check-in
  pregnancyContext: {
    trimester: {
      type: Number,
      min: 1,
      max: 3
    },
    weekOfPregnancy: {
      type: Number,
      min: 1,
      max: 42
    },
    dueDate: Date
  },

  // Call metadata
  callMetadata: {
    duration: Number, // in seconds
    startTime: Date,
    endTime: Date,
    callQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },

  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  // Error information if processing failed
  processingError: {
    message: String,
    timestamp: Date
  },

  // Tags for easy filtering and searching
  tags: [String],

  // Notes from healthcare provider (if reviewed)
  providerNotes: {
    reviewedBy: String,
    reviewDate: Date,
    notes: String,
    followUpRequired: Boolean
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt

  // Indexes for better query performance
  indexes: [
    { userId: 1, date: -1 }, // For user's check-ins by date
    { callId: 1 }, // For Vapi webhook lookups
    { 'healthAnalysis.concerns.urgency': 1 }, // For urgent concerns
    { processingStatus: 1 }, // For processing queue
    { 'pregnancyContext.trimester': 1 }, // For trimester-based queries
    { tags: 1 } // For tag-based searches
  ]
});

// Virtual for formatted date
voiceCheckinSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Virtual for check-in summary
voiceCheckinSchema.virtual('summary').get(function() {
  const mood = this.healthAnalysis.mood || 'okay';
  const symptomsCount = this.healthAnalysis.symptoms?.length || 0;
  const concernsCount = this.healthAnalysis.concerns?.length || 0;

  return `${mood.charAt(0).toUpperCase() + mood.slice(1)} mood, ${symptomsCount} symptoms, ${concernsCount} concerns`;
});

// Method to check if check-in needs urgent attention
voiceCheckinSchema.methods.needsUrgentAttention = function() {
  return this.healthAnalysis.concerns?.some(concern =>
    concern.urgency === 'urgent' || concern.urgency === 'high'
  ) || this.insights.redFlags?.some(flag =>
    flag.severity === 'critical' || flag.severity === 'high'
  );
};

// Method to get wellness trend (requires previous check-ins)
voiceCheckinSchema.methods.getWellnessTrend = async function() {
  const previousCheckin = await this.constructor.findOne({
    userId: this.userId,
    date: { $lt: this.date }
  }).sort({ date: -1 });

  if (!previousCheckin) {
    return 'no_data';
  }

  const currentScore = this.healthAnalysis.wellnessScore || 5;
  const previousScore = previousCheckin.healthAnalysis.wellnessScore || 5;

  if (currentScore > previousScore) return 'improving';
  if (currentScore < previousScore) return 'declining';
  return 'stable';
};

// Static method to get user's recent check-ins
voiceCheckinSchema.statics.getRecentCheckins = function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    userId: userId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

// Static method to get check-ins needing attention
voiceCheckinSchema.statics.getCheckinsNeedingAttention = function() {
  return this.find({
    $or: [
      { 'healthAnalysis.concerns.urgency': { $in: ['high', 'urgent'] } },
      { 'insights.redFlags.severity': { $in: ['high', 'critical'] } }
    ],
    processingStatus: 'completed'
  }).populate('userId', 'name email phone');
};

// Pre-save middleware to set pregnancy context
voiceCheckinSchema.pre('save', async function(next) {
  if (this.isNew && this.userId) {
    try {
      // TODO: Get user's pregnancy information and set context
      // This would typically fetch from User model or Profile model
      // For now, we'll leave it to be set by the controller

      // Set default tags based on analysis
      if (!this.tags || this.tags.length === 0) {
        const tags = ['daily-checkin'];

        if (this.healthAnalysis.symptoms?.length > 0) {
          tags.push('has-symptoms');
        }

        if (this.healthAnalysis.concerns?.length > 0) {
          tags.push('has-concerns');
        }

        if (this.needsUrgentAttention()) {
          tags.push('urgent-attention');
        }

        this.tags = tags;
      }
    } catch (error) {
      console.error('Error in VoiceCheckin pre-save middleware:', error);
    }
  }
  next();
});

// Export the model
module.exports = mongoose.model('VoiceCheckin', voiceCheckinSchema);
