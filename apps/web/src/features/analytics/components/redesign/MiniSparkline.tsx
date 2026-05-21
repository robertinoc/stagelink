'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniSparkline({ data, color = '#E040FB', height = 28 }: MiniSparklineProps) {
  if (!data.length) {
    return <div style={{ height }} aria-hidden="true" />;
  }
  const series = data.map((v, i) => ({ i, v }));
  const gradId = `mini-${color.replace('#', '')}`;
  return (
    <div style={{ width: '100%', height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
