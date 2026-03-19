// src/components/ProtectedRoute.js
// Redirects to /auth if not logged in

import { Navigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';

export default function ProtectedRoute({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
