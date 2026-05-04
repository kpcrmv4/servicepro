import { Search, Users, Shield } from "lucide-react"
import { getAllUsers } from "@/lib/actions/super-admin"
import { SuperAdminUsersTable } from "./users-table"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const users = await getAllUsers(params.search)
  const superAdmins = users.filter(
    (u: Record<string, unknown>) => u.role === "super_admin",
  ).length

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">ผู้ใช้ทั้งหมด</h1>
        <p className="text-sm text-muted-foreground">
          จัดการผู้ใช้ทั้งหมดในระบบ ServicePro
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:gap-4">
        <SummaryCard label="ผู้ใช้ทั้งหมด" value={users.length} icon={Users} />
        <SummaryCard
          label="Super Admins"
          value={superAdmins}
          icon={Shield}
          iconClass="text-red-500"
        />
      </div>

      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          name="search"
          placeholder="ค้นหาชื่อหรืออีเมล..."
          defaultValue={params.search || ""}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      <SuperAdminUsersTable users={users} />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClass = "text-primary",
}: {
  label: string
  value: number
  icon: React.ElementType
  iconClass?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-resting)]">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
