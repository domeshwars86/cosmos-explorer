/**
 * Client-side mirror of app/utils/formatting.py's compact_km — keeps large
 * distances readable in HUD/JS-rendered contexts that don't go through
 * Jinja (the server-rendered stat cards use the Python filter directly).
 */
export function compactKm(value) {
  if (value === null || value === undefined) return '—';
  const v = Number(value);
  if (Number.isNaN(v)) return String(value);
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs.toLocaleString()}`;
}

export function formatISTDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
  }).format(date);
  return `${formatted} IST`;
}

export function formatISTDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium',
  }).format(date)} IST`;
}

export function formatISTTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(date)} IST`;
}

export function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

export function safeHttpUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch (err) {
    return '';
  }
}
