'use client'

import { useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { cn, formatDateShort } from '@/lib/utils'
import { PolicyDialog } from './policy-dialog'

const coverageTypeLabels: Record<string, string> = {
  parts: 'อะไหล่',
  labor: 'ค่าแรง',
  full: 'เต็มรูปแบบ',
  limited: 'จำกัด',
}

interface PolicySectionProps {
  policies: Array<Record<string, unknown>>
}

export function PolicySection({ policies }: PolicySectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPolicy, setEditPolicy] = useState<Record<string, unknown> | null>(null)

  const activePolicies = policies.filter((p) => p.is_active).length

  function handleAdd() {
    setEditPolicy(null)
    setDialogOpen(true)
  }

  function handleEdit(policy: Record<string, unknown>) {
    setEditPolicy(policy)
    setDialogOpen(true)
  }

  return (
    <>
      {/* Add Button (rendered via PageHeader action slot externally, but we also provide one here) */}
      <div className="flex justify-end px-4 sm:px-6 -mt-2">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> เพิ่มนโยบาย
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4 sm:px-6 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">นโยบายทั้งหมด</p>
          <p className="mt-1 text-2xl font-bold">{policies.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">ใช้งานอยู่</p>
          <p className="mt-1 text-2xl font-bold text-success">{activePolicies}</p>
        </div>
      </div>

      {/* Policies Table */}
      <div className="px-4 sm:px-6">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ชื่อนโยบาย</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ประเภท</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">ระยะเวลา (เดือน)</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">วันที่สร้าง</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr
                  key={policy.id as string}
                  onClick={() => handleEdit(policy)}
                  className="border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-card-foreground">{policy.name as string}</p>
                      {typeof policy.description === 'string' && policy.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {policy.description as string}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {coverageTypeLabels[policy.coverage_type as string] || (policy.coverage_type as string)}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {policy.duration_months as number}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        policy.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {policy.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateShort(policy.created_at as string)}
                  </td>
                </tr>
              ))}
              {policies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2">ยังไม่มีนโยบายรับประกัน</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PolicyDialog
        key={editPolicy?.id as string || 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editPolicy={editPolicy}
      />
    </>
  )
}
