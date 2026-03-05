import { Wrench, BarChart3, Clock, Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-2xl">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden w-1/2 bg-gradient-to-br from-blue-900 to-blue-700 p-10 text-white md:flex md:flex-col md:justify-center">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Wrench className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">KPServicePro</h1>
              </div>
            </div>
            <p className="text-lg text-blue-100">
              ระบบจัดการอู่ซ่อมรถออนไลน์
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">จัดการงานซ่อมครบวงจร</h3>
                <p className="text-sm text-blue-200">
                  ติดตามสถานะงานซ่อม อะไหล่ และค่าใช้จ่ายแบบเรียลไทม์
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">ประหยัดเวลา 50%</h3>
                <p className="text-sm text-blue-200">
                  ลดขั้นตอนการทำงานซ้ำซ้อนด้วยระบบอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">ปลอดภัย เชื่อถือได้</h3>
                <p className="text-sm text-blue-200">
                  ข้อมูลปลอดภัยด้วยระบบ Cloud ระดับองค์กร
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form content */}
        <div className="w-full p-8 md:w-1/2 md:p-10">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              KPServicePro
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
