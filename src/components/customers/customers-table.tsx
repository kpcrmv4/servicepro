"use client"

import * as React from "react"
import Link from "next/link"
import { Crown, Phone, Car, Users } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type CustomerRow = Record<string, unknown> & {
  id: string
  name: string
  phone?: string | null
  type?: string | null
  vehicles?: Array<Record<string, unknown>>
  total_visits?: number | null
  total_spending?: number | null
  membership_tier?: string | null
  loyalty_points?: number | null
}

const tierConfig: Record<string, { label: string; tone: "warn" | "neutral" | "info" | "success" | "error" }> = {
  bronze: { label: "Bronze", tone: "warn" },
  silver: { label: "Silver", tone: "neutral" },
  gold: { label: "Gold", tone: "warn" },
  platinum: { label: "Platinum", tone: "info" },
}

interface CustomersTableProps {
  customers: CustomerRow[]
  search?: string
}

export function CustomersTable({ customers, search }: CustomersTableProps) {
  const columns: ColumnDef<CustomerRow>[] = React.useMemo(
    () => [
      {
        id: "name",
        header: "ชื่อ",
        sortable: true,
        sortValue: (r) => r.name,
        cell: (row) => (
          <Link
            href={`/dashboard/customers/${row.id}`}
            className="flex items-center gap-3 hover:underline"
          >
            <Avatar className="h-8 w-8 bg-primary/10 text-primary">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {row.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.name}</span>
          </Link>
        ),
      },
      {
        id: "phone",
        header: "เบอร์โทร",
        cell: (row) =>
          row.phone ? (
            <a
              href={`tel:${row.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-3 w-3" />
              {row.phone}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "type",
        header: "ประเภท",
        align: "center",
        sortable: true,
        sortValue: (r) => r.type ?? "",
        cell: (row) => (
          <Badge tone={row.type === "company" ? "info" : "neutral"}>
            {row.type === "company" ? "นิติบุคคล" : "บุคคล"}
          </Badge>
        ),
      },
      {
        id: "vehicles",
        header: "รถ",
        align: "center",
        sortable: true,
        sortValue: (r) => (r.vehicles?.length ?? 0),
        cell: (row) => {
          const count = row.vehicles?.length ?? 0
          return (
            <span className="inline-flex items-center gap-1 text-foreground">
              <Car className="h-3 w-3 text-muted-foreground" />
              {count}
            </span>
          )
        },
      },
      {
        id: "total_visits",
        header: "ใช้บริการ",
        align: "center",
        sortable: true,
        sortValue: (r) => Number(r.total_visits ?? 0),
        cell: (row) => `${row.total_visits ?? 0} ครั้ง`,
      },
      {
        id: "total_spending",
        header: "ยอดสะสม",
        align: "right",
        sortable: true,
        sortValue: (r) => Number(r.total_spending ?? 0),
        cell: (row) => (
          <span className="font-medium">
            {formatCurrency(Number(row.total_spending) || 0)}
          </span>
        ),
      },
      {
        id: "membership_tier",
        header: "ระดับสมาชิก",
        align: "center",
        sortable: true,
        sortValue: (r) => r.membership_tier ?? "",
        cell: (row) => {
          const tier = row.membership_tier
          if (!tier || !tierConfig[tier]) {
            return <span className="text-muted-foreground">—</span>
          }
          const cfg = tierConfig[tier]
          return (
            <Badge tone={cfg.tone} dot>
              <Crown className="h-3 w-3" />
              {cfg.label}
            </Badge>
          )
        },
      },
      {
        id: "loyalty_points",
        header: "คะแนน",
        align: "center",
        sortable: true,
        sortValue: (r) => Number(r.loyalty_points ?? 0),
        cell: (row) => row.loyalty_points ?? 0,
        hiddenByDefault: false,
      },
    ],
    [],
  )

  return (
    <DataTable<CustomerRow>
      columns={columns}
      data={customers}
      getRowId={(row) => row.id}
      enableColumnVisibility
      enablePagination
      pageSize={25}
      savedViewKey="customers"
      emptyTitle={search ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีข้อมูลลูกค้า"}
      emptyDescription={search ? "ลองเปลี่ยนคำค้นหา" : "เพิ่มลูกค้าใหม่เพื่อเริ่มใช้งาน"}
      renderMobileCard={(row) => (
        <Link
          href={`/dashboard/customers/${row.id}`}
          className="block space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 bg-primary/10 text-primary">
              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                {row.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">{row.name}</span>
            <span className="ml-auto inline-flex shrink-0">
              <Badge tone={row.type === "company" ? "info" : "neutral"} className="text-[10px]">
                {row.type === "company" ? "นิติฯ" : "บุคคล"}
              </Badge>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {row.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {row.phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Car className="h-3 w-3" />
              {row.vehicles?.length ?? 0} คัน
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {row.total_visits ?? 0} ครั้ง
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {formatCurrency(Number(row.total_spending) || 0)}
            </span>
            {row.membership_tier && tierConfig[row.membership_tier] && (
              <Badge
                tone={tierConfig[row.membership_tier].tone}
                dot
                className={cn("text-[10px]")}
              >
                <Crown className="h-2.5 w-2.5" />
                {tierConfig[row.membership_tier].label}
              </Badge>
            )}
          </div>
        </Link>
      )}
    />
  )
}
