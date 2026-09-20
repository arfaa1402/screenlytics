const ScreenLog = require('../models/ScreenLog');
const Task = require('../models/Task');
const UserAchievement = require('../models/UserAchievement');
const ACHIEVEMENTS_CATALOG = require('../utils/achievementCatalog');

const DAILY_GOAL_LIMIT_MINS = 240; // 4 hours limit

/**
 * Evaluate all achievements for a given user and update MongoDB
 */
async function evaluateUserAchievements(userId) {
  try {
    // 1. Fetch user screen logs & tasks
    const logs = await ScreenLog.find({ user: userId }).sort({ logDate: 1 });
    const tasks = await Task.find({ user: userId });

    // --- EVALUATION CALCULATIONS ---

    // Total days goal completed (totalMins <= 240)
    const goalCompletedLogs = logs.filter(l => l.totalMins <= DAILY_GOAL_LIMIT_MINS);
    const goalCompletedCount = goalCompletedLogs.length;

    // Days under 4 hours (< 240 mins)
    const under4HoursCount = logs.filter(l => l.totalMins < DAILY_GOAL_LIMIT_MINS).length;

    // Consecutive streak calculation
    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate = null;

    for (const log of logs) {
      if (log.totalMins <= DAILY_GOAL_LIMIT_MINS) {
        if (!lastDate) {
          currentStreak = 1;
        } else {
          const prev = new Date(lastDate);
          const curr = new Date(log.logDate);
          const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        }
        lastDate = log.logDate;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
        lastDate = null;
      }
    }

    // 2-hour Focus Session / Digital Detox (Task duration >= 120 mins completed OR studyMins >= 120)
    const completedLongTask = tasks.some(t => t.done && t.duration >= 120 && ['study', 'nophone', 'break'].includes(t.type));
    const longStudyLog = logs.some(l => l.studyMins >= 120);
    const digitalDetoxCompleted = completedLongTask || longStudyLog ? 1 : 0;

    // Early Wind-Down (Completed nophone or break task at or after 21:00 / 9 PM)
    const earlyWindDownCompleted = tasks.some(t => {
      if (!t.done || !['nophone', 'break'].includes(t.type)) return false;
      const hour = parseInt((t.time || '00:00').split(':')[0], 10);
      return hour >= 21;
    }) ? 1 : 0;

    // Focus Master (Completed 10 focus/study/nophone tasks)
    const completedFocusTasksCount = tasks.filter(t => t.done && ['study', 'nophone', 'exercise'].includes(t.type)).length;

    // Screen Time Reducer (Current 7 days vs previous 7 days)
    let screenReducerCompleted = 0;
    if (logs.length >= 2) {
      const now = new Date();
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const currentWeekMins = logs.filter(l => l.logDate >= d7).reduce((a, b) => a + b.totalMins, 0);
      const prevWeekMins = logs.filter(l => l.logDate >= d14 && l.logDate < d7).reduce((a, b) => a + b.totalMins, 0);

      if (prevWeekMins > 0 && currentWeekMins < prevWeekMins) {
        screenReducerCompleted = 1;
      }
    }

    // Weekend Detox (Check if Saturday & Sunday in the same week both completed goal)
    let weekendDetoxCompleted = 0;
    const logsByDate = new Map(logs.map(l => [l.logDate, l]));

    for (const log of logs) {
      const d = new Date(log.logDate);
      if (d.getDay() === 6) { // Saturday
        const sunDate = new Date(d);
        sunDate.setDate(d.getDate() + 1);
        const sunStr = sunDate.toISOString().split('T')[0];
        const sunLog = logsByDate.get(sunStr);
        if (log.totalMins <= DAILY_GOAL_LIMIT_MINS && sunLog && sunLog.totalMins <= DAILY_GOAL_LIMIT_MINS) {
          weekendDetoxCompleted = 1;
          break;
        }
      }
    }

    // Map achievement keys to evaluated current values
    const evaluatedValues = {
      streak_7: maxStreak,
      first_goal: goalCompletedCount > 0 ? 1 : 0,
      digital_detox: digitalDetoxCompleted,
      under_4_hours: under4HoursCount > 0 ? 1 : 0,
      early_wind_down: earlyWindDownCompleted,
      streak_30: maxStreak,
      goal_crusher: goalCompletedCount,
      screen_reducer: screenReducerCompleted,
      focus_master: completedFocusTasksCount,
      weekend_detox: weekendDetoxCompleted,
    };

    // 3. Upsert UserAchievement records
    for (const item of ACHIEVEMENTS_CATALOG) {
      const currVal = evaluatedValues[item.key] || 0;
      const targetVal = item.targetValue;
      const isUnlocked = currVal >= targetVal;
      const progressPct = Math.min(100, Math.round((currVal / targetVal) * 100));

      const existing = await UserAchievement.findOne({ user: userId, achievementKey: item.key });

      if (existing) {
        existing.currentValue = currVal;
        existing.progress = progressPct;
        if (!existing.unlocked && isUnlocked) {
          existing.unlocked = true;
          existing.unlockedAt = new Date();
        }
        existing.updatedAt = new Date();
        await existing.save();
      } else {
        await UserAchievement.create({
          user: userId,
          achievementKey: item.key,
          targetValue: targetVal,
          currentValue: currVal,
          progress: progressPct,
          unlocked: isUnlocked,
          unlockedAt: isUnlocked ? new Date() : null,
        });
      }
    }

  } catch (err) {
    console.error('Achievement evaluation error:', err.message);
  }
}

/**
 * Get formatted achievements for frontend UI
 */
async function getUserAchievements(userId) {
  // Always evaluate latest state before returning
  await evaluateUserAchievements(userId);

  const userAchMap = new Map();
  const rawUserAch = await UserAchievement.find({ user: userId });
  rawUserAch.forEach(ua => userAchMap.set(ua.achievementKey, ua));

  const items = ACHIEVEMENTS_CATALOG.map(cat => {
    const ua = userAchMap.get(cat.key);
    return {
      key: cat.key,
      icon: cat.icon,
      title: cat.title,
      description: cat.description,
      category: cat.category,
      unit: cat.unit,
      targetValue: cat.targetValue,
      currentValue: ua ? ua.currentValue : 0,
      progress: ua ? ua.progress : 0,
      unlocked: ua ? ua.unlocked : false,
      unlockedAt: ua && ua.unlockedAt ? ua.unlockedAt : null,
    };
  });

  const unlockedCount = items.filter(i => i.unlocked).length;
  const totalCount = items.length;
  const overallProgressPct = Math.round((unlockedCount / totalCount) * 100);

  return {
    unlockedCount,
    totalCount,
    overallProgressPct,
    achievements: items,
  };
}

module.exports = {
  evaluateUserAchievements,
  getUserAchievements,
};
