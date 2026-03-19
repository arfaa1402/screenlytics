// src/pages/Analytics.js

import { useApp } from '../hooks/useApp';
import { isoToDMY } from '../utils/date';
import styles from './Analytics.module.css';

const PIE_COLORS = ['#c8622a', '#e8a44a', '#7a9e6e', '#a06b3c'];

function BarChart({ logs }) {
  if (logs.length < 2) return <p className={styles.noData}>Log at least 2 days to see chart</p>;
  const maxMins = Math.max(...logs.map(l => l.totalMins));
  const slice   = logs.slice(-7);
  return (
    <div className={styles.barChart}>
      {slice.map(l => {
        const pct   = Math.round((l.totalMins / maxMins) * 90);
        const color = l.category === 'Excess' ? 'var(--excess-c)' : l.category === 'Mid' ? 'var(--mid-c)' : 'var(--accent)';
        const [y, m, d] = l.isoDate.split('-');
        const lbl = new Date(+y, +m - 1, +d).toLocaleDateString('en-GB', { weekday: 'short' });
        return (
          <div key={l.isoDate} className={styles.barCol}>
            <span className={styles.barVal}>{(l.totalMins / 60).toFixed(1)}h</span>
            <div className={styles.barBody} style={{ height: `${pct}%`, background: color }} />
            <span className={styles.barLbl}>{lbl}</span>
          </div>
        );
      })}
    </div>
  );
}

