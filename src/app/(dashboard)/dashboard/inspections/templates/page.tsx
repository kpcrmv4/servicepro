'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getInspectionTemplates,
  getInspectionCategories,
  setDefaultTemplate,
} from '@/lib/actions/inspection-templates'
import { TemplateDialog } from '@/components/inspections/template-dialog'
import { CategoryManager } from '@/components/inspections/category-manager'
import { ArrowLeft, ClipboardList, Layers, Plus, Star, Pencil, FileText } from 'lucide-react'

type Tab = 'templates' | 'categories'

export default function InspectionTemplatesPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('templates')
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([])
  const [categories, setCategories] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [tmpl, cats] = await Promise.all([
        getInspectionTemplates(),
        getInspectionCategories(),
      ])
      setTemplates(tmpl)
      setCategories(cats)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleNewTemplate() {
    setEditTemplate(null)
    setDialogOpen(true)
  }

  function handleEditTemplate(tmpl: Record<string, unknown>) {
    setEditTemplate(tmpl)
    setDialogOpen(true)
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setEditTemplate(null)
      loadData()
    }
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      await setDefaultTemplate(id)
      await loadData()
    })
  }

  function getItemCount(tmpl: Record<string, unknown>): number {
    const items = tmpl.items as unknown[]
    return Array.isArray(items) ? items.length : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            จัดการเทมเพลตตรวจสภาพ
          </h1>
          <p className="text-sm text-gray-500">สร้างและจัดการเทมเพลตรายการตรวจสภาพรถ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          เทมเพลต ({templates.length})
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          หมวดหมู่ ({categories.length})
        </button>
      </div>

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleNewTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              สร้างเทมเพลต
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">ยังไม่มีเทมเพลต</p>
              <button
                onClick={handleNewTemplate}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                สร้างเทมเพลตแรก
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(tmpl => (
                <div
                  key={tmpl.id as string}
                  className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{tmpl.name as string}</h3>
                      {Boolean(tmpl.is_default) && (
                        <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          <Star className="h-3 w-3" />
                          ค่าเริ่มต้น
                        </span>
                      )}
                    </div>
                    {Boolean(tmpl.description) && (
                      <p className="text-sm text-gray-500 mt-1">{tmpl.description as string}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{getItemCount(tmpl)} รายการตรวจ</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!tmpl.is_default && (
                      <button
                        onClick={() => handleSetDefault(tmpl.id as string)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        title="ตั้งเป็นค่าเริ่มต้น"
                      >
                        <Star className="h-3.5 w-3.5" />
                        ตั้งเป็นค่าเริ่มต้น
                      </button>
                    )}
                    <button
                      onClick={() => handleEditTemplate(tmpl)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      แก้ไข
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <CategoryManager categories={categories} onRefresh={loadData} />
      )}

      {/* Template Dialog */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        editTemplate={editTemplate}
      />
    </div>
  )
}
