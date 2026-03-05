"use client"

import { useState } from "react"
import {
  Search,
  Upload,
  X,
  User,
  Car,
  FileText,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
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

interface VehicleCheckinFormProps {
  onCancel: () => void
}

interface FormData {
  customerName: string
  customerPhone: string
  customerLineId: string
  customerType: "individual" | "company"
  licensePlate: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: string
  vehicleColor: string
  mileage: string
  jobType: string
  description: string
  urgency: "urgent" | "normal" | "low"
  photos: File[]
  notes: string
}

const carBrands = [
  "Toyota",
  "Honda",
  "Isuzu",
  "Mitsubishi",
  "Nissan",
  "Mazda",
  "Ford",
  "Chevrolet",
  "Suzuki",
  "MG",
  "Hyundai",
  "Kia",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volvo",
  "Subaru",
  "GWM",
  "BYD",
  "Neta",
  "ORA",
]

export function VehicleCheckinForm({ onCancel }: VehicleCheckinFormProps) {
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerPhone: "",
    customerLineId: "",
    customerType: "individual",
    licensePlate: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    mileage: "",
    jobType: "",
    description: "",
    urgency: "normal",
    photos: [],
    notes: "",
  })

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newFiles = Array.from(files)
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...newFiles] }))
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
  }

  function removePhoto(index: number) {
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log("Vehicle Check-in Form Submitted:", formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Customer Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="h-4 w-4 text-primary" />
          ข้อมูลลูกค้า
        </div>
        <Separator />

        <div>
          <Label htmlFor="customerSearch">ค้นหาลูกค้าเดิม</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="customerSearch"
              placeholder="พิมพ์ชื่อ หรือ เบอร์โทร เพื่อค้นหา..."
              className="pl-9"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            ค้นหาจากชื่อ, เบอร์โทร หรือ ทะเบียนรถ
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="customerName">ชื่อ *</Label>
            <Input
              id="customerName"
              className="mt-1.5"
              value={formData.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">เบอร์โทร *</Label>
            <Input
              id="customerPhone"
              className="mt-1.5"
              value={formData.customerPhone}
              onChange={(e) => updateField("customerPhone", e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="customerLineId">Line ID (ถ้ามี)</Label>
          <Input
            id="customerLineId"
            className="mt-1.5"
            value={formData.customerLineId}
            onChange={(e) => updateField("customerLineId", e.target.value)}
          />
        </div>

        <div>
          <Label>ประเภท</Label>
          <div className="mt-1.5 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="individual"
                checked={formData.customerType === "individual"}
                onChange={() => updateField("customerType", "individual")}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">บุคคล</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="company"
                checked={formData.customerType === "company"}
                onChange={() => updateField("customerType", "company")}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">นิติบุคคล</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 2: Vehicle Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Car className="h-4 w-4 text-primary" />
          ข้อมูลรถ
        </div>
        <Separator />

        <div>
          <Label htmlFor="vehicleSearch">ค้นหาทะเบียน</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="vehicleSearch"
              placeholder="พิมพ์ทะเบียนรถเพื่อค้นหา..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="licensePlate">ทะเบียนรถ *</Label>
            <Input
              id="licensePlate"
              className="mt-1.5"
              value={formData.licensePlate}
              onChange={(e) => updateField("licensePlate", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="vehicleBrand">ยี่ห้อ *</Label>
            <div className="mt-1.5">
              <Select
                value={formData.vehicleBrand}
                onValueChange={(v) => updateField("vehicleBrand", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกยี่ห้อ" />
                </SelectTrigger>
                <SelectContent>
                  {carBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="vehicleModel">รุ่น</Label>
            <Input
              id="vehicleModel"
              className="mt-1.5"
              value={formData.vehicleModel}
              onChange={(e) => updateField("vehicleModel", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="vehicleYear">ปี</Label>
            <Input
              id="vehicleYear"
              className="mt-1.5"
              type="number"
              placeholder="พ.ศ."
              value={formData.vehicleYear}
              onChange={(e) => updateField("vehicleYear", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="vehicleColor">สี</Label>
            <Input
              id="vehicleColor"
              className="mt-1.5"
              value={formData.vehicleColor}
              onChange={(e) => updateField("vehicleColor", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="mileage">เลขไมล์</Label>
          <Input
            id="mileage"
            className="mt-1.5"
            type="number"
            placeholder="กิโลเมตร"
            value={formData.mileage}
            onChange={(e) => updateField("mileage", e.target.value)}
          />
        </div>
      </div>

      {/* Section 3: Job Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          รายละเอียดงาน
        </div>
        <Separator />

        <div>
          <Label htmlFor="jobType">ประเภทงาน *</Label>
          <div className="mt-1.5">
            <Select
              value={formData.jobType}
              onValueChange={(v) => updateField("jobType", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภทงาน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repair">ซ่อม</SelectItem>
                <SelectItem value="maintenance">บำรุงรักษา</SelectItem>
                <SelectItem value="inspection">ตรวจเช็ค</SelectItem>
                <SelectItem value="insurance">ประกัน</SelectItem>
                <SelectItem value="other">อื่นๆ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">อาการเสีย / รายละเอียด</Label>
          <Textarea
            id="description"
            className="mt-1.5 min-h-[100px]"
            placeholder="อธิบายอาการเสียหรือรายละเอียดงานที่ต้องการ..."
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <div>
          <Label>ระดับความเร่งด่วน</Label>
          <div className="mt-1.5 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="urgency"
                value="urgent"
                checked={formData.urgency === "urgent"}
                onChange={() => updateField("urgency", "urgent")}
                className="h-4 w-4 accent-red-500"
              />
              <span className="text-sm font-medium text-error">ด่วน</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="urgency"
                value="normal"
                checked={formData.urgency === "normal"}
                onChange={() => updateField("urgency", "normal")}
                className="h-4 w-4 accent-blue-500"
              />
              <span className="text-sm font-medium text-info">ปกติ</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="urgency"
                value="low"
                checked={formData.urgency === "low"}
                onChange={() => updateField("urgency", "low")}
                className="h-4 w-4 accent-gray-500"
              />
              <span className="text-sm font-medium text-muted-foreground">รอได้</span>
            </label>
          </div>
        </div>

        <div>
          <Label>ถ่ายรูปรถ</Label>
          <div className="mt-1.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              <Upload className="h-4 w-4" />
              <span>เลือกรูปภาพ</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
          {photoPreviews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photoPreviews.map((src, i) => (
                <div
                  key={i}
                  className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={src}
                    alt={`photo-${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-error p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Notes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertCircle className="h-4 w-4 text-primary" />
          หมายเหตุ
        </div>
        <Separator />
        <Textarea
          placeholder="หมายเหตุเพิ่มเติม..."
          className="min-h-[80px]"
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />
      </div>

      {/* Bottom Actions */}
      <Separator />
      <div className="flex justify-end gap-3 pb-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit">บันทึก</Button>
      </div>
    </form>
  )
}
