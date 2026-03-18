'use client'

import { useState, useTransition, useMemo } from 'react'
import { CheckCircle, Loader2, CheckSquare, Square, MessageSquare, Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import { approveInspectionItems } from '@/lib/actions/inspection-approval'

interface InspectionItem {
  id: string
  item_name: string
  category: string
  condition: 'good' | 'fair' | 'poor'
  estimated_cost: number | null
  customer_approved: boolean | null
  photo_url: string | null
  notes?: string | null
}

interface CustomerApprovalFormProps {
  shareToken: string
  items: InspectionItem[]
  isAlreadyApproved: boolean
  createdJobNumber?: string | null
}

const conditionLabels: Record<string, { label: string; color: string }> = {
  fair: { label: 'ควรเปลี่ยน', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  poor: { label: 'ต้องซ่อม', color: 'bg-red-100 text-red-700 border-red-300' },
}

export function CustomerApprovalForm({
  shareToken,
  items,
  isAlreadyApproved,
  createdJobNumber,
}: CustomerApprovalFormProps) {
  const actionableItems = useMemo(
    () => items.filter((i) => i.condition === 'fair' || i.condition === 'poor'),
    [items]
  )

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; jobNumber?: string; error?: string } | null>(null)

  // Don't render if no actionable items
  if (actionableItems.length === 0) return null

  const selectedCount = selectedIds.size
  const totalCost = actionableItems
    .filter((i) => selectedIds.has(i.id))
    .reduce((sum, i) => sum + (Number(i.estimated_cost) || 0), 0)

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setShowConfirm(false)
  }

  function toggleAll() {
    if (selectedIds.size === actionableItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(actionableItems.map((i) => i.id)))
    }
    setShowConfirm(false)
  }

  function handleApproveClick() {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }
    // Confirm -> submit
    startTransition(async () => {
      const res = await approveInspectionItems(
        shareToken,
        Array.from(selectedIds),
        notes || undefined
      )
      setResult(res)
      setShowConfirm(false)
    })
  }

  // Already approved state
  if (isAlreadyApproved || result?.success) {
    const displayJobNumber = result?.jobNumber || createdJobNumber
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-800">อนุมัติแล้ว</h3>
          {displayJobNumber && (
            <p className="text-green-700 mt-1">
              งานซ่อมเลขที่ <span className="font-bold">{displayJobNumber}</span>
            </p>
          )}
          <p className="text-sm text-green-600 mt-2">
            ทางอู่จะดำเนินการตามรายการที่อนุมัติ
          </p>

          {/* Show what was approved */}
          {isAlreadyApproved && actionableItems.length > 0 && (
            <div className="mt-4 text-left space-y-2">
              {actionableItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    item.customer_approved
                      ? 'bg-green-100/60 border border-green-200'
                      : 'bg-gray-100/60 border border-gray-200 opacity-60'
                  }`}
                >
                  {item.customer_approved ? (
                    <CheckSquare className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.item_name}
                    </p>
                  </div>
                  {Number(item.estimated_cost) > 0 && (
                    <span className="text-sm text-gray-600 shrink-0">
                      ฿{Number(item.estimated_cost).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Group by category for display
  const grouped: Record<string, InspectionItem[]> = {}
  actionableItems.forEach((item) => {
    const cat = item.category || 'อื่นๆ'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })

  return (
    <div className="space-y-4 pb-36">
      {/* Section header */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">อนุมัติรายการซ่อม</h3>
            <p className="text-sm text-gray-500">เลือกรายการที่ต้องการให้ดำเนินการ</p>
          </div>
        </div>

        {/* Select all toggle */}
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm text-blue-600 font-medium mt-3 active:opacity-70"
        >
          {selectedIds.size === actionableItems.length ? (
            <CheckSquare className="h-5 w-5" />
          ) : (
            <Square className="h-5 w-5" />
          )}
          เลือกทั้งหมด ({actionableItems.length} รายการ)
        </button>
      </div>

      {/* Items grouped by category */}
      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b">
            <h4 className="text-sm font-semibold text-gray-700">{category}</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {catItems.map((item) => {
              const isSelected = selectedIds.has(item.id)
              const cond = conditionLabels[item.condition]
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors active:bg-gray-50 ${
                    isSelected ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="pt-0.5 shrink-0">
                    {isSelected ? (
                      <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center">
                        <CheckSquare className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-md border-2 border-gray-300 flex items-center justify-center">
                        <Square className="h-5 w-5 text-transparent" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {item.item_name}
                      </span>
                      {cond && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cond.color}`}
                        >
                          {cond.label}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-0.5">{item.notes}</p>
                    )}
                    {Number(item.estimated_cost) > 0 && (
                      <p className="text-sm font-medium text-orange-600 mt-1">
                        ฿{Number(item.estimated_cost).toLocaleString()}
                      </p>
                    )}
                    {item.photo_url && (
                      <div className="mt-2">
                        <img
                          src={item.photo_url}
                          alt={item.item_name}
                          className="rounded-lg h-20 w-20 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Notes toggle */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between p-4 text-sm text-gray-600 active:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>เพิ่มหมายเหตุ (ไม่บังคับ)</span>
          </div>
          {showNotes ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {showNotes && (
          <div className="px-4 pb-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ต้องการซ่อมภายในสัปดาห์นี้..."
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {result?.error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
          {/* Confirm dialog */}
          {showConfirm && selectedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-sm font-medium text-amber-800">
                ยืนยันอนุมัติซ่อม {selectedCount} รายการ ประมาณ ฿{totalCost.toLocaleString()} บาท?
              </p>
              <p className="text-xs text-amber-600 mt-1">กดปุ่มอีกครั้งเพื่อยืนยัน</p>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs text-gray-500 mt-1 underline"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* Summary + button */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <span className="text-gray-500">เลือก </span>
              <span className="font-bold text-gray-900">{selectedCount}</span>
              <span className="text-gray-500"> รายการ</span>
              {totalCost > 0 && (
                <p className="text-orange-600 font-medium">
                  ฿{totalCost.toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={handleApproveClick}
              disabled={selectedCount === 0 || isPending}
              className={`flex items-center gap-2 rounded-xl px-6 min-h-[56px] text-sm font-bold transition-all ${
                selectedCount === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : showConfirm
                    ? 'bg-green-600 text-white active:bg-green-700'
                    : 'bg-blue-600 text-white active:bg-blue-700'
              } disabled:opacity-50`}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              {showConfirm ? 'ยืนยันอนุมัติ' : `อนุมัติรายการที่เลือก (${selectedCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
