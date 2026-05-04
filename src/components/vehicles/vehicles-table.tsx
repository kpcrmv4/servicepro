"use client"

import * as React from "react"
import { Car, Phone } from "lucide-react"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

type VehicleRow = Record<string, unknown> & {
  id: string
  license_plate: string
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  current_mileage?: number | null
  customers?: { name?: string; phone?: string } | null
}

interface VehiclesTableProps {
  vehicles: VehicleRow[]
  search?: string
}

export function VehiclesTable({ vehicles, search }: VehiclesTableProps) {
  const columns: ColumnDef<VehicleRow>[] = React.useMemo(
    () => [
      {
        id: "license_plate",
        header: "ทะเบียน",
        sortable: true,
        sortValue: (r) => r.license_plate,
        cell: (row) => (
          <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-medium text-primary">
            {row.license_plate}
          </span>
        ),
      },
      {
        id: "brand_model",
        header: "ยี่ห้อ / รุ่น",
        sortable: true,
        sortValue: (r) => `${r.brand ?? ""} ${r.model ?? ""}`.trim(),
        cell: (row) => (
          <span className="inline-flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {[row.brand, row.model].filter(Boolean).join(" ") || "—"}
            </span>
          </span>
        ),
      },
      {
        id: "year",
        header: "ปี",
        align: "center",
        sortable: true,
        sortValue: (r) => Number(r.year ?? 0),
        cell: (row) =>
          row.year ? <span className="text-muted-foreground">{row.year}</span> : "—",
      },
      {
        id: "color",
        header: "สี",
        align: "center",
        cell: (row) =>
          row.color ? <span className="text-muted-foreground">{row.color}</span> : "—",
      },
      {
        id: "customer",
        header: "เจ้าของ",
        sortable: true,
        sortValue: (r) => r.customers?.name ?? "",
        cell: (row) => {
          const c = row.customers
          if (!c?.name) return "—"
          return (
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-3 w-3" />
                  {c.phone}
                </a>
              )}
            </div>
          )
        },
      },
      {
        id: "mileage",
        header: "เลขไมล์",
        align: "right",
        sortable: true,
        sortValue: (r) => Number(r.current_mileage ?? 0),
        cell: (row) =>
          row.current_mileage
            ? `${Number(row.current_mileage).toLocaleString()} km`
            : "—",
      },
    ],
    [],
  )

  return (
    <DataTable<VehicleRow>
      columns={columns}
      data={vehicles}
      getRowId={(row) => row.id}
      enablePagination
      enableColumnVisibility
      pageSize={25}
      savedViewKey="vehicles"
      emptyTitle={search ? "ไม่พบรถที่ค้นหา" : "ยังไม่มีข้อมูลรถ"}
      emptyDescription={search ? "ลองเปลี่ยนคำค้นหา" : undefined}
      renderMobileCard={(row) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
              {row.license_plate}
            </span>
            {row.year && (
              <span className="text-xs text-muted-foreground">{row.year}</span>
            )}
          </div>
          <p className="text-sm font-semibold">
            {[row.brand, row.model].filter(Boolean).join(" ") || "—"}
          </p>
          {row.customers?.name && (
            <div className="text-xs text-muted-foreground">
              เจ้าของ: <span className="text-foreground">{row.customers.name}</span>
              {row.customers.phone && ` · ${row.customers.phone}`}
            </div>
          )}
          {row.current_mileage ? (
            <p className="text-xs text-muted-foreground">
              {Number(row.current_mileage).toLocaleString()} km
              {row.color ? ` · ${row.color}` : ""}
            </p>
          ) : null}
        </div>
      )}
    />
  )
}
