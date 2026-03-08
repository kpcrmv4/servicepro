import {
  Plus,
  Search,
  Wrench,
  Phone,
  Users,
} from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getTeamMembers } from "@/lib/actions/settings"

const roleLabels: Record<string, string> = {
  owner: "เจ้าของ",
  admin: "ผู้ดูแล",
  manager: "ผู้จัดการ",
  technician: "ช่าง",
  receptionist: "พนักงานต้อนรับ",
}

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  manager: "bg-indigo-100 text-indigo-700",
  technician: "bg-amber-100 text-amber-700",
  receptionist: "bg-green-100 text-green-700",
}

export default async function EmployeesPage() {
  const members = await getTeamMembers()

  const totalMembers = members.length
  const technicians = members.filter((m: Record<string, unknown>) => m.role === "technician").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="พนักงาน"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> เพิ่มพนักงาน
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4 sm:px-6 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">พนักงานทั้งหมด</p>
          <p className="mt-1 text-2xl font-bold">{totalMembers}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">ช่าง</p>
          <p className="mt-1 text-2xl font-bold">{technicians}</p>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid gap-3 px-4 sm:gap-4 sm:px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((emp: Record<string, unknown>) => (
          <div
            key={emp.id as string}
            className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {(emp.full_name as string)?.charAt(0) || "?"}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{emp.full_name as string}</h3>
                  <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", roleColors[emp.role as string] || "bg-muted text-muted-foreground")}>
                    {roleLabels[emp.role as string] || emp.role as string}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", emp.is_active ? "bg-success" : "bg-error")} />
                <span className="text-xs text-muted-foreground">{emp.is_active ? "ใช้งาน" : "ปิดใช้งาน"}</span>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {emp.phone as string || "-"}
              </div>
              <p className="text-xs text-muted-foreground">{emp.email as string}</p>
              <p className="text-xs text-muted-foreground">เข้าร่วม: {formatDateShort(emp.created_at as string)}</p>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            ยังไม่มีพนักงาน
          </div>
        )}
      </div>
    </div>
  )
}
