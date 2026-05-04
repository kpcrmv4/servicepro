"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { create } from "zustand"

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-3.5 shadow-[var(--shadow-raised)] transition-all",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        success: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
        error: "border-destructive/40 bg-destructive/10 text-destructive",
        warning: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
        info: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        loading: "border-border bg-card text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  /** Override default duration (ms). Pass `Infinity` to keep open until dismissed. */
  duration?: number
  /** Optional action button rendered inline */
  action?: { label: string; onClick: () => void }
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, "id"> & { id?: string }) => string
  update: (id: string, patch: Partial<Toast>) => void
  remove: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (input) => {
    const id = input.id ?? Math.random().toString(36).slice(2, 9)
    set((state) => {
      // replace existing with same id (lets `update` flow)
      const next = state.toasts.filter((t) => t.id !== id)
      return { toasts: [...next, { ...input, id }] }
    })
    return id
  },
  update: (id, patch) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

// =============================================================================
// Public API — sonner-style helpers
// =============================================================================

type ToastInput = Omit<Toast, "id" | "variant">

function show(input: Omit<Toast, "id">): string {
  return useToastStore.getState().add(input)
}

export const toast = Object.assign(
  (input: ToastInput) => show({ ...input, variant: "default" }),
  {
    success: (input: ToastInput | string) =>
      show(typeof input === "string" ? { title: input, variant: "success" } : { ...input, variant: "success" }),
    error: (input: ToastInput | string) =>
      show(typeof input === "string" ? { title: input, variant: "error" } : { ...input, variant: "error" }),
    warning: (input: ToastInput | string) =>
      show(typeof input === "string" ? { title: input, variant: "warning" } : { ...input, variant: "warning" }),
    info: (input: ToastInput | string) =>
      show(typeof input === "string" ? { title: input, variant: "info" } : { ...input, variant: "info" }),
    loading: (input: ToastInput | string) => {
      const base = typeof input === "string" ? { title: input } : input
      return show({ ...base, variant: "loading", duration: Infinity })
    },
    dismiss: (id?: string) => {
      const store = useToastStore.getState()
      if (id) store.remove(id)
      else store.toasts.forEach((t) => store.remove(t.id))
    },
    /**
     * Show a loading toast that swaps to success/error when a promise resolves.
     *
     * ```ts
     * toast.promise(saveJob(), {
     *   loading: "กำลังบันทึก...",
     *   success: "บันทึกแล้ว",
     *   error: (e) => `ผิดพลาด: ${e.message}`
     * })
     * ```
     */
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((err: unknown) => string)
      },
    ): Promise<T> => {
      const id = show({ title: messages.loading, variant: "loading", duration: Infinity })
      return promise
        .then((data) => {
          const title =
            typeof messages.success === "function" ? messages.success(data) : messages.success
          useToastStore.getState().update(id, {
            title,
            variant: "success",
            duration: 5000,
          })
          return data
        })
        .catch((err) => {
          const title =
            typeof messages.error === "function" ? messages.error(err) : messages.error
          useToastStore.getState().update(id, {
            title,
            variant: "error",
            duration: 5000,
          })
          throw err
        })
    },
  },
)

export function useToast() {
  const toasts = useToastStore((state) => state.toasts)
  const add = useToastStore((state) => state.add)
  const remove = useToastStore((state) => state.remove)
  return {
    toasts,
    toast: (props: Omit<Toast, "id">) => add(props),
    dismiss: (id: string) => remove(id),
  }
}

// =============================================================================
// Render
// =============================================================================

const variantIcon: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  React.useEffect(() => {
    const duration = t.duration ?? 5000
    if (!isFinite(duration)) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [t.duration, onDismiss])

  const Icon = variantIcon[t.variant ?? "default"]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(toastVariants({ variant: t.variant }))}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          t.variant === "loading" && "animate-spin",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        {t.title && <div className="text-sm font-semibold leading-tight">{t.title}</div>}
        {t.description && (
          <div className="mt-0.5 text-xs opacity-90">{t.description}</div>
        )}
        {t.action && (
          <button
            type="button"
            onClick={() => {
              t.action!.onClick()
              onDismiss()
            }}
            className="mt-2 text-xs font-semibold underline-offset-2 hover:underline"
          >
            {t.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
        aria-label="ปิดการแจ้งเตือน"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  const toasts = useToastStore((state) => state.toasts)
  const remove = useToastStore((state) => state.remove)

  React.useEffect(() => setMounted(true), [])

  return (
    <>
      {children}
      {mounted &&
        createPortal(
          <div
            className="pointer-events-none fixed bottom-[max(env(safe-area-inset-bottom),1rem)] right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:bottom-4"
            role="region"
            aria-label="Notifications"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((t) => (
                <ToastItem
                  key={t.id}
                  toast={t}
                  onDismiss={() => remove(t.id)}
                />
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </>
  )
}

export { toastVariants }
