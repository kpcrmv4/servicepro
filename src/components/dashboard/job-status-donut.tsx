'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  jobsByStatus: {
    pending?: number;
    in_progress?: number;
    quality_check?: number;
    waiting_pickup?: number;
    completed?: number;
    cancelled?: number;
  };
}

const SEGMENTS = [
  { key: 'pending', label: 'รอดำเนินการ', color: '#FBBF77' },
  { key: 'in_progress', label: 'กำลังซ่อม', color: '#7C5BFB' },
  { key: 'quality_check', label: 'ตรวจ QC', color: '#A78BFA' },
  { key: 'waiting_pickup', label: 'รอลูกค้ารับ', color: '#5BCBE5' },
  { key: 'completed', label: 'เสร็จแล้ว', color: '#7DD3A0' },
  { key: 'cancelled', label: 'ยกเลิก', color: '#FB7878' },
] as const;

export function JobStatusDonut({ jobsByStatus }: Props) {
  const data = SEGMENTS.map((s) => ({
    name: s.label,
    color: s.color,
    value: jobsByStatus[s.key] ?? 0,
  })).filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-3xl bg-card p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-base font-bold sm:text-lg">สถานะงานทั้งหมด</h2>

      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
        {/* Donut */}
        <div className="relative mx-auto h-44 w-44 sm:h-48 sm:w-48">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="68%"
                  outerRadius="95%"
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  cornerRadius={6}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-full border-8 border-muted text-xs text-muted-foreground">
              ยังไม่มีงาน
            </div>
          )}
          {total > 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold sm:text-3xl">{total}</span>
              <span className="text-[11px] text-muted-foreground">งานทั้งหมด</span>
            </div>
          )}
        </div>

        {/* Legend with bars */}
        <div className="space-y-2.5">
          {data.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">ยังไม่มีข้อมูล</p>
          ) : (
            data.map((d) => {
              const pct = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <div key={d.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span>{d.name}</span>
                    </span>
                    <span className="font-semibold">
                      {d.value} <span className="text-muted-foreground font-normal">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
