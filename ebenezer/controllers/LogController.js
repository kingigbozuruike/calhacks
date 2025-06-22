const Log = require('../models/Log');

// Create a new daily log
exports.createLog = async (req, res) => {
  const { text } = req.body;
  try {
    const log = new Log({
      user: req.user.id,
      text,
      // TODO: Add more fields if needed
    });
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get logs by date range (optional)
exports.getLogs = async (req, res) => {
  const { start, end } = req.query;
  let filter = { user: req.user.id };
  if (start && end) {
    filter.date = { $gte: new Date(start), $lte: new Date(end) };
  }
  try {
    const logs = await Log.find(filter).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
