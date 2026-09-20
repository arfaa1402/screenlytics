import { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { chatbotAPI } from '../utils/api';
import styles from './ScheduleAdvisor.module.css';

const QUICK_PROMPTS = [
  "How can I improve my schedule today?",
  "I have exams next week. What should I change?",
  "Am I spending too much time on gaming?",
  "How can I manage college and coding practice?",
  "Can you create a better timetable for me?",
];

export default function ScheduleAdvisor() {
  const { user, tasks, logs, showToast } = useApp();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const messagesEndRef = useRef(null);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function fetchSessions() {
    try {
      const res = await chatbotAPI.getSessions();
      setSessions(res.sessions || []);
      if (res.sessions && res.sessions.length > 0) {
        loadSessionMessages(res.sessions[0]._id || res.sessions[0].id);
      } else {
        createNewSession();
      }
    } catch (err) {
      console.error('Fetch sessions error:', err.message);
    }
  }

  async function createNewSession() {
    try {
      const res = await chatbotAPI.createSession({ title: 'New Schedule Session' });
      const newSess = res.session;
      const sessId = newSess._id || newSess.id;
      setSessions(prev => [newSess, ...prev]);
      setCurrentSessionId(sessId);
      setMessages([{
        id: 'welcome',
        sender: 'ai',
        text: `Hello ${user?.firstName || 'Student'}! 👋 I am your AI Academic Planning Assistant.\n\nI can analyze your daily schedule, college timings, study blocks, and screen time to help you create a balanced, burnout-free timetable.\n\nAsk me anything or select one of the quick prompts below to get started!`,
      }]);
    } catch (err) {
      console.error('Create session error:', err.message);
    }
  }

  async function loadSessionMessages(sessionId) {
    try {
      setCurrentSessionId(sessionId);
      const res = await chatbotAPI.getSessionMessages(sessionId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Load session messages error:', err.message);
    }
  }

  async function deleteSession(e, sessionId) {
    e.stopPropagation();
    try {
      await chatbotAPI.deleteSession(sessionId);
      showToast('Session deleted');
      const updated = sessions.filter(s => (s._id || s.id) !== sessionId);
      setSessions(updated);
      if (updated.length > 0) {
        loadSessionMessages(updated[0]._id || updated[0].id);
      } else {
        createNewSession();
      }
    } catch (err) {
      showToast('Failed to delete session');
    }
  }

  async function handleSend(textToSend) {
    const query = textToSend || input;
    if (!query || !query.trim() || loading) return;

    const studentMsg = {
      id: Date.now().toString(),
      sender: 'student',
      text: query.trim(),
    };

    setMessages(prev => [...prev, studentMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await chatbotAPI.sendMessage({
        sessionId: currentSessionId,
        message: query.trim(),
      });

      if (res.sessionId && res.sessionId !== currentSessionId) {
        setCurrentSessionId(res.sessionId);
      }

      setMessages(prev => [...prev, res.aiMessage]);
      fetchSessions(); // Refresh list to update titles/timestamps
    } catch (err) {
      showToast(err.message || 'Failed to get AI response');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue connecting to the AI service. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAnalyze() {
    setAnalyzing(true);
    try {
      const prompt = "Please analyze my overall planner tasks and screen time logs, and give me a comprehensive schedule improvement plan with KEEP, CHANGE, ADD, REDUCE, and AVOID recommendations.";
      await handleSend(prompt);
    } finally {
      setAnalyzing(false);
    }
  }

  // Helper to render structured advice cards
  function renderAdviceCards(advice) {
    if (!advice) return null;
    const { keep, change, add, reduce, avoid, explanation } = advice;
    const hasAdvice = (keep?.length || change?.length || add?.length || reduce?.length || avoid?.length);

    if (!hasAdvice) return null;

    return (
      <div className={styles.adviceGrid}>
        {keep?.length > 0 && (
          <div className={`${styles.adviceCard} ${styles.keepCard}`}>
            <h4>✅ KEEP</h4>
            <ul>{keep.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        )}
        {change?.length > 0 && (
          <div className={`${styles.adviceCard} ${styles.changeCard}`}>
            <h4>🔄 CHANGE</h4>
            <ul>{change.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        )}
        {add?.length > 0 && (
          <div className={`${styles.adviceCard} ${styles.addCard}`}>
            <h4>➕ ADD</h4>
            <ul>{add.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        )}
        {reduce?.length > 0 && (
          <div className={`${styles.adviceCard} ${styles.reduceCard}`}>
            <h4>📉 REDUCE</h4>
            <ul>{reduce.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        )}
        {avoid?.length > 0 && (
          <div className={`${styles.adviceCard} ${styles.avoidCard}`}>
            <h4>⚠️ AVOID</h4>
            <ul>{avoid.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </div>
        )}
        {explanation && (
          <div className={styles.explanationBox}>
            💡 <strong>Advisor Note:</strong> {explanation}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🤖 AI Schedule Advisor</h1>
          <p className={styles.subtitle}>
            Intelligent academic planning and timetable recommendations powered by Gemini AI.
          </p>
        </div>
        <button
          className={styles.analyzeBtn}
          onClick={handleQuickAnalyze}
          disabled={loading || analyzing}
        >
          {analyzing ? 'Analyzing Schedule...' : '✨ Full Schedule Analysis'}
        </button>
      </div>

      <div className={styles.container}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <button className={styles.newSessBtn} onClick={createNewSession}>
            ➕ New Conversation
          </button>

          <div className={styles.sessList}>
            <h3 className={styles.sessTitle}>Saved Conversations</h3>
            {sessions.map(s => {
              const id = s._id || s.id;
              const isActive = id === currentSessionId;
              return (
                <div
                  key={id}
                  className={`${styles.sessItem} ${isActive ? styles.sessActive : ''}`}
                  onClick={() => loadSessionMessages(id)}
                >
                  <span className={styles.sessName}>💬 {s.title || 'Schedule Advice'}</span>
                  <button
                    className={styles.delSessBtn}
                    onClick={(e) => deleteSession(e, id)}
                    title="Delete session"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          <div className={styles.summaryBox}>
            <h4>📅 Schedule Context</h4>
            <div className={styles.summaryItem}>
              <span>Planner Tasks:</span>
              <strong>{tasks.length} active</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Screen Logs:</span>
              <strong>{logs.length} recorded</strong>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={styles.chatArea}>
          <div className={styles.messageList}>
            {messages.map((m, idx) => {
              const isUser = m.sender === 'student';
              return (
                <div key={m.id || idx} className={`${styles.messageWrap} ${isUser ? styles.userWrap : styles.aiWrap}`}>
                  <div className={styles.avatar}>
                    {isUser ? (user?.firstName?.[0] || 'U') : '🤖'}
                  </div>
                  <div className={styles.bubble}>
                    <div className={styles.senderLabel}>
                      {isUser ? 'You' : 'Academic Advisor'}
                    </div>
                    <div className={styles.messageText}>{m.text}</div>
                    {!isUser && m.advice && renderAdviceCards(m.advice)}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className={`${styles.messageWrap} ${styles.aiWrap}`}>
                <div className={styles.avatar}>🤖</div>
                <div className={styles.bubble}>
                  <div className={styles.typingIndicator}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className={styles.quickPrompts}>
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                className={styles.promptChip}
                onClick={() => handleSend(p)}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form className={styles.inputForm} onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <input
              type="text"
              className={styles.inputField}
              placeholder="Ask for schedule advice, study tips, or timetable revisions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!input.trim() || loading}
            >
              Send 🚀
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
