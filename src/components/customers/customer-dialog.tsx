'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { createCustomer, updateCustomer, deleteCustomer } from '@/lib/actions/customers'
import { Trash2 } from 'lucide-react'

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editCustomer?: Record<string, unknown> | null
}

export function CustomerDialog({ open, onOpenChange, editCustomer }: CustomerDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [customerType, setCustomerType] = useState(editCustomer?.type as string || 'individual')
  const [membershipTier, setMembershipTier] = useState(editCustomer?.membership_tier as string || '')
  const [error, setError] = useState('')

  const isEdit = !!editCustomer

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('type', customerType)
    if (membershipTier) {
      formData.set('membership_tier', membershipTier)
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateCustomer(editCustomer!.id as string, formData)
        : await createCustomer(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  function handleDelete() {
    if (!editCustomer || !confirm('ยืนยันลบลูกค้านี้?')) return
    startTransition(async () => {
      const result = await deleteCustomer(editCustomer.id as string)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}</DialogTitle>
          <DialogDescription>{isEdit ? 'แก้ไขข้อมูลลูกค้า' : 'กรอกข้อมูลลูกค้าที่ต้องการเพิ่ม'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อลูกค้า *</Label>
            <Input id="name" name="name" defaultValue={editCustomer?.name as string || ''} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทร</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={editCustomer?.phone as string || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" name="email" type="email" defaultValue={editCustomer?.email as string || ''} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">ที่อยู่</Label>
            <Input id="address" name="address" defaultValue={editCustomer?.address as string || ''} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tax_id">เลขผู้เสียภาษี</Label>
              <Input id="tax_id" name="tax_id" defaultValue={editCustomer?.tax_id as string || ''} />
            </div>
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger><SelectValue placeholder="เลือกประเภท" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">บุคคล</SelectItem>
                  <SelectItem value="company">บริษัท</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ระดับสมาชิก</Label>
            <Select value={membershipTier} onValueChange={setMembershipTier}>
              <SelectTrigger><SelectValue placeholder="เลือกระดับสมาชิก" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่มี</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Input id="notes" name="notes" defaultValue={editCustomer?.notes as string || ''} />
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
              {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่มลูกค้า'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
