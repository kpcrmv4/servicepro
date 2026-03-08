"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Monitor,
  MessageCircle,
  Shield,
  Loader2,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePushNotification } from "@/hooks/use-push-notification"
import {
  NOTIFICATION_EVENTS,
  EVENT_CATEGORIES,
} from "@/lib/types/notifications"
import type {
  NotificationEventType,
  EventCategory,
  TenantNotificationConfig,
} from "@/lib/types/notifications"

// =============================================================================
// Notification Settings Page
// =============================================================================
// เจ้าของร้าน/admin ตั้งค่าได้ว่า event ไหนส่งแจ้งเตือนไปยัง role ไหนบ้าง
// ผ่านช่องทางไหน (Push, In-App, LINE)
// =============================================================================

const ROLE_COLUMNS = [
  { key: "notify_owner", label: "เจ้าของ", shortLabel: "เจ้าของ" },
  { key: "notify_admin", label: "ผู้ดูแล", shortLabel: "ผู้ดูแล" },
  { key: "notify_manager", label: "ผู้จัดการ", shortLabel: "จัดการ" },
  { key: "notify_technician", label: "ช่าง", shortLabel: "ช่าง" },
  { key: "notify_receptionist", label: "ต้อนรับ", shortLabel: "ต้อนรับ" },
] as const

type RoleKey = (typeof ROLE_COLUMNS)[number]["key"]

