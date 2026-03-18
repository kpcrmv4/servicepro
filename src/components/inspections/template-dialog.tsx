'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createInspectionTemplate,
  updateInspectionTemplate,
  deleteInspectionTemplate,
  getInspectionCategories,
} from '@/lib/actions/inspection-templates'
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react'

interface TemplateItem {
  category: string
  item_name: string
  sort_order: number
}

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTemplate?: Record<string, unknown> | null
}

export function TemplateDialog({ open, onOpenChange, editTemplate }: TemplateDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Record<string, unknown>[]>([])
  const [items, setItems] = useState<TemplateItem[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const isEdit = !!editTemplate

  useEffect(() => {
    if (open) {
      loadCategories()
      if (editTemplate) {
        const existingItems = (editTemplate.items as TemplateItem[]) || []
        setItems(existingItems)
        // Expand categories that have items
        const cats = new Set(existingItems.map(i => i.category))
        setExpandedCategories(cats)
      } else {
        setItems([])
        setExpandedCategories(new Set())
      }
      setError('')
    }
  }, [open, editTemplate])

  async function loadCategories() {
    try {
      const data = await getInspectionCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  function toggleCategory(catName: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catName)) next.delete(catName)
      else next.add(catName)
      return next
    })
  }

  function addItem(category: string) {
    const catItems = items.filter(i => i.category === category)
    const maxSort = catItems.length > 0 ? Math.max(...catItems.map(i => i.sort_order)) + 1 : items.length
    setItems([...items, { category, item_name: '', sort_order: maxSort }])
  }

  function updateItemName(index: number, name: string) {
    const updated = [...items]
    updated[index] = { ...updated[index], item_name: name }
    setItems(updated)
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function getItemsForCategory(catName: string) {
    return items
      .map((item, index) => ({ ...item, _index: index }))
      .filter(i => i.category === catName)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    // Filter out empty item names and re-index sort_order
    let sortOrder = 0
    const cleanItems = items
      .filter(i => i.item_name.trim())
      .map(i => ({ ...i, item_name: i.item_name.trim(), sort_order: sortOrder++ }))

    formData.set('items', JSON.stringify(cleanItems))

    startTransition(async () => {
      const result = isEdit
        ? await updateInspectionTemplate(editTemplate!.id as string, formData)
        : await createInspectionTemplate(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  function handleDelete() {
    if (!editTemplate || !confirm('ยืนยันลบเทมเพลตนี้?')) return
    startTransition(async () => {
      const result = await deleteInspectionTemplate(editTemplate.id as string)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  const totalItemCount = items.filter(i => i.item_name.trim()).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขเทมเพลต' : 'สร้างเทมเพลตใหม่'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'แก้ไขรายการตรวจสภาพในเทมเพลต' : 'กำหนดรายการตรวจสภาพที่ต้องการใช้ซ้ำ'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อเทมเพลต *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={editTemplate?.name as string || ''}
              required
              placeholder="เช่น ตรวจสภาพมาตรฐาน, ตรวจก่อนส่งมอบ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Input
              id="description"
              name="description"
              defaultValue={editTemplate?.description as string || ''}
              placeholder="คำอธิบายเทมเพลต (ไม่บังคับ)"
            />
          </div>

          {/* Template Items Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>รายการตรวจ ({totalItemCount} รายการ)</Label>
            </div>

            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">ไม่พบหมวดหมู่ กรุณาเพิ่มหมวดหมู่ก่อน</p>
              ) : (
                categories.map(cat => {
                  const catName = cat.name as string
                  const isExpanded = expandedCategories.has(catName)
                  const catItems = getItemsForCategory(catName)

                  return (
                    <div key={cat.id as string} className="border border-gray-100 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategory(catName)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="font-medium text-sm text-gray-900">
                            {cat.icon ? `${cat.icon} ` : ''}{catName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{catItems.length} รายการ</span>
                      </button>

                      {isExpanded && (
                        <div className="p-3 space-y-2">
                          {catItems.map((item) => (
                            <div key={item._index} className="flex items-center gap-2">
                              <Input
                                value={item.item_name}
                                onChange={(e) => updateItemName(item._index, e.target.value)}
                                placeholder="ชื่อรายการตรวจ..."
                                className="flex-1 h-9 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => removeItem(item._index)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addItem(catName)}
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            เพิ่มรายการ
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter className="gap-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="mr-auto flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> ลบ
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'สร้างเทมเพลต'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
