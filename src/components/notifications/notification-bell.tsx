"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"
import { NOTIFICATION_EVENTS } from "@/lib/types/notifications"
import type { NotificationEventType } from "@/lib/types/notifications"
import { formatDistanceToNow } from "date-fns"
import { th } from "date-fns/locale"

// =============================================================================
// Notification Bell - แสดงใน Header พร้อม dropdown
// =============================================================================

export function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(20)

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    if (notification.url) {
      router.push(notification.url)
    }
    setIsOpen(false)
  }

  const getEventIcon = (eventType: string) => {
    const event = NOTIFICATION_EVENTS[eventType as NotificationEventType]
    return event?.icon || "🔔"
  }

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: th })
    } catch {
      return dateStr
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-popover shadow-xl animate-in fade-in slide-in-from-top-2 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">การแจ้งเตือน</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
                  title="อ่านทั้งหมด"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  อ่านทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-0",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                    {getEventIcon(notification.event_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm line-clamp-1",
                        !notification.is_read ? "font-semibold" : "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>

                  {/* Actions (show on hover) */}
                  <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        className="rounded p-1 hover:bg-muted"
                        title="อ่านแล้ว"
                      >
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      className="rounded p-1 hover:bg-muted"
                      title="ลบ"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={() => {
                  router.push("/dashboard/notifications")
                  setIsOpen(false)
                }}
                className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                ดูทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
