// src/pages/Landing.js

import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import styles from './Landing.module.css';

const FEATURES = [
  { icon: '🧠', title: 'Burnout Score Engine',  desc: 'Daily usage scored 1–10 with categories: Normal, Mid, and Excess.' },
  { icon: '📊', title: 'Visual Analytics',      desc: 'Charts and trend lines reveal your usage patterns over time.' },
  { icon: '📅', title: 'Schedule Planner',      desc: 'Add tasks and No Phone Hours to keep your week balanced.' },
  { icon: '💡', title: 'Awareness Hub',         desc: 'Quotes and strategies personalised to your burnout level.' },
  { icon: '🔒', title: 'Secure & Private',      desc: 'Your data stays yours. Full account control and export.' },
  { icon: '⚡', title: 'Instant Updates',       desc: 'Log screen time and watch your score recalculate instantly.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { login, showToast } = useApp();

  function demoLogin() {
    login({ firstName: 'Alex', lastName: 'Johnson', email: 'alex@university.edu' });
    showToast('Welcome, Alex! 🌟');
    navigate('/dashboard');
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.pill}>
          <span className={styles.pillDot} />
          Real-time burnout intelligence
        </div>
        <h1 className={styles.heading}>
          Screen smarter.<br /><em>Feel better.</em>
        </h1>
        <p className={styles.desc}>
          Screenlytics turns your daily screen time into a personalised burnout score —
          helping students take back control before exhaustion takes hold.
        </p>
        <div className={styles.btns}>
          <button className={styles.btnMain} onClick={() => navigate('/auth')}>
            Get Started — Free
          </button>
          <button className={styles.btnOutline} onClick={demoLogin}>
            Try Demo
          </button>
        </div>
      </section>

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <div className={styles.statNum}>4.2h</div>
          <div className={styles.statLbl}>Avg. student daily screen time</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNum}>68%</div>
          <div className={styles.statLbl}>Report digital-induced burnout</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNum}>3×</div>
          <div className={styles.statLbl}>Productivity gain with balance</div>
        </div>
      </div>

      {/* Feature cards */}
      <div className={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.featCard}>
            <div className={styles.featIcon}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
