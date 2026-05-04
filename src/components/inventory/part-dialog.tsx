'use client'

import * as React from 'react'
import { useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormField, FormSection } from '@/components/ui/form-field'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { toast } from '@/components/ui/toast'
import { createPart, updatePart, deletePart } from '@/lib/actions/parts'
import { formatCurrency } from '@/lib/utils'
import { Trash2, Hash, Tag, MapPin, Barcode, Image as ImageIcon } from 'lucide-react'

interface PartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Array<Record<string, unknown>>
  editPart?: Record<string, unknown> | null
}

export function PartDialog({
  open,
  onOpenChange,
  categories,
  editPart,
}: PartDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [categoryId, setCategoryId] = React.useState(
    (editPart?.category_id as string) || '',
  )

  const isEdit = !!editPart

  React.useEffect(() => {
    if (!open) return
    setCategoryId((editPart?.category_id as string) || '')
  }, [open, editPart])

  const categoryOptions: ComboboxOption[] = React.useMemo(
    () =>
      categories.map((c) => ({
        value: c.id as string,
        label: c.name as string,
      })),
    [categories],
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('category_id', categoryId)

    startTransition(async () => {
      try {
        const result = await toast.promise(
          isEdit
            ? updatePart(editPart!.id as string, formData)
            : createPart(formData),
          {
            loading: isEdit ? 'กำลังบันทึก...' : 'กำลังเพิ่มอะไหล่...',
            success: isEdit ? 'บันทึกสำเร็จ' : 'เพิ่มอะไหล่สำเร็จ',
            error: (err) =>
              err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
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
    if (!editPart || !confirm('ยืนยันลบอะไหล่นี้?')) return
    startTransition(async () => {
      try {
        const result = await toast.promise(
          deletePart(editPart.id as string),
          {
            loading: 'กำลังลบ...',
            success: 'ลบอะไหล่สำเร็จ',
            error: (err) =>
              err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
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
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขอะไหล่' : 'เพิ่มอะไหล่ใหม่'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'แก้ไขข้อมูลอะไหล่' : 'กรอกข้อมูลอะไหล่ที่ต้องการเพิ่ม'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSection title="ข้อมูลพื้นฐาน" variant="plain">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="รหัสอะไหล่" required htmlFor="part_number">
                <Input
                  id="part_number"
                  name="part_number"
                  required
                  prefix={<Hash />}
                  defaultValue={(editPart?.part_number as string) || ''}
                />
              </FormField>
              <FormField label="SKU" htmlFor="sku">
                <Input
                  id="sku"
                  name="sku"
                  prefix={<Tag />}
                  defaultValue={(editPart?.sku as string) || ''}
                />
              </FormField>
            </div>

            <FormField label="ชื่ออะไหล่" required htmlFor="name">
              <Input
                id="name"
                name="name"
                required
                defaultValue={(editPart?.name as string) || ''}
              />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="ยี่ห้อ" htmlFor="brand">
                <Input
                  id="brand"
                  name="brand"
                  defaultValue={(editPart?.brand as string) || ''}
                />
              </FormField>
              <FormField label="หมวดหมู่">
                <Combobox
                  options={categoryOptions}
                  value={categoryId}
                  onValueChange={setCategoryId}
                  placeholder="เลือกหมวดหมู่"
                  title="เลือกหมวดหมู่"
                  clearable
                />
              </FormField>
            </div>

            <FormField label="รายละเอียด" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={(editPart?.description as string) || ''}
              />
            </FormField>
          </FormSection>

          <FormSection title="ราคาและหน่วย" variant="plain">
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="หน่วย" htmlFor="unit">
                <Input
                  id="unit"
                  name="unit"
                  defaultValue={(editPart?.unit as string) || 'piece'}
                />
              </FormField>
              <FormField label="ราคาขาย" required htmlFor="selling_price">
                <Input
                  id="selling_price"
                  name="selling_price"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={(editPart?.selling_price as number) ?? ''}
                />
              </FormField>
              {!isEdit ? (
                <FormField label="ราคาทุน" htmlFor="cost_price">
                  <Input
                    id="cost_price"
                    name="cost_price"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                  />
                </FormField>
              ) : (
                <FormField label="ราคาทุนเฉลี่ย">
                  <div className="flex h-10 items-center rounded-xl border border-border bg-muted px-3 text-sm">
                    {formatCurrency(Number(editPart?.cost_price) || 0)}
                  </div>
                </FormField>
              )}
            </div>
          </FormSection>

          <FormSection
            title="สต็อกและจุดสั่งซื้อ"
            variant="plain"
            description="ระบบจะแจ้งเตือนเมื่อสต็อกถึงจุดสั่งซื้อ"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="สต็อกขั้นต่ำ" htmlFor="min_stock">
                <Input
                  id="min_stock"
                  name="min_stock"
                  type="number"
                  step="0.01"
                  defaultValue={(editPart?.min_stock as number) ?? '0'}
                />
              </FormField>
              <FormField label="สต็อกสูงสุด" htmlFor="max_stock">
                <Input
                  id="max_stock"
                  name="max_stock"
                  type="number"
                  step="0.01"
                  defaultValue={(editPart?.max_stock as number) ?? ''}
                />
              </FormField>
              <FormField label="จุดสั่งซื้อ" htmlFor="reorder_point">
                <Input
                  id="reorder_point"
                  name="reorder_point"
                  type="number"
                  step="0.01"
                  defaultValue={(editPart?.reorder_point as number) ?? '0'}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="อื่นๆ" variant="plain" collapsible defaultOpen={false}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="ตำแหน่งจัดเก็บ" htmlFor="location">
                <Input
                  id="location"
                  name="location"
                  prefix={<MapPin />}
                  defaultValue={(editPart?.location as string) || ''}
                />
              </FormField>
              <FormField label="บาร์โค้ด" htmlFor="barcode">
                <Input
                  id="barcode"
                  name="barcode"
                  prefix={<Barcode />}
                  defaultValue={(editPart?.barcode as string) || ''}
                />
              </FormField>
            </div>
            <FormField label="URL รูปภาพ" htmlFor="image_url">
              <Input
                id="image_url"
                name="image_url"
                type="url"
                prefix={<ImageIcon />}
                placeholder="https://..."
                defaultValue={(editPart?.image_url as string) || ''}
              />
            </FormField>
          </FormSection>

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
              {isEdit ? 'บันทึก' : 'เพิ่มอะไหล่'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
