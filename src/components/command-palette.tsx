"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Search,
  LayoutDashboard,
  Wrench,
  Package,
  DollarSign,
  Users,
  UserCog,
  BarChart3,
  Settings,
  CalendarCheck,
  ClipboardCheck,
  ShieldCheck,
  Bell,
  Globe,
  Store,
  Plus,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Kbd, useKeyboardModifier } from "@/components/ui/kbd"

// =============================================================================
// Command catalog
// =============================================================================

interface CommandEntry {
  id: string
  label: string
  /** Group this command appears under */
  group: "นำทาง" | "สร้าง" | "ตั้งค่า"
  /** Searchable keywords (label + these are matched) */
  keywords?: string[]
  icon: React.ElementType
  /** Either navigate to a path or fire a custom action */
  href?: string
  action?: () => void
}

const commands: CommandEntry[] = [
  // Navigate
  { id: "nav-home", label: "แดชบอร์ด", group: "นำทาง", icon: LayoutDashboard, href: "/dashboard", keywords: ["dashboard", "หน้าหลัก"] },
  { id: "nav-jobs", label: "งานซ่อม", group: "นำทาง", icon: Wrench, href: "/dashboard/jobs", keywords: ["jobs", "service"] },
  { id: "nav-bookings", label: "คิวจองล่วงหน้า", group: "นำทาง", icon: CalendarCheck, href: "/dashboard/bookings", keywords: ["booking"] },
  { id: "nav-inspections", label: "ตรวจสภาพรถ", group: "นำทาง", icon: ClipboardCheck, href: "/dashboard/inspections", keywords: ["inspection", "DVI"] },
  { id: "nav-inventory", label: "คลังอะไหล่", group: "นำทาง", icon: Package, href: "/dashboard/inventory", keywords: ["parts", "stock"] },
  { id: "nav-finance", label: "การเงิน", group: "นำทาง", icon: DollarSign, href: "/dashboard/finance", keywords: ["finance", "invoice"] },
  { id: "nav-warranty", label: "รับประกัน", group: "นำทาง", icon: ShieldCheck, href: "/dashboard/warranty" },
  { id: "nav-customers", label: "ลูกค้า", group: "นำทาง", icon: Users, href: "/dashboard/customers", keywords: ["customer"] },
  { id: "nav-team", label: "ทีมงาน", group: "นำทาง", icon: UserCog, href: "/dashboard/team", keywords: ["staff", "user"] },
  { id: "nav-reminders", label: "แจ้งเตือนลูกค้า", group: "นำทาง", icon: Bell, href: "/dashboard/reminders" },
  { id: "nav-reports", label: "รายงาน", group: "นำทาง", icon: BarChart3, href: "/dashboard/reports", keywords: ["report"] },
  { id: "nav-landing", label: "Landing Page", group: "นำทาง", icon: Globe, href: "/dashboard/landing" },
  { id: "nav-shop", label: "ร้านค้าออนไลน์", group: "นำทาง", icon: Store, href: "/dashboard/shop-manage" },

  // Create
  { id: "new-job", label: "สร้างงานซ่อมใหม่", group: "สร้าง", icon: Plus, href: "/dashboard/jobs/new", keywords: ["new job", "create"] },
  { id: "new-inspection", label: "ตรวจสภาพใหม่", group: "สร้าง", icon: Plus, href: "/dashboard/inspections/new" },
  { id: "new-reception", label: "รับรถใหม่", group: "สร้าง", icon: Plus, href: "/dashboard/reception/new" },

  // Settings
  { id: "settings", label: "ตั้งค่าทั่วไป", group: "ตั้งค่า", icon: Settings, href: "/dashboard/settings" },
  { id: "settings-line", label: "ตั้งค่า LINE OA", group: "ตั้งค่า", icon: Settings, href: "/dashboard/settings/line" },
  { id: "settings-branding", label: "Branding / โลโก้", group: "ตั้งค่า", icon: Settings, href: "/dashboard/settings/branding" },
  { id: "settings-domain", label: "Custom Domain", group: "ตั้งค่า", icon: Settings, href: "/dashboard/settings/domain" },
  { id: "settings-subscription", label: "แพ็กเกจ / สมาชิก", group: "ตั้งค่า", icon: Settings, href: "/dashboard/settings/subscription" },
]

// =============================================================================
// Component
// =============================================================================

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { glyph } = useKeyboardModifier()

  // Listen for the open event dispatched by the sidebar trigger or ⌘K
  React.useEffect(() => {
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener("command-palette:open", onOpen)
    return () => window.removeEventListener("command-palette:open", onOpen)
  }, [])

  // ⌘K / Ctrl+K binds — sidebar already binds, but listen here too in case
  // sidebar isn't mounted (auth pages, customer portal)
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  // Reset state when closed
  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setActiveIndex(0)
    } else {
      // Focus input on next tick (after motion mount)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Filter
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => {
      if (c.label.toLowerCase().includes(q)) return true
      if (c.keywords?.some((k) => k.toLowerCase().includes(q))) return true
      if (c.group.toLowerCase().includes(q)) return true
      return false
    })
  }, [query])

  // Group filtered into ordered sections
  const grouped = React.useMemo(() => {
    const order = ["นำทาง", "สร้าง", "ตั้งค่า"] as const
    return order
      .map((g) => ({ group: g, items: filtered.filter((c) => c.group === g) }))
      .filter((s) => s.items.length > 0)
  }, [filtered])

  // Flat list for keyboard nav
  const flat = React.useMemo(
    () => grouped.flatMap((g) => g.items),
    [grouped],
  )

  React.useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function runCommand(c: CommandEntry) {
    setOpen(false)
    if (c.action) c.action()
    else if (c.href) router.push(c.href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const cmd = flat[activeIndex]
      if (cmd) runCommand(cmd)
    } else if (e.key === "Home") {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === "End") {
      e.preventDefault()
      setActiveIndex(flat.length - 1)
    }
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[120] flex items-start justify-center bg-black/60 px-3 pt-[10vh] backdrop-blur-sm sm:px-0"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="ค้นหาด่วน"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-raised)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ค้นหาเมนู หรือสร้าง..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoComplete="off"
              />
              <Kbd>Esc</Kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {flat.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  ไม่พบรายการ
                </div>
              ) : (
                grouped.map((section) => (
                  <div key={section.group} className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.group}
                    </div>
                    {section.items.map((cmd) => {
                      const flatIndex = flat.indexOf(cmd)
                      const Icon = cmd.icon
                      const isActive = flatIndex === activeIndex
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => runCommand(cmd)}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                            isActive ? "bg-muted" : "",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{cmd.label}</span>
                          {isActive && (
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  เลื่อน
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  เปิด
                </span>
              </div>
              <span className="inline-flex items-center gap-1">
                <Kbd>{glyph}K</Kbd>
                เพื่อเปิด/ปิด
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
