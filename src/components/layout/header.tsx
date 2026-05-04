"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Menu,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Loader2,
} from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ThemeToggleCompact } from "@/components/theme-toggle"
import { Breadcrumb } from "@/components/layout/breadcrumb"

interface BreadcrumbItem {
  title: string
  href?: string
}

interface HeaderProps {
  onMenuClick: () => void
  /** Optional global breadcrumb — render before action cluster */
  breadcrumb?: BreadcrumbItem[]
}

interface UserProfile {
  full_name: string
  email: string
  role: string
  tenants?: { name: string } | null
}

const roleLabels: Record<string, string> = {
  owner: "เจ้าของ",
  admin: "ผู้ดูแล",
  manager: "ผู้จัดการ",
  technician: "ช่าง",
  receptionist: "พนักงานต้อนรับ",
  super_admin: "Super Admin",
}

export function Header({ onMenuClick, breadcrumb }: HeaderProps) {
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const userMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let active = true
    void (async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("users")
          .select("full_name, email, role, tenants(name)")
          .eq("id", user.id)
          .single()
        if (active && data) setProfile(data as unknown as UserProfile)
      } catch {
        // silently fail
      }
    })()
    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  const initials = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : "?"

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-2 bg-background/80 px-3 backdrop-blur-md lg:h-14 lg:gap-3 lg:px-6">
      {/* Mobile menu trigger */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground lg:hidden"
        aria-label="เมนู"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumb (desktop only — keeps mobile header clean) */}
      <div className="hidden flex-1 min-w-0 lg:block">
        {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
      </div>

      {/* Mobile spacer */}
      <div className="flex-1 lg:hidden" />

      <div className="flex items-center gap-1.5 lg:gap-2">
        {/* Theme — single icon toggle on every breakpoint */}
        <ThemeToggleCompact />

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full border border-border bg-card p-1 transition-colors hover:bg-muted/50 md:pr-3"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-tight">
                {profile?.full_name || "Loading..."}
              </p>
              <p className="text-[10px] leading-tight text-muted-foreground">
                {roleLabels[profile?.role || ""] || profile?.role || ""}
              </p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-popover p-1.5 shadow-[var(--shadow-raised)] animate-fade-in">
              <div className="mb-1 border-b border-border px-3 py-2.5">
                <p className="text-sm font-semibold">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                {profile?.tenants?.name && (
                  <p className="mt-0.5 text-xs font-medium text-primary">
                    {profile.tenants.name}
                  </p>
                )}
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <User className="h-4 w-4" />
                แก้ไขโปรไฟล์
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
                ตั้งค่า
              </Link>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-error transition-colors hover:bg-error-light disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {loggingOut ? "กำลังออก..." : "ออกจากระบบ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
