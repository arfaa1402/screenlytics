// src/pages/LogTime.jsx — connected to backend

import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { calcBurnout } from '../utils/burnout';
import { todayDMY, dmyToISO } from '../utils/date';
import styles from './LogTime.module.css';

function fmtDateInput(val) {
  let v = val.replace(/\D/g, '').slice(0, 8);
  let o = '';
  if (v.length > 0) o += v.slice(0, 2);
  if (v.length > 2) o += ' / ' + v.slice(2, 4);
  if (v.length > 4) o += ' / ' + v.slice(4, 8);
  return o;
}

export default function LogTime() {
  const { logs, upsertLog, showToast } = useApp();

  const [date,    setDate]    = useState(todayDMY());
  const [studyH,  setStudyH]  = useState('');
  const [studyM,  setStudyM]  = useState('');
  const [socialH, setSocialH] = useState('');
  const [socialM, setSocialM] = useState('');
  const [entH,    setEntH]    = useState('');
  const [entM,    setEntM]    = useState('');
  const [otherH,  setOtherH]  = useState('');
  const [otherM,  setOtherM]  = useState('');
  const [result,  setResult]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  function nv(v) { return parseFloat(v) || 0; }

  // ✅ Submit — saves to backend via AppContext
  async function handleSubmit(e) {
    e.preventDefault();
    const isoDate = dmyToISO(date);
    if (!isoDate) { showToast('Please enter a valid date (DD / MM / YYYY)'); return; }

    const sm = nv(studyH)  * 60 + nv(studyM);
    const sc = nv(socialH) * 60 + nv(socialM);
    const em = nv(entH)    * 60 + nv(entM);
    const om = nv(otherH)  * 60 + nv(otherM);
    const total = sm + sc + em + om;
    if (!total) { showToast('Please enter at least one category'); return; }

    const { score, category } = calcBurnout(total, sc, em);
    const entry = {
      isoDate,
      displayDate: date,
      totalMins:   total,
      study:       sm,
      social:      sc,
      ent:         em,
      other:       om,
      score,
      category,
    };

    setSaving(true);
    const res = await upsertLog(entry);
    setSaving(false);

    if (res.success) {
      setResult({ score: res.score, category: res.category });
      showToast(`✅ Score updated: ${res.score}/10 — ${res.category}`);
    } else {
      showToast(res.message || 'Failed to save log');
    }
  }

  const catClass = result
    ? result.category === 'Excess' ? 'badge-excess'
    : result.category === 'Mid'    ? 'badge-mid' : 'badge-normal'
    : '';

  return (
    <div className={styles.page}>
      <div className="page-inner fade-in">
        <div className="page-header">
          <h1>Log Screen Time</h1>
          <p>Record your daily usage to recalculate your burnout score.</p>
        </div>

        <div className={styles.layout}>
          {/* Form */}
          <form className="card" onSubmit={handleSubmit}>
            <h2 className={styles.cardTitle}>📱 Manual Entry</h2>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label>Date (DD / MM / YYYY)</label>
              <input
                type="text"
                placeholder="DD / MM / YYYY"
                value={date}
                maxLength={14}
                inputMode="numeric"
                onChange={e => setDate(fmtDateInput(e.target.value))}
              />
            </div>

            <div className={styles.catLabel}>Breakdown by Category (hours · minutes)</div>
            <div className={styles.catGrid}>
              <CatField label="📚 Study / Class"  hVal={studyH}  mVal={studyM}  onH={setStudyH}  onM={setStudyM} />
              <CatField label="💬 Social Media"   hVal={socialH} mVal={socialM} onH={setSocialH} onM={setSocialM} />
              <CatField label="🎬 Entertainment"  hVal={entH}    mVal={entM}    onH={setEntH}    onM={setEntM} />
              <CatField label="🔧 Other"          hVal={otherH}  mVal={otherM}  onH={setOtherH}  onM={setOtherM} />
            </div>

            {result && (
              <div className={styles.resultBox}>
                <div className={styles.resultScore}>{result.score}/10</div>
                <span className={`badge ${catClass}`}>{result.category}</span>
                <div className={styles.resultSub}>Burnout score updated</div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={saving}>
              {saving ? 'Saving…' : 'Submit & Recalculate Score →'}
            </button>
          </form>

          {/* History */}
          <div className="card">
            <h2 className={styles.cardTitle}>📋 Recent Entries</h2>
            {logs.length === 0 ? (
              <p className={styles.empty}>No entries yet. Log your first day!</p>
            ) : (
              <div className={styles.histList}>
                {logs.slice(0, 10).map((l) => (
                  <div key={l.isoDate} className={styles.histItem}>
                    <div>
                      <div className={styles.histDate}>{l.displayDate}</div>
                      <div className={styles.histDetail}>
                        Study {(l.study / 60).toFixed(1)}h · Social {(l.social / 60).toFixed(1)}h
                      </div>
                    </div>
                    <div className={styles.histRight}>
                      <span className={styles.histHrs}>{(l.totalMins / 60).toFixed(1)}h</span>
                      <span className={`badge badge-${l.category.toLowerCase()}`}>{l.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatField({ label, hVal, mVal, onH, onM }) {
  return (
    <div className={styles.catField}>
      <label className={styles.catLbl}>{label}</label>
      <div className={styles.hmRow}>
        <input type="number" min="0" max="24" placeholder="hrs" value={hVal} onChange={e => onH(e.target.value)} />
        <input type="number" min="0" max="59" placeholder="min" value={mVal} onChange={e => onM(e.target.value)} />
      </div>
    </div>
  );
}
