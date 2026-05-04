import { TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  greeting: string;
  shopName: string | null;
  monthlyRevenue: number;
  monthlyJobsCount: number;
  trendPercent: number; // positive or negative %
  initials: string;
}

const MONTH_NAMES_TH = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export function HeroCard({
  greeting,
  shopName,
  monthlyRevenue,
  monthlyJobsCount,
  trendPercent,
  initials,
}: Props) {
  const now = new Date();
  const monthLabel = `${MONTH_NAMES_TH[now.getMonth()]} ${now.getFullYear() + 543}`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C5BFB] via-[#9C84FF] to-[#B5A2FF] p-5 text-white shadow-xl shadow-primary/20 sm:p-6">
      {/* decorative blob */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-12 h-32 w-32 rounded-full bg-pink-300/20 blur-2xl" />

      {/* top row */}
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur-md">
            {initials}
          </div>
          <div>
            <p className="text-xs text-white/80">{greeting}</p>
            <p className="text-sm font-semibold">{shopName || 'KPServicePro'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-md">
          <Calendar className="h-3 w-3" />
          {monthLabel}
        </div>
      </div>

      {/* main metric */}
      <div className="relative mt-5">
        <p className="text-xs text-white/80">รายรับเดือนนี้</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-3xl font-bold sm:text-4xl">{formatCurrency(monthlyRevenue)}</p>
          {trendPercent !== 0 && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                trendPercent > 0
                  ? 'bg-emerald-400/20 text-emerald-100'
                  : 'bg-red-400/20 text-red-100'
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 ${trendPercent < 0 ? 'rotate-180' : ''}`}
              />
              {trendPercent > 0 ? '+' : ''}
              {trendPercent.toFixed(0)}%
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-white/80">
          {monthlyJobsCount} งานเดือนนี้
        </p>
      </div>
    </div>
  );
}
