"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  User,
  Car,
  Wrench,
  AlertTriangle,
  UserCog,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/layout/page-header"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { RadioGroup, SegmentedItem } from "@/components/ui/radio-group"
import { FormField, FormSection } from "@/components/ui/form-field"
import { toast } from "@/components/ui/toast"
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
  { value: "low", label: "รอได้" },
  { value: "normal", label: "ปกติ" },
  { value: "urgent", label: "ด่วน" },
]

type CustomerData = {
  id: string
  name: string
  phone?: string
  vehicles?: VehicleData[]
}

type VehicleData = {
  id: string
  license_plate?: string
  brand?: string
  model?: string
}

type TechnicianData = {
  id: string
  full_name?: string
  role?: string
}

export default function NewJobPage() {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [customers, setCustomers] = React.useState<CustomerData[]>([])
  const [technicians, setTechnicians] = React.useState<TechnicianData[]>([])

  const [customerId, setCustomerId] = React.useState("")
  const [vehicleId, setVehicleId] = React.useState("")
  const [technicianId, setTechnicianId] = React.useState("")
  const [jobType, setJobType] = React.useState("repair")
  const [priority, setPriority] = React.useState("normal")
  const [description, setDescription] = React.useState("")
  const [bay, setBay] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    Promise.all([getCustomers(), getTechnicians()]).then(([c, t]) => {
      setCustomers(c as CustomerData[])
      setTechnicians(t as TechnicianData[])
    })
  }, [])

  // When customer changes, clear vehicle if not in new customer's vehicle list
  React.useEffect(() => {
    if (!customerId) {
      setVehicleId("")
      return
    }
    const c = customers.find((x) => x.id === customerId)
    const vehicles = c?.vehicles ?? []
    if (vehicleId && !vehicles.some((v) => v.id === vehicleId)) {
      setVehicleId("")
    }
  }, [customerId, customers, vehicleId])

  const customerOptions: ComboboxOption[] = React.useMemo(
    () =>
      customers.map((c) => ({
        value: c.id,
        label: c.name,
        hint: c.phone,
        keywords: c.phone ? [c.phone] : undefined,
      })),
    [customers],
  )

  const vehicleOptions: ComboboxOption[] = React.useMemo(() => {
    const c = customers.find((x) => x.id === customerId)
    return (
      c?.vehicles?.map((v) => ({
        value: v.id,
        label: v.license_plate || "ไม่ระบุทะเบียน",
        hint: [v.brand, v.model].filter(Boolean).join(" "),
      })) ?? []
    )
  }, [customerId, customers])

  const technicianOptions: ComboboxOption[] = React.useMemo(
    () =>
      technicians.map((t) => ({
        value: t.id,
        label: t.full_name || "—",
        hint: t.role,
      })),
    [technicians],
  )

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!customerId) next.customer_id = "กรุณาเลือกลูกค้า"
    if (!vehicleId) next.vehicle_id = "กรุณาเลือกรถ"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      toast.error("กรอกข้อมูลให้ครบถ้วน")
      return
    }
    const formData = new FormData()
    formData.set("customer_id", customerId)
    formData.set("vehicle_id", vehicleId)
    formData.set("type", jobType)
    formData.set("priority", priority)
    formData.set("description", description)
    formData.set("assigned_to", technicianId)
    formData.set("bay_number", bay)
    formData.set("notes", notes)

    setPending(true)
    try {
      const result = await toast.promise(createJob(formData), {
        loading: "กำลังสร้าง Job Order...",
        success: "สร้าง Job Order สำเร็จ",
        error: (err) => (err instanceof Error ? err.message : "ไม่สามารถสร้างได้"),
      })
      if (result?.error) throw new Error(result.error)
      if (result?.success && result.id) router.push(`/dashboard/jobs/${result.id}`)
    } catch {
      // toast already shown
    } finally {
      setPending(false)
    }
  }

  const breadcrumb = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "งานซ่อม", href: "/dashboard/jobs" },
    { title: "สร้างใหม่" },
  ]

  return (
    <>
      <PageHeader
        title="สร้าง Job Order"
        description="ระบุลูกค้า รถ และรายละเอียดงานที่จะรับเข้าซ่อม"
        breadcrumb={breadcrumb}
        action={
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl space-y-4 px-3 pb-32 sm:space-y-5 sm:px-6"
      >
        <FormSection
          title="ลูกค้าและรถ"
          description="เลือกลูกค้าก่อน รายการรถจะกรองตามลูกค้านั้นโดยอัตโนมัติ"
        >
          <FormField
            label="ลูกค้า"
            required
            htmlFor="customer_id"
            error={errors.customer_id}
          >
            <Combobox
              name="customer_id"
              options={customerOptions}
              value={customerId}
              onValueChange={setCustomerId}
              placeholder="เลือกลูกค้า"
              title="เลือกลูกค้า"
              clearable
              error={!!errors.customer_id}
            />
          </FormField>

          <FormField
            label="รถ"
            required
            htmlFor="vehicle_id"
            error={errors.vehicle_id}
            hint={!customerId ? "เลือกลูกค้าก่อน" : undefined}
          >
            <Combobox
              name="vehicle_id"
              options={vehicleOptions}
              value={vehicleId}
              onValueChange={setVehicleId}
              placeholder={customerId ? "เลือกรถ" : "เลือกลูกค้าก่อน"}
              title="เลือกรถ"
              disabled={!customerId}
              error={!!errors.vehicle_id}
            />
          </FormField>
        </FormSection>

        <FormSection title="ประเภทและความสำคัญ">
          <FormField label="ประเภทงาน">
            <RadioGroup
              variant="segmented"
              value={jobType}
              onValueChange={setJobType}
              name="type"
              className="flex-wrap"
            >
              {jobTypes.map((t) => (
                <SegmentedItem key={t.value} value={t.value}>
                  {t.label}
                </SegmentedItem>
              ))}
            </RadioGroup>
          </FormField>

          <FormField label="ระดับความสำคัญ">
            <RadioGroup
              variant="segmented"
              value={priority}
              onValueChange={setPriority}
              name="priority"
            >
              {priorities.map((p) => (
                <SegmentedItem key={p.value} value={p.value}>
                  {p.value === "urgent" && <AlertTriangle className="h-3.5 w-3.5" />}
                  {p.label}
                </SegmentedItem>
              ))}
            </RadioGroup>
          </FormField>

          <FormField label="ช่างที่รับผิดชอบ" hint="เว้นว่างหากยังไม่กำหนด">
            <Combobox
              name="assigned_to"
              options={technicianOptions}
              value={technicianId}
              onValueChange={setTechnicianId}
              placeholder="ยังไม่กำหนด"
              title="เลือกช่าง"
              clearable
            />
          </FormField>
        </FormSection>

        <FormSection
          title="รายละเอียดและหมายเหตุ"
          description="ข้อมูลที่ลูกค้าและช่างจะใช้สื่อสารกัน"
        >
          <FormField
            label="รายละเอียดงาน"
            htmlFor="description"
            labelAside={
              description ? `${description.length} ตัวอักษร` : undefined
            }
          >
            <Textarea
              id="description"
              rows={4}
              placeholder="อาการเสีย งานที่ต้องทำ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="ช่องซ่อม (Bay)" htmlFor="bay">
              <Input
                id="bay"
                placeholder="เช่น Bay 1, Bay 2"
                prefix={<Wrench />}
                value={bay}
                onChange={(e) => setBay(e.target.value)}
              />
            </FormField>

            <FormField label="หมายเหตุ" htmlFor="notes">
              <Input
                id="notes"
                placeholder="หมายเหตุเพิ่มเติม"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Sticky action bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 px-3 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="hidden text-xs text-muted-foreground sm:block">
              <CreateSummary
                customer={customers.find((c) => c.id === customerId)?.name}
                vehicle={
                  customers
                    .find((c) => c.id === customerId)
                    ?.vehicles?.find((v) => v.id === vehicleId)?.license_plate
                }
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={pending}
              >
                ยกเลิก
              </Button>
              <Button type="submit" loading={pending} loadingText="กำลังสร้าง...">
                สร้าง Job Order
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}

function CreateSummary({
  customer,
  vehicle,
}: {
  customer?: string
  vehicle?: string
}) {
  if (!customer && !vehicle) {
    return <span>กรอกข้อมูลทางซ้ายแล้วกดสร้าง</span>
  }
  return (
    <span className="inline-flex items-center gap-2">
      {customer && (
        <span className="inline-flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {customer}
        </span>
      )}
      {vehicle && (
        <span className="inline-flex items-center gap-1">
          <Car className="h-3.5 w-3.5" />
          {vehicle}
        </span>
      )}
    </span>
  )
}
