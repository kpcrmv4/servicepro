"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createJob, getTechnicians } from "@/lib/actions/jobs"
import { getCustomers } from "@/lib/actions/customers"

const jobTypes = [
  { value: "repair", label: "ซ่อม" },
  { value: "maintenance", label: "บำรุงรักษา" },
  { value: "inspection", label: "ตรวจเช็ค" },
  { value: "insurance", label: "ประกัน" },
  { value: "warranty", label: "รับประกัน" },
  { value: "other", label: "อื่นๆ" },
]

const priorities = [
  { value: "normal", label: "ปกติ" },
  { value: "urgent", label: "ด่วน" },
  { value: "low", label: "รอได้" },
]

type CustomerData = Record<string, unknown> & {
  id: string
  name: string
  vehicles?: Array<Record<string, unknown>>
}

export default function NewJobPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [technicians, setTechnicians] = useState<Record<string, unknown>[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [vehicles, setVehicles] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([getCustomers(), getTechnicians()]).then(([c, t]) => {
      setCustomers(c as CustomerData[])
      setTechnicians(t)
    })
  }, [])

  useEffect(() => {
    const customer = customers.find((c) => c.id === selectedCustomerId)
    setVehicles((customer?.vehicles as Record<string, unknown>[]) || [])
  }, [selectedCustomerId, customers])

  async function handleSubmit(formData: FormData) {
    setError("")
    startTransition(async () => {
      const result = await createJob(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push(`/dashboard/jobs/${result.id}`)
      }
    })
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 pt-1 sm:gap-4 sm:px-6 sm:pt-2">
        <Link href="/dashboard/jobs" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold sm:text-xl">สร้าง Job Order</h1>
      </div>

      <form action={handleSubmit} className="space-y-4 px-3 sm:space-y-6 sm:px-6 max-w-2xl">
        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Customer */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ลูกค้า <span className="text-error">*</span></label>
          <select
            name="customer_id"
            required
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">เลือกลูกค้า</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</option>
            ))}
          </select>
        </div>

        {/* Vehicle */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">รถ <span className="text-error">*</span></label>
          <select
            name="vehicle_id"
            required
            disabled={!selectedCustomerId}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">{selectedCustomerId ? "เลือกรถ" : "เลือกลูกค้าก่อน"}</option>
            {vehicles.map((v) => (
              <option key={v.id as string} value={v.id as string}>
                {v.license_plate as string} - {v.brand as string} {v.model as string}
              </option>
            ))}
          </select>
        </div>

        {/* Type & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">ประเภทงาน</label>
            <select
              name="type"
              defaultValue="repair"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {jobTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priority</label>
            <select
              name="priority"
              defaultValue="normal"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Technician */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ช่างที่รับผิดชอบ</label>
          <select
            name="assigned_to"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">ยังไม่กำหนด</option>
            {technicians.map((t) => (
              <option key={t.id as string} value={t.id as string}>{t.full_name as string}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">รายละเอียดงาน</label>
          <textarea
            name="description"
            rows={4}
            placeholder="อาการเสีย, งานที่ต้องทำ..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Bay Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ช่องซ่อม (Bay)</label>
          <input
            type="text"
            name="bay_number"
            placeholder="เช่น Bay 1, Bay 2"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">หมายเหตุ</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="หมายเหตุเพิ่มเติม..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "กำลังสร้าง..." : "สร้าง Job Order"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ยกเลิก
          </Button>
        </div>
      </form>
    </div>
  )
}
