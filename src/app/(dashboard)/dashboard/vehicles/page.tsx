"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  Car,
  AlertTriangle,
  Shield,
  Gauge,
  Calendar,
} from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  owner: string
  lastMileage: number
  lastService: string
  insuranceExpiry: string
}

const colorMap: Record<string, string> = {
  "ขาว": "bg-white border border-gray-300",
  "ดำ": "bg-gray-800",
  "เงิน": "bg-gray-400",
  "แดง": "bg-red-500",
  "น้ำเงิน": "bg-blue-600",
  "เทา": "bg-gray-500",
  "น้ำตาล": "bg-amber-700",
  "เขียว": "bg-green-600",
  "ส้ม": "bg-orange-500",
}

const mockVehicles: Vehicle[] = [
  { id: "V01", plate: "กข 1234", brand: "Toyota", model: "Camry", year: 2023, color: "ขาว", owner: "คุณสมชาย วงศ์สวัสดิ์", lastMileage: 45200, lastService: "2026-03-05", insuranceExpiry: "2026-08-15" },
  { id: "V02", plate: "ขค 5678", brand: "Honda", model: "Civic", year: 2022, color: "ดำ", owner: "คุณสุภาพร จันทร์เจริญ", lastMileage: 62300, lastService: "2026-03-03", insuranceExpiry: "2026-03-20" },
  { id: "V03", plate: "จฉ 9012", brand: "Isuzu", model: "D-Max", year: 2021, color: "เงิน", owner: "บ.ABC ทรานสปอร์ต จำกัด", lastMileage: 98500, lastService: "2026-03-04", insuranceExpiry: "2026-06-30" },
  { id: "V04", plate: "ฌญ 3456", brand: "Mazda", model: "3", year: 2024, color: "แดง", owner: "คุณวิชัย ศรีสุข", lastMileage: 15800, lastService: "2026-02-15", insuranceExpiry: "2027-01-10" },
  { id: "V05", plate: "ฎฏ 7890", brand: "Ford", model: "Ranger", year: 2020, color: "น้ำเงิน", owner: "คุณอรุณ มีชัย", lastMileage: 112000, lastService: "2026-03-02", insuranceExpiry: "2026-04-01" },
  { id: "V06", plate: "กท 2468", brand: "Toyota", model: "Hilux Revo", year: 2023, color: "ขาว", owner: "บ.XYZ โลจิสติกส์ จำกัด", lastMileage: 55800, lastService: "2026-03-01", insuranceExpiry: "2026-09-20" },
  { id: "V07", plate: "ขง 1357", brand: "Honda", model: "HR-V", year: 2024, color: "เทา", owner: "คุณนิตยา แสงจันทร์", lastMileage: 12500, lastService: "2026-02-25", insuranceExpiry: "2027-02-15" },
  { id: "V08", plate: "คม 8642", brand: "Nissan", model: "Almera", year: 2021, color: "ขาว", owner: "คุณประเสริฐ ทองคำ", lastMileage: 78900, lastService: "2026-02-28", insuranceExpiry: "2026-03-15" },
  { id: "V09", plate: "ฆง 5791", brand: "MG", model: "ZS", year: 2023, color: "แดง", owner: "คุณนภา รุ่งเรือง", lastMileage: 28400, lastService: "2026-03-01", insuranceExpiry: "2026-11-30" },
  { id: "V10", plate: "วว 1122", brand: "Toyota", model: "Fortuner", year: 2022, color: "ดำ", owner: "คุณสุรชัย พงศ์ไพร", lastMileage: 68200, lastService: "2026-03-03", insuranceExpiry: "2026-07-15" },
  { id: "V11", plate: "ฒณ 4455", brand: "Mitsubishi", model: "Pajero Sport", year: 2021, color: "ขาว", owner: "คุณสุรชัย พงศ์ไพร", lastMileage: 95400, lastService: "2026-02-20", insuranceExpiry: "2026-05-10" },
  { id: "V12", plate: "ดต 6677", brand: "Suzuki", model: "Swift", year: 2023, color: "ส้ม", owner: "คุณพิมพ์ใจ สุขสันต์", lastMileage: 19800, lastService: "2026-01-15", insuranceExpiry: "2026-12-25" },
  { id: "V13", plate: "ถท 8899", brand: "Hyundai", model: "Creta", year: 2024, color: "น้ำเงิน", owner: "คุณธนากร เจริญผล", lastMileage: 8500, lastService: "2026-03-04", insuranceExpiry: "2027-03-01" },
  { id: "V14", plate: "บผ 2233", brand: "Kia", model: "Seltos", year: 2023, color: "เขียว", owner: "คุณมาลี ดวงดาว", lastMileage: 32100, lastService: "2026-02-10", insuranceExpiry: "2026-03-25" },
  { id: "V15", plate: "สห 3344", brand: "Toyota", model: "Yaris", year: 2022, color: "ขาว", owner: "คุณสมชาย วงศ์สวัสดิ์", lastMileage: 41200, lastService: "2026-03-05", insuranceExpiry: "2026-10-15" },
  { id: "V16", plate: "ฐณ 7722", brand: "BMW", model: "320d", year: 2022, color: "ดำ", owner: "คุณธนากร เจริญผล", lastMileage: 52300, lastService: "2026-03-04", insuranceExpiry: "2026-03-10" },
]

