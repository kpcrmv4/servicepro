import { ArrowLeft, Car, Wrench, Calendar, DollarSign } from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { getVehicleWithHistory } from "@/lib/actions/customer-portal"
import Link from "next/link"
import { notFound } from "next/navigation"

const statusLabels: Record<string, string> = {
  pending: "รอรับรถ",
  checked_in: "รับรถแล้ว",
  diagnosing: "ตรวจสอบ",
  in_progress: "กำลังซ่อม",
  waiting_parts: "รออะไหล่",
  completed: "เสร็จแล้ว",
  delivered: "ส่งมอบแล้ว",
  cancelled: "ยกเลิก",
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const vehicle = await getVehicleWithHistory(id)

  if (!vehicle) {
    notFound()
  }

  const jobs = (vehicle.jobs as Record<string, unknown>[]) || []

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/c" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">{vehicle.license_plate as string}</h1>
          <p className="text-xs text-muted-foreground">{vehicle.brand as string} {vehicle.model as string}</p>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-primary">{vehicle.license_plate as string}</p>
            <p className="text-sm">{vehicle.brand as string} {vehicle.model as string} {vehicle.year ? `(${vehicle.year})` : ""}</p>
            {vehicle.color && <p className="text-xs text-muted-foreground">สี: {vehicle.color as string}</p>}
            {vehicle.vin && <p className="text-xs text-muted-foreground font-mono">VIN: {vehicle.vin as string}</p>}
            {vehicle.current_mileage && (
              <p className="text-xs text-muted-foreground">เลขไมล์: {Number(vehicle.current_mileage).toLocaleString()} km</p>
            )}
          </div>
        </div>
      </div>

      {/* Service History */}
      <section>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" /> ประวัติการซ่อม
        </h2>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id as string} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-primary">{job.job_number as string}</span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  job.status === "completed" || job.status === "delivered"
                    ? "bg-success/10 text-success"
                    : job.status === "cancelled"
                    ? "bg-error/10 text-error"
                    : "bg-primary/10 text-primary"
                )}>
                  {statusLabels[job.status as string] || job.status as string}
                </span>
              </div>
              <p className="text-sm text-foreground">{job.description as string || "งานซ่อม"}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateShort(job.created_at as string)}
                </span>
                {(Number(job.grand_total) > 0) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(Number(job.grand_total))}
                  </span>
                )}
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีประวัติการซ่อม</p>
          )}
        </div>
      </section>
    </div>
  )
}
