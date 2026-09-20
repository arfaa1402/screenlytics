const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName.trim()} ${lastName ? lastName.trim() : ''}`.trim();

    const user = await User.create({
      name: fullName,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    res.status(201).json({ message: 'Account created successfully', userId: user._id.toString() });

  } catch (err) {
    console.error('Register error details:', err);
    res.status(500).json({ message: err.message || 'Server error during registration' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'mysecretkey123';
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Login error details:', err);
    res.status(500).json({ message: err.message || 'Server error during login' });
  }
};