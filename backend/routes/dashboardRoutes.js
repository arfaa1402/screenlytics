const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/dashboard/summary  (protected)
router.get('/summary', authMiddleware, getDashboardSummary);

module.exports = router;