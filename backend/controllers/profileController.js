const User = require('../models/User');
const ScreenLog = require('../models/ScreenLog');
const BurnoutScore = require('../models/BurnoutScore');
const NotificationSettings = require('../models/NotificationSettings');
const Task = require('../models/Task');
const bcrypt = require('bcryptjs');

// GET PROFILE
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const u = await User.findById(userId);
    if (!u)
      return res.status(404).json({ message: 'User not found' });

    const parts = u.name.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const daysLogged = await ScreenLog.countDocuments({ user: userId });
    const latestBurnout = await BurnoutScore.findOne({ user: userId }).sort({ recordedAt: -1 });

    let notif = await NotificationSettings.findOne({ user: userId });
    if (!notif) {
      notif = await NotificationSettings.create({
        user: userId,
        dailyReminders: true,
        burnoutAlerts: true,
        weeklyReport: false,
      });
    }

    res.status(200).json({
      user: {
        id: u._id.toString(),
        firstName,
        lastName,
        email: u.email,
        memberSince: u.createdAt ? u.createdAt.getFullYear().toString() : '2026',
      },
      stats: {
        burnoutScore: latestBurnout ? parseFloat(latestBurnout.score) : 0,
        daysLogged: Number(daysLogged),
      },
      notifications: {
        dailyReminders: Boolean(notif.dailyReminders),
        burnoutAlerts: Boolean(notif.burnoutAlerts),
        weeklyReport: Boolean(notif.weeklyReport),
      }
    });

  } catch (err) {
    console.error('Get profile error details:', err);
    res.status(500).json({ message: err.message || 'Server error loading profile' });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email } = req.body;

  if (!firstName || !firstName.trim())
    return res.status(400).json({ message: 'First name is required' });
  if (!email || !email.trim())
    return res.status(400).json({ message: 'Email is required' });

  try {
    const existing = await User.findOne({
      email: email.trim().toLowerCase(),
      _id: { $ne: userId }
    });
    if (existing)
      return res.status(409).json({ message: 'Email already in use by another account' });

    const fullName = `${firstName.trim()} ${lastName ? lastName.trim() : ''}`.trim();

    await User.findByIdAndUpdate(userId, {
      name: fullName,
      email: email.trim().toLowerCase(),
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : '',
        email: email.trim().toLowerCase(),
      }
    });

  } catch (err) {
    console.error('Update profile error details:', err);
    res.status(500).json({ message: err.message || 'Server error updating profile' });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword)
    return res.status(400).json({ message: 'Please fill all password fields' });
  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: 'Passwords do not match' });
  if (newPassword.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters' });

  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error('Change password error details:', err);
    res.status(500).json({ message: err.message || 'Server error changing password' });
  }
};

// UPDATE NOTIFICATION SETTINGS
exports.updateNotifications = async (req, res) => {
  const userId = req.user.id;
  const { dailyReminders, burnoutAlerts, weeklyReport } = req.body;

  try {
    const notif = await NotificationSettings.findOneAndUpdate(
      { user: userId },
      {
        dailyReminders: Boolean(dailyReminders),
        burnoutAlerts: Boolean(burnoutAlerts),
        weeklyReport: Boolean(weeklyReport),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: 'Notification settings saved ✅',
      notifications: {
        dailyReminders: Boolean(notif.dailyReminders),
        burnoutAlerts: Boolean(notif.burnoutAlerts),
        weeklyReport: Boolean(notif.weeklyReport),
      }
    });

  } catch (err) {
    console.error('Update notifications error details:', err);
    res.status(500).json({ message: err.message || 'Server error saving notifications' });
  }
};

// EXPORT ALL USER DATA
exports.exportData = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select('-password');
    const logs = await ScreenLog.find({ user: userId }).sort({ logDate: 1 });
    const tasks = await Task.find({ user: userId }).sort({ isoDate: 1 });
    const burnout = await BurnoutScore.find({ user: userId }).sort({ recordedAt: 1 });

    res.status(200).json({
      exportedAt: new Date().toISOString(),
      user,
      screenLogs: logs,
      tasks,
      burnout,
    });

  } catch (err) {
    console.error('Export data error details:', err);
    res.status(500).json({ message: err.message || 'Server error exporting data' });
  }
};

// DELETE ACCOUNT
exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    await ScreenLog.deleteMany({ user: userId });
    await Task.deleteMany({ user: userId });
    await BurnoutScore.deleteMany({ user: userId });
    await NotificationSettings.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Account deleted successfully' });

  } catch (err) {
    console.error('Delete account error details:', err);
    res.status(500).json({ message: err.message || 'Server error deleting account' });
  }
};
