'use client'

import { useState } from 'react'
import { Gift, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
} from '@/lib/actions/service-packages'
import { useRouter } from 'next/navigation'

const categoryOptions = [
  { value: 'repair', label: 'ซ่อม' },
  { value: 'maintenance', label: 'ซ่อมบำรุง' },
  { value: 'inspection', label: 'ตรวจเช็ค' },
  { value: 'body_paint', label: 'สี/ตัวถัง' },
]

const categoryLabelMap: Record<string, string> = {
  repair: 'ซ่อม',
  maintenance: 'ซ่อมบำรุง',
  inspection: 'ตรวจเช็ค',
  body_paint: 'สี/ตัวถัง',
}

interface PackageFormData {
  name: string
  description: string
  category: string
  base_price: number
  estimated_hours: number
  is_active: boolean
}

const defaultForm: PackageFormData = {
  name: '',
  description: '',
  category: '',
  base_price: 0,
  estimated_hours: 1,
  is_active: true,
}

// ---- Create/Edit Dialog ----

interface PackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPackage?: Record<string, unknown> | null
}

export function PackageDialog({ open, onOpenChange, editingPackage }: PackageDialogProps) {
  const router = useRouter()
  const [form, setForm] = useState<PackageFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const isEditing = !!editingPackage

  // Reset form when dialog opens
  const handleOpenChange = (value: boolean) => {
    if (value && editingPackage) {
      setForm({
        name: String(editingPackage.name || ''),
        description: String(editingPackage.description || ''),
        category: String(editingPackage.category || ''),
        base_price: Number(editingPackage.base_price || 0),
        estimated_hours: Number(editingPackage.estimated_duration_minutes || 60) / 60,
        is_active: editingPackage.is_active !== false,
      })
    } else if (value) {
      setForm(defaultForm)
    }
    onOpenChange(value)
  }

  async function handleSave() {
    if (!form.name.trim() || form.base_price <= 0) return
    try {
      setSaving(true)
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category || undefined,
        base_price: form.base_price,
        estimated_duration_minutes: Math.round(form.estimated_hours * 60),
        is_active: form.is_active,
      }

      if (isEditing) {
        await updateServicePackage(String(editingPackage!.id), payload)
      } else {
        await createServicePackage({ ...payload, base_price: payload.base_price })
      }

      onOpenChange(false)
      setForm(defaultForm)
      router.refresh()
    } catch (err) {
      console.error('Failed to save package:', err)
    } finally {
      setSaving(false)
    }
  }

  // We need to call handleOpenChange when controlled open changes
  // Use the Dialog's onOpenChange directly
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'แก้ไขแพ็กเกจ' : 'สร้างแพ็กเกจใหม่'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'แก้ไขข้อมูลแพ็กเกจบริการ' : 'เพิ่มแพ็กเกจบริการใหม่สำหรับลูกค้า'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="pkg-name">ชื่อแพ็กเกจ *</Label>
            <Input
              id="pkg-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="เช่น เปลี่ยนถ่ายน้ำมันเครื่อง"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="pkg-desc">รายละเอียด</Label>
            <Textarea
              id="pkg-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="รายละเอียดแพ็กเกจ..."
              rows={3}
            />
          </div>

          {/* Category + Base Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pkg-price">ราคาพื้นฐาน (บาท) *</Label>
              <Input
                id="pkg-price"
                type="number"
                min={0}
                step={0.01}
                value={form.base_price || ''}
                onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Estimated Hours + Active toggle */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-hours">เวลาโดยประมาณ (ชม.)</Label>
              <Input
                id="pkg-hours"
                type="number"
                min={0}
                step={0.5}
                value={form.estimated_hours || ''}
                onChange={(e) => setForm({ ...form, estimated_hours: Number(e.target.value) })}
                placeholder="1"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 sm:mt-8">
              <Label htmlFor="pkg-active" className="cursor-pointer text-sm">
                เปิดใช้งาน
              </Label>
              <Switch
                id="pkg-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || form.base_price <= 0}
          >
            {saving ? 'กำลังบันทึก...' : isEditing ? 'บันทึก' : 'สร้างแพ็กเกจ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Delete Confirmation Dialog ----

interface DeletePackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg: Record<string, unknown> | null
}

export function DeletePackageDialog({ open, onOpenChange, pkg }: DeletePackageDialogProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!pkg) return
    try {
      setDeleting(true)
      await deleteServicePackage(String(pkg.id))
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete package:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ลบแพ็กเกจบริการ</DialogTitle>
          <DialogDescription>
            ยืนยันลบแพ็กเกจ &quot;{pkg?.name as string}&quot; หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            ยกเลิก
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'กำลังลบ...' : 'ลบแพ็กเกจ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Packages Tab Wrapper (client component for inventory page) ----

interface PackagesTabProps {
  servicePackages: Array<Record<string, unknown>>
}

export function PackagesTab({ servicePackages }: PackagesTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPkg, setEditingPkg] = useState<Record<string, unknown> | null>(null)
  const [deletingPkg, setDeletingPkg] = useState<Record<string, unknown> | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">
          แพ็กเกจบริการ ({servicePackages.length})
        </h3>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Gift className="h-4 w-4" />
          สร้างแพ็กเกจ
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ชื่อแพ็กเกจ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">รายละเอียด</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">หมวดหมู่</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ราคา</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">เวลา</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {servicePackages.map((pkg) => {
                const isActive = pkg.is_active as boolean
                const isPopular = pkg.is_popular as boolean
                const durationMin = Number(pkg.estimated_duration_minutes || 0)
                const hours = durationMin > 0 ? (durationMin / 60).toFixed(1) : null

                return (
                  <tr key={pkg.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-card-foreground">{pkg.name as string}</span>
                        {isPopular && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">ยอดนิยม</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[250px] truncate">
                      {(pkg.description as string) || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {pkg.category ? (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {categoryLabelMap[pkg.category as string] || (pkg.category as string)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">
                      {Number(pkg.base_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })} ฿
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                      {hours ? `${hours} ชม.` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={
                        isActive
                          ? 'inline-block rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success'
                          : 'inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'
                      }>
                        {isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingPkg(pkg)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title="แก้ไข"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPkg(pkg)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {servicePackages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    ยังไม่มีแพ็กเกจบริการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <PackageDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Edit Dialog */}
      <PackageDialog
        open={!!editingPkg}
        onOpenChange={(open) => { if (!open) setEditingPkg(null) }}
        editingPackage={editingPkg}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePackageDialog
        open={!!deletingPkg}
        onOpenChange={(open) => { if (!open) setDeletingPkg(null) }}
        pkg={deletingPkg}
      />
    </div>
  )
}
