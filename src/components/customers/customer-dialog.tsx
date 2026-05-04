'use client'

import * as React from 'react'
import { useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { RadioGroup, SegmentedItem } from '@/components/ui/radio-group'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { createCustomer, updateCustomer, deleteCustomer } from '@/lib/actions/customers'
import { Trash2, User, Phone, Mail, MapPin, FileText, Building2 } from 'lucide-react'

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editCustomer?: Record<string, unknown> | null
}

export function CustomerDialog({ open, onOpenChange, editCustomer }: CustomerDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [customerType, setCustomerType] = React.useState(
    (editCustomer?.type as string) || 'individual',
  )
  const [membershipTier, setMembershipTier] = React.useState(
    (editCustomer?.membership_tier as string) || '',
  )

  const isEdit = !!editCustomer

  // Reset state when dialog opens for a different customer
  React.useEffect(() => {
    if (!open) return
    setCustomerType((editCustomer?.type as string) || 'individual')
    setMembershipTier((editCustomer?.membership_tier as string) || '')
  }, [open, editCustomer])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('type', customerType)
    if (membershipTier) formData.set('membership_tier', membershipTier)

    startTransition(async () => {
      try {
        const result = await toast.promise(
          isEdit
            ? updateCustomer(editCustomer!.id as string, formData)
            : createCustomer(formData),
          {
            loading: isEdit ? 'กำลังบันทึก...' : 'กำลังเพิ่มลูกค้า...',
            success: isEdit ? 'บันทึกสำเร็จ' : 'เพิ่มลูกค้าสำเร็จ',
            error: (err) => (err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'),
          },
        )
        if (result?.error) throw new Error(result.error)
        onOpenChange(false)
      } catch {
        // toast already shown
      }
    })
  }

  function handleDelete() {
    if (!editCustomer || !confirm('ยืนยันลบลูกค้านี้?')) return
    startTransition(async () => {
      try {
        const result = await toast.promise(
          deleteCustomer(editCustomer.id as string),
          {
            loading: 'กำลังลบ...',
            success: 'ลบลูกค้าสำเร็จ',
            error: (err) => (err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'),
          },
        )
        if (result?.error) throw new Error(result.error)
        onOpenChange(false)
      } catch {
        // toast already shown
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'แก้ไขข้อมูลลูกค้า' : 'กรอกข้อมูลลูกค้าที่ต้องการเพิ่ม'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="ประเภทลูกค้า">
            <RadioGroup
              variant="segmented"
              value={customerType}
              onValueChange={setCustomerType}
            >
              <SegmentedItem value="individual">
                <User className="h-3.5 w-3.5" />
                บุคคล
              </SegmentedItem>
              <SegmentedItem value="company">
                <Building2 className="h-3.5 w-3.5" />
                บริษัท
              </SegmentedItem>
            </RadioGroup>
          </FormField>

          <FormField label="ชื่อลูกค้า" required htmlFor="name">
            <Input
              id="name"
              name="name"
              defaultValue={(editCustomer?.name as string) || ''}
              required
              prefix={<User />}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="เบอร์โทร" htmlFor="phone">
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={(editCustomer?.phone as string) || ''}
                prefix={<Phone />}
              />
            </FormField>
            <FormField label="อีเมล" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={(editCustomer?.email as string) || ''}
                prefix={<Mail />}
              />
            </FormField>
          </div>

          <FormField label="ที่อยู่" htmlFor="address">
            <Input
              id="address"
              name="address"
              defaultValue={(editCustomer?.address as string) || ''}
              prefix={<MapPin />}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="เลขผู้เสียภาษี" htmlFor="tax_id">
              <Input
                id="tax_id"
                name="tax_id"
                defaultValue={(editCustomer?.tax_id as string) || ''}
                prefix={<FileText />}
              />
            </FormField>
            <FormField label="ระดับสมาชิก">
              <Select
                value={membershipTier}
                onValueChange={setMembershipTier}
                title="เลือกระดับสมาชิก"
              >
                <SelectTrigger>
                  <SelectValue placeholder="ไม่มี" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่มี</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="หมายเหตุ" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={(editCustomer?.notes as string) || ''}
            />
          </FormField>

          <DialogFooter className="gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={isPending}
                className="mr-auto border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> ลบ
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" loading={isPending}>
              {isEdit ? 'บันทึก' : 'เพิ่มลูกค้า'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
