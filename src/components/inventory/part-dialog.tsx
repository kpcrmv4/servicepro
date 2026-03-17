'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { createPart, updatePart, deletePart } from '@/lib/actions/parts'
import { formatCurrency } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface PartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Array<Record<string, unknown>>
  editPart?: Record<string, unknown> | null
}

export function PartDialog({ open, onOpenChange, categories, editPart }: PartDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [categoryId, setCategoryId] = useState(editPart?.category_id as string || '')
  const [error, setError] = useState('')

  const isEdit = !!editPart

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('category_id', categoryId)

    startTransition(async () => {
      const result = isEdit
        ? await updatePart(editPart!.id as string, formData)
        : await createPart(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  function handleDelete() {
    if (!editPart || !confirm('ยืนยันลบอะไหล่นี้?')) return
    startTransition(async () => {
      const result = await deletePart(editPart.id as string)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขอะไหล่' : 'เพิ่มอะไหล่ใหม่'}</DialogTitle>
          <DialogDescription>{isEdit ? 'แก้ไขข้อมูลอะไหล่' : 'กรอกข้อมูลอะไหล่ที่ต้องการเพิ่ม'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="part_number">รหัสอะไหล่ *</Label>
              <Input id="part_number" name="part_number" defaultValue={editPart?.part_number as string || ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={editPart?.sku as string || ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">ชื่ออะไหล่ *</Label>
            <Input id="name" name="name" defaultValue={editPart?.name as string || ''} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brand">ยี่ห้อ</Label>
              <Input id="brand" name="brand" defaultValue={editPart?.brand as string || ''} />
            </div>
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id as string} value={c.id as string}>{c.name as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Input id="description" name="description" defaultValue={editPart?.description as string || ''} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="unit">หน่วย</Label>
              <Input id="unit" name="unit" defaultValue={editPart?.unit as string || 'piece'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selling_price">ราคาขาย *</Label>
              <Input id="selling_price" name="selling_price" type="number" step="0.01" defaultValue={editPart?.selling_price as number || ''} required />
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="cost_price">ราคาทุน</Label>
                <Input id="cost_price" name="cost_price" type="number" step="0.01" defaultValue="0" />
              </div>
            )}
            {isEdit && (
              <div className="space-y-2">
                <Label>ราคาทุนเฉลี่ย</Label>
                <div className="flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm">
                  {formatCurrency(Number(editPart?.cost_price) || 0)}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="min_stock">สต็อกขั้นต่ำ</Label>
              <Input id="min_stock" name="min_stock" type="number" step="0.01" defaultValue={editPart?.min_stock as number || '0'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_stock">สต็อกสูงสุด</Label>
              <Input id="max_stock" name="max_stock" type="number" step="0.01" defaultValue={editPart?.max_stock as number || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_point">จุดสั่งซื้อ</Label>
              <Input id="reorder_point" name="reorder_point" type="number" step="0.01" defaultValue={editPart?.reorder_point as number || '0'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="location">ตำแหน่งจัดเก็บ</Label>
              <Input id="location" name="location" defaultValue={editPart?.location as string || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">บาร์โค้ด</Label>
              <Input id="barcode" name="barcode" defaultValue={editPart?.barcode as string || ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL รูปภาพ</Label>
            <Input id="image_url" name="image_url" type="url" placeholder="https://..." defaultValue={editPart?.image_url as string || ''} />
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
              {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่มอะไหล่'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
