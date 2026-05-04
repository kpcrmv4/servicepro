"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Kbd, useKeyboardModifier } from "@/components/ui/kbd"
import {
  LayoutDashboard,
  Wrench,
  Package,
  DollarSign,
  Users,
  UserCog,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardCheck,
  ShieldCheck,
  Bell,
  CalendarCheck,
  Globe,
  Store,
  Search,
  LogOut,
  ChevronUp,
} from "lucide-react"

// =============================================================================
// Navigation Config — 6 groups (ภาษาไทย labels)
// =============================================================================

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "หลัก",
    items: [{ title: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "ปฏิบัติการ",
    items: [
      { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
      { title: "คิวจองล่วงหน้า", href: "/dashboard/bookings", icon: CalendarCheck },
      { title: "ตรวจสภาพรถ", href: "/dashboard/inspections", icon: ClipboardCheck },
    ],
  },
  {
    label: "ทรัพย์สิน",
    items: [
      { title: "คลังอะไหล่", href: "/dashboard/inventory", icon: Package },
      { title: "การเงิน", href: "/dashboard/finance", icon: DollarSign },
      { title: "รับประกัน", href: "/dashboard/warranty", icon: ShieldCheck },
    ],
  },
  {
    label: "คน",
    items: [
      { title: "ลูกค้า", href: "/dashboard/customers", icon: Users },
      { title: "ทีมงาน", href: "/dashboard/team", icon: UserCog },
    ],
  },
  {
    label: "การสื่อสาร",
    items: [
      { title: "แจ้งเตือนลูกค้า", href: "/dashboard/reminders", icon: Bell },
      { title: "รายงาน", href: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    label: "ช่องทางขาย",
    items: [
      { title: "Landing Page", href: "/dashboard/landing", icon: Globe },
      { title: "ร้านค้าออนไลน์", href: "/dashboard/shop-manage", icon: Store },
    ],
  },
]

const settingsItem: NavItem = {
  title: "ตั้งค่า",
  href: "/dashboard/settings",
  icon: Settings,
}

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

interface SidebarProfile {
  full_name?: string | null
  email?: string | null
  role?: string | null
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

// =============================================================================
// Component
// =============================================================================

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/dashboard/settings") return pathname === "/dashboard/settings"
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar-bg shadow-xl">
            <button
              onClick={onCloseMobile}
              className="absolute right-3 top-4 text-sidebar-muted hover:text-sidebar-fg"
              aria-label="ปิดเมนู"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarBody
              collapsed={false}
              isActive={isActive}
              onLinkClick={onCloseMobile}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 bg-sidebar-bg border-r border-border transition-all duration-200",
          collapsed ? "lg:w-[72px]" : "lg:w-[260px]",
        )}
      >
        <SidebarBody
          collapsed={collapsed}
          isActive={isActive}
          onLinkClick={() => {}}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>
    </>
  )
}

interface SidebarBodyProps {
  collapsed: boolean
  isActive: (href: string) => boolean
  onLinkClick: () => void
  onToggleCollapse?: () => void
}

function SidebarBody({
  collapsed,
  isActive,
  onLinkClick,
  onToggleCollapse,
}: SidebarBodyProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-[var(--shadow-primary)]">
          KP
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="truncate text-sm font-bold text-sidebar-fg">
              KPServicePro
            </h1>
            <p className="text-[10px] text-sidebar-muted">ระบบจัดการอู่ซ่อมรถ</p>
          </div>
        )}
      </div>

      {/* Command palette trigger (⌘K) */}
      <div className="px-3 pt-3">
        <CommandTrigger collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3 last:mb-0">
            {!collapsed && (
              <div className="mb-1 px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {group.label}
              </div>
            )}
            {collapsed && (
              <div className="my-2 mx-2 border-t border-border first:mt-0 first:border-0" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-primary)]"
                        : "text-sidebar-muted hover:bg-muted hover:text-sidebar-fg",
                      collapsed && "justify-center",
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.title}</span>
                        {item.badge ? (
                          <span
                            className={cn(
                              "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                              active
                                ? "bg-white/20 text-white"
                                : "bg-primary text-primary-foreground",
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: settings + user pill + collapse toggle */}
      <div className="border-t border-border p-3">
        <Link
          href={settingsItem.href}
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
            isActive(settingsItem.href)
              ? "bg-primary text-primary-foreground shadow-[var(--shadow-primary)]"
              : "text-sidebar-muted hover:bg-muted hover:text-sidebar-fg",
            collapsed && "justify-center",
          )}
          title={collapsed ? settingsItem.title : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{settingsItem.title}</span>}
        </Link>

        <UserPill collapsed={collapsed} />

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="mt-1 flex w-full items-center justify-center rounded-xl px-3 py-2 text-sidebar-muted transition-colors hover:bg-muted hover:text-sidebar-fg"
            aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!collapsed && <span className="ml-2 text-xs">ย่อเมนู</span>}
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Command palette trigger (⌘K)
// =============================================================================

function CommandTrigger({ collapsed }: { collapsed: boolean }) {
  const { glyph } = useKeyboardModifier()

  function openCommandPalette() {
    // Phase 7 will wire a real command palette to this event.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("command-palette:open"))
    }
  }

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        openCommandPalette()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  if (collapsed) {
    return (
      <button
        onClick={openCommandPalette}
        className="flex h-9 w-full items-center justify-center rounded-xl border border-border bg-card text-sidebar-muted hover:bg-muted hover:text-sidebar-fg"
        title="ค้นหา"
        aria-label="ค้นหา (⌘K)"
      >
        <Search className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={openCommandPalette}
      className="flex h-9 w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 text-left text-sidebar-muted transition-colors hover:bg-muted hover:text-sidebar-fg"
      aria-label="ค้นหา (⌘K)"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-xs">ค้นหา…</span>
      <Kbd>{glyph}K</Kbd>
    </button>
  )
}

// =============================================================================
// User pill (bottom of sidebar)
// =============================================================================

function UserPill({ collapsed }: { collapsed: boolean }) {
  const router = useRouter()
  const [profile, setProfile] = React.useState<SidebarProfile | null>(null)
  const [open, setOpen] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

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
        if (active && data) setProfile(data as unknown as SidebarProfile)
      } catch {
        // silently fail — header may also load profile
      }
    })()
    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

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
  const roleLabel = profile?.role ? roleLabels[profile.role] ?? profile.role : ""

  return (
    <div ref={ref} className="relative mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-border bg-card p-2 text-left transition-colors hover:bg-muted",
          collapsed && "justify-center p-1.5",
        )}
        aria-label="เมนูผู้ใช้"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-fg">
                {profile?.full_name || "—"}
              </p>
              <p className="truncate text-[10px] text-sidebar-muted">{roleLabel}</p>
            </div>
            <ChevronUp
              className={cn(
                "h-3.5 w-3.5 text-sidebar-muted transition-transform",
                open && "rotate-180",
              )}
            />
          </>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-border bg-popover p-1 shadow-[var(--shadow-raised)]">
          {profile?.tenants?.name && (
            <div className="border-b border-border px-3 py-2">
              <p className="text-[10px] uppercase text-sidebar-muted">ร้าน</p>
              <p className="truncate text-xs font-medium text-foreground">
                {profile.tenants.name}
              </p>
            </div>
          )}
          {profile?.email && (
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-[11px] text-muted-foreground">
                {profile.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-error transition-colors hover:bg-error-light disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOut ? "กำลังออก..." : "ออกจากระบบ"}
          </button>
        </div>
      )}
    </div>
  )
}
