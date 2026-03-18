'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { VehicleDialog } from './vehicle-dialog'

export function AddVehicleButton({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" /> เพิ่มรถ
      </button>
      <VehicleDialog open={open} onOpenChange={setOpen} customerId={customerId} />
    </>
  )
}

export function EditVehicleCard({
  vehicle,
  customerId,
}: {
  vehicle: Record<string, unknown>
  customerId: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted/30 transition-colors"
      >
        <p className="font-bold text-primary">{vehicle.license_plate as string}</p>
        <p className="text-sm">{vehicle.brand as string} {vehicle.model as string}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {vehicle.year ? <span>ปี {String(vehicle.year)}</span> : null}
          {vehicle.color ? <span>สี: {String(vehicle.color)}</span> : null}
          {vehicle.current_mileage ? <span>{Number(vehicle.current_mileage).toLocaleString()} กม.</span> : null}
        </div>
        {vehicle.vin ? <p className="mt-1 font-mono text-[10px] text-muted-foreground">VIN: {String(vehicle.vin)}</p> : null}
      </button>
      <VehicleDialog open={open} onOpenChange={setOpen} customerId={customerId} editVehicle={vehicle} />
    </>
  )
}
