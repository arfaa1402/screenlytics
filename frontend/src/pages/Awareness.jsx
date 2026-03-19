// src/pages/Awareness.js

import { useEffect, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { fetchQuoteByScore } from '../utils/quotes';
import styles from './Awareness.module.css';

const ARTICLES = [
  { tag: '📱 Digital Habits',  title: 'The 20-20-20 Rule: Protect Your Eyes',      body: 'Every 20 minutes, look at something 20 feet away for 20 seconds. Dramatically reduces eye strain and cognitive fatigue from prolonged screen use.' },
  { tag: '🧠 Neuroscience',    title: 'How Social Media Hijacks Your Brain',       body: 'Dopamine spikes from notifications create compulsive checking. Batching social media to 2–3 windows per day significantly reduces anxiety.' },
  { tag: '😴 Sleep Science',   title: 'Blue Light Is Hurting Your Grades',         body: 'Blue light suppresses melatonin by up to 50%. Stopping screens 90 min before bed leads to better focus and higher exam scores.' },
  { tag: '💪 Recovery',        title: 'The 52/17 Work Rhythm',                     body: 'Top performers work 52 minutes then take a 17-minute screen-free break — restoring attention far better than scrolling.' },
];

const STRATEGIES = [
  { icon: '🌅', title: 'Morning Screen-Free Hour',  desc: 'No phone for the first 60 minutes. Sets a calm, intentional tone for your day.' },
  { icon: '📴', title: 'No Phone Hours',             desc: '1–2 hours daily with your phone in another room. Most effective burnout reducer.' },
  { icon: '🚶', title: 'Walk Without Headphones',    desc: '10 minutes daily without any device. Activates your default mode network.' },
  { icon: '🍽️', title: 'Phone-Free Meals',           desc: 'Start with one meal a day. Improves digestion and social connection.' },
];

const BAND_LABELS = { normal: 'Normal range', mid: 'Mid range', excess: 'Excess — take care' };

export default function Awareness() {
  const { burnoutScore } = useApp();
  const [quoteData, setQuoteData] = useState(null);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (burnoutScore === 0) { setQuoteData(null); return; }
    setLoading(true);
    fetchQuoteByScore(burnoutScore).then(data => {
      setQuoteData(data);
      setLoading(false);
    });
  }, [burnoutScore]);

  return (
    <div className={styles.page}>
      <div className="page-inner fade-in">
        <div className="page-header">
          <h1>Awareness & Motivation</h1>
          <p>Strategies and inspiration personalised to your burnout level.</p>
        </div>

        {/* Quote hero */}
        <div className={styles.quoteHero}>
          {burnoutScore > 0 && quoteData && (
            <span className={styles.scoreTag}>
              Your score: {burnoutScore}/10 · {BAND_LABELS[quoteData.band]}
            </span>
          )}
          <div className={styles.quoteMark}>"</div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              <p className={styles.bigQuote}>
                {quoteData
                  ? quoteData.text
                  : 'Log your screen time to unlock a personalised quote based on your burnout score.'}
              </p>
              <div className={styles.quoteAuthor}>
                — {quoteData ? quoteData.author : 'Screenlytics'}
              </div>
            </>
          )}
        </div>

        {/* Articles */}
        <div className={styles.articleGrid}>
          {ARTICLES.map(a => (
            <div key={a.title} className={styles.articleCard}>
              <div className={styles.articleTag}>{a.tag}</div>
              <h3>{a.title}</h3>
              <p>{a.body}</p>
            </div>
          ))}
        </div>

        {/* Strategies */}
        <h2 className={styles.stratHeading}>🛡️ Burnout Prevention Strategies</h2>
        <div className={styles.stratGrid}>
          {STRATEGIES.map(s => (
            <div key={s.title} className={styles.stratCard}>
              <div className={styles.stratIcon}>{s.icon}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
