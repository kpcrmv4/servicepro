"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Calendar,
  Package,
  DollarSign,
  Users,
  Car,
  UserCog,
  BarChart3,
  Settings,
  Shield,
  Plus,
  MoreHorizontal,
  X,
  FileText,
  CheckSquare,
  Receipt,
  Bell,
  LogOut,
  User,
} from "lucide-react"

// ============================================================
// Types
// ============================================================

type UserRole = "owner" | "admin" | "manager" | "technician" | "receptionist" | "viewer"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

interface RoleNavConfig {
  items: [NavItem, NavItem, NavItem, NavItem] // exactly 4 items: [left1, left2, right1, right2(=more)]
  centerAction: NavItem & { color: string }
}

// ============================================================
// All menu items (for "More" overlay)
// ============================================================

const allMenuItems: NavItem[] = [
  { title: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
  { title: "รับรถ", href: "/dashboard/reception", icon: ClipboardList },
  { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
  { title: "คิวงาน", href: "/dashboard/queue", icon: CheckSquare },
  { title: "ตารางงาน", href: "/dashboard/planning", icon: Calendar },
  { title: "ใบเสนอราคา", href: "/dashboard/quotations", icon: FileText },
  { title: "อะไหล่", href: "/dashboard/inventory", icon: Package },
  { title: "การเงิน", href: "/dashboard/finance", icon: DollarSign },
  { title: "ลูกค้า", href: "/dashboard/customers", icon: Users },
  { title: "รถ", href: "/dashboard/vehicles", icon: Car },
  { title: "ประกัน", href: "/dashboard/insurance", icon: Shield },
  { title: "พนักงาน", href: "/dashboard/employees", icon: UserCog },
  { title: "รายงาน", href: "/dashboard/reports", icon: BarChart3 },
  { title: "ตั้งค่า", href: "/dashboard/settings", icon: Settings },
]

// ============================================================
// Role-based navigation configs
// ============================================================

const roleNavConfigs: Record<UserRole, RoleNavConfig> = {
  // เจ้าของ: เน้นภาพรวม + การเงิน + สร้างงานใหม่
  owner: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "การเงิน", href: "/dashboard/finance", icon: DollarSign },
      { title: "รายงาน", href: "/dashboard/reports", icon: BarChart3 },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "สร้างงาน", href: "/dashboard/reception", icon: Plus, color: "bg-primary" },
  },
  // ผู้ดูแล: เน้นจัดการระบบ + งาน + สร้างงานใหม่
  admin: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "ตั้งค่า", href: "/dashboard/settings", icon: Settings },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "สร้างงาน", href: "/dashboard/reception", icon: Plus, color: "bg-primary" },
  },
  // ผู้จัดการ: เน้นจัดการงาน + ตารางงาน + สร้างงานใหม่
  manager: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "ตารางงาน", href: "/dashboard/planning", icon: Calendar },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "รับรถ", href: "/dashboard/reception", icon: ClipboardList, color: "bg-emerald-500" },
  },
  // ช่าง: เน้นคิวงาน + งานของตัวเอง + อัพเดทงาน
  technician: {
    items: [
      { title: "คิวงาน", href: "/dashboard/queue", icon: CheckSquare },
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "อะไหล่", href: "/dashboard/inventory", icon: Package },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "อัพเดทงาน", href: "/dashboard/jobs", icon: Wrench, color: "bg-orange-500" },
  },
  // พนักงานต้อนรับ: เน้นรับรถ + ลูกค้า + รับรถใหม่
  receptionist: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "ลูกค้า", href: "/dashboard/customers", icon: Users },
      { title: "คิวงาน", href: "/dashboard/queue", icon: CheckSquare },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "รับรถ", href: "/dashboard/reception", icon: ClipboardList, color: "bg-emerald-500" },
  },
  // ผู้ดู: เน้นดูข้อมูลอย่างเดียว
  viewer: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "รายงาน", href: "/dashboard/reports", icon: BarChart3 },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "ดูงาน", href: "/dashboard/jobs", icon: Wrench, color: "bg-primary" },
  },
}

// ============================================================
// Component
// ============================================================

export function BottomNav() {
  const pathname = usePathname()
  const [role, setRole] = useState<UserRole>("viewer")
  const [moreOpen, setMoreOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUserRole()
  }, [])

  // Close more menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [moreOpen])

  // Close more menu on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  async function loadUserRole() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (data?.role) {
        setRole(data.role as UserRole)
      }
      setLoaded(true)
    } catch {
      setLoaded(true)
    }
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "#more") return false
    return pathname.startsWith(href)
  }

  const config = roleNavConfigs[role] || roleNavConfigs.viewer
  const leftItems = config.items.slice(0, 2)
  const rightItems = config.items.slice(2, 4)
  const center = config.centerAction

  if (!loaded) return null

  return (
    <>
      {/* More Menu Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" ref={moreRef}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />

          {/* Menu Panel - slides up from bottom */}
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
            <div className="mx-2 mb-2 rounded-2xl border border-border bg-card shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="text-base font-bold text-foreground">เมนูทั้งหมด</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Grid Menu */}
              <div className="grid grid-cols-4 gap-1 p-3">
                {allMenuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                      <span className="text-[11px] font-medium leading-tight">{item.title}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Quick Actions */}
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <User className="h-4 w-4" />
                    โปรไฟล์
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    ตั้งค่า
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        {/* Safe area background */}
        <div className="border-t border-border bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
          <div className="relative flex items-end justify-around px-2 pt-1">
            {/* Left items (positions 1 & 2) */}
            {leftItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                  <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                    {item.title}
                  </span>
                </Link>
              )
            })}

            {/* Center Action Button (position 3 - raised) */}
            <div className="flex flex-1 items-center justify-center">
              <Link
                href={center.href}
                className={cn(
                  "relative -mt-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
                  center.color,
                  "text-white"
                )}
              >
                {/* Glow effect */}
                <div className={cn("absolute inset-0 rounded-full opacity-30 blur-md", center.color)} />
                <center.icon className="relative h-6 w-6 stroke-[2.5]" />
              </Link>
              <span className={cn(
                "absolute bottom-1.5 text-[10px] font-semibold",
                isActive(center.href) ? "text-primary" : "text-muted-foreground"
              )}>
                {center.title}
              </span>
            </div>

            {/* Right items (positions 4 & 5) */}
            {rightItems.map((item, idx) => {
              const Icon = item.icon
              const isMore = item.href === "#more"
              const active = isMore ? moreOpen : isActive(item.href)

              if (isMore) {
                return (
                  <button
                    key="more"
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {moreOpen ? (
                      <X className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                      {moreOpen ? "ปิด" : item.title}
                    </span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                  <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                    {item.title}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
