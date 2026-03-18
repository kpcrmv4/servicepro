'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { createVehicle, updateVehicle, deleteVehicle } from '@/lib/actions/vehicles'
import { Trash2 } from 'lucide-react'

interface VehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  editVehicle?: Record<string, unknown> | null
}

export function VehicleDialog({ open, onOpenChange, customerId, editVehicle }: VehicleDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [engineType, setEngineType] = useState(editVehicle?.engine_type as string || '')
  const [error, setError] = useState('')

  const isEdit = !!editVehicle

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('customer_id', customerId)
    if (engineType) {
      formData.set('engine_type', engineType)
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateVehicle(editVehicle!.id as string, formData)
        : await createVehicle(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  function handleDelete() {
    if (!editVehicle || !confirm('ยืนยันลบรถคันนี้?')) return
    startTransition(async () => {
      const result = await deleteVehicle(editVehicle.id as string)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขข้อมูลรถ' : 'เพิ่มรถใหม่'}</DialogTitle>
          <DialogDescription>{isEdit ? 'แก้ไขข้อมูลรถยนต์' : 'กรอกข้อมูลรถที่ต้องการเพิ่ม'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license_plate">ทะเบียนรถ *</Label>
            <Input id="license_plate" name="license_plate" defaultValue={editVehicle?.license_plate as string || ''} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brand">ยี่ห้อ</Label>
              <Input id="brand" name="brand" defaultValue={editVehicle?.brand as string || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">รุ่น</Label>
              <Input id="model" name="model" defaultValue={editVehicle?.model as string || ''} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="year">ปี</Label>
              <Input id="year" name="year" type="number" defaultValue={editVehicle?.year as number || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">สี</Label>
              <Input id="color" name="color" defaultValue={editVehicle?.color as string || ''} />
            </div>
            <div className="space-y-2">
              <Label>ประเภทเครื่องยนต์</Label>
              <Select value={engineType} onValueChange={setEngineType}>
                <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">เบนซิน</SelectItem>
                  <SelectItem value="diesel">ดีเซล</SelectItem>
                  <SelectItem value="hybrid">ไฮบริด</SelectItem>
                  <SelectItem value="electric">ไฟฟ้า</SelectItem>
                  <SelectItem value="lpg">LPG</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="vin">เลข VIN</Label>
              <Input id="vin" name="vin" defaultValue={editVehicle?.vin as string || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_mileage">เลขไมล์</Label>
              <Input id="current_mileage" name="current_mileage" type="number" defaultValue={editVehicle?.current_mileage as number || ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Input id="notes" name="notes" defaultValue={editVehicle?.notes as string || ''} />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <DialogFooter className="gap-2">
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={isPending}
                className="mr-auto flex items-center gap-1.5 rounded-lg border border-error/30 px-3 py-2 text-sm text-error hover:bg-error/10 disabled:opacity-50">
                <Trash2 className="h-4 w-4" /> ลบ
              </button>
            )}
            <button type="button" onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              ยกเลิก
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่มรถ'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
