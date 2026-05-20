// TrendPill math + helpers.

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendResult {
  direction: TrendDirection;
  percent: number;
  /** Display string like "↑ 28%" or "↓ 3.5%" or "±0%". */
  label: string;
}

export function computeTrend(value: number, prev: number): TrendResult {
  if (prev === 0) {
    if (value === 0) return { direction: 'flat', percent: 0, label: '±0%' };
    // From-zero growth is undefined as a % — display the absolute delta as +N
    return { direction: 'up', percent: 100, label: `↑ ${formatPctValue(100)}` };
  }
  const pct = ((value - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) return { direction: 'flat', percent: 0, label: '±0%' };
  const direction: TrendDirection = pct > 0 ? 'up' : 'down';
  const arrow = direction === 'up' ? '↑' : '↓';
  return {
    direction,
    percent: pct,
    label: `${arrow} ${formatPctValue(Math.abs(pct))}`,
  };
}

function formatPctValue(abs: number): string {
  // toFixed(0) once the magnitude is ≥10 — keeps numbers tight visually.
  if (abs >= 10) return `${Math.round(abs)}%`;
  return `${abs.toFixed(1)}%`;
}
