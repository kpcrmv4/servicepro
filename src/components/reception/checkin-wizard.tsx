"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Upload,
  X,
  User,
  Car,
  FileText,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
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
import { createCheckinJob, searchCustomers, searchVehicleByPlate } from "@/lib/actions/reception"
import { uploadGenericPhoto } from "@/lib/actions/upload"
import { SignaturePad, dataUrlToFile } from "@/components/ui/signature-pad"

const carBrands = [
  "Toyota", "Honda", "Isuzu", "Mitsubishi", "Nissan", "Mazda", "Ford",
  "Chevrolet", "Suzuki", "MG", "Hyundai", "Kia", "BMW", "Mercedes-Benz",
  "Audi", "Volvo", "Subaru", "GWM", "BYD", "Neta", "ORA",
]

const jobTypes = [
  { value: "repair", label: "ซ่อม" },
  { value: "maintenance", label: "บำรุงรักษา" },
  { value: "inspection", label: "ตรวจเช็ค" },
  { value: "insurance", label: "ประกัน" },
  { value: "warranty", label: "รับประกัน" },
  { value: "other", label: "อื่นๆ" },
]

const steps = [
  { label: "ข้อมูลลูกค้า", icon: User },
  { label: "ข้อมูลรถ", icon: Car },
  { label: "รายละเอียดงาน", icon: FileText },
]

type CustomerResult = {
  id: string
  name: string
  phone: string | null
  email: string | null
  line_id: string | null
  type: string
  vehicles: Array<{
    id: string
    license_plate: string
    brand: string
    model: string
    year: number | null
    color: string | null
    current_mileage: number | null
  }>
}

type VehicleSearchResult = {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number | null
  color: string | null
  current_mileage: number | null
  customer_id: string
  customers: {
    id: string
    name: string
    phone: string | null
    email: string | null
    line_id: string | null
    type: string
  } | null
}

