// src/pages/Dashboard.js


import { useApp } from '../hooks/useApp';
import { todayISO } from '../utils/date';
import BurnoutRing from '../components/BurnoutRing';
import styles from './Dashboard.module.css';

const TIPS = {
  Normal: ["You're in a healthy zone — keep this balance going!", "Try a 10-minute walk between study sessions.", "Schedule one No Phone Hour this evening."],
  Mid:    ["Elevated usage detected — consider a 1-hour screen break.", "Cap entertainment to 30 minutes tonight.", "Take a 5-min break every 50 minutes of screen use."],
  Excess: ["⚠️ High burnout risk. Put your phone down now.", "Block social apps for the next 2 hours.", "A 20-minute walk outside will help significantly."],
};

export default function Dashboard() {
  const { user, logs, burnoutScore, burnoutCat } = useApp();

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const todayLog = logs.find(l => l.isoDate === todayISO());
  const score    = todayLog ? todayLog.score : burnoutScore;
  const cat      = todayLog ? todayLog.category : burnoutCat;

  const weekTotal = logs.reduce((s, l) => s + l.totalMins, 0);
  const tips      = TIPS[cat] || TIPS.Normal;

  const catClass =
    cat === 'Excess' ? 'badge-excess' :
    cat === 'Mid'    ? 'badge-mid'    : 'badge-normal';

  const ringMsg =
    score > 0
      ? cat === 'Normal' ? "You're in a healthy zone!" : cat === 'Mid' ? 'Moderate risk — take breaks.' : 'High risk — rest now.'
      : 'Log today to see your score';

  return (
    <div className={styles.page}>
      <div className="page-inner fade-in">
        <div className="page-header">
          <h1>Good {greeting}, <span style={{ color: 'var(--accent)' }}>{user?.firstName}</span> 👋</h1>
          <p>Here's your digital wellness overview.</p>
        </div>

        <div className={styles.top}>
          {/* Burnout ring card */}
          <div className={styles.ringCard}>
            <div className={styles.ringLbl}>Burnout Score</div>
            <BurnoutRing score={score} category={cat} />
            <span className={`badge ${catClass}`} style={{ marginBottom: 10 }}>
              {score > 0 ? cat : '—'}
            </span>
            <p className={styles.ringMsg}>{ringMsg}</p>
          </div>

          {/* Right column */}
          <div className={styles.rightCol}>
            <div className={styles.tileGrid}>
              <div className="info-tile">
                <div className="info-tile-lbl">Today's Screen Time</div>
                <div className="info-tile-val" style={{ color: 'var(--accent)' }}>
                  {todayLog ? `${(todayLog.totalMins / 60).toFixed(1)}h` : '—'}
                </div>
                <div className="info-tile-sub">
                  {todayLog ? `Score: ${todayLog.score}/10` : 'Not logged yet'}
                </div>
              </div>
              <div className="info-tile">
                <div className="info-tile-lbl">Weekly Total</div>
                <div className="info-tile-val" style={{ color: 'var(--accent4)' }}>
                  {weekTotal > 0 ? `${(weekTotal / 60).toFixed(1)}h` : '—'}
                </div>
                <div className="info-tile-sub">This week</div>
              </div>
            </div>

            <div className={styles.tipsStrip}>
              <h3>💡 TODAY'S TIPS</h3>
              <ul>
                {tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
