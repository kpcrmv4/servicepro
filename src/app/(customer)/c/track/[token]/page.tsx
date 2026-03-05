"use client"

import { use, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Phone,
  CheckCircle2,
  Loader2,
  Circle,
  Camera,
  AlertTriangle,
  Clock,
  MessageCircle,
} from "lucide-react"

const trackingSteps = [
  {
    label: "รับรถเข้าซ่อม",
    time: "14:30 น.",
    status: "completed" as const,
    detail: "รถเข้าอู่เรียบร้อย",
  },
  {
    label: "เริ่มซ่อม (ช่าง: สมชาย)",
    time: "15:00 น.",
    status: "completed" as const,
    detail: "เริ่มถอดล้อ เปลี่ยนผ้าเบรค",
  },
  {
    label: "กำลังซ่อม...",
    time: "",
    status: "current" as const,
    detail: "กำลังประกอบล้อหลัง",
  },
  {
    label: "ตรวจสอบคุณภาพ (QC)",
    time: "",
    status: "pending" as const,
    detail: "",
  },
  {
    label: "พร้อมรับรถ",
    time: "",
    status: "pending" as const,
    detail: "",
  },
]

const photos = [
  { id: 1, label: "ผ้าเบรคเก่า" },
  { id: 2, label: "ผ้าเบรคใหม่ (หน้า)" },
  { id: 3, label: "กำลังประกอบ" },
]

const additionalIssue = {
  title: "พบปัญหาเพิ่มเติม",
  description: "น้ำมันเบรคสีดำ ควรเปลี่ยนพร้อมกัน",
  estimatedCost: 350,
  approved: null as boolean | null,
}

export default function TrackJobPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [issue, setIssue] = useState(additionalIssue)

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <Link
          href="/c"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Link>
      </div>

      {/* Job Info */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted-foreground">JOB-2026-0142</span>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            กำลังซ่อม
          </span>
        </div>
        <h1 className="text-base font-semibold text-foreground">เปลี่ยนผ้าเบรคหน้า-หลัง</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Toyota Camry | กข 1234</p>
      </div>

      {/* Tracking Steps */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">สถานะการซ่อม</h2>
        <div className="space-y-0">
          {trackingSteps.map((step, index) => (
            <div key={index} className="relative pl-8 pb-5 last:pb-0">
              {/* Line */}
              {index < trackingSteps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[11px] top-6 bottom-0 w-0.5",
                    step.status === "completed" ? "bg-success" : "bg-border"
                  )}
                />
              )}
              {/* Icon */}
              <div className="absolute left-0 top-0.5">
                {step.status === "completed" && (
                  <CheckCircle2 className="h-6 w-6 text-success fill-success/10" />
                )}
                {step.status === "current" && (
                  <div className="relative">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                )}
                {step.status === "pending" && (
                  <Circle className="h-6 w-6 text-muted-foreground/40" />
                )}
              </div>
              {/* Content */}
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.status === "completed"
                      ? "text-foreground"
                      : step.status === "current"
                        ? "text-primary"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {step.time && (
                    <span className="text-xs text-muted-foreground">{step.time}</span>
                  )}
                  {step.detail && (
                    <span className="text-xs text-muted-foreground">{step.detail}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Thumbnails */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">รูปภาพจากช่าง</h2>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="aspect-square rounded-lg bg-muted flex flex-col items-center justify-center gap-1 border border-border">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground text-center px-1">
                {photo.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Issue Alert */}
      {issue.approved === null && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">{issue.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{issue.description}</p>
              <p className="text-sm font-medium text-foreground mt-1">
                ค่าใช้จ่ายเพิ่ม: ฿{issue.estimatedCost.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIssue({ ...issue, approved: true })}
              className="flex-1 py-2 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90 transition-colors"
            >
              อนุมัติ
            </button>
            <button
              onClick={() => setIssue({ ...issue, approved: false })}
              className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              ไม่อนุมัติ
            </button>
          </div>
        </div>
      )}

      {issue.approved !== null && (
        <div
          className={cn(
            "rounded-xl border p-3 text-sm text-center",
            issue.approved
              ? "border-success/30 bg-success/5 text-success"
              : "border-border bg-muted/30 text-muted-foreground"
          )}
        >
          {issue.approved
            ? "อนุมัติงานเพิ่มเติมแล้ว"
            : "ปฏิเสธงานเพิ่มเติมแล้ว"}
        </div>
      )}

      {/* Estimated Time */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 opacity-80" />
          <div>
            <p className="text-xs opacity-80">เวลาเสร็จโดยประมาณ</p>
            <p className="text-lg font-bold">ประมาณ 16:00 วันนี้</p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <Phone className="h-4 w-4" />
          โทรหาร้าน
        </button>
        <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <MessageCircle className="h-4 w-4" />
          แชท Line
        </button>
      </div>
    </div>
  )
}
