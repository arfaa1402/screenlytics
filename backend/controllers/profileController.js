// backend/controllers/profileController.js

const db     = require('../config/db');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────
// GET PROFILE — user info + stats + notifications
// ─────────────────────────────────────────
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. User info
    const [userRows] = await db.query(
      `SELECT id, name, email,
        DATE_FORMAT(created_at, '%Y') AS memberSince
       FROM users WHERE id = ?`,
      [userId]
    );
    if (userRows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const u         = userRows[0];
    const parts     = u.name.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName  = parts.slice(1).join(' ') || '';

    // 2. Days logged count
    const [logCount] = await db.query(
      'SELECT COUNT(*) AS daysLogged FROM screen_logs WHERE user_id = ?',
      [userId]
    );

    // 3. Latest burnout score
    const [burnoutRows] = await db.query(
      `SELECT score FROM burnout_scores
       WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1`,
      [userId]
    );

    // 4. Notification settings
    //    ✅ Auto-create default row if user has never set preferences
    const [notifRows] = await db.query(
      'SELECT daily_reminders, burnout_alerts, weekly_report FROM notification_settings WHERE user_id = ?',
      [userId]
    );

    if (notifRows.length === 0) {
      // First time — insert default row
      await db.query(
        `INSERT INTO notification_settings
         (user_id, daily_reminders, burnout_alerts, weekly_report)
         VALUES (?, 1, 1, 0)`,
        [userId]
      );
    }

    const notif = notifRows[0] || { daily_reminders: 1, burnout_alerts: 1, weekly_report: 0 };

    res.status(200).json({
      user: {
        id:          u.id,
        firstName,
        lastName,
        email:       u.email,
        memberSince: u.memberSince
      },
      stats: {
        burnoutScore: burnoutRows.length > 0 ? parseFloat(burnoutRows[0].score) : 0,
        daysLogged:   Number(logCount[0].daysLogged)
      },
      notifications: {
        dailyReminders: notif.daily_reminders === 1,
        burnoutAlerts:  notif.burnout_alerts  === 1,
        weeklyReport:   notif.weekly_report   === 1
      }
    });

  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// UPDATE PROFILE (name + email)
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email } = req.body;

  if (!firstName || !firstName.trim())
    return res.status(400).json({ message: 'First name is required' });
  if (!email || !email.trim())
    return res.status(400).json({ message: 'Email is required' });

  try {
    // Check email not used by another account
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email.trim(), userId]
    );
    if (existing.length > 0)
      return res.status(409).json({ message: 'Email already in use by another account' });

    const fullName = `${firstName.trim()} ${lastName ? lastName.trim() : ''}`.trim();

    await db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [fullName, email.trim(), userId]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        firstName: firstName.trim(),
        lastName:  lastName ? lastName.trim() : '',
        email:     email.trim()
      }
    });

  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────
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
    const [rows] = await db.query(
      'SELECT password FROM users WHERE id = ?', [userId]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch)
      return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    res.status(200).json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// UPDATE NOTIFICATION SETTINGS
// ✅ Upsert — works whether row exists or not
// ─────────────────────────────────────────
exports.updateNotifications = async (req, res) => {
  const userId = req.user.id;
  const { dailyReminders, burnoutAlerts, weeklyReport } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM notification_settings WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE notification_settings
         SET daily_reminders = ?, burnout_alerts = ?, weekly_report = ?
         WHERE user_id = ?`,
        [dailyReminders ? 1 : 0, burnoutAlerts ? 1 : 0, weeklyReport ? 1 : 0, userId]
      );
    } else {
      await db.query(
        `INSERT INTO notification_settings
         (user_id, daily_reminders, burnout_alerts, weekly_report)
         VALUES (?, ?, ?, ?)`,
        [userId, dailyReminders ? 1 : 0, burnoutAlerts ? 1 : 0, weeklyReport ? 1 : 0]
      );
    }

    res.status(200).json({
      message: 'Notification settings saved ✅',
      notifications: {
        dailyReminders: !!dailyReminders,
        burnoutAlerts:  !!burnoutAlerts,
        weeklyReport:   !!weeklyReport
      }
    });

  } catch (err) {
    console.error('Update notifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// EXPORT ALL USER DATA
// ─────────────────────────────────────────
exports.exportData = async (req, res) => {
  const userId = req.user.id;

  try {
    const [userRows]    = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId]
    );
    const [logRows]     = await db.query(
      `SELECT DATE_FORMAT(log_date,'%Y-%m-%d') AS date,
        total_mins, study_mins, social_mins, ent_mins, other_mins, score, category
       FROM screen_logs WHERE user_id = ? ORDER BY log_date ASC`,
      [userId]
    );
    const [taskRows]    = await db.query(
      `SELECT title, type,
        DATE_FORMAT(iso_date,'%Y-%m-%d') AS date,
        time, duration, done
       FROM tasks WHERE user_id = ? ORDER BY iso_date ASC`,
      [userId]
    );
    const [burnoutRows] = await db.query(
      `SELECT score, DATE_FORMAT(recorded_at,'%Y-%m-%d') AS date
       FROM burnout_scores WHERE user_id = ? ORDER BY recorded_at ASC`,
      [userId]
    );

    res.status(200).json({
      exportedAt: new Date().toISOString(),
      user:       userRows[0],
      screenLogs: logRows,
      tasks:      taskRows,
      burnout:    burnoutRows
    });

  } catch (err) {
    console.error('Export data error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// DELETE ACCOUNT
// CASCADE in DB auto-deletes all related rows
// ─────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
