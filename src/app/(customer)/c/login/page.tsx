import { Car, Phone } from "lucide-react"
import Link from "next/link"

export default function CustomerLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">ServicePro</h1>
          <p className="text-sm text-muted-foreground mt-1">เข้าสู่ระบบลูกค้า</p>
        </div>

        <form action="/c" method="GET" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                name="phone"
                placeholder="0xx-xxx-xxxx"
                required
                className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          ใช้เบอร์โทรศัพท์ที่ลงทะเบียนไว้กับทางร้าน
        </p>
      </div>
    </div>
  )
}
