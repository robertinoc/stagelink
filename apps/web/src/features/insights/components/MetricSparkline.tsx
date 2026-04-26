'use client';

import { useMemo } from 'react';
import type { StageLinkInsightsHistoryPoint } from '@stagelink/types';

interface MetricSparklineProps {
  history: StageLinkInsightsHistoryPoint[];
  metricKey: string;
  /** Hex or rgb stroke color. Defaults to emerald-ish green. */
  strokeColor?: string;
  width?: number;
  height?: number;
}

/**
 * Lightweight SVG sparkline — no charting library.
 * Renders null when there are fewer than 2 valid data points.
 */
export function MetricSparkline({
  history,
  metricKey,
  strokeColor = '#4ade80',
  width = 80,
  height = 28,
}: MetricSparklineProps) {
  const points = useMemo(() => {
    return history
      .map((h) => {
        const v = h.metrics[metricKey];
        return typeof v === 'number' && Number.isFinite(v) ? v : null;
      })
      .filter((v): v is number => v !== null)
      .slice(-10);
  }, [history, metricKey]);

  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  // 2px vertical padding so the line doesn't clip at the edges
  const pad = 2;
  const innerH = height - pad * 2;

  const coords = points
    .map((v, i) => {
      const x = ((i / (points.length - 1)) * width).toFixed(1);
      const y = (height - pad - ((v - min) / range) * innerH).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 opacity-50"
      aria-hidden="true"
    >
      <polyline
        points={coords}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
