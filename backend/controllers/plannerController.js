const Task = require('../models/Task');
const achievementService = require('../services/achievementService');

// GET ALL TASKS for logged-in user
exports.getTasks = async (req, res) => {
  const userId = req.user.id;

  try {
    const rawTasks = await Task.find({ user: userId }).sort({ isoDate: 1, time: 1 });

    const tasks = rawTasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      type: t.type,
      isoDate: t.isoDate,
      displayDate: t.displayDate || t.isoDate.split('-').reverse().join(' / '),
      time: t.time,
      duration: Number(t.duration),
      done: Boolean(t.done),
    }));

    res.status(200).json({ tasks });

  } catch (err) {
    console.error('Get tasks error details:', err);
    res.status(500).json({ message: err.message || 'Server error loading tasks' });
  }
};

// ADD TASK
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

    const task = await Task.create({
      user: userId,
      title: title.trim(),
      type,
      isoDate,
      displayDate: safeDisplayDate,
      time,
      duration: Number(duration),
      done: false,
    });

    // Auto-evaluate user achievements
    achievementService.evaluateUserAchievements(userId).catch(err => console.error('Auto achievement eval error:', err.message));

    res.status(201).json({
      message: 'Task added successfully',
      task: {
        id: task._id.toString(),
        title: task.title,
        type: task.type,
        isoDate: task.isoDate,
        displayDate: task.displayDate,
        time: task.time,
        duration: task.duration,
        done: task.done,
      }
    });

  } catch (err) {
    console.error('Add task error details:', err);
    res.status(500).json({ message: err.message || 'Server error adding task' });
  }
};

// TOGGLE TASK done ↔ undone
exports.toggleTask = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const task = await Task.findOne({ _id: id, user: userId });
    if (!task)
      return res.status(404).json({ message: 'Task not found' });

    task.done = !task.done;
    await task.save();

    // Auto-evaluate user achievements
    achievementService.evaluateUserAchievements(userId).catch(err => console.error('Auto achievement eval error:', err.message));

    res.status(200).json({
      message: task.done ? 'Task marked as done' : 'Task marked as undone',
      done: task.done,
    });

  } catch (err) {
    console.error('Toggle task error details:', err);
    res.status(500).json({ message: err.message || 'Server error toggling task' });
  }
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await Task.deleteOne({ _id: id, user: userId });

    if (result.deletedCount === 0)
      return res.status(404).json({ message: 'Task not found' });

    // Auto-evaluate user achievements
    achievementService.evaluateUserAchievements(userId).catch(err => console.error('Auto achievement eval error:', err.message));

    res.status(200).json({ message: 'Task deleted successfully' });

  } catch (err) {
    console.error('Delete task error details:', err);
    res.status(500).json({ message: err.message || 'Server error deleting task' });
  }
};
