"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Menu,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Loader2,
} from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  onMenuClick: () => void
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

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("users")
        .select("full_name, email, role, tenants(name)")
        .eq("id", user.id)
        .single()

      if (data) {
        setProfile(data as unknown as UserProfile)
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 px-4 lg:px-6 bg-background/80 backdrop-blur-md">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground lg:hidden"
        aria-label="เมนู"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Search — pill input */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหา... (⌘K)"
            className="w-full rounded-full border border-border bg-card py-2 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle (light / system / dark) */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full bg-card border border-border pl-1 pr-3 py-1 hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-tight">{profile?.full_name || "Loading..."}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {roleLabels[profile?.role || ""] || profile?.role || ""}
              </p>
            </div>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-popover p-1.5 shadow-xl animate-fade-in">
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-sm font-semibold">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                {profile?.tenants?.name && (
                  <p className="text-xs text-primary mt-0.5 font-medium">{profile.tenants.name}</p>
                )}
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4" />
                แก้ไขโปรไฟล์
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                ตั้งค่า
              </Link>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-error hover:bg-error-light transition-colors disabled:opacity-50"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {loggingOut ? "กำลังออก..." : "ออกจากระบบ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
