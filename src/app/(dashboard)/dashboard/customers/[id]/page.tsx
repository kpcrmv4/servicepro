import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Crown,
  Star,
  Wrench,
  FileText,
  Calendar,
  DollarSign,
} from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { getCustomer, getCustomerJobs, getCustomerInvoices } from "@/lib/actions/customers"
import { EditCustomerButton } from "@/components/customers/customer-actions"
import { AddVehicleButton, EditVehicleCard } from "@/components/customers/vehicle-actions"
import { PageHeader } from "@/components/layout/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { notFound } from "next/navigation"

type MembershipTier = "bronze" | "silver" | "gold" | "platinum"

const tierConfig: Record<string, { label: string; color: string; bg: string }> = {
  bronze: { label: "Bronze", color: "text-amber-700", bg: "bg-amber-100" },
  silver: { label: "Silver", color: "text-gray-600", bg: "bg-gray-200" },
  gold: { label: "Gold", color: "text-yellow-600", bg: "bg-yellow-100" },
  platinum: { label: "Platinum", color: "text-purple-600", bg: "bg-purple-100" },
}

const jobStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "รอรับรถ", color: "bg-warning/10 text-warning" },
  checked_in: { label: "รับรถแล้ว", color: "bg-blue-100 text-blue-700" },
  diagnosing: { label: "ตรวจสอบ", color: "bg-purple-100 text-purple-700" },
  in_progress: { label: "กำลังซ่อม", color: "bg-primary/10 text-primary" },
  waiting_parts: { label: "รออะไหล่", color: "bg-orange-100 text-orange-700" },
  completed: { label: "เสร็จแล้ว", color: "bg-success/10 text-success" },
  delivered: { label: "ส่งมอบแล้ว", color: "bg-muted text-muted-foreground" },
  cancelled: { label: "ยกเลิก", color: "bg-error/10 text-error" },
}

const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: "ชำระแล้ว", color: "bg-success/10 text-success" },
  pending: { label: "รอชำระ", color: "bg-warning/10 text-warning" },
  overdue: { label: "เกินกำหนด", color: "bg-error/10 text-error" },
  partial: { label: "ชำระบางส่วน", color: "bg-blue-100 text-blue-700" },
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [customer, jobs, invoices] = await Promise.all([
    getCustomer(id),
    getCustomerJobs(id),
    getCustomerInvoices(id),
  ])

  if (!customer) {
    notFound()
  }

  const vehicles = (customer.vehicles as Record<string, unknown>[]) || []
  const tier = customer.membership_tier as MembershipTier | null
  const tierInfo = tier ? tierConfig[tier] : null

  const breadcrumb = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "ลูกค้า", href: "/dashboard/customers" },
    { title: customer.name as string },
  ]

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <Avatar className="h-9 w-9 bg-primary/10 text-primary">
              <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                {(customer.name as string).charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span>{customer.name as string}</span>
            {tierInfo && (
              <Badge tone="warn" dot className="text-xs">
                <Crown className="h-3 w-3" />
                {tierInfo.label}
              </Badge>
            )}
          </span>
        }
        description={customer.type === "company" ? "นิติบุคคล" : "บุคคล"}
        breadcrumb={breadcrumb}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/customers"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </Link>
            <EditCustomerButton customer={customer as Record<string, unknown>} />
          </div>
        }
      />

      <div className="grid gap-4 px-3 pb-6 sm:gap-6 sm:px-6 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> ข้อมูลติดต่อ
            </h2>
            <div className="space-y-3 text-sm">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{customer.phone as string}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{customer.email as string}</span>
                </div>
              )}
              {customer.line_id && (
                <div className="flex items-center gap-2">
                  <span className="flex h-3.5 w-3.5 items-center justify-center text-[10px] font-bold text-muted-foreground">L</span>
                  <span>{customer.line_id as string}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{customer.address as string}</span>
                </div>
              )}
              {customer.tax_id && (
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">เลขผู้เสียภาษี: {customer.tax_id as string}</span>
                </div>
              )}
              {!customer.phone && !customer.email && !customer.address && (
                <p className="text-muted-foreground">ไม่มีข้อมูลติดต่อ</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" /> สถิติ
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ใช้บริการ</span>
                <span className="font-medium">{Number(customer.total_visits) || 0} ครั้ง</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ยอดสะสม</span>
                <span className="font-medium">{formatCurrency(Number(customer.total_spending) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">คะแนนสะสม</span>
                <span className="font-medium">{Number(customer.loyalty_points) || 0} แต้ม</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">สมาชิกตั้งแต่</span>
                <span className="font-medium">{formatDateShort(customer.created_at as string)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-2">หมายเหตุ</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes as string}</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicles */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" /> รถยนต์ ({vehicles.length})
              </h2>
              <AddVehicleButton customerId={customer.id as string} />
            </div>
            {vehicles.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {vehicles.map((v: Record<string, unknown>) => (
                  <EditVehicleCard key={v.id as string} vehicle={v} customerId={customer.id as string} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลรถ</p>
            )}
          </div>

          {/* Jobs History */}
          <div className="rounded-xl border border-border bg-card">
            <div className="p-5 pb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" /> ประวัติงานซ่อม ({jobs.length})
              </h2>
            </div>
            {jobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">เลข Job</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">ทะเบียน</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">ยอดรวม</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job: Record<string, unknown>) => {
                      const vehicle = job.vehicles as Record<string, unknown> | null
                      const status = job.status as string
                      return (
                        <tr key={job.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5">
                            <Link href={`/dashboard/jobs/${job.id}`} className="text-sm font-medium text-primary hover:underline">
                              {job.job_number as string}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-sm">{vehicle?.license_plate as string || "-"}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                              jobStatusConfig[status]?.color || "bg-muted text-muted-foreground"
                            )}>
                              {jobStatusConfig[status]?.label || status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-medium">{formatCurrency(Number(job.grand_total) || 0)}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatDateShort(job.created_at as string)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 pb-5 text-sm text-muted-foreground">ยังไม่มีประวัติงานซ่อม</p>
            )}
          </div>

          {/* Invoices */}
          <div className="rounded-xl border border-border bg-card">
            <div className="p-5 pb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> ใบแจ้งหนี้ ({invoices.length})
              </h2>
            </div>
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">เลขที่</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Job</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: Record<string, unknown>) => {
                      const job = inv.jobs as Record<string, unknown> | null
                      const status = inv.payment_status as string
                      return (
                        <tr key={inv.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5 text-sm font-medium text-primary">{inv.invoice_number as string}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{job?.job_number as string || "-"}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-medium">{formatCurrency(Number(inv.total) || 0)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                              invoiceStatusConfig[status]?.color || "bg-muted text-muted-foreground"
                            )}>
                              {invoiceStatusConfig[status]?.label || status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatDateShort(inv.created_at as string)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 pb-5 text-sm text-muted-foreground">ยังไม่มีใบแจ้งหนี้</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
