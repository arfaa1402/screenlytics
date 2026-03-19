const db = require('../config/db');

// ✅ Helper: replicate frontend calcBurnout logic exactly
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

// ✅ UPSERT LOG
exports.upsertLog = async (req, res) => {
  const userId = req.user.id;
  const { isoDate, totalMins, study, social, ent, other } = req.body;

  if (!isoDate || !totalMins) {
    return res.status(400).json({ message: 'Date and total minutes are required' });
  }
  if (totalMins <= 0) {
    return res.status(400).json({ message: 'Please enter at least one category' });
  }

  try {
    const { score, category } = calcBurnout(
      Number(totalMins),
      Number(social || 0),
      Number(ent    || 0)
    );

    const [existing] = await db.query(
      'SELECT id FROM screen_logs WHERE user_id = ? AND log_date = ?',
      [userId, isoDate]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE screen_logs 
         SET total_mins=?, study_mins=?, social_mins=?, ent_mins=?, other_mins=?, score=?, category=?
         WHERE user_id=? AND log_date=?`,
        [totalMins, study||0, social||0, ent||0, other||0, score, category, userId, isoDate]
      );
    } else {
      await db.query(
        `INSERT INTO screen_logs 
         (user_id, log_date, total_mins, study_mins, social_mins, ent_mins, other_mins, score, category)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [userId, isoDate, totalMins, study||0, social||0, ent||0, other||0, score, category]
      );
    }

    // Upsert burnout_scores
    const [existingBurnout] = await db.query(
      'SELECT id FROM burnout_scores WHERE user_id=? AND DATE(recorded_at)=?',
      [userId, isoDate]
    );
    if (existingBurnout.length > 0) {
      await db.query(
        'UPDATE burnout_scores SET score=? WHERE user_id=? AND DATE(recorded_at)=?',
        [score, userId, isoDate]
      );
    } else {
      await db.query(
        'INSERT INTO burnout_scores (user_id, score, recorded_at) VALUES (?,?,?)',
        [userId, score, isoDate]
      );
    }

    res.status(200).json({ message: 'Log saved successfully', score, category });

  } catch (err) {
    console.error('Upsert log error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ GET ALL LOGS — all numbers parsed correctly
exports.getLogs = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(log_date, '%Y-%m-%d') AS isoDate,
        CAST(total_mins  AS UNSIGNED)     AS totalMins,
        CAST(study_mins  AS UNSIGNED)     AS study,
        CAST(social_mins AS UNSIGNED)     AS social,
        CAST(ent_mins    AS UNSIGNED)     AS ent,
        CAST(other_mins  AS UNSIGNED)     AS other,
        CAST(score       AS DECIMAL(4,2)) AS score,
        category
       FROM screen_logs
       WHERE user_id = ?
       ORDER BY log_date ASC`,
      [userId]
    );

    // ✅ Force all numeric fields to JS numbers
    const logs = rows.map(log => ({
      isoDate:     log.isoDate,
      totalMins:   Number(log.totalMins),
      study:       Number(log.study),
      social:      Number(log.social),
      ent:         Number(log.ent),
      other:       Number(log.other),
      score:       parseFloat(log.score),
      category:    log.category,
      displayDate: log.isoDate.split('-').reverse().join(' / ')
    }));

    res.status(200).json({ logs });

  } catch (err) {
    console.error('Get logs error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ GET ANALYTICS SUMMARY
exports.getAnalyticsSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(log_date, '%Y-%m-%d') AS isoDate,
        CAST(total_mins  AS UNSIGNED)     AS totalMins,
        CAST(study_mins  AS UNSIGNED)     AS study,
        CAST(social_mins AS UNSIGNED)     AS social,
        CAST(ent_mins    AS UNSIGNED)     AS ent,
        CAST(other_mins  AS UNSIGNED)     AS other,
        CAST(score       AS DECIMAL(4,2)) AS score,
        category
       FROM screen_logs
       WHERE user_id = ?
       ORDER BY log_date ASC`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(200).json({ logs: [], summary: null });
    }

    const logs = rows.map(log => ({
      isoDate:     log.isoDate,
      totalMins:   Number(log.totalMins),
      study:       Number(log.study),
      social:      Number(log.social),
      ent:         Number(log.ent),
      other:       Number(log.other),
      score:       parseFloat(log.score),
      category:    log.category,
      displayDate: log.isoDate.split('-').reverse().join(' / ')
    }));

    const totalScore = logs.reduce((s, l) => s + l.score,     0);
    const totalMins  = logs.reduce((s, l) => s + l.totalMins, 0);
    const avgScore   = parseFloat((totalScore / logs.length).toFixed(2));
    const avgMins    = Math.round(totalMins / logs.length);
    const daysLogged = logs.length;
    const highest    = logs.reduce((a, b) => a.totalMins > b.totalMins ? a : b);
    const lowest     = logs.reduce((a, b) => a.totalMins < b.totalMins ? a : b);
    const trend      = logs.length >= 2
      ? parseFloat((logs[logs.length - 1].score - logs[0].score).toFixed(2))
      : 0;

    res.status(200).json({
      logs,
      summary: { avgScore, avgMins, weekTotal: totalMins, daysLogged, highest, lowest, trend }
    });

  } catch (err) {
    console.error('Analytics summary error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};