const User = require('../models/User');
const getTrimester = require('../utils/getTrimester');
const dayjs = require('dayjs');

// Get user profile and pregnancy stats
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let trimester = null;
    let dueDate = null;
    if (user.conceptionDate) {
      trimester = getTrimester(user.conceptionDate);
      dueDate = dayjs(user.conceptionDate).add(40, 'week').format('YYYY-MM-DD');
    }

    res.json({
      email: user.email,
      pregnancyStage: user.pregnancyStage,
      conceptionDate: user.conceptionDate,
      trimester,
      dueDate,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Intake profile info (pregnancy stage, conception date)
exports.intakeProfile = async (req, res) => {
  const { pregnancyStage, conceptionDate } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.pregnancyStage = pregnancyStage;
    user.conceptionDate = conceptionDate;
    // TODO: Add more fields if needed
    await user.save();

    res.json({ msg: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
