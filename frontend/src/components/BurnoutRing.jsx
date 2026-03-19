// src/components/BurnoutRing.js
// Animated SVG ring showing burnout score

import styles from './BurnoutRing.module.css';

const CIRCUMFERENCE = 2 * Math.PI * 62; // r=62

export default function BurnoutRing({ score, category }) {
  const offset = score > 0 ? CIRCUMFERENCE - (score / 10) * CIRCUMFERENCE : CIRCUMFERENCE;
  const strokeColor =
    category === 'Excess' ? 'var(--excess-c)' :
    category === 'Mid'    ? 'var(--mid-c)'    : 'var(--normal-c)';

  return (
    <div className={styles.wrap}>
      <svg viewBox="0 0 155 155" className={styles.svg}>
        <circle className={styles.bg}   cx="77.5" cy="77.5" r="62" />
        <circle
          className={styles.fill}
          cx="77.5" cy="77.5" r="62"
          style={{
            strokeDashoffset: offset,
            stroke: strokeColor,
          }}
        />
      </svg>
      <div className={styles.label}>
        {score > 0 ? (
          <>
            <span className={styles.num}>{score.toFixed(1)}</span>
            <span className={styles.denom}>/10</span>
          </>
        ) : (
          <span className={styles.num}>—</span>
        )}
      </div>
    </div>
  );
}
