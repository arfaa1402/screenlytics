// src/utils/api.js
// Central API utility — all backend calls go through here

const BASE_URL = 'http://localhost:5000/api';

// ✅ Get token from localStorage
function getToken() {
  return localStorage.getItem('sl-token');
}

// ✅ Core fetch wrapper with auth headers
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({ message: 'Invalid response from server' }));

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('sl-token');
      localStorage.removeItem('sl-user');
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ─── AUTH ───────────────────────────────────────────────
export const authAPI = {
  register: (body) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── DASHBOARD ──────────────────────────────────────────
export const dashboardAPI = {
  getSummary: () => apiFetch('/dashboard/summary'),
};

// ─── LOGS ───────────────────────────────────────────────
export const logsAPI = {
  upsert: (body) =>
    apiFetch('/logs/upsert', { method: 'POST', body: JSON.stringify(body) }),

  getAll: () => apiFetch('/logs'),

  getAnalytics: () => apiFetch('/logs/analytics'),
};

// ─── PLANNER ────────────────────────────────────────────
export const plannerAPI = {
  getAll: () => apiFetch('/planner'),

  add: (body) =>
    apiFetch('/planner', { method: 'POST', body: JSON.stringify(body) }),

  toggle: (id) =>
    apiFetch(`/planner/${id}/toggle`, { method: 'PATCH' }),

  delete: (id) =>
    apiFetch(`/planner/${id}`, { method: 'DELETE' }),
};

// ─── PROFILE ────────────────────────────────────────────
export const profileAPI = {
  get: () => apiFetch('/profile'),

  update: (body) =>
    apiFetch('/profile', { method: 'PUT', body: JSON.stringify(body) }),

  changePassword: (body) =>
    apiFetch('/profile/password', { method: 'PUT', body: JSON.stringify(body) }),

  updateNotifications: (body) =>
    apiFetch('/profile/notifications', { method: 'PUT', body: JSON.stringify(body) }),

  exportData: () => apiFetch('/profile/export'),

  deleteAccount: () =>
    apiFetch('/profile', { method: 'DELETE' }),
};

// ─── AWARENESS ──────────────────────────────────────────
export const awarenessAPI = {
  getQuote: (score) => apiFetch(`/awareness/quote/${score}`),
};

// ─── CHATBOT & SCHEDULE ADVISOR ─────────────────────────
export const chatbotAPI = {
  sendMessage: (body) =>
    apiFetch('/chatbot/chat', { method: 'POST', body: JSON.stringify(body) }),

  getSessions: () =>
    apiFetch('/chatbot/sessions'),

  createSession: (body) =>
    apiFetch('/chatbot/sessions', { method: 'POST', body: JSON.stringify(body) }),

  getSessionMessages: (id) =>
    apiFetch(`/chatbot/sessions/${id}/messages`),

  deleteSession: (id) =>
    apiFetch(`/chatbot/sessions/${id}`, { method: 'DELETE' }),

  analyzeSchedule: (body) =>
    apiFetch('/chatbot/analyze', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── ACHIEVEMENTS & GAMIFICATION ────────────────────────
export const achievementsAPI = {
  getAll: () => apiFetch('/achievements'),
  evaluate: () => apiFetch('/achievements/evaluate', { method: 'POST' }),
};
