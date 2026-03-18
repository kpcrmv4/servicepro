'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { inviteTeamMember, updateTeamMember, deactivateTeamMember } from '@/lib/actions/team'
import { Trash2, UserX } from 'lucide-react'

const ROLES = [
  { value: 'owner', label: 'เจ้าของ' },
  { value: 'admin', label: 'แอดมิน' },
  { value: 'manager', label: 'ผู้จัดการ' },
  { value: 'technician', label: 'ช่าง' },
  { value: 'receptionist', label: 'พนักงานต้อนรับ' },
  { value: 'viewer', label: 'ผู้ชม' },
] as const

interface MemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editMember?: Record<string, unknown> | null
}

export function MemberDialog({ open, onOpenChange, editMember }: MemberDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(editMember?.role as string || 'technician')
  const [isActive, setIsActive] = useState(editMember?.is_active !== false)
  const [error, setError] = useState('')

  const isEdit = !!editMember

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('role', role)
    if (isEdit) {
      formData.set('is_active', String(isActive))
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateTeamMember(editMember!.id as string, formData)
        : await inviteTeamMember(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  function handleDeactivate() {
    if (!editMember || !confirm('ยืนยันปิดการใช้งานพนักงานนี้?')) return
    startTransition(async () => {
      const result = await deactivateTeamMember(editMember.id as string)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขพนักงาน' : 'เชิญพนักงานใหม่'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'กรอกข้อมูลพนักงานที่ต้องการเชิญเข้าทีม'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              defaultValue={editMember?.email as string || ''}
              readOnly={isEdit}
              className={isEdit ? 'bg-muted cursor-not-allowed' : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">ชื่อ-นามสกุล *</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="ชื่อ นามสกุล"
              defaultValue={editMember?.full_name as string || ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>ตำแหน่ง *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกตำแหน่ง" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">เบอร์โทร</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="08x-xxx-xxxx"
              defaultValue={editMember?.phone as string || ''}
            />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm font-medium">สถานะการใช้งาน</Label>
                <p className="text-xs text-muted-foreground">
                  {isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <DialogFooter className="gap-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isPending}
                className="mr-auto flex items-center gap-1.5 rounded-lg border border-error/30 px-3 py-2 text-sm text-error hover:bg-error/10 disabled:opacity-50"
              >
                <UserX className="h-4 w-4" /> ปิดใช้งาน
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เชิญพนักงาน'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
