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
