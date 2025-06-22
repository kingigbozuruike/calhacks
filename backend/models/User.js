const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    pregnancyStage: {
      type: String,
      enum: ['trying_to_conceive', 'pregnant', 'postpartum'],
      default: 'trying_to_conceive'
    },
    conceptionDate: {
      type: Date,
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    currentTrimester: {
      type: Number,
      min: 1,
      max: 3,
      default: null
    },
    weekOfPregnancy: {
      type: Number,
      min: 1,
      max: 42,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate pregnancy stats
userSchema.methods.calculatePregnancyStats = function() {
  if (!this.profile.conceptionDate) {
    return {
      trimester: null,
      weekOfPregnancy: null,
      dueDate: null,
      daysUntilDue: null
    };
  }

  const now = new Date();
  const conception = new Date(this.profile.conceptionDate);
  const daysSinceConception = Math.floor((now - conception) / (1000 * 60 * 60 * 24));
  const weekOfPregnancy = Math.floor(daysSinceConception / 7) + 1;

  let trimester;
  if (weekOfPregnancy <= 12) {
    trimester = 1;
  } else if (weekOfPregnancy <= 27) {
    trimester = 2;
  } else {
    trimester = 3;
  }

  // Calculate due date (280 days from conception)
  const dueDate = new Date(conception);
  dueDate.setDate(dueDate.getDate() + 280);

  const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

  return {
    trimester,
    weekOfPregnancy: Math.min(weekOfPregnancy, 42),
    dueDate,
    daysUntilDue
  };
};

module.exports = mongoose.model('User', userSchema);
