"use client"

import { useState, useEffect, useTransition } from "react"
import { QRCodeImage } from "@/components/ui/qr-code"
import { MessageCircle, CheckCircle, Link2, Loader2 } from "lucide-react"
import { getLineOAConfig } from "@/lib/actions/line"

export function LineLinkCard({
  customerId,
  customerName,
  isLinked,
}: {
  customerId: string
  customerName: string
  isLinked: boolean
}) {
  const [botBasicId, setBotBasicId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getLineOAConfig()
        if (config?.channel_id) {
          // LINE OA bot basic ID format: @xxx
          // The friend add URL uses the bot basic ID or channel ID
          setBotBasicId(config.channel_id)
        }
      } catch {
        // LINE not configured
      }
      setLoading(false)
    }
    loadConfig()
  }, [])

  if (loading) return null
  if (!botBasicId) return null
  if (isLinked) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">เชื่อมต่อ LINE แล้ว</span>
        </div>
      </div>
    )
  }

  // Generate LINE add friend URL
  // Use LIFF or the standard add friend URL
  const lineAddFriendUrl = `https://line.me/R/ti/p/@${botBasicId}`

  function handleCopyLink() {
    navigator.clipboard.writeText(lineAddFriendUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-[#06C755]/30 bg-[#06C755]/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-5 w-5 text-[#06C755]" />
        <h2 className="text-sm font-semibold">เชื่อมต่อ LINE</h2>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        ให้ลูกค้าสแกน QR Code เพิ่มเพื่อนใน LINE เพื่อรับแจ้งเตือนสถานะงานซ่อมและใบเสนอราคา
      </p>

      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <div className="rounded-xl border border-border bg-white p-3">
          <QRCodeImage value={lineAddFriendUrl} size={180} />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mb-3">
        สแกนเพื่อเพิ่มเพื่อนใน LINE
      </p>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Link2 className="h-3 w-3" />
        {copied ? "คัดลอกแล้ว!" : "คัดลอกลิงก์"}
      </button>

      <p className="text-[10px] text-muted-foreground text-center mt-3">
        หลังลูกค้าเพิ่มเพื่อนแล้ว ระบบจะผูกบัญชี LINE กับ {customerName} อัตโนมัติ
      </p>
    </div>
  )
}
