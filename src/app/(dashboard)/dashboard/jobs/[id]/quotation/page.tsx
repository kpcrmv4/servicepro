"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Save,
  Loader2,
  FileText,
  MessageCircle,
  Link2,
  QrCode,
  Copy,
  Check,
  Printer,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { QRCodeImage } from "@/components/ui/qr-code"
import { getJob } from "@/lib/actions/jobs"
import {
  createQuotation,
  updateQuotation,
  sendQuotationToCustomer,
  getQuotationByJobId,
  type QuotationItem,
} from "@/lib/actions/quotations"
import { sendQuotationViaLine } from "@/lib/actions/quotation-line"

interface LineItem {
  type: "part" | "labor" | "other"
  description: string
  quantity: number
  unitPrice: number
  discount: number
}

const emptyItem: LineItem = {
  type: "part",
  description: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function QuotationPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [job, setJob] = useState<Record<string, unknown> | null>(null)
  const [existingQuotation, setExistingQuotation] = useState<Record<string, unknown> | null>(null)
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [jobData, qtData] = await Promise.all([
        getJob(jobId),
        getQuotationByJobId(jobId),
      ])
      setJob(jobData)
      if (qtData) {
        setExistingQuotation(qtData)
        const existingItems = (qtData.items as LineItem[]) || []
        if (existingItems.length > 0) {
          setItems(existingItems.map((i) => ({
            type: i.type || "part",
            description: i.description || "",
            quantity: Number(i.quantity) || 1,
            unitPrice: Number(i.unitPrice) || 0,
            discount: Number(i.discount) || 0,
          })))
        }
        setNotes((qtData.notes as string) || "")
      }
      setLoading(false)
    }
    loadData()
  }, [jobId])

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function getItemTotal(item: LineItem) {
    return (item.quantity * item.unitPrice) - item.discount
  }

  const subtotal = items.reduce((sum, item) => sum + getItemTotal(item), 0)
  const vat = Math.round(subtotal * 0.07 * 100) / 100
  const total = subtotal + vat

  function handleSave() {
    setError("")
    setSuccess("")

    const validItems = items.filter((i) => i.description.trim() && i.unitPrice > 0)
    if (validItems.length === 0) {
      setError("กรุณาเพิ่มรายการอย่างน้อย 1 รายการ")
      return
    }

    startTransition(async () => {
      const qtItems: QuotationItem[] = validItems.map((i) => ({
        type: i.type,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
      }))

      if (existingQuotation) {
        const result = await updateQuotation(existingQuotation.id as string, qtItems, notes)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess("บันทึกใบเสนอราคาแล้ว")
        }
      } else {
        const result = await createQuotation(jobId, qtItems, notes)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess("สร้างใบเสนอราคาแล้ว")
          // Reload to get the created quotation
          const qtData = await getQuotationByJobId(jobId)
          if (qtData) setExistingQuotation(qtData)
        }
      }
    })
  }

  function handleSendToCustomer() {
    if (!existingQuotation) {
      setError("กรุณาบันทึกใบเสนอราคาก่อน")
      return
    }

    setError("")
    setSuccess("")

    startTransition(async () => {
      const result = await sendQuotationToCustomer(existingQuotation.id as string, jobId)
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/dashboard/jobs/${jobId}`)
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!job) return null

  const customer = job.customers as Record<string, unknown> | null
  const vehicle = job.vehicles as Record<string, unknown> | null
  const quotationStatus = existingQuotation?.status as string | undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-2 sm:px-6">
        <Link
          href={`/dashboard/jobs/${jobId}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {existingQuotation
              ? `ใบเสนอราคา ${existingQuotation.quotation_number as string}`
              : "สร้างใบเสนอราคา"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {job.job_number as string} - {customer?.name as string} - {vehicle?.license_plate as string}
          </p>
        </div>
      </div>

      <div className="max-w-3xl px-4 sm:px-6 space-y-6">
        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">
            {success}
          </div>
        )}

        {/* Job summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">ลูกค้า</p>
            <p className="text-sm font-medium">{customer?.name as string}</p>
            <p className="text-xs text-muted-foreground">{customer?.phone as string}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">รถ</p>
            <p className="text-sm font-medium">{vehicle?.license_plate as string}</p>
            <p className="text-xs text-muted-foreground">
              {vehicle?.brand as string} {vehicle?.model as string}
            </p>
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              รายการ
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" /> เพิ่มรายการ
            </Button>
          </div>
          <Separator />

          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  รายการที่ {index + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-muted-foreground hover:text-error transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                <div>
                  <Label>ประเภท</Label>
                  <div className="mt-1">
                    <Select
                      value={item.type}
                      onValueChange={(v) => updateItem(index, "type", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="part">อะไหล่</SelectItem>
                        <SelectItem value="labor">ค่าแรง</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>รายละเอียด</Label>
                  <Input
                    className="mt-1 h-9"
                    placeholder="ชื่อรายการ..."
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>จำนวน</Label>
                  <Input
                    className="mt-1 h-9"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>ราคา/หน่วย</Label>
                  <Input
                    className="mt-1 h-9"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>ส่วนลด</Label>
                  <Input
                    className="mt-1 h-9"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discount}
                    onChange={(e) => updateItem(index, "discount", Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="text-right text-sm font-medium">
                รวม: {formatCurrency(getItemTotal(item))} บาท
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">รวมก่อน VAT</span>
            <span>{formatCurrency(subtotal)} บาท</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT 7%</span>
            <span>{formatCurrency(vat)} บาท</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>รวมทั้งหมด</span>
            <span className="text-primary">{formatCurrency(total)} บาท</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>หมายเหตุ</Label>
          <Textarea
            className="mt-1.5 min-h-[80px]"
            placeholder="เงื่อนไข, ข้อตกลง, หมายเหตุเพิ่มเติม..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="space-y-4 pb-6">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              บันทึกใบเสนอราคา
            </Button>

            {existingQuotation && quotationStatus === "draft" && (
              <Button
                type="button"
                onClick={handleSendToCustomer}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                ส่งใบเสนอราคาให้ลูกค้า
              </Button>
            )}
          </div>

          {/* Sharing section - show after quotation is sent */}
          {existingQuotation && (quotationStatus === "sent" || quotationStatus === "draft") && (
            <QuotationSharePanel
              quotationId={existingQuotation.id as string}
              jobId={jobId}
              status={quotationStatus || "draft"}
              isPending={isPending}
              startTransition={startTransition}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function QuotationSharePanel({
  quotationId,
  jobId,
  status,
  isPending,
  startTransition,
  setError,
  setSuccess,
}: {
  quotationId: string
  jobId: string
  status: string
  isPending: boolean
  startTransition: (fn: () => Promise<void>) => void
  setError: (s: string) => void
  setSuccess: (s: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [lineSending, setLineSending] = useState(false)

  const quotationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/c/quotation/${quotationId}`
    : `/c/quotation/${quotationId}`

  function handleCopyLink() {
    navigator.clipboard.writeText(quotationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSendViaLine() {
    setLineSending(true)
    setError("")
    startTransition(async () => {
      const result = await sendQuotationViaLine(quotationId, jobId)
      setLineSending(false)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("ส่งใบเสนอราคาทาง LINE แล้ว")
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Send className="h-4 w-4 text-primary" />
        ส่งใบเสนอราคาให้ลูกค้า
      </div>

      {status === "sent" && (
        <div className="rounded-lg border border-info/30 bg-info/10 p-2 text-xs text-info text-center font-medium">
          ส่งให้ลูกค้าแล้ว - รออนุมัติ
        </div>
      )}

      {/* Send via LINE */}
      <button
        onClick={handleSendViaLine}
        disabled={isPending}
        className="flex w-full items-center gap-3 rounded-lg border border-[#06C755]/30 bg-[#06C755]/5 px-4 py-3 text-sm font-medium text-[#06C755] hover:bg-[#06C755]/10 transition-colors disabled:opacity-50"
      >
        <MessageCircle className="h-5 w-5" />
        <div className="flex-1 text-left">
          <p>ส่งทาง LINE</p>
          <p className="text-xs text-muted-foreground font-normal">ส่งใบเสนอราคาพร้อมปุ่มอนุมัติ</p>
        </div>
        {lineSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </button>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Link2 className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 text-left">
          <p>คัดลอกลิงก์</p>
          <p className="text-xs text-muted-foreground font-normal">ส่งลิงก์ผ่านช่องทางอื่น (SMS, Email)</p>
        </div>
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* QR Code toggle */}
      <button
        onClick={() => setShowQR(!showQR)}
        className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
      >
        <QrCode className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 text-left">
          <p>QR Code</p>
          <p className="text-xs text-muted-foreground font-normal">ให้ลูกค้าสแกนเปิดใบเสนอราคา</p>
        </div>
      </button>

      {showQR && (
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="rounded-xl border border-border bg-white p-3">
            <QRCodeImage value={quotationUrl} size={200} />
          </div>
          <p className="text-xs text-muted-foreground">สแกนเพื่อดูใบเสนอราคาและอนุมัติ</p>
        </div>
      )}

      {/* Print */}
      <button
        onClick={() => window.open(`/c/quotation/${quotationId}?print=1`, '_blank')}
        className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Printer className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 text-left">
          <p>พิมพ์ใบเสนอราคา</p>
          <p className="text-xs text-muted-foreground font-normal">เปิดหน้าพิมพ์ใบเสนอราคา</p>
        </div>
      </button>
    </div>
  )
}
