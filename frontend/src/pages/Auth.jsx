// src/pages/Auth.jsx — connected to backend

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import styles from './Auth.module.css';

export default function Auth() {
  const [tab,     setTab]     = useState('login');
  const [regStep, setRegStep] = useState('form');
  const navigate = useNavigate();
  const { login, register, showToast, loading } = useApp();

  /* Login state */
  const [lEmail, setLEmail] = useState('');
  const [lPw,    setLPw]    = useState('');

  /* Register state */
  const [rFirst, setRFirst] = useState('');
  const [rLast,  setRLast]  = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPw,    setRPw]    = useState('');

  // ✅ Login — calls backend via AppContext
  async function handleLogin(e) {
    e.preventDefault();
    if (!lEmail.trim()) { showToast('Please enter your email'); return; }
    if (!lPw)           { showToast('Please enter your password'); return; }

    const result = await login({ email: lEmail.trim(), password: lPw });

    if (result.success) {
      showToast(`Welcome, ${result.firstName}! 🌟`);
      navigate('/dashboard');
    } else {
      showToast(result.message || 'Login failed');
    }
  }

  // ✅ Register — calls backend via AppContext
  async function handleRegister(e) {
    e.preventDefault();
    if (!rFirst.trim() || !rEmail.trim()) { showToast('Please fill required fields'); return; }
    if (rPw.length < 8) { showToast('Password must be at least 8 characters'); return; }

    const result = await register({
      firstName: rFirst.trim(),
      lastName:  rLast.trim(),
      email:     rEmail.trim(),
      password:  rPw,
    });

    if (result.success) {
      setRegStep('success');
      setTimeout(() => {
        setRFirst(''); setRLast(''); setRPw('');
        setLEmail(rEmail);
        setREmail('');
        setRegStep('form');
        setTab('login');
        showToast('Account created! Please sign in ✅');
      }, 2400);
    } else {
      showToast(result.message || 'Registration failed');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.logo} onClick={() => navigate('/')}>Screenlytics</span>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login'    ? styles.active : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {/* ── Login ── */}
        {tab === 'login' && (
          <form className={styles.form} onSubmit={handleLogin}>
            <h2>Welcome back</h2>
            <p className={styles.sub}>Sign in to your Screenlytics account</p>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@university.edu" value={lEmail} onChange={e => setLEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={lPw} onChange={e => setLPw(e.target.value)} />
            </div>
            <button type="submit" className="btn-full" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
            <p className={styles.switchLine}>
              No account?{' '}
              <span className={styles.switchLink} onClick={() => setTab('register')}>Register here</span>
            </p>
          </form>
        )}

        {/* ── Register ── */}
        {tab === 'register' && (
          regStep === 'form' ? (
            <form className={styles.form} onSubmit={handleRegister}>
              <h2>Create account</h2>
              <p className={styles.sub}>Join Screenlytics and take back your focus</p>
              <div className={styles.regFields}>
                <div className={styles.regRow}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" placeholder="Alex" value={rFirst} onChange={e => setRFirst(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" placeholder="Johnson" value={rLast} onChange={e => setRLast(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="you@university.edu" value={rEmail} onChange={e => setREmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Password <span className={styles.hint}>(min 8 characters)</span></label>
                  <input type="password" placeholder="Create a strong password" value={rPw} onChange={e => setRPw(e.target.value)} />
                </div>
                <button type="submit" className="btn-full" style={{ marginTop: 4 }} disabled={loading}>
                  {loading ? 'Creating…' : 'Create Account →'}
                </button>
              </div>
              <p className={styles.switchLine}>
                Already registered?{' '}
                <span className={styles.switchLink} onClick={() => setTab('login')}>Sign in</span>
              </p>
            </form>
          ) : (
            <div className={styles.success}>
              <div className={styles.successCircle}>✅</div>
              <h3>Account Created!</h3>
              <p>Your account is ready.<br />Redirecting to sign in…</p>
              <div className="spinner" />
            </div>
          )
        )}
      </div>
    </div>
  );
}
