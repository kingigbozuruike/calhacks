const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const {
  getDashboardData,
  getTrimesterContent,
  getPregnancyStats
} = require('../controllers/DashboardController');

// Add authentication middleware to all routes
router.use(verifyToken);

router.get('/', getDashboardData);
router.get('/content', getTrimesterContent);
router.get('/stats', getPregnancyStats);

module.exports = router;
