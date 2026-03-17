'use client'

import { useState, useTransition } from 'react'
import { createPartCategory, updatePartCategory, deletePartCategory } from '@/lib/actions/parts'
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CategoryManagerProps {
  categories: Array<Record<string, unknown>>
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setError('')
    startTransition(async () => {
      const result = await createPartCategory(newName.trim())
      if (result?.error) setError(result.error)
      else setNewName('')
    })
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return
    setError('')
    startTransition(async () => {
      const result = await updatePartCategory(id, editName.trim())
      if (result?.error) setError(result.error)
      else setEditingId(null)
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`ยืนยันลบหมวดหมู่ "${name}"?`)) return
    setError('')
    startTransition(async () => {
      const result = await deletePartCategory(id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-card-foreground">จัดการหมวดหมู่อะไหล่</h3>

      {/* Create new */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="ชื่อหมวดหมู่ใหม่"
          className="flex-1"
        />
        <button type="submit" disabled={isPending || !newName.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          <Plus className="h-4 w-4" /> เพิ่ม
        </button>
      </form>

      {error && <p className="text-sm text-error">{error}</p>}

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          ยังไม่มีหมวดหมู่
        </div>
      ) : (
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id as string} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              {editingId === cat.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(cat.id as string)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <button onClick={() => handleUpdate(cat.id as string)} disabled={isPending}
                    className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">บันทึก</button>
                  <button onClick={() => setEditingId(null)} className="rounded border border-border px-2 py-1 text-xs">ยกเลิก</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-card-foreground">{cat.name as string}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(cat.id as string); setEditName(cat.name as string) }}
                      className="p-1.5 text-muted-foreground hover:text-foreground" title="แก้ไข">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id as string, cat.name as string)}
                      disabled={isPending}
                      className="p-1.5 text-muted-foreground hover:text-error" title="ลบ">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
