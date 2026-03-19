// src/hooks/useApp.js
// Custom hook to consume global AppContext

import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
