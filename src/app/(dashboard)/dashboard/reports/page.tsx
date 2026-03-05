"use client"

import {
  DollarSign,
  Wrench,
  Package,
  Users,
  BarChart3,
  FileText,
  TrendingUp,
  Car,
  ClipboardCheck,
  ShoppingCart,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

const reportCards = [
  {
    title: "รายรับ-รายจ่าย",
    description: "สรุปรายรับ รายจ่าย กำไรขาดทุน แยกตามช่วงเวลา",
    icon: DollarSign,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "ประสิทธิภาพช่าง",
    description: "วิเคราะห์ผลงาน เวลาซ่อม คะแนน QC ของช่างแต่ละคน",
    icon: Wrench,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "ยอดขายอะไหล่",
    description: "สรุปยอดขายอะไหล่ สินค้าขายดี และสต็อกหมุนเวียน",
    icon: Package,
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    title: "ลูกค้า & CRM",
    description: "วิเคราะห์ลูกค้าใหม่ ลูกค้าประจำ และอัตราการกลับมา",
    icon: Users,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    title: "สถิติงานซ่อม",
    description: "สถิติจำนวนงาน ประเภทงาน และเวลาเฉลี่ยในการซ่อม",
    icon: BarChart3,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "รายงานภาษี",
    description: "สรุปภาษีซื้อ ภาษีขาย และรายงานสำหรับยื่นสรรพากร",
    icon: FileText,
    color: "text-error",
    bg: "bg-error/10",
  },
]

const quickStats = [
  {
    label: "รายรับเดือนนี้",
    value: 487500,
    icon: TrendingUp,
    color: "text-success",
    bars: [40, 55, 45, 60, 70, 65, 80, 75, 90, 85, 78, 95],
    barColor: "bg-success",
  },
  {
    label: "งานซ่อมเดือนนี้",
    value: 45,
    icon: Car,
    color: "text-primary",
    bars: [30, 45, 55, 40, 60, 50, 65, 70, 55, 75, 80, 85],
    barColor: "bg-primary",
    isCurrency: false,
  },
  {
    label: "คะแนน QC เฉลี่ย",
    value: 91.5,
    icon: ClipboardCheck,
    color: "text-info",
    bars: [85, 88, 90, 87, 92, 89, 93, 91, 94, 90, 92, 95],
    barColor: "bg-info",
    isCurrency: false,
    suffix: "%",
  },
  {
    label: "ยอดขายอะไหล่",
    value: 198500,
    icon: ShoppingCart,
    color: "text-warning",
    bars: [50, 40, 60, 55, 45, 70, 65, 75, 80, 60, 85, 90],
    barColor: "bg-warning",
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="รายงาน" />

      {/* Report Category Cards */}
      <div className="grid gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", card.bg)}>
                <Icon className={cn("h-6 w-6", card.color)} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-card-foreground">{card.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
              <button className="mt-4 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 group-hover:bg-primary group-hover:text-primary-foreground">
                ดูรายงาน
              </button>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="px-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">สถิติด่วน</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon
            const maxBar = Math.max(...stat.bars)
            return (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <p className="mt-1 text-xl font-bold text-card-foreground">
                  {stat.isCurrency === false
                    ? `${stat.value}${stat.suffix || ""}`
                    : formatCurrency(stat.value)}
                </p>
                {/* Sparkline bars */}
                <div className="mt-3 flex items-end gap-0.5">
                  {stat.bars.map((bar, i) => (
                    <div
                      key={i}
                      className={cn("flex-1 rounded-sm", stat.barColor, "opacity-70")}
                      style={{ height: `${(bar / maxBar) * 32}px` }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground text-right">12 เดือนล่าสุด</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
