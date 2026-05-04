"use client"

import * as React from "react"
import { formatDateShort } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "เจ้าของ",
  admin: "ผู้ดูแล",
  manager: "ผู้จัดการ",
  technician: "ช่าง",
  receptionist: "พนักงานต้อนรับ",
}

type UserRow = Record<string, unknown> & {
  id: string
  full_name?: string | null
  email: string
  role: string
  is_active: boolean
  created_at: string
  tenants?: { name?: string } | null
}

interface UsersTableProps {
  users: UserRow[]
}

export function SuperAdminUsersTable({ users }: UsersTableProps) {
  const columns: ColumnDef<UserRow>[] = React.useMemo(
    () => [
      {
        id: "name",
        header: "ผู้ใช้",
        sortable: true,
        sortValue: (r) => r.full_name ?? "",
        cell: (row) => {
          const isSuper = row.role === "super_admin"
          return (
            <div className="flex items-center gap-3">
              <Avatar
                className={
                  isSuper
                    ? "h-8 w-8 bg-red-600 text-white"
                    : "h-8 w-8 bg-primary text-primary-foreground"
                }
              >
                <AvatarFallback
                  className={
                    isSuper
                      ? "bg-red-600 text-xs font-bold text-white"
                      : "bg-primary text-xs font-bold text-primary-foreground"
                  }
                >
                  {row.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{row.full_name || "—"}</span>
            </div>
          )
        },
      },
      {
        id: "email",
        header: "อีเมล",
        sortable: true,
        sortValue: (r) => r.email,
        cell: (row) => <span className="text-muted-foreground">{row.email}</span>,
      },
      {
        id: "tenant",
        header: "ร้านค้า",
        sortable: true,
        sortValue: (r) => r.tenants?.name ?? "",
        cell: (row) => row.tenants?.name || "—",
      },
      {
        id: "role",
        header: "บทบาท",
        align: "center",
        sortable: true,
        sortValue: (r) => r.role,
        cell: (row) => (
          <Badge tone={row.role === "super_admin" ? "error" : "info"}>
            {roleLabels[row.role] || row.role}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "สถานะ",
        align: "center",
        cell: (row) => (
          <Badge tone={row.is_active ? "success" : "neutral"} dot>
            {row.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
          </Badge>
        ),
      },
      {
        id: "created_at",
        header: "สร้างเมื่อ",
        sortable: true,
        sortValue: (r) => r.created_at,
        cell: (row) => (
          <span className="text-muted-foreground">{formatDateShort(row.created_at)}</span>
        ),
      },
      {
        id: "actions",
        header: "จัดการ",
        align: "center",
        cell: () => (
          <button className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/80">
            แก้ไข
          </button>
        ),
      },
    ],
    [],
  )

  return (
    <DataTable<UserRow>
      columns={columns}
      data={users}
      getRowId={(row) => row.id}
      enablePagination
      enableColumnVisibility
      pageSize={50}
      savedViewKey="super-admin-users"
      emptyTitle="ไม่พบผู้ใช้"
      renderMobileCard={(row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback
                className={
                  row.role === "super_admin"
                    ? "bg-red-600 text-[10px] font-bold text-white"
                    : "bg-primary text-[10px] font-bold text-primary-foreground"
                }
              >
                {row.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">{row.full_name || "—"}</span>
            <span className="ml-auto inline-flex shrink-0">
              <Badge
                tone={row.role === "super_admin" ? "error" : "info"}
                className="text-[10px]"
              >
                {roleLabels[row.role] || row.role}
              </Badge>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{row.email}</p>
          <div className="flex items-center justify-between text-xs">
            <span>{row.tenants?.name || "—"}</span>
            <Badge tone={row.is_active ? "success" : "neutral"} dot className="text-[10px]">
              {row.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
            </Badge>
          </div>
        </div>
      )}
    />
  )
}
