'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  day: number;
  label: string;
  created: number;
  completed: number;
}

interface Props {
  data: DataPoint[];
}

const MONTH_NAMES_TH = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export function MonthlyJobsChart({ data }: Props) {
  const [tab, setTab] = useState<'created' | 'completed'>('created');
  const now = new Date();
  const monthLabel = `${MONTH_NAMES_TH[now.getMonth()]} ${now.getFullYear() + 543}`;

  const total = data.reduce((s, d) => s + d[tab], 0);
  const peak = data.reduce(
    (max, d) => (d[tab] > max.value ? { day: d.day, value: d[tab] } : max),
    { day: 1, value: 0 },
  );

  return (
    <div className="rounded-3xl bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold sm:text-lg">งานในเดือน {monthLabel}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            รวม {total} งาน · จุดสูงสุดวันที่ {peak.day} ({peak.value} งาน)
          </p>
        </div>

        {/* Pill toggle */}
        <div className="flex shrink-0 rounded-full bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab('created')}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              tab === 'created'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            งานใหม่
          </button>
          <button
            type="button"
            onClick={() => setTab('completed')}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              tab === 'completed'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            งานเสร็จ
          </button>
        </div>
      </div>

      <div className="mt-4 h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="jobs-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
              }}
              labelFormatter={(label) => `วันที่ ${label}`}
              formatter={((v: unknown) => [
                String(v),
                tab === 'created' ? 'งานใหม่' : 'งานเสร็จ',
              ]) as never}
            />
            <Area
              type="monotone"
              dataKey={tab}
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#jobs-grad)"
              dot={{ r: 0 }}
              activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
