"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { create } from "zustand"

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        success: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
        error: "border-destructive/50 bg-destructive/10 text-destructive",
        warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
        info: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type ToastVariant = "default" | "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => string
  removeToast: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    return id
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

export function toast(props: Omit<Toast, "id">) {
  return useToastStore.getState().addToast(props)
}

export function useToast() {
  const toasts = useToastStore((state) => state.toasts)
  const addToast = useToastStore((state) => state.addToast)
  const removeToast = useToastStore((state) => state.removeToast)

  return {
    toasts,
    toast: (props: Omit<Toast, "id">) => addToast(props),
    dismiss: (id: string) => removeToast(id),
  }
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  React.useEffect(() => {
    const duration = t.duration ?? 5000
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [t.duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(toastVariants({ variant: t.variant }))}
    >
      <div className="flex-1">
        {t.title && <div className="text-sm font-semibold">{t.title}</div>}
        {t.description && (
          <div className="text-sm opacity-90">{t.description}</div>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  React.useEffect(() => setMounted(true), [])

  return (
    <>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex max-w-[420px] flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {toasts.map((t) => (
                <ToastItem
                  key={t.id}
                  toast={t}
                  onDismiss={() => removeToast(t.id)}
                />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </>
  )
}

export { toastVariants }
