const express = require('express');
const router = express.Router();

const {
  getDashboardData,
  getTrimesterContent,
  getPregnancyStats
} = require('../controllers/DashboardController');

// TODO: Developer A - Import authentication middleware once implemented
// const { verifyToken } = require('../middleware/auth');

// TODO: Developer A - Add authentication middleware to all routes
// router.use(verifyToken);

router.get('/', getDashboardData);
router.get('/content', getTrimesterContent);
router.get('/stats', getPregnancyStats);

module.exports = router;
