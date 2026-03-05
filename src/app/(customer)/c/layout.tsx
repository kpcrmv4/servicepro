"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Car,
  CalendarPlus,
  Crown,
  Bell,
  User,
} from "lucide-react"

const bottomNavItems = [
  { href: "/c", label: "หน้าหลัก", icon: Home },
  { href: "/c/vehicles/v1", label: "รถของฉัน", icon: Car },
  { href: "/c/booking", label: "จองคิว", icon: CalendarPlus },
  { href: "/c/membership", label: "สมาชิก", icon: Crown },
]

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)

  const isActive = (href: string) => {
    if (href === "/c") return pathname === "/c"
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-lg min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">อู่</span>
              </div>
              <span className="font-semibold text-foreground">อู่ช่างสมชาย</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-muted transition-colors"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error" />
              </button>
              <Link
                href="/c/login"
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <User className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-4 top-14 w-72 bg-card rounded-xl border border-border shadow-lg p-3 z-50">
              <p className="text-sm font-medium text-foreground mb-2">การแจ้งเตือน</p>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-muted/50 text-sm">
                  <p className="text-foreground">รถของคุณพร้อมรับแล้ว!</p>
                  <p className="text-muted-foreground text-xs mt-0.5">5 นาทีที่แล้ว</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 text-sm">
                  <p className="text-foreground">ได้รับคะแนนสะสม +50 แต้ม</p>
                  <p className="text-muted-foreground text-xs mt-0.5">2 ชั่วโมงที่แล้ว</p>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
          <div className="mx-auto max-w-lg flex items-center justify-around py-2 px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                  <span className="text-[10px] font-medium truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
