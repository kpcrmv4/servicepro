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
  Package,
  DollarSign,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Plus,
  MoreHorizontal,
  X,
  CheckSquare,
  Bell,
  LogOut,
  ClipboardCheck,
  ShieldCheck,
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
  items: [NavItem, NavItem, NavItem, NavItem]
  centerAction: NavItem & { color: string }
}

// ============================================================
// All menu items — 8 items (ลดจาก 19)
// ============================================================

interface MenuItemWithAccess extends NavItem {
  allowedRoles: UserRole[]
}

const allMenuItems: MenuItemWithAccess[] = [
  {
    title: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard,
    allowedRoles: ["owner", "admin", "manager", "technician", "receptionist", "viewer"],
  },
  {
    title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench,
    allowedRoles: ["owner", "admin", "manager", "technician", "receptionist", "viewer"],
  },
  {
    title: "ตรวจสภาพ", href: "/dashboard/inspections", icon: ClipboardCheck,
    allowedRoles: ["owner", "admin", "manager", "technician", "receptionist"],
  },
  {
    title: "คลังอะไหล่", href: "/dashboard/inventory", icon: Package,
    allowedRoles: ["owner", "admin", "manager", "technician"],
  },
  {
    title: "การเงิน", href: "/dashboard/finance", icon: DollarSign,
    allowedRoles: ["owner", "admin", "manager"],
  },
  {
    title: "ลูกค้า", href: "/dashboard/customers", icon: Users,
    allowedRoles: ["owner", "admin", "manager", "receptionist", "viewer"],
  },
  {
    title: "ทีมงาน", href: "/dashboard/team", icon: UserCog,
    allowedRoles: ["owner", "admin", "manager"],
  },
  {
    title: "รับประกัน", href: "/dashboard/warranty", icon: ShieldCheck,
    allowedRoles: ["owner", "admin", "manager"],
  },
  {
    title: "รายงาน", href: "/dashboard/reports", icon: BarChart3,
    allowedRoles: ["owner", "admin", "manager", "viewer"],
  },
]

// ============================================================
// Role-based navigation configs — route ใหม่
// ============================================================

const roleNavConfigs: Record<UserRole, RoleNavConfig> = {
  owner: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "การเงิน", href: "/dashboard/finance", icon: DollarSign },
      { title: "รายงาน", href: "/dashboard/reports", icon: BarChart3 },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "สร้างงาน", href: "/dashboard/jobs/new", icon: Plus, color: "bg-primary" },
  },
  admin: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "ทีมงาน", href: "/dashboard/team", icon: UserCog },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "สร้างงาน", href: "/dashboard/jobs/new", icon: Plus, color: "bg-primary" },
  },
  manager: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "คลังอะไหล่", href: "/dashboard/inventory", icon: Package },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "รับรถ", href: "/dashboard/jobs?tab=reception", icon: ClipboardList, color: "bg-emerald-500" },
  },
  technician: {
    items: [
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "คลังอะไหล่", href: "/dashboard/inventory", icon: Package },
      { title: "ตรวจสภาพ", href: "/dashboard/inspections", icon: ClipboardCheck },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "คิวงาน", href: "/dashboard/jobs?tab=queue", icon: CheckSquare, color: "bg-orange-500" },
  },
  receptionist: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "ลูกค้า", href: "/dashboard/customers", icon: Users },
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "รับรถ", href: "/dashboard/jobs?tab=reception", icon: ClipboardList, color: "bg-emerald-500" },
  },
  viewer: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard", icon: LayoutDashboard },
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "รายงาน", href: "/dashboard/reports", icon: BarChart3 },
      { title: "เพิ่มเติม", href: "#more", icon: MoreHorizontal },
    ],
    centerAction: { title: "ดูงาน", href: "/dashboard/jobs?tab=list", icon: Wrench, color: "bg-primary" },
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
    void loadUserRole()
    // loadUserRole is declared below — hoisted by `function`, safe here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    const [hrefPath] = href.split("?")
    return pathname.startsWith(hrefPath)
  }

  // Filter menu items by role
  const visibleMenuItems = allMenuItems.filter(item =>
    item.allowedRoles.includes(role)
  )

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
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />

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

              {/* Grid Menu — 8 items max, filtered by role */}
              <div className="grid grid-cols-4 gap-1 p-3">
                {visibleMenuItems.map((item) => {
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
                    <Settings className="h-4 w-4" />
                    ตั้งค่า
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Bell className="h-4 w-4" />
                    แจ้งเตือน
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar — floating pill style */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="rounded-full border border-border bg-card/95 shadow-2xl backdrop-blur-lg">
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
                className="relative -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition-transform active:scale-95"
              >
                <div className="absolute inset-0 rounded-full bg-primary opacity-40 blur-lg" />
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
            {rightItems.map((item) => {
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
