"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { PWARegister } from "@/components/pwa/pwa-register"
import { SyncStatus } from "@/components/pwa/sync-status"
import { ToastProvider } from "@/components/ui/toast"
import { CommandPalette } from "@/components/command-palette"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            "flex flex-col transition-all duration-200",
            sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]",
          )}
        >
          <Header onMenuClick={() => setMobileOpen(true)} />

          <main className="flex-1 pb-24 sm:p-1 lg:p-2 lg:pb-6">{children}</main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav />

        {/* PWA Registration & Install/Update Prompts */}
        <PWARegister />

        {/* Connectivity + sync queue indicator */}
        <SyncStatus />

        {/* ⌘K Command Palette */}
        <CommandPalette />
      </div>
    </ToastProvider>
  )
}
