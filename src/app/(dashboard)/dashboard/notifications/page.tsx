"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"
import { NOTIFICATION_EVENTS, EVENT_CATEGORIES } from "@/lib/types/notifications"
import type { NotificationEventType, EventCategory } from "@/lib/types/notifications"

// =============================================================================
// Notification Center Page - หน้าดูประวัติแจ้งเตือนทั้งหมด
// =============================================================================

function formatTime(dateStr: string) {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "เมื่อสักครู่"
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
    if (days < 7) return `${days} วันที่แล้ว`
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
  } catch {
    return dateStr
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(100)

  const getEventIcon = (eventType: string) => {
    const event = NOTIFICATION_EVENTS[eventType as NotificationEventType]
    return event?.icon || "🔔"
  }

  const getEventCategory = (eventType: string): EventCategory | null => {
    const event = NOTIFICATION_EVENTS[eventType as NotificationEventType]
    return event?.category as EventCategory || null
  }

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread" && n.is_read) return false
    if (categoryFilter !== "all") {
      const cat = getEventCategory(n.event_type)
      if (cat !== categoryFilter) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleClick = async (notification: (typeof notifications)[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    if (notification.url) {
      router.push(notification.url)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-xl font-bold">การแจ้งเตือน</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} รายการที่ยังไม่ได้อ่าน` : "อ่านทั้งหมดแล้ว"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              อ่านทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:px-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาแจ้งเตือน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Read/Unread filter */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === "unread" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            ยังไม่อ่าน ({unreadCount})
          </button>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          <button
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              categoryFilter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            ทั้งหมด
          </button>
          {Object.entries(EVENT_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key as EventCategory)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                categoryFilter === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="mx-4 sm:mx-6 rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">ไม่มีการแจ้งเตือน</p>
            <p className="text-xs mt-1">
              {filter === "unread" ? "อ่านทั้งหมดแล้ว" : "ยังไม่มีการแจ้งเตือนในระบบ"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "group flex gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer",
                  !notification.is_read && "bg-primary/5"
                )}
                onClick={() => handleClick(notification)}
              >
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                  {getEventIcon(notification.event_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "text-sm",
                      !notification.is_read ? "font-semibold" : "font-medium"
                    )}>
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {notification.body}
                  </p>
                  {/* Category badge */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {NOTIFICATION_EVENTS[notification.event_type as NotificationEventType]?.label || notification.event_type}
                    </span>
                    {!notification.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                      className="rounded p-1.5 hover:bg-muted"
                      title="อ่านแล้ว"
                    >
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                    className="rounded p-1.5 hover:bg-muted"
                    title="ลบ"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