function PieChart({ logs }) {
  if (!logs.length) return <p className={styles.noData}>No data yet</p>;
  const ts = logs.reduce((s, l) => s + l.study,  0);
  const tc = logs.reduce((s, l) => s + l.social, 0);
  const te = logs.reduce((s, l) => s + l.ent,    0);
  const to = logs.reduce((s, l) => s + l.other,  0);
  const gr = ts + tc + te + to || 1;
  const pies = [
    { lb: 'Study',         v: ts },
    { lb: 'Social',        v: tc },
    { lb: 'Entertainment', v: te },
    { lb: 'Other',         v: to },
  ].map(p => ({ ...p, pct: Math.round(p.v / gr * 100) })).filter(p => p.pct > 0);

  const r = 60, cx = 80, cy = 80, circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = pies.map((p, i) => {
    const dash = circ * p.pct / 100;
    const el = (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={PIE_COLORS[i]}
        strokeWidth="22"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <div className={styles.pieRow}>
      <svg width="160" height="160" viewBox="0 0 160 160">{segments}</svg>
      <div className={styles.pieLegend}>
        {pies.map((p, i) => (
          <div key={i} className={styles.pieLegItem}>
            <span className={styles.pieDot} style={{ background: PIE_COLORS[i] }} />
            {p.lb} — {p.pct}%
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ logs }) {
  if (logs.length < 2) return <p className={styles.noData}>Need 2+ entries</p>;
  const scores = logs.map(l => l.score);
  const labels = logs.map(l => { const [y, m, d] = l.isoDate.split('-'); return `${d}/${m}`; });
  const minS = Math.min(...scores) - 0.5, maxS = Math.max(...scores) + 0.5;
  const W = 400, H = 130;
  const px = i => (i / (scores.length - 1)) * (W - 40) + 20;
  const py = s => H - 20 - ((s - minS) / (maxS - minS)) * (H - 40);
  const pts = scores.map((s, i) => `${px(i)},${py(s)}`).join(' ');
  const area = `${px(0)},${H - 20} ${pts} ${px(scores.length - 1)},${H - 20}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(200,98,42,0.28)" />
          <stop offset="100%" stopColor="rgba(200,98,42,0)" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((s, i) => <circle key={i} cx={px(i)} cy={py(s)} r="4" fill="var(--accent)" />)}
      {labels.map((l, i) => (
        <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fill="var(--muted)" fontSize="9">{l}</text>
      ))}
    </svg>
  );
}

export default function Analytics() {
  const { logs } = useApp();
  const sorted = [...logs].sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  if (sorted.length === 0) {
    return (
      <div className={styles.page}>
        <div className="page-inner fade-in">
          <div className="page-header"><h1>Analytics & Insights</h1><p>Visualise your screen time patterns.</p></div>
          <p style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: 60 }}>Log some screen time to see your analytics.</p>
        </div>
      </div>
    );
  }

  const avgScore  = sorted.reduce((s, l) => s + l.score, 0) / sorted.length;
  const avgMins   = sorted.reduce((s, l) => s + l.totalMins, 0) / sorted.length;
  const weekTotal = sorted.reduce((s, l) => s + l.totalMins, 0);
  const highest   = sorted.reduce((a, b) => a.totalMins > b.totalMins ? a : b);
  const lowest    = sorted.reduce((a, b) => a.totalMins < b.totalMins ? a : b);
  const trend     = sorted.length >= 2 ? sorted[sorted.length - 1].score - sorted[0].score : 0;

  const insights = [
    { icon: '📈', bg: 'rgba(200,98,42,.1)',   val: `Avg score: ${avgScore.toFixed(1)}/10`,  sub: avgScore <= 3.5 ? 'Normal range 👍' : avgScore <= 6.5 ? 'Moderate — keep improving' : 'High — take action now' },
    { icon: '🔺', bg: 'rgba(232,164,74,.12)', val: `Highest: ${(highest.totalMins / 60).toFixed(1)}h on ${highest.displayDate}`, sub: `Score was ${highest.score}/10` },
    { icon: '🏅', bg: 'rgba(122,158,110,.12)',val: `Best day: ${(lowest.totalMins / 60).toFixed(1)}h on ${lowest.displayDate}`,  sub: `Score was ${lowest.score}/10` },
    { icon: trend > 0 ? '⚠️' : '✅', bg: 'rgba(160,107,60,.1)',
      val: trend > 0 ? `Trending up by ${Math.abs(trend).toFixed(1)}` : trend < 0 ? `Improving by ${Math.abs(trend).toFixed(1)}` : 'Score is stable',
      sub: 'Based on your logged entries' },
  ];

  return (
    <div className={styles.page}>
      <div className="page-inner fade-in">
        <div className="page-header"><h1>Analytics & Insights</h1><p>Visualise your screen time patterns and trends.</p></div>

        {/* Summary tiles */}
        <div className={styles.summaryGrid}>
          <div className="info-tile"><div className="info-tile-lbl">Avg Score</div><div className="info-tile-val" style={{ color: 'var(--accent)' }}>{avgScore.toFixed(1)}/10</div></div>
          <div className="info-tile"><div className="info-tile-lbl">Avg Daily</div><div className="info-tile-val" style={{ color: 'var(--accent4)' }}>{Math.round(avgMins)}m</div></div>
          <div className="info-tile"><div className="info-tile-lbl">Weekly Total</div><div className="info-tile-val" style={{ color: 'var(--accent2)' }}>{(weekTotal / 60).toFixed(1)}h</div></div>
          <div className="info-tile"><div className="info-tile-lbl">Days Logged</div><div className="info-tile-val" style={{ color: 'var(--accent3)' }}>{sorted.length}</div></div>
        </div>

        <div className={styles.topRow}>
          <div className="card">
            <h2 className={styles.cardTitle}>📊 Daily Screen Time (hrs)</h2>
            <BarChart logs={sorted} />
          </div>
          <div className="card">
            <h2 className={styles.cardTitle}>🥧 Category Breakdown</h2>
            <PieChart logs={sorted} />
          </div>
        </div>

        <div className={styles.bottomRow}>
          <div className="card">
            <h2 className={styles.cardTitle}>📈 Burnout Score Trend</h2>
            <div className={styles.sparkWrap}><Sparkline logs={sorted} /></div>
          </div>
          <div className="card">
            <h2 className={styles.cardTitle}>🔍 Key Insights</h2>
            {insights.map((item, i) => (
              <div key={i} className={styles.insightRow}>
                <div className={styles.insightIcon} style={{ background: item.bg }}>{item.icon}</div>
                <div>
                  <div className={styles.insightVal}>{item.val}</div>
                  <div className={styles.insightSub}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
