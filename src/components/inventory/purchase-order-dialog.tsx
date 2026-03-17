'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { createPurchaseOrder } from '@/lib/actions/parts'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'

interface POItem {
  part_id: string
  part_name: string
  quantity: number
  cost_per_unit: number
}

interface PurchaseOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suppliers: Array<Record<string, unknown>>
  parts: Array<Record<string, unknown>>
}

export function PurchaseOrderDialog({ open, onOpenChange, suppliers, parts }: PurchaseOrderDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<POItem[]>([])
  const [selectedPartId, setSelectedPartId] = useState('')
  const [error, setError] = useState('')

  function addItem() {
    if (!selectedPartId) return
    const part = parts.find((p) => p.id === selectedPartId)
    if (!part) return
    if (items.some((i) => i.part_id === selectedPartId)) return

    setItems([...items, {
      part_id: selectedPartId,
      part_name: part.name as string,
      quantity: 1,
      cost_per_unit: Number(part.cost_price) || 0,
    }])
    setSelectedPartId('')
  }

  function removeItem(partId: string) {
    setItems(items.filter((i) => i.part_id !== partId))
  }

  function updateItem(partId: string, field: keyof POItem, value: number) {
    setItems(items.map((i) =>
      i.part_id === partId ? { ...i, [field]: value } : i
    ))
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (items.length === 0) { setError('กรุณาเพิ่มรายการอะไหล่'); return }

    const formData = new FormData(e.currentTarget)
    formData.set('supplier_id', supplierId)
    formData.set('items', JSON.stringify(items))

    startTransition(async () => {
      const result = await createPurchaseOrder(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setSupplierId('')
        setItems([])
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>สร้างใบสั่งซื้อ</DialogTitle>
          <DialogDescription>สร้างใบสั่งซื้ออะไหล่จากซัพพลายเออร์</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>ซัพพลายเออร์ *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="เลือกซัพพลายเออร์" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id as string} value={s.id as string}>{s.name as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_delivery">วันที่คาดว่าจะได้รับ</Label>
            <Input id="expected_delivery" name="expected_delivery" type="date" />
          </div>

          {/* Add items */}
          <div className="space-y-2">
            <Label>รายการอะไหล่</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                  <SelectTrigger><SelectValue placeholder="เลือกอะไหล่" /></SelectTrigger>
                  <SelectContent>
                    {parts.filter((p) => !items.some((i) => i.part_id === p.id)).map((p) => (
                      <SelectItem key={p.id as string} value={p.id as string}>
                        {p.part_number as string} - {p.name as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button type="button" onClick={addItem} disabled={!selectedPartId}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <Plus className="h-4 w-4" /> เพิ่ม
              </button>
            </div>
          </div>

          {/* Item list */}
          {items.length > 0 && (
            <div className="rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">อะไหล่</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-24">จำนวน</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-32">ราคาต่อหน่วย</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-28">รวม</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.part_id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-card-foreground">{item.part_name}</td>
                      <td className="px-3 py-2">
                        <Input type="number" min="1" value={item.quantity}
                          onChange={(e) => updateItem(item.part_id, 'quantity', Number(e.target.value) || 1)}
                          className="h-8 text-center" />
                      </td>
                      <td className="px-3 py-2">
                        <Input type="number" step="0.01" min="0" value={item.cost_per_unit}
                          onChange={(e) => updateItem(item.part_id, 'cost_per_unit', Number(e.target.value) || 0)}
                          className="h-8 text-center" />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.quantity * item.cost_per_unit)}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeItem(item.part_id)} className="text-muted-foreground hover:text-error">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/30">
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">รวมทั้งหมด</td>
                    <td className="px-3 py-2 text-right font-bold text-primary">{formatCurrency(subtotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="po_notes">หมายเหตุ</Label>
            <Input id="po_notes" name="notes" placeholder="หมายเหตุ (ถ้ามี)" />
          </div>

          <input type="hidden" name="vat" value="0" />

          {error && <p className="text-sm text-error">{error}</p>}

          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">ยกเลิก</button>
            <button type="submit" disabled={isPending || !supplierId || items.length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? 'กำลังสร้าง...' : 'สร้างใบสั่งซื้อ'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
