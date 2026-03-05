"use client"

import { useState } from "react"
import {
  Building2,
  Clock,
  Wrench,
  Hash,
  Bell,
  CreditCard,
  Upload,
  Save,
  Check,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

type SettingsSection = "shop" | "hours" | "labor" | "document" | "notification" | "plan"

const sections: { key: SettingsSection; label: string; icon: React.ElementType }[] = [
  { key: "shop", label: "ข้อมูลอู่", icon: Building2 },
  { key: "hours", label: "เวลาทำงาน", icon: Clock },
  { key: "labor", label: "ค่าแรงมาตรฐาน", icon: Wrench },
  { key: "document", label: "เลขที่เอกสาร", icon: Hash },
  { key: "notification", label: "การแจ้งเตือน", icon: Bell },
  { key: "plan", label: "แผนและการชำระเงิน", icon: CreditCard },
]

const workingHours = [
  { day: "จันทร์", open: "08:30", close: "18:00", isOpen: true },
  { day: "อังคาร", open: "08:30", close: "18:00", isOpen: true },
  { day: "พุธ", open: "08:30", close: "18:00", isOpen: true },
  { day: "พฤหัสบดี", open: "08:30", close: "18:00", isOpen: true },
  { day: "ศุกร์", open: "08:30", close: "18:00", isOpen: true },
  { day: "เสาร์", open: "09:00", close: "16:00", isOpen: true },
  { day: "อาทิตย์", open: "09:00", close: "14:00", isOpen: false },
]

const laborRates = [
  { id: "L01", name: "เปลี่ยนถ่ายน้ำมันเครื่อง", rate: 300 },
  { id: "L02", name: "เปลี่ยนผ้าเบรก (ต่อล้อ)", rate: 400 },
  { id: "L03", name: "ตั้งศูนย์ถ่วงล้อ", rate: 500 },
  { id: "L04", name: "เปลี่ยนสายพานไทม์มิ่ง", rate: 2500 },
  { id: "L05", name: "ซ่อมเครื่องยนต์ (ต่อชม.)", rate: 800 },
  { id: "L06", name: "ซ่อมระบบแอร์", rate: 1500 },
  { id: "L07", name: "เปลี่ยนโช้คอัพ (ต่อคู่)", rate: 800 },
  { id: "L08", name: "ซ่อมระบบไฟฟ้า (ต่อชม.)", rate: 600 },
]

const documentFormats = [
  { label: "ใบเสนอราคา", prefix: "QT", format: "QT-{YYYY}-{NNNN}", current: "QT-2026-0048" },
  { label: "ใบสั่งงาน", prefix: "JOB", format: "JOB-{YYYY}-{NNNN}", current: "JOB-2026-0152" },
  { label: "ใบแจ้งหนี้", prefix: "INV", format: "INV-{YYYY}-{NNNN}", current: "INV-2026-0045" },
  { label: "ใบเสร็จรับเงิน", prefix: "REC", format: "REC-{YYYY}-{NNNN}", current: "REC-2026-0032" },
]

const notifications = [
  { id: "n1", label: "แจ้งเตือนงานใหม่", description: "เมื่อมีงานซ่อมเข้ามาใหม่", enabled: true },
  { id: "n2", label: "แจ้งเตือนงานเสร็จ", description: "เมื่อช่างซ่อมงานเสร็จ", enabled: true },
  { id: "n3", label: "แจ้งเตือนสต็อกใกล้หมด", description: "เมื่ออะไหล่ถึงจุดสั่งซื้อ", enabled: true },
  { id: "n4", label: "แจ้งเตือนใบแจ้งหนี้ค้าง", description: "เมื่อใบแจ้งหนี้เกินกำหนดชำระ", enabled: false },
  { id: "n5", label: "แจ้งเตือนประกันหมดอายุ", description: "แจ้งเตือนลูกค้าก่อนประกันหมดอายุ 30 วัน", enabled: true },
  { id: "n6", label: "สรุปรายวัน", description: "ส่งสรุปยอดรายรับ-รายจ่ายประจำวัน", enabled: false },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("shop")
  const [notifState, setNotifState] = useState<Record<string, boolean>>(
    Object.fromEntries(notifications.map((n) => [n.id, n.enabled]))
  )

  return (
    <div className="space-y-0">
      <PageHeader title="ตั้งค่า" />

      <div className="flex flex-col gap-6 p-6 lg:flex-row">
        {/* Left: Settings Menu */}
        <nav className="w-full shrink-0 lg:w-56">
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeSection === section.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {section.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Right: Content */}
        <div className="flex-1">
          {/* ข้อมูลอู่ */}
          {activeSection === "shop" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground">ข้อมูลอู่</h2>
              <p className="mt-1 text-sm text-muted-foreground">ข้อมูลพื้นฐานของอู่ซ่อมรถ</p>

              <div className="mt-6 space-y-5">
                {/* Logo */}
                <div>
                  <label className="text-sm font-medium text-card-foreground">โลโก้</label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
                      <Upload className="h-6 w-6" />
                    </div>
                    <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                      อัปโหลดรูป
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-card-foreground">ชื่ออู่</label>
                    <input
                      type="text"
                      defaultValue="เซอร์วิสโปร ออโต้เซอร์วิส"
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      type="text"
                      defaultValue="0-1234-56789-01-2"
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-card-foreground">ที่อยู่</label>
                  <textarea
                    defaultValue="123/45 ถ.สุขุมวิท แขวงบางจาก เขตพระโขนง กรุงเทพฯ 10260"
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-card-foreground">เบอร์โทร</label>
                    <input
                      type="text"
                      defaultValue="02-123-4567"
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground">อีเมล</label>
                    <input
                      type="email"
                      defaultValue="info@servicepro.co.th"
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-card-foreground">บัญชีธนาคาร</label>
                  <div className="mt-1.5 grid gap-4 sm:grid-cols-3">
                    <input
                      type="text"
                      defaultValue="กสิกรไทย"
                      placeholder="ธนาคาร"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      defaultValue="123-4-56789-0"
                      placeholder="เลขบัญชี"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      defaultValue="บจ. เซอร์วิสโปร ออโต้"
                      placeholder="ชื่อบัญชี"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Save className="h-4 w-4" /> บันทึก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* เวลาทำงาน */}
          {activeSection === "hours" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground">เวลาทำงาน</h2>
              <p className="mt-1 text-sm text-muted-foreground">กำหนดเวลาเปิด-ปิดทำการของอู่</p>

              <div className="mt-6 space-y-3">
                {workingHours.map((wh) => (
                  <div
                    key={wh.day}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border border-border p-3",
                      !wh.isOpen && "opacity-50"
                    )}
                  >
                    <div className="w-24 text-sm font-medium text-card-foreground">{wh.day}</div>
                    <label className="flex items-center gap-2">
                      <div className={cn(
                        "relative h-5 w-9 rounded-full transition-colors cursor-pointer",
                        wh.isOpen ? "bg-primary" : "bg-muted"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          wh.isOpen ? "translate-x-4" : "translate-x-0.5"
                        )} />
                      </div>
                      <span className="text-xs text-muted-foreground">{wh.isOpen ? "เปิด" : "ปิด"}</span>
                    </label>
                    {wh.isOpen && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          defaultValue={wh.open}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">ถึง</span>
                        <input
                          type="time"
                          defaultValue={wh.close}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Save className="h-4 w-4" /> บันทึก
                </button>
              </div>
            </div>
          )}

          {/* ค่าแรงมาตรฐาน */}
          {activeSection === "labor" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground">ค่าแรงมาตรฐาน</h2>
              <p className="mt-1 text-sm text-muted-foreground">กำหนดอัตราค่าแรงสำหรับงานแต่ละประเภท</p>

              <div className="mt-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">รายการ</th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">ค่าแรง (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laborRates.map((rate) => (
                      <tr key={rate.id} className="border-b border-border last:border-0">
                        <td className="py-3 text-sm text-card-foreground">{rate.name}</td>
                        <td className="py-3 text-right">
                          <input
                            type="number"
                            defaultValue={rate.rate}
                            className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Save className="h-4 w-4" /> บันทึก
                </button>
              </div>
            </div>
          )}

          {/* เลขที่เอกสาร */}
          {activeSection === "document" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground">เลขที่เอกสาร</h2>
              <p className="mt-1 text-sm text-muted-foreground">กำหนดรูปแบบเลขที่เอกสารอัตโนมัติ</p>

              <div className="mt-6 space-y-4">
                {documentFormats.map((doc) => (
                  <div key={doc.prefix} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-card-foreground">{doc.label}</h3>
                      <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-mono text-muted-foreground">
                        ล่าสุด: {doc.current}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Prefix</label>
                        <input
                          type="text"
                          defaultValue={doc.prefix}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">รูปแบบ</label>
                        <input
                          type="text"
                          defaultValue={doc.format}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Save className="h-4 w-4" /> บันทึก
                </button>
              </div>
            </div>
          )}

          {/* การแจ้งเตือน */}
          {activeSection === "notification" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground">การแจ้งเตือน</h2>
              <p className="mt-1 text-sm text-muted-foreground">ตั้งค่าการแจ้งเตือนต่างๆ ของระบบ</p>

              <div className="mt-6 space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <h3 className="text-sm font-medium text-card-foreground">{notif.label}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{notif.description}</p>
                    </div>
                    <button
                      onClick={() => setNotifState((prev) => ({ ...prev, [notif.id]: !prev[notif.id] }))}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        notifState[notif.id] ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        notifState[notif.id] ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Save className="h-4 w-4" /> บันทึก
                </button>
              </div>
            </div>
          )}

          {/* แผนและการชำระเงิน */}
          {activeSection === "plan" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-card-foreground">แผนปัจจุบัน</h2>
                <p className="mt-1 text-sm text-muted-foreground">รายละเอียดแผนการใช้งานและการชำระเงิน</p>

                <div className="mt-6 rounded-xl border-2 border-primary bg-primary/5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                          PRO
                        </span>
                        <h3 className="text-lg font-bold text-card-foreground">แผน Professional</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">เหมาะสำหรับอู่ขนาดกลาง 5-15 ช่าง</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-card-foreground">{formatCurrency(1990)}<span className="text-sm font-normal text-muted-foreground">/เดือน</span></p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    {[
                      "ผู้ใช้ไม่จำกัด",
                      "เก็บข้อมูล 50 GB",
                      "รายงานขั้นสูง",
                      "การแจ้งเตือนอัตโนมัติ",
                      "ระบบเคลมประกัน",
                      "API เชื่อมต่อภายนอก",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-card-foreground">
                        <Check className="h-4 w-4 text-success" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                    <span className="text-xs text-muted-foreground">ต่ออายุ: 1 เม.ย. 2569</span>
                    <span className="text-xs text-muted-foreground">|</span>
                    <span className="text-xs text-muted-foreground">ชำระผ่าน: บัตรเครดิต **** 4567</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-base font-semibold text-card-foreground">อัปเกรดแผน</h3>
                <p className="mt-1 text-sm text-muted-foreground">ต้องการฟีเจอร์เพิ่มเติม?</p>
                <div className="mt-4 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-warning px-3 py-0.5 text-xs font-bold text-white">
                          ENTERPRISE
                        </span>
                        <h4 className="font-semibold text-card-foreground">แผน Enterprise</h4>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Multi-branch, White label, Priority support</p>
                    </div>
                    <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      อัปเกรด
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
