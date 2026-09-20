const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware');

// All chatbot endpoints require user authentication
router.use(authMiddleware);

// Chat endpoints
router.post('/chat', chatbotController.sendMessage);
router.get('/sessions', chatbotController.getSessions);
router.post('/sessions', chatbotController.createSession);
router.get('/sessions/:id/messages', chatbotController.getSessionMessages);
router.delete('/sessions/:id', chatbotController.deleteSession);

// Schedule analysis endpoint
router.post('/analyze', chatbotController.analyzeSchedule);

module.exports = router;
