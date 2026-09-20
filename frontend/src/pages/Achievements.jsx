import { useState, useEffect } from 'react';
import { achievementsAPI } from '../utils/api';
import { useApp } from '../hooks/useApp';
import styles from './Achievements.module.css';

export default function Achievements() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'
  const [data, setData] = useState({
    unlockedCount: 0,
    totalCount: 10,
    overallProgressPct: 0,
    achievements: [],
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    setLoading(true);
    try {
      const res = await achievementsAPI.getAll();
      setData(res);
    } catch (err) {
      console.error('Fetch achievements error:', err.message);
      showToast('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      const res = await achievementsAPI.evaluate();
      setData(res);
      showToast('Achievements updated!');
    } catch (err) {
      showToast('Failed to refresh achievements');
    }
  }

  const filteredAchievements = data.achievements.filter((item) => {
    if (filter === 'unlocked') return item.unlocked;
    if (filter === 'locked') return !item.unlocked;
    return true;
  });

  return (
    <div className={styles.page}>
      {/* Header Banner */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🏆 Achievements & Trophy Case</h1>
          <p className={styles.subtitle}>
            Unlock badges by reaching digital detox goals, maintaining streaks, and building focus habits.
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={handleRefresh} disabled={loading}>
          🔄 Refresh Progress
        </button>
      </div>

      {/* Progress Summary Card */}
      <div className={styles.statsCard}>
        <div className={styles.statsInfo}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Unlocked</span>
            <span className={styles.statVal}>
              🏆 {data.unlockedCount} / {data.totalCount}
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Mastery Progress</span>
            <span className={styles.statVal}>{data.overallProgressPct}%</span>
          </div>
        </div>

        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${data.overallProgressPct}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.activeFilter : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({data.totalCount})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'unlocked' ? styles.activeFilter : ''}`}
          onClick={() => setFilter('unlocked')}
        >
          Unlocked ({data.unlockedCount})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'locked' ? styles.activeFilter : ''}`}
          onClick={() => setFilter('locked')}
        >
          Locked ({data.totalCount - data.unlockedCount})
        </button>
      </div>

      {/* Achievements Cards Grid */}
      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner}></div>
          <p>Evaluating achievements...</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredAchievements.map((item) => (
            <div
              key={item.key}
              className={`${styles.card} ${item.unlocked ? styles.unlockedCard : styles.lockedCard}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.iconCircle}>
                  <span>{item.icon}</span>
                </div>
                <span className={`${styles.badge} ${item.unlocked ? styles.unlockedBadge : styles.lockedBadge}`}>
                  {item.unlocked ? '✨ Unlocked' : '🔒 Locked'}
                </span>
              </div>

              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemDesc}>{item.description}</p>

              {/* Progress Bar & Details */}
              <div className={styles.progressSection}>
                <div className={styles.progressTextRow}>
                  <span>Progress</span>
                  <span className={styles.progressVal}>
                    {item.currentValue} / {item.targetValue} {item.unit} ({item.progress}%)
                  </span>
                </div>
                <div className={styles.cardProgressTrack}>
                  <div
                    className={styles.cardProgressFill}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              {/* Unlock Date Footer */}
              {item.unlocked && item.unlockedAt && (
                <div className={styles.unlockedFooter}>
                  🎉 Unlocked on {new Date(item.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
