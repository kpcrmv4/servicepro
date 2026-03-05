"use client"

import { useState, useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
} from "lucide-react"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหา... (⌘K)"
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              A
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-[10px] text-muted-foreground">Owner</p>
            </div>
            <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg animate-fade-in">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@example.com</p>
              </div>
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors">
                <User className="h-4 w-4" />
                แก้ไขโปรไฟล์
              </button>
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors">
                <Settings className="h-4 w-4" />
                ตั้งค่า
              </button>
              <div className="my-1 border-t border-border" />
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-error hover:bg-error-light transition-colors">
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
