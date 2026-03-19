// src/utils/date.js
// Date formatting and conversion helpers

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function isoToDMY(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d} / ${m} / ${y}`;
}

export function dmyToISO(dmy) {
  const parts = dmy.replace(/\s/g, '').split('/');
  if (parts.length !== 3 || parts[2].length < 4) return null;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

export function todayDMY() {
  return isoToDMY(todayISO());
}
