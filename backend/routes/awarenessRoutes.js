const express  = require('express');
const router   = express.Router();
const { getQuote, getQuotesByBand } = require('../controllers/awarenessController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/awareness/quote/:score     → get random quote by burnout score
router.get('/quote/:score',   authMiddleware, getQuote);

// GET /api/awareness/quotes/:band     → get all quotes for a band
router.get('/quotes/:band',   authMiddleware, getQuotesByBand);

module.exports = router;