export function CheckinWizard() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState("")

  // Customer state
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null)
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerLineId, setCustomerLineId] = useState("")
  const [customerType, setCustomerType] = useState<"individual" | "company">("individual")
  const [isNewCustomer, setIsNewCustomer] = useState(false)

  // Vehicle state
  const [vehicleSearch, setVehicleSearch] = useState("")
  const [vehicleResults, setVehicleResults] = useState<VehicleSearchResult[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; license_plate: string; brand: string; model: string; year?: number | null; color?: string | null; current_mileage?: number | null } | null>(null)
  const [isSearchingVehicle, setIsSearchingVehicle] = useState(false)
  const [licensePlate, setLicensePlate] = useState("")
  const [vehicleBrand, setVehicleBrand] = useState("")
  const [vehicleModel, setVehicleModel] = useState("")
  const [vehicleYear, setVehicleYear] = useState("")
  const [vehicleColor, setVehicleColor] = useState("")
  const [mileage, setMileage] = useState("")
  const [isNewVehicle, setIsNewVehicle] = useState(false)

  // Job state
  const [jobType, setJobType] = useState("repair")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"urgent" | "normal" | "low">("normal")
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)

  // Customer search
  async function handleCustomerSearch() {
    if (customerSearch.length < 2) return
    setIsSearchingCustomer(true)
    const results = await searchCustomers(customerSearch)
    setCustomerResults(results as CustomerResult[])
    setIsSearchingCustomer(false)
  }

  function selectCustomer(customer: CustomerResult) {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone || "")
    setCustomerLineId(customer.line_id || "")
    setCustomerType(customer.type as "individual" | "company")
    setIsNewCustomer(false)
    setCustomerResults([])
    setCustomerSearch("")
  }

  function clearCustomer() {
    setSelectedCustomer(null)
    setCustomerName("")
    setCustomerPhone("")
    setCustomerLineId("")
    setCustomerType("individual")
    setIsNewCustomer(false)
    // Also clear vehicle since it's tied to customer
    clearVehicle()
  }

  // Vehicle search
  async function handleVehicleSearch() {
    if (vehicleSearch.length < 2) return
    setIsSearchingVehicle(true)
    const results = await searchVehicleByPlate(vehicleSearch)
    setVehicleResults(results as unknown as VehicleSearchResult[])
    setIsSearchingVehicle(false)
  }

  function selectVehicle(vehicle: { id: string; license_plate: string; brand: string; model: string; year?: number | null; color?: string | null; current_mileage?: number | null }) {
    setSelectedVehicle(vehicle)
    setLicensePlate(vehicle.license_plate)
    setVehicleBrand(vehicle.brand)
    setVehicleModel(vehicle.model)
    setVehicleYear(vehicle.year?.toString() || "")
    setVehicleColor(vehicle.color || "")
    setMileage(vehicle.current_mileage?.toString() || "")
    setIsNewVehicle(false)
    setVehicleResults([])
    setVehicleSearch("")
  }

  function selectVehicleFromSearch(vehicle: VehicleSearchResult) {
    selectVehicle(vehicle)
    // Also select the customer if we don't have one
    if (!selectedCustomer && vehicle.customers) {
      const c = vehicle.customers
      setSelectedCustomer({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        line_id: c.line_id,
        type: c.type,
        vehicles: [],
      })
      setCustomerName(c.name)
      setCustomerPhone(c.phone || "")
      setCustomerLineId(c.line_id || "")
      setCustomerType(c.type as "individual" | "company")
    }
  }

  function clearVehicle() {
    setSelectedVehicle(null)
    setLicensePlate("")
    setVehicleBrand("")
    setVehicleModel("")
    setVehicleYear("")
    setVehicleColor("")
    setMileage("")
    setIsNewVehicle(false)
  }

  // Photo handling
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newFiles = Array.from(files)
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setPhotos((prev) => [...prev, ...newFiles])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
  }

  function removePhoto(index: number) {
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  // Validation
  function canProceedStep(step: number): boolean {
    if (step === 0) {
      return !!customerName.trim() && !!customerPhone.trim()
    }
    if (step === 1) {
      return !!licensePlate.trim() && !!vehicleBrand.trim()
    }
    return true
  }

  // Submit
  function handleSubmit() {
    setError("")
    startTransition(async () => {
      // Upload photos sequentially to job-photos/checkins/<plate>
      const photoUrls: string[] = []
      const folder = `checkins/${licensePlate.replace(/[^A-Za-z0-9ก-๙]/g, "_")}_${Date.now()}`
      for (const file of photos) {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("bucket", "job-photos")
        fd.append("folder", folder)
        const up = await uploadGenericPhoto(fd)
        if ("error" in up && up.error) {
          setError(`อัปโหลดรูปล้มเหลว: ${up.error}`)
          return
        }
        if (up.url) photoUrls.push(up.url)
      }

      // Upload signature if drawn — stored as a job-photo with a
      // distinct filename so it can be retrieved separately for the
      // PDF receipt.
      let signatureUrl: string | undefined
      if (signatureDataUrl) {
        const sigFile = await dataUrlToFile(signatureDataUrl, `signature_${Date.now()}.png`)
        const fd = new FormData()
        fd.append("file", sigFile)
        fd.append("bucket", "job-photos")
        fd.append("folder", `${folder}/signature`)
        const up = await uploadGenericPhoto(fd)
        if ("error" in up && up.error) {
          setError(`อัปโหลดลายเซ็นล้มเหลว: ${up.error}`)
          return
        }
        signatureUrl = up.url
        if (signatureUrl) photoUrls.push(signatureUrl)
      }

      const result = await createCheckinJob({
        customerId: selectedCustomer?.id,
        customerName,
        customerPhone,
        customerLineId,
        customerType,
        vehicleId: selectedVehicle?.id,
        licensePlate,
        vehicleBrand,
        vehicleModel,
        vehicleYear,
        vehicleColor,
        mileage,
        jobType,
        description,
        priority,
        notes,
        photoUrls,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push(`/dashboard/jobs/${result.id}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1 px-4 sm:px-0">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => {
                  if (i < currentStep) setCurrentStep(i)
                }}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                      ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStep ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 mx-1",
                  i < currentStep ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mx-4 sm:mx-0 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Step 1: Customer */}
      {currentStep === 0 && (
        <div className="space-y-4 px-4 sm:px-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-primary" />
            ข้อมูลลูกค้า
          </div>
          <Separator />

          {/* Search existing customer */}
          {!selectedCustomer && !isNewCustomer && (
            <div className="space-y-3">
              <div>
                <Label>ค้นหาลูกค้าเดิม</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="พิมพ์ชื่อ หรือ เบอร์โทร..."
                    className="pl-9"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleCustomerSearch()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={handleCustomerSearch}
                    disabled={isSearchingCustomer || customerSearch.length < 2}
                  >
                    {isSearchingCustomer ? <Loader2 className="h-3 w-3 animate-spin" /> : "ค้นหา"}
                  </Button>
                </div>
              </div>

              {/* Search results */}
              {customerResults.length > 0 && (
                <div className="rounded-lg border border-border divide-y divide-border">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-muted-foreground ml-2">{c.phone}</span>}
                        {c.vehicles && c.vehicles.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            รถ: {c.vehicles.map(v => `${v.license_plate} ${v.brand} ${v.model}`).join(", ")}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {customerResults.length === 0 && customerSearch.length >= 2 && !isSearchingCustomer && (
                <p className="text-xs text-muted-foreground">ไม่พบลูกค้า กรุณาสร้างลูกค้าใหม่</p>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsNewCustomer(true)}
              >
                <User className="h-4 w-4 mr-2" />
                สร้างลูกค้าใหม่
              </Button>
            </div>
          )}

          {/* Selected customer info */}
          {selectedCustomer && !isNewCustomer && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary">ลูกค้าเดิม</span>
                <button type="button" onClick={clearCustomer} className="text-xs text-muted-foreground hover:text-foreground">
                  เปลี่ยน
                </button>
              </div>
              <p className="font-medium">{selectedCustomer.name}</p>
              {selectedCustomer.phone && <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>}
            </div>
          )}

          {/* New customer form */}
          {isNewCustomer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary">ลูกค้าใหม่</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomer(false)
                    clearCustomer()
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ค้นหาลูกค้าเดิม
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="customerName">ชื่อ *</Label>
                  <Input
                    id="customerName"
                    className="mt-1.5"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">เบอร์โทร *</Label>
                  <Input
                    id="customerPhone"
                    className="mt-1.5"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerLineId">Line ID (ถ้ามี)</Label>
                <Input
                  id="customerLineId"
                  className="mt-1.5"
                  value={customerLineId}
                  onChange={(e) => setCustomerLineId(e.target.value)}
                />
              </div>

              <div>
                <Label>ประเภท</Label>
                <div className="mt-1.5 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="customerType"
                      checked={customerType === "individual"}
                      onChange={() => setCustomerType("individual")}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm">บุคคล</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="customerType"
                      checked={customerType === "company"}
                      onChange={() => setCustomerType("company")}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm">นิติบุคคล</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Vehicle */}
      {currentStep === 1 && (
        <div className="space-y-4 px-4 sm:px-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Car className="h-4 w-4 text-primary" />
            ข้อมูลรถ
          </div>
          <Separator />

          {/* If customer has existing vehicles, show them */}
          {selectedCustomer && selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 && !selectedVehicle && !isNewVehicle && (
            <div className="space-y-2">
              <Label>รถของลูกค้า</Label>
              <div className="rounded-lg border border-border divide-y divide-border">
                {selectedCustomer.vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVehicle(v)}
                    className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="font-medium">{v.license_plate}</span>
                      <span className="text-muted-foreground ml-2">{v.brand} {v.model}</span>
                      {v.color && <span className="text-muted-foreground ml-1">({v.color})</span>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search by plate */}
          {!selectedVehicle && !isNewVehicle && (
            <div className="space-y-3">
              <div>
                <Label>ค้นหาทะเบียนรถ</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="พิมพ์ทะเบียนรถ..."
                    className="pl-9"
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleVehicleSearch()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={handleVehicleSearch}
                    disabled={isSearchingVehicle || vehicleSearch.length < 2}
                  >
                    {isSearchingVehicle ? <Loader2 className="h-3 w-3 animate-spin" /> : "ค้นหา"}
                  </Button>
                </div>
              </div>

              {vehicleResults.length > 0 && (
                <div className="rounded-lg border border-border divide-y divide-border">
                  {vehicleResults.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectVehicleFromSearch(v)}
                      className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="font-medium">{v.license_plate}</span>
                        <span className="text-muted-foreground ml-2">{v.brand} {v.model}</span>
                        {v.customers && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            เจ้าของ: {v.customers.name}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsNewVehicle(true)}
              >
                <Car className="h-4 w-4 mr-2" />
                เพิ่มรถใหม่
              </Button>
            </div>
          )}

          {/* Selected vehicle */}
          {selectedVehicle && !isNewVehicle && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary">รถที่เลือก</span>
                  <button type="button" onClick={clearVehicle} className="text-xs text-muted-foreground hover:text-foreground">
                    เปลี่ยน
                  </button>
                </div>
                <p className="font-medium">{selectedVehicle.license_plate}</p>
                <p className="text-sm text-muted-foreground">{selectedVehicle.brand} {selectedVehicle.model}</p>
              </div>

              <div>
                <Label htmlFor="mileage">เลขไมล์ปัจจุบัน</Label>
                <Input
                  id="mileage"
                  className="mt-1.5"
                  type="number"
                  placeholder="กิโลเมตร"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* New vehicle form */}
          {isNewVehicle && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary">รถใหม่</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewVehicle(false)
                    clearVehicle()
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ค้นหารถเดิม
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="licensePlate">ทะเบียนรถ *</Label>
                  <Input
                    id="licensePlate"
                    className="mt-1.5"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleBrand">ยี่ห้อ *</Label>
                  <div className="mt-1.5">
                    <Select value={vehicleBrand} onValueChange={setVehicleBrand}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกยี่ห้อ" />
                      </SelectTrigger>
                      <SelectContent>
                        {carBrands.map((brand) => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
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
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleYear">ปี</Label>
                  <Input
                    id="vehicleYear"
                    className="mt-1.5"
                    type="number"
                    placeholder="พ.ศ."
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleColor">สี</Label>
                  <Input
                    id="vehicleColor"
                    className="mt-1.5"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mileageNew">เลขไมล์</Label>
                <Input
                  id="mileageNew"
                  className="mt-1.5"
                  type="number"
                  placeholder="กิโลเมตร"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Job details */}
      {currentStep === 2 && (
        <div className="space-y-4 px-4 sm:px-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            รายละเอียดงาน
          </div>
          <Separator />

          {/* Summary of selected customer & vehicle */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">ลูกค้า</p>
              <p className="text-sm font-medium">{customerName}</p>
              <p className="text-xs text-muted-foreground">{customerPhone}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">รถ</p>
              <p className="text-sm font-medium">{licensePlate}</p>
              <p className="text-xs text-muted-foreground">{vehicleBrand} {vehicleModel}</p>
            </div>
          </div>

          <div>
            <Label>ประเภทงาน *</Label>
            <div className="mt-1.5">
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทงาน" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label>ระดับความเร่งด่วน</Label>
            <div className="mt-1.5 flex gap-4">
              {([
                { value: "urgent" as const, label: "ด่วน", color: "accent-red-500", textColor: "text-error" },
                { value: "normal" as const, label: "ปกติ", color: "accent-blue-500", textColor: "text-info" },
                { value: "low" as const, label: "รอได้", color: "accent-gray-500", textColor: "text-muted-foreground" },
              ] as const).map((p) => (
                <label key={p.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === p.value}
                    onChange={() => setPriority(p.value)}
                    className={cn("h-4 w-4", p.color)}
                  />
                  <span className={cn("text-sm font-medium", p.textColor)}>{p.label}</span>
                </label>
              ))}
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
                  <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                    <img src={src} alt={`photo-${i + 1}`} className="h-full w-full object-cover" />
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

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              หมายเหตุ
            </div>
            <Textarea
              placeholder="หมายเหตุเพิ่มเติม..."
              className="min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">ลายเซ็นรับรถ</div>
            <p className="mb-2 text-xs text-muted-foreground">
              ให้ลูกค้าเซ็นยืนยันสภาพรถและการรับงาน
            </p>
            <SignaturePad onChange={setSignatureDataUrl} />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <Separator />
      <div className="flex justify-between px-4 pb-6 sm:px-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (currentStep === 0) {
              router.push("/dashboard/reception")
            } else {
              setCurrentStep((s) => s - 1)
            }
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {currentStep === 0 ? "ยกเลิก" : "ย้อนกลับ"}
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceedStep(currentStep)}
          >
            ถัดไป
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                รับรถเข้าอู่
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
