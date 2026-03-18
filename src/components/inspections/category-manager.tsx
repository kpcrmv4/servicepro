'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import {
  createInspectionCategory,
  updateInspectionCategory,
  deleteInspectionCategory,
} from '@/lib/actions/inspection-templates'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'

interface CategoryManagerProps {
  categories: Record<string, unknown>[]
  onRefresh: () => void
}

export function CategoryManager({ categories, onRefresh }: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editSort, setEditSort] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [newSort, setNewSort] = useState(0)
  const [error, setError] = useState('')

  function startEdit(cat: Record<string, unknown>) {
    setEditingId(cat.id as string)
    setEditName(cat.name as string)
    setEditIcon(cat.icon as string || '')
    setEditSort(cat.sort_order as number || 0)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setError('')
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return
    const formData = new FormData()
    formData.set('name', editName.trim())
    formData.set('icon', editIcon.trim())
    formData.set('sort_order', String(editSort))

    startTransition(async () => {
      const result = await updateInspectionCategory(editingId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setEditingId(null)
        onRefresh()
      }
    })
  }

  function handleAdd() {
    if (!newName.trim()) return
    const formData = new FormData()
    formData.set('name', newName.trim())
    formData.set('icon', newIcon.trim())
    formData.set('sort_order', String(newSort))

    startTransition(async () => {
      const result = await createInspectionCategory(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setNewName('')
        setNewIcon('')
        setNewSort(0)
        setShowAdd(false)
        onRefresh()
      }
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`ยืนยันลบหมวดหมู่ "${name}"?`)) return
    startTransition(async () => {
      const result = await deleteInspectionCategory(id)
      if (result?.error) {
        setError(result.error)
      } else {
        onRefresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_80px_80px] sm:grid-cols-[1fr_100px_100px_100px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
          <span>ชื่อหมวดหมู่</span>
          <span>ไอคอน</span>
          <span>ลำดับ</span>
          <span className="text-right">จัดการ</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {categories.map(cat => {
            const isEditing = editingId === (cat.id as string)

            if (isEditing) {
              return (
                <div key={cat.id as string} className="grid grid-cols-[1fr_80px_80px_80px] sm:grid-cols-[1fr_100px_100px_100px] gap-2 px-4 py-2.5 items-center bg-blue-50">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="ชื่อหมวดหมู่"
                  />
                  <Input
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="ไอคอน"
                  />
                  <Input
                    type="number"
                    value={editSort}
                    onChange={(e) => setEditSort(Number(e.target.value))}
                    className="h-8 text-sm"
                  />
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={handleSaveEdit}
                      disabled={isPending}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={cat.id as string} className="grid grid-cols-[1fr_80px_80px_80px] sm:grid-cols-[1fr_100px_100px_100px] gap-2 px-4 py-2.5 items-center hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900">{cat.name as string}</span>
                <span className="text-sm text-gray-500">{(cat.icon as string) || '-'}</span>
                <span className="text-sm text-gray-500">{cat.sort_order as number}</span>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id as string, cat.name as string)}
                    disabled={isPending}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {categories.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              ยังไม่มีหมวดหมู่
            </div>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAdd ? (
        <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">เพิ่มหมวดหมู่ใหม่</h3>
          <div className="grid grid-cols-[1fr_100px_100px] gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ชื่อหมวดหมู่"
              className="h-9 text-sm"
            />
            <Input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="ไอคอน/อิโมจิ"
              className="h-9 text-sm"
            />
            <Input
              type="number"
              value={newSort}
              onChange={(e) => setNewSort(Number(e.target.value))}
              placeholder="ลำดับ"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !newName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {isPending ? 'กำลังบันทึก...' : 'เพิ่ม'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setError('') }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          เพิ่มหมวดหมู่ใหม่
        </button>
      )}
    </div>
  )
}
