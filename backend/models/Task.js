// TODO: Developer A - Add mongoose import once MongoDB is set up
// const mongoose = require('mongoose');

// Task model for storing user-specific tasks
// This will store tasks assigned to users based on their trimester and progress

/*
TODO: Developer A - Uncomment and set up this schema once mongoose is configured

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  trimester: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
    index: true
  },
  category: {
    type: String,
    required: false,
    trim: true,
    enum: ['medical', 'nutrition', 'exercise', 'preparation', 'education', 'wellness', 'other']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: false
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    required: false
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  isDaily: {
    type: Boolean,
    default: false
  },
  weekOfPregnancy: {
    type: Number,
    required: false,
    min: 1,
    max: 42
  },
  notes: {
    type: String,
    required: false,
    trim: true
  },
  reminderEnabled: {
    type: Boolean,
    default: true
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

// Compound indexes for efficient querying
taskSchema.index({ userId: 1, trimester: 1, isCompleted: 1 });
taskSchema.index({ userId: 1, assignedDate: 1 });
taskSchema.index({ userId: 1, dueDate: 1, isCompleted: 1 });

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Set completedAt when task is marked as completed
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = Date.now();
  }

  // Clear completedAt if task is marked as incomplete
  if (!this.isCompleted && this.completedAt) {
    this.completedAt = null;
  }

  next();
});

// Instance method to mark task as completed
taskSchema.methods.markCompleted = function() {
  this.isCompleted = true;
  this.completedAt = Date.now();
  return this.save();
};

// Instance method to mark task as incomplete
taskSchema.methods.markIncomplete = function() {
  this.isCompleted = false;
  this.completedAt = null;
  return this.save();
};

// Static method to get daily tasks for a user
taskSchema.statics.getDailyTasks = function(userId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    userId: userId,
    $or: [
      { isDaily: true },
      {
        assignedDate: { $gte: startOfDay, $lte: endOfDay },
        isDaily: false
      }
    ]
  }).sort({ priority: -1, createdAt: 1 });
};

// Static method to get tasks by trimester
taskSchema.statics.getTasksByTrimester = function(userId, trimester) {
  return this.find({
    userId: userId,
    trimester: trimester
  }).sort({ priority: -1, assignedDate: 1 });
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
*/

// Temporary export for development - replace with actual model once mongoose is set up
module.exports = {
  // Mock data structure for development
  mockTasks: [
    {
      id: 1,
      userId: 'user123',
      title: 'Take prenatal vitamin',
      description: 'Take your daily prenatal vitamin with breakfast',
      trimester: 1,
      category: 'nutrition',
      priority: 'high',
      isDaily: true,
      isCompleted: false,
      assignedDate: new Date().toISOString(),
      completedAt: null
    },
    {
      id: 2,
      userId: 'user123',
      title: 'Schedule first prenatal appointment',
      description: 'Call your healthcare provider to schedule your first prenatal checkup',
      trimester: 1,
      category: 'medical',
      priority: 'high',
      isDaily: false,
      isCompleted: false,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      completedAt: null
    },
    {
      id: 3,
      userId: 'user123',
      title: 'Drink 8 glasses of water',
      description: 'Stay hydrated throughout the day',
      trimester: 1,
      category: 'wellness',
      priority: 'medium',
      isDaily: true,
      isCompleted: false,
      completedAt: null
    }
  ],

  // Mock methods for development
  getDailyTasks: (userId, date = new Date()) => {
    // Return mock daily tasks
    return module.exports.mockTasks.filter(task =>
      task.userId === userId && (task.isDaily ||
      new Date(task.assignedDate).toDateString() === date.toDateString())
    );
  },

  getTasksByTrimester: (userId, trimester) => {
    // Return mock tasks by trimester
    return module.exports.mockTasks.filter(task =>
      task.userId === userId && task.trimester === trimester
    );
  },

  // Method to add AI-generated tasks to the mock tasks array
  addAIGeneratedTasks: (userId, aiTasks, taskType = 'daily') => {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    aiTasks.forEach(aiTask => {
      // Check if this task already exists
      const existingTask = module.exports.mockTasks.find(task =>
        task.userId === userId &&
        task.title === aiTask.title &&
        task.assignedDate.split('T')[0] === currentDate &&
        task.taskType === taskType
      );

      if (!existingTask) {
        // Generate unique ID
        const newId = Math.max(...module.exports.mockTasks.map(t => t.id), 0) + 1;

        // Convert AI task to our task format
        const newTask = {
          id: newId,
          userId: userId,
          title: aiTask.title || aiTask.task || 'Untitled Task',
          description: aiTask.description || aiTask.explanation || '',
          trimester: aiTask.trimester || 1,
          category: aiTask.category || 'other',
          priority: aiTask.priority || 'medium',
          isDaily: taskType === 'daily',
          isCompleted: aiTask.isCompleted || false,
          assignedDate: new Date().toISOString(),
          completedAt: aiTask.isCompleted ? new Date().toISOString() : null,
          dueDate: aiTask.dueDate || null,
          weekOfPregnancy: aiTask.weekOfPregnancy || null,
          taskType: taskType, // 'daily' or 'trimester'
          source: 'ai-generated', // Mark as AI-generated
          aiTaskId: aiTask.id || null, // Store original AI task ID if available
          createdAt: new Date().toISOString()
        };

        module.exports.mockTasks.push(newTask);
      }
    });

    return module.exports.mockTasks.filter(task =>
      task.userId === userId && task.source === 'ai-generated'
    );
  },

  // Method to get tasks by source (ai-generated vs manual)
  getTasksBySource: (userId, source = 'ai-generated') => {
    return module.exports.mockTasks.filter(task =>
      task.userId === userId && task.source === source
    );
  },

  // Method to clean up old AI-generated tasks (optional - to prevent memory bloat)
  cleanupOldAITasks: (daysOld = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialLength = module.exports.mockTasks.length;
    module.exports.mockTasks = module.exports.mockTasks.filter(task => {
      if (task.source === 'ai-generated') {
        const taskDate = new Date(task.assignedDate);
        return taskDate >= cutoffDate;
      }
      return true; // Keep non-AI tasks
    });

    const removedCount = initialLength - module.exports.mockTasks.length;
    return { removedCount, remainingTasks: module.exports.mockTasks.length };
  }
};
