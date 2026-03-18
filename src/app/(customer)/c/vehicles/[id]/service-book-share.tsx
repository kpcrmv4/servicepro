"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { QRCodeImage } from "@/components/ui/qr-code"

interface ServiceBookShareProps {
  vehicleId: string
  licensePlate: string
}

export default function ServiceBookShare({ vehicleId, licensePlate }: ServiceBookShareProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/c/vehicles/${vehicleId}`
    : ""

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col items-center gap-3">
        <QRCodeImage value={shareUrl || `placeholder-${vehicleId}`} size={160} className="rounded-lg" />
        <p className="text-xs text-muted-foreground text-center">
          สแกน QR Code เพื่อดูสมุดซ่อมรถ {licensePlate}
        </p>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted active:bg-muted/80 transition-colors min-h-[44px]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-success" />
              คัดลอกแล้ว
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              คัดลอกลิงก์
            </>
          )}
        </button>
      </div>
    </div>
  )
}
