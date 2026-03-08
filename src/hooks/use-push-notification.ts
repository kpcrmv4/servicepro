"use client"

import { useState, useEffect, useCallback } from "react"

// =============================================================================
// usePushNotification Hook
// =============================================================================
// จัดการ Push Notification subscription บน client-side
// - ขอ permission
// - Subscribe / Unsubscribe
// - ตรวจสอบสถานะ
// =============================================================================

type PushPermission = "default" | "granted" | "denied" | "unsupported"

interface UsePushNotificationReturn {
  permission: PushPermission
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  requestPermission: () => Promise<boolean>
}

export function usePushNotification(): UsePushNotificationReturn {
  const [permission, setPermission] = useState<PushPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // ตรวจสอบสถานะเริ่มต้น
  useEffect(() => {
    const checkStatus = async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPermission("unsupported")
        setIsLoading(false)
        return
      }

      // ตรวจสอบ permission
      setPermission(Notification.permission as PushPermission)

      try {
        // ดึง service worker registration
        const reg = await navigator.serviceWorker.ready
        setRegistration(reg)

        // ตรวจสอบว่า subscribe อยู่หรือไม่
        const sub = await reg.pushManager.getSubscription()
        setIsSubscribed(!!sub)
      } catch (e) {
        console.error("[Push] Error checking status:", e)
      }

      setIsLoading(false)
    }

    checkStatus()
  }, [])

  // ขอ permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result as PushPermission)
      return result === "granted"
    } catch (e) {
      console.error("[Push] Permission error:", e)
      return false
    }
  }, [])

  // Subscribe
  const subscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // ขอ permission ก่อน
      const granted = await requestPermission()
      if (!granted) {
        setError("กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์")
        setIsLoading(false)
        return
      }

      // ดึง VAPID public key
      const response = await fetch("/api/push/send")
      const { publicKey } = await response.json()

      if (!publicKey) {
        setError("ระบบแจ้งเตือนยังไม่ได้ตั้งค่า VAPID keys")
        setIsLoading(false)
        return
      }

      // Subscribe กับ Push Manager
      const reg = registration || await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // ส่ง subscription ไปเก็บที่ server
      const subJson = sub.toJSON()
      const result = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: sub.endpoint,
            keys: {
              p256dh: subJson.keys?.p256dh,
              auth: subJson.keys?.auth,
            },
          },
          userAgent: navigator.userAgent,
        }),
      })

      if (!result.ok) {
        throw new Error("Failed to save subscription")
      }

      setIsSubscribed(true)
    } catch (e) {
      console.error("[Push] Subscribe error:", e)
      setError("ไม่สามารถเปิดการแจ้งเตือนได้ กรุณาลองอีกครั้ง")
    }

    setIsLoading(false)
  }, [registration, requestPermission])

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const reg = registration || await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        // Unsubscribe จาก Push Manager
        await sub.unsubscribe()

        // แจ้ง server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }

      setIsSubscribed(false)
    } catch (e) {
      console.error("[Push] Unsubscribe error:", e)
      setError("ไม่สามารถปิดการแจ้งเตือนได้")
    }

    setIsLoading(false)
  }, [registration])

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  }
}

// =============================================================================
// Utility: Convert VAPID key to Uint8Array
// =============================================================================
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}
