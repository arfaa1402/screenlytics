const achievementService = require('../services/achievementService');

// GET all achievements for user
exports.getAchievements = async (req, res) => {
  const userId = req.user.id;
  try {
    const data = await achievementService.getUserAchievements(userId);
    res.status(200).json(data);
  } catch (err) {
    console.error('Get achievements controller error:', err);
    res.status(500).json({ message: err.message || 'Server error loading achievements' });
  }
};

// POST evaluate achievements on demand
exports.evaluateAchievements = async (req, res) => {
  const userId = req.user.id;
  try {
    const data = await achievementService.getUserAchievements(userId);
    res.status(200).json({ message: 'Achievements evaluated successfully', ...data });
  } catch (err) {
    console.error('Evaluate achievements controller error:', err);
    res.status(500).json({ message: err.message || 'Server error evaluating achievements' });
  }
};
