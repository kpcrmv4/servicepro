'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { receivePurchaseOrder, type ReceiveItem } from '@/lib/actions/parts'
import { formatCurrency } from '@/lib/utils'

interface ReceivePODialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: Record<string, unknown> | null
}

export function ReceivePODialog({ open, onOpenChange, purchaseOrder }: ReceivePODialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const poItems = (purchaseOrder?.items as Array<Record<string, unknown>>) || []
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>(() =>
    poItems.map((item) => ({
      part_id: item.part_id as string,
      part_name: item.part_name as string,
      ordered_quantity: Number(item.quantity) || 0,
      received_quantity: Number(item.quantity) || 0,
      cost_per_unit: Number(item.cost_per_unit) || 0,
      expiry_date: null,
    }))
  )

  // Reset when PO changes
  const poId = purchaseOrder?.id as string
  const [lastPoId, setLastPoId] = useState(poId)
  if (poId !== lastPoId) {
    setLastPoId(poId)
    setReceiveItems(
      poItems.map((item) => ({
        part_id: item.part_id as string,
        part_name: item.part_name as string,
        ordered_quantity: Number(item.quantity) || 0,
        received_quantity: Number(item.quantity) || 0,
        cost_per_unit: Number(item.cost_per_unit) || 0,
        expiry_date: null,
      }))
    )
  }

  function updateItem(index: number, field: string, value: string | number) {
    setReceiveItems((prev) =>
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!purchaseOrder) return
    setError('')

    startTransition(async () => {
      const result = await receivePurchaseOrder(purchaseOrder.id as string, receiveItems)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  if (!purchaseOrder) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>นำเข้าอะไหล่จากใบสั่งซื้อ</DialogTitle>
          <DialogDescription>
            {purchaseOrder.po_number as string} - {(purchaseOrder.suppliers as Record<string, unknown>)?.name as string}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">อะไหล่</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-20">สั่งซื้อ</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-24">ได้รับจริง</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-32">ราคาทุน/หน่วย</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-36">วันหมดอายุ</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-28">รวม</th>
                </tr>
              </thead>
              <tbody>
                {receiveItems.map((item, index) => (
                  <tr key={item.part_id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-card-foreground">{item.part_name}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{item.ordered_quantity}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        max={item.ordered_quantity * 2}
                        step="0.01"
                        value={item.received_quantity}
                        onChange={(e) => updateItem(index, 'received_quantity', Number(e.target.value) || 0)}
                        className="h-8 text-center"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cost_per_unit}
                        onChange={(e) => updateItem(index, 'cost_per_unit', Number(e.target.value) || 0)}
                        className="h-8 text-center"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        value={item.expiry_date || ''}
                        onChange={(e) => updateItem(index, 'expiry_date', e.target.value || '')}
                        className="h-8"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(item.received_quantity * item.cost_per_unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={5} className="px-3 py-2 text-right font-medium">รวมทั้งหมด</td>
                  <td className="px-3 py-2 text-right font-bold text-primary">
                    {formatCurrency(receiveItems.reduce((sum, item) => sum + (item.received_quantity * item.cost_per_unit), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            สามารถแก้ไขจำนวนที่ได้รับจริง ราคาทุน และวันหมดอายุของแต่ละรายการได้
          </p>

          {error && <p className="mt-3 text-sm text-error">{error}</p>}

          <DialogFooter className="mt-4">
            <button type="button" onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">ยกเลิก</button>
            <button type="submit" disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? 'กำลังนำเข้า...' : 'ยืนยันนำเข้า'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
