'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatShortDate } from '../../lib/format';

export interface BigSparklinePoint {
  /** ISO date string. */
  date: string;
  value: number;
  /** Optional comparison-period value for the same relative day. */
  prevValue?: number;
}

interface BigSparklineProps {
  data: BigSparklinePoint[];
  color?: string;
  height?: number;
  /** Render axis gridlines (3 horizontal lines at 25/50/75%). */
  showAxis?: boolean;
  locale?: 'es' | 'en';
  /** Accessibility title for the chart container (used by SR). */
  ariaLabel?: string;
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ payload: BigSparklinePoint }>;
}

function ChartTooltip({ active, payload, locale }: TooltipPayload & { locale: 'es' | 'en' }) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  if (!first) return null;
  const p = first.payload;
  const diff = p.prevValue != null ? p.value - p.prevValue : null;
  const diffLabel =
    diff == null
      ? null
      : diff === 0
        ? '±0'
        : `${diff > 0 ? '+' : ''}${diff.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}`;
  return (
    <div className="rounded-[10px] border border-white/10 bg-[#130D2B]/95 px-3 py-2 shadow-xl backdrop-blur">
      <div className="font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[1px] text-white/40">
        {formatShortDate(p.date, locale)}
      </div>
      <div className="mt-1 font-[family-name:var(--font-heading)] text-[18px] font-bold text-white">
        {p.value.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}
      </div>
      {diffLabel && (
        <div
          className={
            diff && diff > 0
              ? 'text-[11px] font-semibold text-[#4ADE80]'
              : diff && diff < 0
                ? 'text-[11px] font-semibold text-[#FF6B6B]'
                : 'text-[11px] font-semibold text-white/50'
          }
        >
          {diffLabel}{' '}
          <span className="text-white/40">{locale === 'es' ? 'vs anterior' : 'vs prior'}</span>
        </div>
      )}
    </div>
  );
}

export function BigSparkline({
  data,
  color = '#E040FB',
  height = 180,
  showAxis = false,
  locale = 'es',
  ariaLabel,
}: BigSparklineProps) {
  if (!data.length) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-[12px] text-white/40"
        role="img"
        aria-label={ariaLabel ?? 'No data'}
      >
        {locale === 'es' ? 'Sin datos' : 'No data'}
      </div>
    );
  }
  const gradId = `big-${color.replace('#', '')}`;
  const lastPoint = data[data.length - 1];
  if (!lastPoint) return null;
  return (
    <div style={{ width: '100%', height }} role="img" aria-label={ariaLabel ?? 'Trend chart'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxis && (
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="0"
              horizontalPoints={[height * 0.25, height * 0.5, height * 0.75]}
            />
          )}
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1 }}
            content={(props) => (
              <ChartTooltip
                active={props.active ?? undefined}
                payload={
                  props.payload as unknown as Array<{ payload: BigSparklinePoint }> | undefined
                }
                locale={locale}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={lastPoint.date}
            y={lastPoint.value}
            r={4}
            fill={color}
            stroke="#0D0A1A"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
