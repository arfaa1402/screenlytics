// src/pages/Planner.jsx — connected to backend

import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { todayDMY, dmyToISO } from '../utils/date';
import styles from './Planner.module.css';

const TYPE_META = {
  study:    { label: '📚 Study',    color: '#a78bfa' },
  exercise: { label: '🏃 Exercise', color: '#e8a44a' },
  break:    { label: '☀️ Break',    color: '#7a9e6e' },
  nophone:  { label: '📵 No Phone', color: '#c8622a' },
};

function fmtDateInput(val) {
  let v = val.replace(/\D/g, '').slice(0, 8);
  let o = '';
  if (v.length > 0) o += v.slice(0, 2);
  if (v.length > 2) o += ' / ' + v.slice(2, 4);
  if (v.length > 4) o += ' / ' + v.slice(4, 8);
  return o;
}

function timeToMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minsToTime(m) {
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export default function Planner() {
  const { tasks, addTask, deleteTask, toggleTask, showToast } = useApp();

  const [selType,  setSelType]  = useState('study');
  const [title,    setTitle]    = useState('');
  const [date,     setDate]     = useState(todayDMY());
  const [time,     setTime]     = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [saving,   setSaving]   = useState(false);

  // ✅ Add task — calls backend via AppContext
  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) { showToast('Please enter a task title'); return; }
    const isoDate = dmyToISO(date);
    if (!isoDate) { showToast('Please enter a valid date (DD / MM / YYYY)'); return; }

    setSaving(true);
    const res = await addTask({
      title:       title.trim(),
      type:        selType,
      isoDate,
      displayDate: date,
      time,
      duration:    +duration,
    });
    setSaving(false);

    if (res.success) {
      setTitle('');
      showToast('Task added to schedule!');
    } else {
      showToast(res.message || 'Failed to add task');
    }
  }

  // ✅ Delete task — calls backend via AppContext
  async function handleDelete(id) {
    const res = await deleteTask(id);
    if (res.success) showToast('Task removed');
    else showToast(res.message || 'Failed to delete task');
  }

  // ✅ Toggle task — calls backend via AppContext
  async function handleToggle(id) {
    const res = await toggleTask(id);
    if (!res.success) showToast(res.message || 'Failed to update task');
  }

  // Group tasks by date
  const grouped = {};
  [...tasks]
    .sort((a, b) => a.isoDate !== b.isoDate ? a.isoDate.localeCompare(b.isoDate) : a.time.localeCompare(b.time))
    .forEach(t => {
      if (!grouped[t.isoDate]) grouped[t.isoDate] = [];
      grouped[t.isoDate].push(t);
    });

  return (
    <div className={styles.page}>
      <div className="page-inner fade-in">
        <div className="page-header">
          <h1>Schedule Planner</h1>
          <p>Add tasks and see them reflected in your schedule instantly.</p>
        </div>

        <div className={styles.layout}>
          {/* Add task form */}
          <form className={styles.addCard} onSubmit={handleAdd}>
            <h2 className={styles.cardTitle}>+ Add Task</h2>

            <div className={styles.typeGrid}>
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.typeBtn} ${selType === key ? styles.typeSel : ''}`}
                  onClick={() => setSelType(key)}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            <div className={styles.fields}>
              <div className="form-group">
                <label>Task Title</label>
                <input type="text" placeholder="e.g. Physics revision" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
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
              <div className={styles.timeRow}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className={styles.timeInput} />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)} className={styles.selectInput}>
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hrs</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? 'Adding…' : 'Add to Schedule'}
              </button>
            </div>
          </form>

          {/* Schedule view */}
          <div className={styles.scheduleCard}>
            <h2 className={styles.cardTitle}>📅 Your Schedule</h2>
            {tasks.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📋</div>
                <p className={styles.emptyTitle}>No tasks yet</p>
                <p className={styles.emptyHint}>Add a task on the left to see it here.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([iso, dayTasks]) => {
                const [y, m, d] = iso.split('-');
                const dateStr = new Date(+y, +m - 1, +d).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                });
                return (
                  <div key={iso} className={styles.dayGroup}>
                    <div className={styles.dayLabel}>{dateStr}</div>
                    {dayTasks.map(t => {
                      const meta    = TYPE_META[t.type];
                      const endTime = minsToTime(timeToMins(t.time) + t.duration);
                      return (
                        <div key={t.id} className={`${styles.taskItem} ${t.done ? styles.done : ''}`}>
                          <span className={styles.typeDot} style={{ background: meta.color }} />
                          <div className={styles.taskInfo}>
                            <div className={styles.taskTitle}>{t.title}</div>
                            <div className={styles.taskMeta}>{meta.label} · {t.time} – {endTime} · {t.duration} min</div>
                          </div>
                          <button className={styles.btnDone} onClick={() => handleToggle(t.id)}>
                            {t.done ? '↩ Undo' : '✓ Done'}
                          </button>
                          <button className={styles.btnDelete} onClick={() => handleDelete(t.id)}>×</button>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
