const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'mysecretkey123';
    const decoded = jwt.verify(token, secret);

    // Validate if decoded.id is a valid MongoDB ObjectId (handles legacy MySQL integer tokens)
    if (!decoded || !decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ message: 'Session expired or invalid format. Please sign in again.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token. Please sign in again.' });
  }
};