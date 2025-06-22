const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', CounterSchema);

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  name: { type: String, required: true }, // User's name
  age: { type: Number, required: true }, // User's age
  healthComplications: { type: String }, // Health complications (optional, can be a string or array if needed)
  pregnancyStage: { type: String }, // e.g., 'first', 'second', 'third'
  conceptionDate: { type: Date },
  phoneNumber: { type: String }, // Phone number for voice assistant calls
  userId: { type: Number, unique: true }, // Unique auto-incrementing user ID
  createdAt: { type: Date, default: Date.now },
});

// Auto-increment userId before saving a new user
UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'userId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
// TODO: Add more fields if needed for your user profile
