"use client"

import { useEffect } from "react"
import { Printer } from "lucide-react"

export function QuotationPrintButton({ autoPrint }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      // Small delay to ensure page is fully rendered
      const timer = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timer)
    }
  }, [autoPrint])

  return (
    <button
      onClick={() => window.print()}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
    >
      <Printer className="h-4 w-4" />
      พิมพ์ใบเสนอราคา
    </button>
  )
}
