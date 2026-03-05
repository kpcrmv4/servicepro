"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

const navItems: NavItem[] = [
  { title: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
  { title: "รับรถ", href: "/dashboard/reception", icon: ClipboardList },
  { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench, badge: 5 },
  { title: "ตารางงาน", href: "/dashboard/planning", icon: Calendar },
  { title: "อะไหล่", href: "/dashboard/inventory", icon: Package },
  { title: "การเงิน", href: "/dashboard/finance", icon: DollarSign },
  { title: "ลูกค้า", href: "/dashboard/customers", icon: Users },
  { title: "รถ", href: "/dashboard/vehicles", icon: Car },
  { title: "ประกัน", href: "/dashboard/insurance", icon: Shield },
  { title: "พนักงาน", href: "/dashboard/employees", icon: UserCog },
  { title: "รายงาน", href: "/dashboard/reports", icon: BarChart3 },
  { title: "ตั้งค่า", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm shrink-0">
          KP
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white truncate">KPServicePro</h1>
            <p className="text-[10px] text-white/50">ระบบจัดการอู่ซ่อมรถ</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-white/10 p-2">
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span className="ml-2 text-sm">ย่อเมนู</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onCloseMobile} />
          <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar-bg">
            <button
              onClick={onCloseMobile}
              className="absolute right-3 top-4 text-white/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 bg-sidebar-bg transition-all duration-200",
          collapsed ? "lg:w-[70px]" : "lg:w-[260px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
