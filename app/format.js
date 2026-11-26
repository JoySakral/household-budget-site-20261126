// format.js — number, money and date helpers for DompetKeluarga.
// Everything here is pure: no DOM, no storage, so the budget math in
// app.js can stay small and testable. All amounts are whole rupiah.

// Format a whole-rupiah amount as Indonesian currency, e.g. 1250000 -> "Rp1.250.000".
export function rupiah(amount) {
  const sign = amount < 0 ? '-' : '';
  const digits = String(Math.abs(Math.round(amount)));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return sign + 'Rp' + grouped;
}

// Short form for chart labels and tight cards: 1.250.000 -> "Rp1,25 jt".
export function rupiahShort(amount) {
  const abs = Math.abs(amount);
  if (abs >= 1000000000) return 'Rp' + trimZeros((amount / 1000000000).toFixed(2)) + ' M';
  if (abs >= 1000000) return 'Rp' + trimZeros((amount / 1000000).toFixed(2)) + ' jt';
  if (abs >= 1000) return 'Rp' + trimZeros((amount / 1000).toFixed(1)) + ' rb';
  return rupiah(amount);
}

function trimZeros(text) {
  return text.replace(/\.?0+$/, '');
}

// "2026-11-14" -> "14 Nov 2026" (Indonesian month abbreviations).
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' ' + MONTHS_SHORT[m - 1] + ' ' + y;
}

// "2026-11" -> "November 2026".
export function formatMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return MONTHS_LONG[m - 1] + ' ' + y;
}

// Month-key helpers ("2026-11") used by the month switcher and the report.

// Shift a month key by a number of months, e.g. shiftMonth("2026-11", -1) -> "2026-10".
export function shiftMonth(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

// Today's month key in local time, e.g. "2026-11".
export function currentMonthKey() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

// Today's date as an ISO date string for the transaction form's default value.
export function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

// Parse a user-typed amount ("1.250.000", "1250000", "Rp 1.250.000") into whole rupiah.
export function parseAmount(text) {
  if (typeof text === 'number') return Math.round(text);
  const cleaned = String(text).replace(/[^0-9-]/g, '');
  const value = parseInt(cleaned, 10);
  return Number.isFinite(value) ? value : 0;
}

// Clamp a percentage to 0..100 for progress bars.
export function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
