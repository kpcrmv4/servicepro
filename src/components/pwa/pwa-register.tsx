"use client"

import { useEffect, useState } from "react"
import { Download, X, RefreshCw } from "lucide-react"

// =============================================================================
// PWA Service Worker Registration & Install Prompt
// =============================================================================

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    // Register service worker
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })
        setRegistration(reg)
        console.log("[PWA] Service Worker registered:", reg.scope)

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available
                setShowUpdateBanner(true)
              }
            })
          }
        })
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error)
      }
    }

    registerSW()

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      // Show install banner after 30 seconds if not already installed
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 30000)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      setShowInstallBanner(false)
      setInstallPrompt(null)
      console.log("[PWA] App installed successfully")
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promptEvent = installPrompt as any
    promptEvent.prompt()
    const result = await promptEvent.userChoice
    if (result.outcome === "accepted") {
      console.log("[PWA] User accepted install prompt")
    }
    setInstallPrompt(null)
    setShowInstallBanner(false)
  }

  const handleDismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
      window.location.reload()
    }
  }

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && installPrompt && (
        <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300 sm:bottom-6">
          <div className="rounded-2xl border border-border bg-background p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                KP
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">ติดตั้ง KPServicePro</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ติดตั้งเป็นแอปเพื่อเข้าถึงได้เร็วขึ้นและรับการแจ้งเตือน
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ติดตั้ง
                  </button>
                  <button
                    onClick={handleDismissInstall}
                    className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    ไว้ทีหลัง
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissInstall}
                className="shrink-0 rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Banner */}
      {showUpdateBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">มีเวอร์ชันใหม่</p>
                <p className="text-xs text-muted-foreground">กดอัปเดตเพื่อใช้งานเวอร์ชันล่าสุด</p>
              </div>
              <button
                onClick={handleUpdate}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                อัปเดต
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
