// backend/controllers/plannerController.js

const db = require('../config/db');

// ─────────────────────────────────────────
// GET ALL TASKS for logged-in user
// ─────────────────────────────────────────
exports.getTasks = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        id,
        title,
        type,
        DATE_FORMAT(iso_date, '%Y-%m-%d') AS isoDate,
        display_date                       AS displayDate,
        TIME_FORMAT(time, '%H:%i')         AS time,
        duration,
        done
       FROM tasks
       WHERE user_id = ?
       ORDER BY iso_date ASC, time ASC`,
      [userId]
    );

    // Force correct JS types — MySQL returns strings
    const tasks = rows.map(t => ({
      id:          Number(t.id),
      title:       t.title,
      type:        t.type,
      isoDate:     t.isoDate,
      displayDate: t.displayDate,
      time:        t.time,
      duration:    Number(t.duration),   // ✅ must be number for end-time calculation
      done:        t.done === 1          // ✅ must be boolean not 0/1
    }));

    res.status(200).json({ tasks });

  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// ADD TASK
// ─────────────────────────────────────────
exports.addTask = async (req, res) => {
  const userId = req.user.id;
  const { title, type, isoDate, displayDate, time, duration } = req.body;

  if (!title || !title.trim())
    return res.status(400).json({ message: 'Please enter a task title' });

  if (!isoDate)
    return res.status(400).json({ message: 'Please enter a valid date' });

  if (!['study', 'exercise', 'break', 'nophone'].includes(type))
    return res.status(400).json({ message: 'Invalid task type' });

  if (!time)
    return res.status(400).json({ message: 'Please enter a start time' });

  if (!duration || Number(duration) <= 0)
    return res.status(400).json({ message: 'Please select a duration' });

  try {
    const safeDisplayDate = displayDate || isoDate.split('-').reverse().join(' / ');

    const [result] = await db.query(
      `INSERT INTO tasks 
       (user_id, title, type, iso_date, display_date, time, duration, done)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [userId, title.trim(), type, isoDate, safeDisplayDate, time, Number(duration)]
    );

    res.status(201).json({
      message: 'Task added successfully',
      task: {
        id:          result.insertId,        // ✅ real DB id, not Date.now()
        title:       title.trim(),
        type,
        isoDate,
        displayDate: safeDisplayDate,
        time,
        duration:    Number(duration),
        done:        false
      }
    });

  } catch (err) {
    console.error('Add task error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// TOGGLE TASK done ↔ undone
// ─────────────────────────────────────────
exports.toggleTask = async (req, res) => {
  const userId = req.user.id;
  const { id }  = req.params;

  try {
    const [rows] = await db.query(
      'SELECT done FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Task not found' });

    const newDone = rows[0].done === 0 ? 1 : 0;

    await db.query(
      'UPDATE tasks SET done = ? WHERE id = ? AND user_id = ?',
      [newDone, id, userId]
    );

    res.status(200).json({
      message: newDone ? 'Task marked as done' : 'Task marked as undone',
      done:    newDone === 1   // ✅ boolean for frontend
    });

  } catch (err) {
    console.error('Toggle task error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// DELETE TASK
// ─────────────────────────────────────────
exports.deleteTask = async (req, res) => {
  const userId = req.user.id;
  const { id }  = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Task not found' });

    res.status(200).json({ message: 'Task deleted successfully' });

  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
