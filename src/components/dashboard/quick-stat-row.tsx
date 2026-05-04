import type { LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  /** background color of the icon circle + tile bg accent */
  tone: 'mint' | 'cyan' | 'amber' | 'pink' | 'purple';
}

const TONE_CLASSES: Record<Stat['tone'], { bg: string; iconBg: string; iconText: string }> = {
  mint: {
    bg: 'bg-pastel-mint',
    iconBg: 'bg-white/70 dark:bg-black/30',
    iconText: 'text-emerald-600 dark:text-emerald-300',
  },
  cyan: {
    bg: 'bg-pastel-cyan',
    iconBg: 'bg-white/70 dark:bg-black/30',
    iconText: 'text-cyan-600 dark:text-cyan-300',
  },
  amber: {
    bg: 'bg-pastel-amber',
    iconBg: 'bg-white/70 dark:bg-black/30',
    iconText: 'text-amber-600 dark:text-amber-300',
  },
  pink: {
    bg: 'bg-pastel-pink',
    iconBg: 'bg-white/70 dark:bg-black/30',
    iconText: 'text-pink-600 dark:text-pink-300',
  },
  purple: {
    bg: 'bg-pastel-purple',
    iconBg: 'bg-white/70 dark:bg-black/30',
    iconText: 'text-violet-600 dark:text-violet-300',
  },
};

interface Props {
  stats: Stat[];
}

export function QuickStatRow({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((s) => {
        const Icon = s.icon;
        const t = TONE_CLASSES[s.tone];
        return (
          <div
            key={s.label}
            className={`flex items-center gap-3 rounded-2xl p-4 ${t.bg}`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${t.iconBg} ${t.iconText}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold leading-tight sm:text-xl">{s.value}</p>
              {s.hint && (
                <p className="text-[11px] text-muted-foreground">{s.hint}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
