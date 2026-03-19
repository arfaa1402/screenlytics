const db = require('../config/db');

// ✅ GET Dashboard Summary
// Returns today's log, week total, burnout score & category
exports.getDashboardSummary = async (req, res) => {
  const userId = req.user.id; // from JWT middleware

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    const weekStart = monday.toISOString().split('T')[0];

    // Today's log
    const [todayRows] = await db.query(
      `SELECT 
        DATE_FORMAT(log_date, '%Y-%m-%d') AS isoDate,
        SUM(duration_minutes)            AS totalMins
       FROM screen_logs
       WHERE user_id = ? AND log_date = ?
       GROUP BY log_date`,
      [userId, today]
    );

    // Weekly logs
    const [weekRows] = await db.query(
      `SELECT 
        DATE_FORMAT(log_date, '%Y-%m-%d') AS isoDate,
        SUM(duration_minutes)            AS totalMins
       FROM screen_logs
       WHERE user_id = ? AND log_date >= ?
       GROUP BY log_date`,
      [userId, weekStart]
    );

    // Latest burnout score
    const [burnoutRows] = await db.query(
      `SELECT score, recorded_at
       FROM burnout_scores
       WHERE user_id = ?
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [userId]
    );

    // Calculate burnout category from score
    const getBurnoutCategory = (score) => {
      if (score <= 3)  return 'Normal';
      if (score <= 6)  return 'Mid';
      return 'Excess';
    };

    // Attach score & category to each log
    const logsWithScore = weekRows.map(log => {
      const score = calculateScoreFromMins(log.totalMins);
      return {
        ...log,
        totalMins: log.totalMins,
        score,
        category: getBurnoutCategory(score)
      };
    });

    // Weekly total minutes
    const weekTotal = weekRows.reduce((sum, l) => sum + l.totalMins, 0);

    // Latest burnout data
    const latestBurnout = burnoutRows[0] || null;
    const burnoutScore  = latestBurnout ? parseFloat(latestBurnout.score) : 0;
    const burnoutCat    = getBurnoutCategory(burnoutScore);

    res.status(200).json({
      todayLog:     logsWithScore.find(l => l.isoDate === today) || null,
      logs:         logsWithScore,
      weekTotal,
      burnoutScore,
      burnoutCat
    });

  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Helper: calculate burnout score from total minutes
function calculateScoreFromMins(totalMins) {
  // Scale: 0-120 mins = Normal (0-3), 120-300 = Mid (4-6), 300+ = Excess (7-10)
  if (totalMins <= 120) return parseFloat((totalMins / 40).toFixed(1));
  if (totalMins <= 300) return parseFloat((3 + ((totalMins - 120) / 60)).toFixed(1));
  return parseFloat(Math.min(10, 6 + ((totalMins - 300) / 100)).toFixed(1));
}