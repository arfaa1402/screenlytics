import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

import Navbar         from './components/Navbar';
import Toast          from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import Landing   from './pages/Landing';
import Auth      from './pages/Auth';
import Dashboard from './pages/Dashboard';
import LogTime   from './pages/LogTime';
import Analytics from './pages/Analytics';
import Awareness from './pages/Awareness';
import Planner   from './pages/Planner';
import Profile   from './pages/Profile';

import './styles/globals.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />
        <Toast />
        <Routes>
          <Route path="/"          element={<Landing />} />
          <Route path="/auth"      element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/log-time"  element={<ProtectedRoute><LogTime /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/awareness" element={<ProtectedRoute><Awareness /></ProtectedRoute>} />
          <Route path="/planner"   element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