export default function NotificationSettingsPage() {
  const router = useRouter()
  const pushNotification = usePushNotification()
  const [configs, setConfigs] = useState<TenantNotificationConfig[]>([])
  const [originalConfigs, setOriginalConfigs] = useState<TenantNotificationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(EVENT_CATEGORIES)))
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch current config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/config")
      if (res.ok) {
        const data = await res.json()
        setConfigs(data)
        setOriginalConfigs(JSON.parse(JSON.stringify(data)))
      }
    } catch (e) {
      console.error("Failed to fetch notification config:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(configs) !== JSON.stringify(originalConfigs))
  }, [configs, originalConfigs])

  // Toggle category expand
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Update a single config field
  const updateConfig = (eventType: NotificationEventType, field: string, value: boolean) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.event_type === eventType ? { ...c, [field]: value } : c
      )
    )
  }

  // Toggle all roles for an event
  const toggleAllRoles = (eventType: NotificationEventType, enabled: boolean) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.event_type === eventType
          ? {
              ...c,
              notify_owner: enabled,
              notify_admin: enabled,
              notify_manager: enabled,
              notify_technician: enabled,
              notify_receptionist: enabled,
            }
          : c
      )
    )
  }

  // Toggle entire category
  const toggleCategory_enabled = (category: EventCategory, enabled: boolean) => {
    const eventTypes = Object.entries(NOTIFICATION_EVENTS)
      .filter(([, v]) => v.category === category)
      .map(([k]) => k)

    setConfigs((prev) =>
      prev.map((c) =>
        eventTypes.includes(c.event_type) ? { ...c, is_enabled: enabled } : c
      )
    )
  }

  // Reset to original
  const resetChanges = () => {
    setConfigs(JSON.parse(JSON.stringify(originalConfigs)))
  }

  // Save changes
  const saveChanges = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const changedConfigs = configs.filter((c, i) => {
        return JSON.stringify(c) !== JSON.stringify(originalConfigs[i])
      })

      if (changedConfigs.length === 0) {
        setSaveMessage({ type: "success", text: "ไม่มีการเปลี่ยนแปลง" })
        setIsSaving(false)
        return
      }

      const res = await fetch("/api/notifications/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: changedConfigs }),
      })

      if (res.ok) {
        setOriginalConfigs(JSON.parse(JSON.stringify(configs)))
        setSaveMessage({ type: "success", text: "บันทึกเรียบร้อย" })
      } else {
        const data = await res.json()
        setSaveMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      setSaveMessage({ type: "error", text: "ไม่สามารถบันทึกได้" })
    }

    setIsSaving(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  // Group configs by category
  const groupedConfigs: Record<string, TenantNotificationConfig[]> = {}
  for (const config of configs) {
    const event = NOTIFICATION_EVENTS[config.event_type as NotificationEventType]
    const category = event?.category || "other"
    if (!groupedConfigs[category]) groupedConfigs[category] = []
    groupedConfigs[category].push(config)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-xl font-bold">ตั้งค่าการแจ้งเตือน</h1>
          <p className="text-sm text-muted-foreground">
            กำหนดว่าเหตุการณ์ใดจะส่งแจ้งเตือนไปยังบทบาทใดบ้าง
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={resetChanges}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              ยกเลิก
            </button>
          )}
          <button
            onClick={saveChanges}
            disabled={!hasChanges || isSaving}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className={cn(
          "mx-4 sm:mx-6 rounded-lg px-4 py-3 text-sm",
          saveMessage.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        )}>
          {saveMessage.text}
        </div>
      )}

      {/* Push Notification Status */}
      <div className="mx-4 sm:mx-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              pushNotification.isSubscribed ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
            )}>
              <Smartphone className={cn(
                "h-5 w-5",
                pushNotification.isSubscribed ? "text-green-600" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="text-sm font-semibold">Push Notification บนอุปกรณ์นี้</p>
              <p className="text-xs text-muted-foreground">
                {pushNotification.permission === "unsupported"
                  ? "เบราว์เซอร์นี้ไม่รองรับ Push Notification"
                  : pushNotification.permission === "denied"
                  ? "คุณปิดกั้นการแจ้งเตือน กรุณาเปิดในการตั้งค่าเบราว์เซอร์"
                  : pushNotification.isSubscribed
                  ? "เปิดรับการแจ้งเตือนอยู่"
                  : "ยังไม่ได้เปิดรับการแจ้งเตือน"}
              </p>
            </div>
          </div>
          <button
            onClick={pushNotification.isSubscribed ? pushNotification.unsubscribe : pushNotification.subscribe}
            disabled={pushNotification.isLoading || pushNotification.permission === "unsupported" || pushNotification.permission === "denied"}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              pushNotification.isSubscribed
                ? "border border-border hover:bg-muted"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
              (pushNotification.isLoading || pushNotification.permission === "unsupported" || pushNotification.permission === "denied") && "opacity-50 cursor-not-allowed"
            )}
          >
            {pushNotification.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : pushNotification.isSubscribed ? (
              "ปิดการแจ้งเตือน"
            ) : (
              "เปิดการแจ้งเตือน"
            )}
          </button>
        </div>
        {pushNotification.error && (
          <p className="mt-2 text-xs text-red-500">{pushNotification.error}</p>
        )}
      </div>

      {/* Info box */}
      <div className="mx-4 sm:mx-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
        <div className="text-xs text-blue-700 dark:text-blue-400">
          <p className="font-medium">วิธีใช้ตาราง</p>
          <p className="mt-0.5">เปิด/ปิด checkbox เพื่อกำหนดว่าเหตุการณ์ใดจะส่งแจ้งเตือนไปยังบทบาทใด สามารถเปิด/ปิดทั้งหมวดหมู่ได้ การตั้งค่านี้มีผลกับทุกคนในร้าน</p>
        </div>
      </div>

      {/* Config Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="mx-4 sm:mx-6 space-y-4">
          {Object.entries(EVENT_CATEGORIES).map(([categoryKey, category]) => {
            const categoryConfigs = groupedConfigs[categoryKey] || []
            if (categoryConfigs.length === 0) return null
            const isExpanded = expandedCategories.has(categoryKey)
            const allEnabled = categoryConfigs.every((c) => c.is_enabled)

            return (
              <div key={categoryKey} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCategory(categoryKey)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-lg">{category.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{category.label}</p>
                      <p className="text-[10px] text-muted-foreground">{categoryConfigs.length} เหตุการณ์</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="hidden sm:inline">เปิดทั้งหมวด</span>
                      <input
                        type="checkbox"
                        checked={allEnabled}
                        onChange={(e) => toggleCategory_enabled(categoryKey as EventCategory, e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                    </label>
                  </div>
                </div>

                {/* Events Table */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr,repeat(5,48px),repeat(3,48px)] sm:grid-cols-[1fr,repeat(5,64px),repeat(3,64px)] items-center gap-0 border-b border-border bg-muted/30 px-4 py-2">
                      <div className="text-[10px] font-medium text-muted-foreground uppercase">เหตุการณ์</div>
                      {ROLE_COLUMNS.map((role) => (
                        <div key={role.key} className="text-center text-[10px] font-medium text-muted-foreground uppercase">
                          <span className="hidden sm:inline">{role.label}</span>
                          <span className="sm:hidden">{role.shortLabel}</span>
                        </div>
                      ))}
                      <div className="text-center text-[10px] font-medium text-muted-foreground" title="Push Notification">
                        <Monitor className="h-3.5 w-3.5 mx-auto" />
                      </div>
                      <div className="text-center text-[10px] font-medium text-muted-foreground" title="In-App">
                        <Bell className="h-3.5 w-3.5 mx-auto" />
                      </div>
                      <div className="text-center text-[10px] font-medium text-muted-foreground" title="LINE">
                        <MessageCircle className="h-3.5 w-3.5 mx-auto" />
                      </div>
                    </div>

                    {/* Event Rows */}
                    {categoryConfigs.map((config) => {
                      const event = NOTIFICATION_EVENTS[config.event_type as NotificationEventType]
                      return (
                        <div
                          key={config.event_type}
                          className={cn(
                            "grid grid-cols-[1fr,repeat(5,48px),repeat(3,48px)] sm:grid-cols-[1fr,repeat(5,64px),repeat(3,64px)] items-center gap-0 border-b border-border last:border-0 px-4 py-2.5 hover:bg-muted/30 transition-colors",
                            !config.is_enabled && "opacity-40"
                          )}
                        >
                          {/* Event name */}
                          <div className="flex items-center gap-2 min-w-0">
                            <label className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={config.is_enabled}
                                onChange={(e) => updateConfig(config.event_type as NotificationEventType, "is_enabled", e.target.checked)}
                                className="h-3.5 w-3.5 shrink-0 rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-sm truncate">{event?.label || config.event_type}</span>
                            </label>
                          </div>

                          {/* Role checkboxes */}
                          {ROLE_COLUMNS.map((role) => (
                            <div key={role.key} className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={config[role.key as RoleKey] as boolean}
                                onChange={(e) => updateConfig(config.event_type as NotificationEventType, role.key, e.target.checked)}
                                disabled={!config.is_enabled}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-30"
                              />
                            </div>
                          ))}

                          {/* Channel checkboxes */}
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={config.push_enabled}
                              onChange={(e) => updateConfig(config.event_type as NotificationEventType, "push_enabled", e.target.checked)}
                              disabled={!config.is_enabled}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-30"
                            />
                          </div>
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={config.in_app_enabled}
                              onChange={(e) => updateConfig(config.event_type as NotificationEventType, "in_app_enabled", e.target.checked)}
                              disabled={!config.is_enabled}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-30"
                            />
                          </div>
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={config.line_enabled}
                              onChange={(e) => updateConfig(config.event_type as NotificationEventType, "line_enabled", e.target.checked)}
                              disabled={!config.is_enabled}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary disabled:opacity-30"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom save bar (sticky) */}
      {hasChanges && (
        <div className="sticky bottom-0 mx-4 sm:mx-6 mb-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
          <p className="text-sm text-muted-foreground">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</p>
          <div className="flex items-center gap-2">
            <button
              onClick={resetChanges}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={saveChanges}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              บันทึก
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
