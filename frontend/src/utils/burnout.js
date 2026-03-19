// src/utils/burnout.js
// Burnout score calculation logic

export function calcBurnout(totalMins, socialMins, entMins) {
  const h = totalMins / 60;
  let base;
  if      (h <= 2) base = h * 1.0;
  else if (h <= 4) base = 2 + (h - 2) * 1.2;
  else if (h <= 6) base = 4.4 + (h - 4) * 1.5;
  else if (h <= 8) base = 7.4 + (h - 6) * 1.0;
  else             base = 9.4 + (h - 8) * 0.3;

  const passive = (socialMins + entMins) / (totalMins || 1);
  const bonus   = passive > 0.6 ? 0.8 : passive > 0.4 ? 0.4 : 0;
  const score   = Math.round(Math.min(10, Math.max(1, base + bonus)) * 10) / 10;
  const category = score <= 3.5 ? 'Normal' : score <= 6.5 ? 'Mid' : 'Excess';
  return { score, category };
}
