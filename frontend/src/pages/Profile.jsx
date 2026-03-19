// src/pages/Profile.jsx — connected to backend

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { profileAPI } from '../utils/api';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, updateUser, logout, logs, burnoutScore, showToast } = useApp();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName,  setLastName]  = useState(user?.lastName  || '');
  const [email,     setEmail]     = useState(user?.email     || '');

  const [curPw,  setCurPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');

  const [notif1, setNotif1] = useState(true);
  const [notif2, setNotif2] = useState(true);
  const [notif3, setNotif3] = useState(false);

  const [memberSince, setMemberSince] = useState(new Date().getFullYear());
  const [daysLogged,  setDaysLogged]  = useState(logs.length);

  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = user ? (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase() : '??';

  // ✅ Load profile data from backend on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await profileAPI.get();
        if (data.user) {
          setFirstName(data.user.firstName);
          setLastName(data.user.lastName);
          setEmail(data.user.email);
          setMemberSince(data.user.memberSince);
        }
        if (data.stats) {
          setDaysLogged(data.stats.daysLogged);
        }
        if (data.notifications) {
          setNotif1(data.notifications.dailyReminders);
          setNotif2(data.notifications.burnoutAlerts);
          setNotif3(data.notifications.weeklyReport);
        }
      } catch (err) {
        console.error('Load profile error:', err.message);
      }
    }
    loadProfile();
  }, []);

  // ✅ Save profile — calls backend
  async function saveProfile(e) {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) { showToast('Please fill required fields'); return; }

    setSavingProfile(true);
    try {
      const data = await profileAPI.update({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
      });
      updateUser(data.user);
      showToast('Profile updated! ✅');
    } catch (err) {
      showToast(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  // ✅ Change password — calls backend
  async function changePassword(e) {
    e.preventDefault();
    if (!curPw || !newPw)  { showToast('Please fill all password fields'); return; }
    if (newPw !== confPw)  { showToast('Passwords do not match'); return; }
    if (newPw.length < 8)  { showToast('Password must be at least 8 characters'); return; }

    setSavingPassword(true);
    try {
      await profileAPI.changePassword({
        currentPassword: curPw,
        newPassword:     newPw,
        confirmPassword: confPw,
      });
      setCurPw(''); setNewPw(''); setConfPw('');
      showToast('Password updated! ✅');
    } catch (err) {
      showToast(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  }

  // ✅ Save notification settings — calls backend
  async function handleNotifToggle(which) {
    const updated = {
      dailyReminders: which === 1 ? !notif1 : notif1,
      burnoutAlerts:  which === 2 ? !notif2 : notif2,
      weeklyReport:   which === 3 ? !notif3 : notif3,
    };
    if (which === 1) setNotif1(v => !v);
    if (which === 2) setNotif2(v => !v);
    if (which === 3) setNotif3(v => !v);

    try {
      await profileAPI.updateNotifications(updated);
    } catch (err) {
      console.error('Notification save error:', err.message);
    }
  }

  // ✅ Export data — calls backend
  async function handleExport() {
    try {
      const data = await profileAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'screenlytics_data.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully! ✅');
    } catch (err) {
      showToast(err.message || 'Export failed');
    }
  }

  // ✅ Delete account — calls backend
  async function handleDeleteAccount() {
    const confirmed = window.confirm('Are you sure? This will permanently delete your account and all data.');
    if (!confirmed) return;
    try {
      await profileAPI.deleteAccount();
      logout();
      showToast('Account deleted');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Failed to delete account');
    }
  }

  // ✅ Logout
  function handleLogout() {
    logout();
    showToast('Signed out successfully');
    navigate('/');
  }

  return (
    <div className={styles.page}>
      <div className="page-inner fade-in">
        <div className="page-header">
          <h1>Profile & Settings</h1>
          <p>Manage your account and preferences.</p>
        </div>

        <div className={styles.layout}>
          {/* Left sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.name}>{user?.firstName} {user?.lastName}</div>
            <div className={styles.emailDisp}>{user?.email}</div>

            <div className={styles.statRow}><span className={styles.statLbl}>Burnout Score</span><span className={styles.statVal}>{burnoutScore > 0 ? `${burnoutScore}/10` : '—'}</span></div>
            <div className={styles.statRow}><span className={styles.statLbl}>Days Logged</span><span className={styles.statVal}>{daysLogged}</span></div>
            <div className={styles.statRow}><span className={styles.statLbl}>Member Since</span><span className={styles.statVal}>{memberSince}</span></div>

            <button className="btn-logout" onClick={handleLogout}>🚪 Sign Out</button>
          </div>

          {/* Right content */}
          <div className={styles.content}>
            {/* Personal info */}
            <form className="card" onSubmit={saveProfile}>
              <div className={styles.secLabel}>Personal Information</div>
              <div className={styles.nameRow}>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary btn-sm" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </form>

            {/* Change password */}
            <form className="card" onSubmit={changePassword}>
              <div className={styles.secLabel}>Change Password</div>
              <div className={styles.pwFields}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" placeholder="••••••••" value={curPw} onChange={e => setCurPw(e.target.value)} />
                </div>
                <div className={styles.pwRow}>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="New" value={newPw} onChange={e => setNewPw(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Confirm</label>
                    <input type="password" placeholder="Confirm" value={confPw} onChange={e => setConfPw(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn-primary btn-sm" disabled={savingPassword}>
                  {savingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>

            {/* Notifications */}
            <div className="card">
              <div className={styles.secLabel}>Notifications</div>
              <SettingRow label="Daily Reminders" desc="Remind me to log each evening" on={notif1} onToggle={() => handleNotifToggle(1)} />
              <SettingRow label="Burnout Alerts"  desc="Alert when score reaches 7+"   on={notif2} onToggle={() => handleNotifToggle(2)} />
              <SettingRow label="Weekly Report"   desc="Email summary each Sunday"     on={notif3} onToggle={() => handleNotifToggle(3)} last />
            </div>

            {/* Danger zone */}
            <div className={styles.dangerZone}>
              <h3>⚠️ Danger Zone</h3>
              <p>These actions are permanent.</p>
              <div className={styles.dangerBtns}>
                <button className="btn-danger btn-sm" onClick={handleExport}>Export My Data</button>
                <button className="btn-danger btn-sm" onClick={handleDeleteAccount}>Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, on, onToggle, last }) {
  return (
    <div className={`${styles.settRow} ${last ? styles.settLast : ''}`}>
      <div>
        <div className={styles.settLbl}>{label}</div>
        <div className={styles.settDesc}>{desc}</div>
      </div>
      <button className={`toggle ${on ? 'on' : ''}`} onClick={onToggle} type="button" />
    </div>
  );
}
