import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type Tone = "default" | "purple" | "pink" | "cyan" | "mint" | "amber" | "rose"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  /** Pastel background tone — picks bg + accent color together */
  tone?: Tone
  className?: string
}

const toneStyles: Record<Tone, { bg: string; iconBg: string; iconColor: string }> = {
  default: { bg: "bg-card", iconBg: "bg-muted", iconColor: "text-primary" },
  purple: {
    bg: "bg-pastel-purple",
    iconBg: "bg-white/60 dark:bg-black/30",
    iconColor: "text-[#7C5BFB] dark:text-[#9C84FF]",
  },
  pink: {
    bg: "bg-pastel-pink",
    iconBg: "bg-white/60 dark:bg-black/30",
    iconColor: "text-[#E84393] dark:text-[#FF7CAF]",
  },
  cyan: {
    bg: "bg-pastel-cyan",
    iconBg: "bg-white/60 dark:bg-black/30",
    iconColor: "text-[#0891B2] dark:text-[#5BCBE5]",
  },
  mint: {
    bg: "bg-pastel-mint",
    iconBg: "bg-white/60 dark:bg-black/30",
    iconColor: "text-[#059669] dark:text-[#7DD3A0]",
  },
  amber: {
    bg: "bg-pastel-amber",
    iconBg: "bg-white/60 dark:bg-black/30",
    iconColor: "text-[#D97706] dark:text-[#FBBF77]",
  },
  rose: {
    bg: "bg-pastel-rose",
    iconBg: "bg-white/60 dark:bg-black/30",
    iconColor: "text-[#DC2626] dark:text-[#FB7878]",
  },
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
  tone = "default",
  className,
}: StatCardProps) {
  const t = toneStyles[tone]
  return (
    <div
      className={cn(
        "rounded-2xl p-5 transition-shadow hover:shadow-md",
        tone === "default" ? "border border-border" : "",
        t.bg,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-2xl", t.iconBg, iconColor || t.iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{value}</p>
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              trend.isPositive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            )}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}
