const ScreenLog = require('../models/ScreenLog');
const BurnoutScore = require('../models/BurnoutScore');
const achievementService = require('../services/achievementService');

// Helper: replicate burnout score calculation logic
function calcBurnout(totalMins, socialMins, entMins) {
  const h = totalMins / 60;
  let base;
  if      (h <= 2) base = h * 1.0;
  else if (h <= 4) base = 2 + (h - 2) * 1.2;
  else if (h <= 6) base = 4.4 + (h - 4) * 1.5;
  else if (h <= 8) base = 7.4 + (h - 6) * 1.0;
  else             base = 9.4 + (h - 8) * 0.3;

  const passive = (socialMins + entMins) / (totalMins || 1);
  const bonus   = passive > 0.6 ? 0.8 : passive > 0.4 ? 0.4 : 0;
  const score   = Math.round(Math.min(10, Math.max(1, base + bonus)) * 10) / 10;
  const category = score <= 3.5 ? 'Normal' : score <= 6.5 ? 'Mid' : 'Excess';
  return { score, category };
}

// UPSERT LOG
exports.upsertLog = async (req, res) => {
  const userId = req.user.id;
  const { isoDate, totalMins, study, social, ent, other } = req.body;

  if (!isoDate || totalMins === undefined || totalMins === null) {
    return res.status(400).json({ message: 'Date and total minutes are required' });
  }
  if (Number(totalMins) <= 0) {
    return res.status(400).json({ message: 'Please enter at least one category' });
  }

  try {
    const { score, category } = calcBurnout(
      Number(totalMins),
      Number(social || 0),
      Number(ent    || 0)
    );

    const logData = {
      user: userId,
      logDate: isoDate,
      totalMins: Number(totalMins),
      studyMins: Number(study || 0),
      socialMins: Number(social || 0),
      entMins: Number(ent || 0),
      otherMins: Number(other || 0),
      score,
      category,
    };

    await ScreenLog.findOneAndUpdate(
      { user: userId, logDate: isoDate },
      logData,
      { upsert: true, new: true, runValidators: true }
    );

    // Record Burnout Score
    await BurnoutScore.create({
      user: userId,
      score,
      recordedAt: new Date(isoDate),
    });

    // Auto-evaluate user achievements
    achievementService.evaluateUserAchievements(userId).catch(err => console.error('Auto achievement eval error:', err.message));

    res.status(200).json({ message: 'Log saved successfully', score, category });

  } catch (err) {
    console.error('Upsert log error details:', err);
    res.status(500).json({ message: err.message || 'Server error saving log' });
  }
};

// GET ALL LOGS
exports.getLogs = async (req, res) => {
  const userId = req.user.id;

  try {
    const rawLogs = await ScreenLog.find({ user: userId }).sort({ logDate: 1 });

    const logs = rawLogs.map(log => ({
      isoDate: log.logDate,
      totalMins: Number(log.totalMins),
      study: Number(log.studyMins),
      social: Number(log.socialMins),
      ent: Number(log.entMins),
      other: Number(log.otherMins),
      score: parseFloat(log.score),
      category: log.category,
      displayDate: log.logDate.split('-').reverse().join(' / ')
    }));

    res.status(200).json({ logs });

  } catch (err) {
    console.error('Get logs error details:', err);
    res.status(500).json({ message: err.message || 'Server error fetching logs' });
  }
};

// GET ANALYTICS SUMMARY
exports.getAnalyticsSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    const rawLogs = await ScreenLog.find({ user: userId }).sort({ logDate: 1 });

    if (rawLogs.length === 0) {
      return res.status(200).json({ logs: [], summary: null });
    }

    const logs = rawLogs.map(log => ({
      isoDate: log.logDate,
      totalMins: Number(log.totalMins),
      study: Number(log.studyMins),
      social: Number(log.socialMins),
      ent: Number(log.entMins),
      other: Number(log.otherMins),
      score: parseFloat(log.score),
      category: log.category,
      displayDate: log.logDate.split('-').reverse().join(' / ')
    }));

    const totalScore = logs.reduce((s, l) => s + l.score, 0);
    const totalMins = logs.reduce((s, l) => s + l.totalMins, 0);
    const avgScore = parseFloat((totalScore / logs.length).toFixed(2));
    const avgMins = Math.round(totalMins / logs.length);
    const daysLogged = logs.length;
    const highest = logs.reduce((a, b) => a.totalMins > b.totalMins ? a : b);
    const lowest = logs.reduce((a, b) => a.totalMins < b.totalMins ? a : b);
    const trend = logs.length >= 2
      ? parseFloat((logs[logs.length - 1].score - logs[0].score).toFixed(2))
      : 0;

    res.status(200).json({
      logs,
      summary: { avgScore, avgMins, weekTotal: totalMins, daysLogged, highest, lowest, trend }
    });

  } catch (err) {
    console.error('Analytics summary error details:', err);
    res.status(500).json({ message: err.message || 'Server error fetching analytics' });
  }
};