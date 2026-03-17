import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { CheckCircle, XCircle, FileText, Car, User, Clock } from "lucide-react"
import { QuotationApprovalButtons } from "./approval-buttons"

export default async function CustomerQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: quotation } = await supabase
    .from("quotations")
    .select("*, customers(name, phone), vehicles(license_plate, brand, model), jobs(job_number, description)")
    .eq("id", id)
    .single()

  if (!quotation) {
    notFound()
  }

  const customer = quotation.customers as Record<string, unknown> | null
  const vehicle = quotation.vehicles as Record<string, unknown> | null
  const job = quotation.jobs as Record<string, unknown> | null
  const items = (quotation.items as Record<string, unknown>[]) || []
  const status = quotation.status as string

  const isActionable = status === "sent"

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold">ใบเสนอราคา</h1>
        <p className="text-sm text-muted-foreground">{quotation.quotation_number as string}</p>
      </div>

      {/* Status */}
      {status === "approved" && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
          <CheckCircle className="h-8 w-8 text-success mx-auto mb-1" />
          <p className="text-sm font-medium text-success">อนุมัติแล้ว</p>
          <p className="text-xs text-muted-foreground">
            {quotation.approved_at ? `เมื่อ ${formatDateShort(quotation.approved_at as string)}` : ""}
          </p>
        </div>
      )}
      {status === "rejected" && (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-center">
          <XCircle className="h-8 w-8 text-error mx-auto mb-1" />
          <p className="text-sm font-medium text-error">ไม่อนุมัติ</p>
        </div>
      )}
      {status === "expired" && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-center">
          <Clock className="h-8 w-8 text-warning mx-auto mb-1" />
          <p className="text-sm font-medium text-warning">ใบเสนอราคาหมดอายุ</p>
        </div>
      )}

      {/* Vehicle & Customer */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {vehicle && (
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-primary">{vehicle.license_plate as string}</p>
              <p className="text-xs text-muted-foreground">{vehicle.brand as string} {vehicle.model as string}</p>
            </div>
          </div>
        )}
        {customer && (
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{customer.name as string}</p>
              {customer.phone ? <p className="text-xs text-muted-foreground">{String(customer.phone)}</p> : null}
            </div>
          </div>
        )}
        {job && (
          <div className="text-xs text-muted-foreground">
            งานซ่อม: {String(job.job_number)}
            {job.description ? ` - ${String(job.description)}` : null}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">รายการ</h2>
        <div className="space-y-3">
          {items.map((item, i) => {
            const typeLabels: Record<string, string> = { part: "อะไหล่", labor: "ค่าแรง", other: "อื่นๆ" }
            const qty = Number(item.quantity) || 1
            const unitPrice = Number(item.unitPrice) || 0
            const discount = Number(item.discount) || 0
            const lineTotal = (qty * unitPrice) - discount
            return (
              <div key={i} className="border-b border-border last:border-0 pb-2 last:pb-0">
                <div className="flex justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">{typeLabels[item.type as string] || "อื่นๆ"}</span>
                    <p className="text-sm font-medium">{item.description as string}</p>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(lineTotal)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {qty} x {formatCurrency(unitPrice)}
                  {discount > 0 && ` (ส่วนลด ${formatCurrency(discount)})`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">รวมก่อน VAT</span>
          <span>{formatCurrency(Number(quotation.subtotal) || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">VAT 7%</span>
          <span>{formatCurrency(Number(quotation.vat) || 0)}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
          <span>ยอดรวม</span>
          <span className="text-primary">{formatCurrency(Number(quotation.total) || 0)}</span>
        </div>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-1">หมายเหตุ</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.notes as string}</p>
        </div>
      )}

      {/* Validity */}
      {quotation.valid_until && (
        <p className="text-center text-xs text-muted-foreground">
          ใบเสนอราคามีผลถึง {formatDateShort(quotation.valid_until as string)}
        </p>
      )}

      {/* Approval buttons */}
      {isActionable && (
        <QuotationApprovalButtons quotationId={quotation.id as string} jobId={quotation.job_id as string} />
      )}
    </div>
  )
}
