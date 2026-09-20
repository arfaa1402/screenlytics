// backend/server.js — MongoDB, Gemini Chatbot & Achievements enabled

const dns = require('dns');

// Fix MongoDB Atlas SRV DNS resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const authRoutes        = require('./routes/authRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const logRoutes         = require('./routes/logRoutes');
const plannerRoutes     = require('./routes/plannerRoutes');
const profileRoutes     = require('./routes/profileRoutes');
const awarenessRoutes   = require('./routes/awarenessRoutes');
const chatbotRoutes     = require('./routes/chatbotRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

dotenv.config();

// Connect to MongoDB Atlas / Local MongoDB
connectDB();

const app = express();

// Allow all localhost dev ports
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// All Routes
app.use('/api/auth',        authRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/logs',        logRoutes);
app.use('/api/planner',     plannerRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/awareness',   awarenessRoutes);
app.use('/api/chatbot',     chatbotRoutes);
app.use('/api/achievements', achievementRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Screenlytics backend is running on MongoDB, Gemini AI & Gamification Engine 🚀'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});