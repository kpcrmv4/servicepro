import Link from "next/link"
import { Car, CalendarPlus, Phone, MessageCircle, ChevronRight, Wrench, Tag } from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { createServerClient } from "@/lib/supabase/server"

const statusLabels: Record<string, string> = {
  pending: "รอรับรถ",
  checked_in: "รับรถแล้ว",
  diagnosing: "ตรวจสอบ",
  in_progress: "กำลังซ่อม",
  waiting_parts: "รออะไหล่",
  completed: "เสร็จแล้ว",
  delivered: "ส่งมอบแล้ว",
}

export default async function CustomerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>
}) {
  const params = await searchParams
  const phone = params.phone

  const supabase = await createServerClient()

  let customer: Record<string, unknown> | null = null
  let vehicles: Record<string, unknown>[] = []
  let activeJobs: Record<string, unknown>[] = []

  if (phone) {
    const { data: cust } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .single()

    if (cust) {
      customer = cust

      const { data: vehs } = await supabase
        .from("vehicles")
        .select("*")
        .eq("customer_id", cust.id)

      vehicles = vehs || []

      const { data: jobs } = await supabase
        .from("jobs")
        .select("*, vehicles(license_plate, brand, model)")
        .eq("customer_id", cust.id)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: false })

      activeJobs = jobs || []
    }
  }

  return (
    <div className="p-4 space-y-5">
      {/* Search by Phone */}
      {!customer && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-primary mx-auto mb-3" />
            <h1 className="text-xl font-bold">ServicePro</h1>
            <p className="text-sm text-muted-foreground mt-1">ค้นหาข้อมูลด้วยเบอร์โทรศัพท์</p>
          </div>
          <form className="space-y-3">
            <input
              type="tel"
              name="phone"
              placeholder="กรอกเบอร์โทรศัพท์..."
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              ค้นหา
            </button>
          </form>
        </div>
      )}

      {/* Customer Found */}
      {customer && (
        <>
          {/* Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                สวัสดี, {customer.name as string}
              </h1>
              <p className="text-sm text-muted-foreground">ยินดีต้อนรับ</p>
            </div>
          </div>

          {/* My Vehicles */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">รถของฉัน</h2>
              <span className="text-xs text-muted-foreground">{vehicles.length} คัน</span>
            </div>
            <div className="space-y-3">
              {vehicles.map((v) => (
                <Link
                  key={v.id as string}
                  href={`/c/vehicles/${v.id}?phone=${phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      {v.brand as string} {v.model as string}
                    </p>
                    <p className="text-xs text-muted-foreground">{v.license_plate as string}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
              {vehicles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีรถ</p>
              )}
            </div>
          </section>

          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <section>
              <h2 className="font-semibold text-foreground mb-3">งานปัจจุบัน</h2>
              {activeJobs.map((job) => {
                const vehicle = job.vehicles as Record<string, unknown> | null
                return (
                  <Link
                    key={job.id as string}
                    href={job.job_number ? `/c/track/${job.job_number}` : "#"}
                    className="block p-4 rounded-xl border border-border bg-card mb-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{job.job_number as string}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {statusLabels[job.status as string] || job.status as string}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{job.description as string || "งานซ่อม"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {vehicle?.license_plate as string} {vehicle?.brand as string} {vehicle?.model as string}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(job.created_at as string)}
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                )
              })}
            </section>
          )}

          {/* Quick Actions */}
          <section>
            <h2 className="font-semibold text-foreground mb-3">เมนูลัด</h2>
            <div className="grid grid-cols-3 gap-3">
              <Link href={`/c/booking?phone=${phone}`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarPlus className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">จองคิว</span>
              </Link>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-success" />
                </div>
                <span className="text-xs font-medium text-foreground">โทรหาร้าน</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                <div className="h-10 w-10 rounded-full bg-[#06C755]/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-[#06C755]" />
                </div>
                <span className="text-xs font-medium text-foreground">แชท Line</span>
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
