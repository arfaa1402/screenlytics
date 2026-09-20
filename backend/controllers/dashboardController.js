const ScreenLog = require('../models/ScreenLog');
const BurnoutScore = require('../models/BurnoutScore');

// GET Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    const weekStart = monday.toISOString().split('T')[0];

    // Fetch weekly logs for user
    const weekLogs = await ScreenLog.find({
      user: userId,
      logDate: { $gte: weekStart }
    }).sort({ logDate: 1 });

    // Latest burnout score
    const latestBurnout = await BurnoutScore.findOne({ user: userId }).sort({ recordedAt: -1 });

    const getBurnoutCategory = (score) => {
      if (score <= 3) return 'Normal';
      if (score <= 6) return 'Mid';
      return 'Excess';
    };

    const logsWithScore = weekLogs.map(log => ({
      isoDate: log.logDate,
      totalMins: log.totalMins,
      score: log.score,
      category: log.category || getBurnoutCategory(log.score)
    }));

    const weekTotal = weekLogs.reduce((sum, l) => sum + l.totalMins, 0);
    const burnoutScore = latestBurnout ? parseFloat(latestBurnout.score) : (weekLogs.length > 0 ? weekLogs[weekLogs.length - 1].score : 0);
    const burnoutCat = getBurnoutCategory(burnoutScore);

    res.status(200).json({
      todayLog: logsWithScore.find(l => l.isoDate === today) || null,
      logs: logsWithScore,
      weekTotal,
      burnoutScore,
      burnoutCat
    });

  } catch (err) {
    console.error('Dashboard error details:', err);
    res.status(500).json({ message: err.message || 'Server error loading dashboard' });
  }
};