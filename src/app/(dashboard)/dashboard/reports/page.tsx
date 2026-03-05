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
  Clock,
  Star,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

const reportCategories = [
  {
    title: "รายรับ-รายจ่าย",
    description: "สรุปรายรับรายจ่ายประจำเดือน/ไตรมาส/ปี พร้อมกราฟเปรียบเทียบ",
    icon: DollarSign,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "ประสิทธิภาพช่าง",
    description: "วิเคราะห์ผลงานช่างแต่ละคน ชั่วโมงทำงาน และคะแนน QC",
    icon: Wrench,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "ยอดขายอะไหล่",
    description: "สรุปยอดขายอะไหล่ สินค้าขายดี และสต็อกที่ต้องสั่งเพิ่ม",
    icon: Package,
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    title: "ลูกค้า & CRM",
    description: "วิเคราะห์ฐานลูกค้า อัตราการกลับมาใช้บริการ และความพึงพอใจ",
    icon: Users,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    title: "สถิติงานซ่อม",
    description: "จำนวนงาน ประเภทงาน เวลาเฉลี่ย และอัตราการแก้ไขงาน",
    icon: BarChart3,
    color: "text-purple-500",
    bg: "bg-purple-100",
  },
  {
    title: "รายงานภาษี",
    description: "รายงานภาษีซื้อ-ขาย สรุป VAT และเตรียมข้อมูลยื่นภาษี",
    icon: FileText,
    color: "text-error",
    bg: "bg-error/10",
  },
]

const quickStats = [
  {
    label: "รายรับสัปดาห์นี้",
    value: 128500,
    change: "+15.2%",
    isPositive: true,
    icon: TrendingUp,
    bars: [40, 65, 55, 80, 72, 90, 85],
  },
  {
    label: "งานซ่อมเสร็จ",
    value: 18,
    unit: "งาน",
    change: "+3 จากสัปดาห์ก่อน",
    isPositive: true,
    icon: Car,
    bars: [50, 70, 60, 45, 80, 65, 75],
  },
  {
    label: "เวลาซ่อมเฉลี่ย",
    value: 3.2,
    unit: "ชม.",
    change: "-0.5 ชม.",
    isPositive: true,
    icon: Clock,
    bars: [80, 70, 65, 60, 55, 50, 45],
  },
  {
    label: "คะแนนรีวิวเฉลี่ย",
    value: 4.7,
    unit: "/5",
    change: "+0.2",
    isPositive: true,
    icon: Star,
    bars: [75, 80, 78, 85, 88, 90, 92],
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="รายงาน" />

      {/* Report Categories Grid */}
      <div className="grid gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {reportCategories.map((report) => {
          const Icon = report.icon
          return (
            <div
              key={report.title}
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", report.bg)}>
                <Icon className={cn("h-6 w-6", report.color)} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-card-foreground">{report.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{report.description}</p>
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
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-card-foreground">
                    {typeof stat.value === "number" && stat.value > 1000
                      ? formatCurrency(stat.value)
                      : stat.value}
                  </span>
                  {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
                </div>
                <p className={cn(
                  "mt-1 text-xs",
                  stat.isPositive ? "text-success" : "text-error"
                )}>
                  {stat.change}
                </p>

                {/* Mini bar chart */}
                <div className="mt-3 flex items-end gap-1">
                  {stat.bars.map((height, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-t-sm",
                        i === stat.bars.length - 1 ? "bg-primary" : "bg-primary/30"
                      )}
                      style={{ height: `${height * 0.35}px` }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
