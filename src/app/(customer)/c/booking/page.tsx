import { ArrowLeft, CalendarPlus, Car, Clock } from "lucide-react"
import Link from "next/link"

export default function BookingPage() {
  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/c" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">จองคิวซ่อม</h1>
          <p className="text-xs text-muted-foreground">เลือกวันและเวลาที่สะดวก</p>
        </div>
      </div>

      {/* Booking Form */}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล</label>
          <input
            type="text"
            placeholder="กรอกชื่อ-นามสกุล"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
          <input
            type="tel"
            placeholder="0xx-xxx-xxxx"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ทะเบียนรถ</label>
          <input
            type="text"
            placeholder="กรอกทะเบียนรถ"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ประเภทบริการ</label>
          <select className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">เลือกประเภทบริการ</option>
            <option value="maintenance">เช็คระยะ/บำรุงรักษา</option>
            <option value="repair">ซ่อมทั่วไป</option>
            <option value="body">ซ่อมตัวถัง/สี</option>
            <option value="electrical">ระบบไฟฟ้า</option>
            <option value="ac">แอร์</option>
            <option value="tire">ยาง/ล้อ</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">วันที่ต้องการ</label>
          <input
            type="date"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">เวลาที่สะดวก</label>
          <select className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">เลือกเวลา</option>
            <option value="08:00">08:00 - 09:00</option>
            <option value="09:00">09:00 - 10:00</option>
            <option value="10:00">10:00 - 11:00</option>
            <option value="11:00">11:00 - 12:00</option>
            <option value="13:00">13:00 - 14:00</option>
            <option value="14:00">14:00 - 15:00</option>
            <option value="15:00">15:00 - 16:00</option>
            <option value="16:00">16:00 - 17:00</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">อาการ/รายละเอียดเพิ่มเติม</label>
          <textarea
            rows={3}
            placeholder="อธิบายอาการหรือสิ่งที่ต้องการซ่อม..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <span className="flex items-center justify-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            ยืนยันจองคิว
          </span>
        </button>
      </form>

      {/* Info */}
      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">
          หมายเหตุ: การจองคิวนี้เป็นการนัดหมายเบื้องต้น ทางร้านจะติดต่อกลับเพื่อยืนยันอีกครั้ง
        </p>
      </div>
    </div>
  )
}
