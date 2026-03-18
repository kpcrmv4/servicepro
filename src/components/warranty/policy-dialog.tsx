'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { createWarrantyPolicy, updateWarrantyPolicy, deleteWarrantyPolicy } from '@/lib/actions/warranty'
import { Trash2 } from 'lucide-react'

const COVERAGE_TYPES = [
  { value: 'parts', label: 'อะไหล่' },
  { value: 'labor', label: 'ค่าแรง' },
  { value: 'full', label: 'เต็มรูปแบบ' },
  { value: 'limited', label: 'จำกัด' },
] as const

interface PolicyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editPolicy?: Record<string, unknown> | null
}

export function PolicyDialog({ open, onOpenChange, editPolicy }: PolicyDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [coverageType, setCoverageType] = useState(editPolicy?.coverage_type as string || 'full')
  const [error, setError] = useState('')

  const isEdit = !!editPolicy

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('coverage_type', coverageType)

    if (isEdit) {
      const isActiveCheckbox = e.currentTarget.querySelector<HTMLInputElement>('input[name="is_active"]')
      formData.set('is_active', isActiveCheckbox?.checked ? 'true' : 'false')
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateWarrantyPolicy(editPolicy!.id as string, formData)
        : await createWarrantyPolicy(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  function handleDelete() {
    if (!editPolicy || !confirm('ยืนยันลบนโยบายรับประกันนี้?')) return
    startTransition(async () => {
      const result = await deleteWarrantyPolicy(editPolicy.id as string)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขนโยบายรับประกัน' : 'เพิ่มนโยบายรับประกัน'}</DialogTitle>
          <DialogDescription>{isEdit ? 'แก้ไขข้อมูลนโยบายรับประกัน' : 'กรอกข้อมูลนโยบายรับประกันที่ต้องการเพิ่ม'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อนโยบาย *</Label>
            <Input id="name" name="name" defaultValue={editPolicy?.name as string || ''} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Input id="description" name="description" defaultValue={editPolicy?.description as string || ''} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="duration_months">ระยะเวลา (เดือน) *</Label>
              <Input
                id="duration_months"
                name="duration_months"
                type="number"
                min="1"
                defaultValue={editPolicy?.duration_months as number || ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ประเภทความคุ้มครอง</Label>
              <Select value={coverageType} onValueChange={setCoverageType}>
                <SelectTrigger><SelectValue placeholder="เลือกประเภท" /></SelectTrigger>
                <SelectContent>
                  {COVERAGE_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">เงื่อนไข</Label>
            <textarea
              id="terms"
              name="terms"
              rows={3}
              defaultValue={editPolicy?.terms as string || ''}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked={editPolicy?.is_active as boolean}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active" className="cursor-pointer">ใช้งาน</Label>
            </div>
          )}

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
              {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่มนโยบาย'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
