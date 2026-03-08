import { Search, Users, Shield } from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { getAllUsers } from "@/lib/actions/super-admin"

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "เจ้าของ",
  admin: "ผู้ดูแล",
  manager: "ผู้จัดการ",
  technician: "ช่าง",
  receptionist: "พนักงานต้อนรับ",
}

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  manager: "bg-indigo-100 text-indigo-700",
  technician: "bg-amber-100 text-amber-700",
  receptionist: "bg-green-100 text-green-700",
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const users = await getAllUsers(params.search)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ผู้ใช้ทั้งหมด</h1>
        <p className="text-sm text-muted-foreground">จัดการผู้ใช้ทั้งหมดในระบบ ServicePro</p>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">ผู้ใช้ทั้งหมด</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Super Admins</p>
              <p className="text-2xl font-bold">{users.filter((u: Record<string, unknown>) => u.role === "super_admin").length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" name="search" placeholder="ค้นหาชื่อหรืออีเมล..."
          defaultValue={params.search || ""}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ผู้ใช้</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">อีเมล</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ร้านค้า</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">บทบาท</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">สร้างเมื่อ</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: Record<string, unknown>) => {
                const tenant = u.tenants as Record<string, unknown> | null
                return (
                  <tr key={u.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                          u.role === "super_admin" ? "bg-red-600" : "bg-primary"
                        )}>
                          {(u.full_name as string)?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm font-medium">{u.full_name as string}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.email as string}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tenant?.name as string || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        roleColors[u.role as string] || "bg-muted text-muted-foreground"
                      )}>
                        {roleLabels[u.role as string] || u.role as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        u.is_active ? "bg-success/10 text-success" : "bg-error/10 text-error"
                      )}>
                        {u.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(u.created_at as string)}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/80">
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    ไม่พบผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