function isInsuranceExpiring(dateStr: string): boolean {
  const expiry = new Date(dateStr)
  const now = new Date("2026-03-05")
  const diff = expiry.getTime() - now.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 30
}

function isInsuranceExpired(dateStr: string): boolean {
  const expiry = new Date(dateStr)
  const now = new Date("2026-03-05")
  return expiry < now
}

export default function VehiclesPage() {
  const [search, setSearch] = useState("")

  const filtered = mockVehicles.filter((v) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      v.plate.toLowerCase().includes(s) ||
      v.brand.toLowerCase().includes(s) ||
      v.model.toLowerCase().includes(s) ||
      v.owner.toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการรถ"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> เพิ่มรถ
          </button>
        }
      />

      {/* Search */}
      <div className="px-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่น หรือเจ้าของ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ทะเบียน</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ยี่ห้อ-รุ่น</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ปี</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สี</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เจ้าของ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ไมล์ล่าสุด</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ใช้บริการล่าสุด</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ประกันหมดอายุ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const expiring = isInsuranceExpiring(v.insuranceExpiry)
                  const expired = isInsuranceExpired(v.insuranceExpiry)
                  return (
                    <tr key={v.id} className={cn(
                      "border-b border-border last:border-0 hover:bg-muted/30",
                      (expiring || expired) && "bg-error/5"
                    )}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-bold text-primary">{v.plate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-card-foreground">{v.brand} {v.model}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">{v.year}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <span className={cn("h-4 w-4 rounded-full", colorMap[v.color] || "bg-gray-300")} />
                          <span className="text-xs text-muted-foreground">{v.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-card-foreground">{v.owner}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 text-sm text-card-foreground">
                          <Gauge className="h-3 w-3 text-muted-foreground" />
                          {v.lastMileage.toLocaleString()} km
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateShort(v.lastService)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Shield className={cn(
                            "h-4 w-4",
                            expired ? "text-error" : expiring ? "text-warning" : "text-success"
                          )} />
                          <span className={cn(
                            "text-sm",
                            expired ? "font-medium text-error" : expiring ? "font-medium text-warning" : "text-muted-foreground"
                          )}>
                            {formatDateShort(v.insuranceExpiry)}
                          </span>
                          {(expiring || expired) && (
                            <AlertTriangle className={cn("h-3.5 w-3.5", expired ? "text-error" : "text-warning")} />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      ไม่พบรถที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
