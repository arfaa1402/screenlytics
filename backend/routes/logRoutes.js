const express = require('express');
const router  = express.Router();
const { upsertLog, getLogs, getAnalyticsSummary } = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/logs/upsert     → save or update a log
router.post('/upsert',   authMiddleware, upsertLog);

// GET  /api/logs            → get all logs (used by LogTime & Analytics)
router.get('/',          authMiddleware, getLogs);

// GET  /api/logs/analytics  → pre-computed analytics summary
router.get('/analytics', authMiddleware, getAnalyticsSummary);

module.exports = router;
