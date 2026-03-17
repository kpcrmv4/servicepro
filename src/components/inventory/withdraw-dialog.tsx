'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { withdrawPart } from '@/lib/actions/parts'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parts: Array<Record<string, unknown>>
  jobs: Array<Record<string, unknown>>
  expiringBatches: Array<Record<string, unknown>>
}

export function WithdrawDialog({ open, onOpenChange, parts, jobs, expiringBatches }: WithdrawDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [partId, setPartId] = useState('')
  const [jobId, setJobId] = useState('')
  const [error, setError] = useState('')

  const selectedPart = parts.find((p) => p.id === partId)

  // Get expiring batches for selected part
  const partExpiringBatches = expiringBatches.filter(
    (b) => (b.parts as Record<string, unknown>)?.part_number === selectedPart?.part_number ||
           b.part_id === partId
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const quantity = Number(formData.get('quantity')) || 0

    if (!partId || !jobId || quantity <= 0) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    startTransition(async () => {
      const result = await withdrawPart({
        partId,
        jobId,
        quantity,
        notes: formData.get('notes') as string || undefined,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setPartId('')
        setJobId('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>เบิกอะไหล่</DialogTitle>
          <DialogDescription>เบิกอะไหล่สำหรับงานซ่อม (ระบบจะเบิก lot ที่ใกล้หมดอายุก่อน)</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>งานซ่อม (Job) *</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger><SelectValue placeholder="เลือกงานซ่อม" /></SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id as string} value={j.id as string}>
                    {j.job_number as string} - {(j.customers as Record<string, unknown>)?.name as string || ''} ({(j.vehicles as Record<string, unknown>)?.license_plate as string || ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>อะไหล่ *</Label>
            <Select value={partId} onValueChange={setPartId}>
              <SelectTrigger><SelectValue placeholder="เลือกอะไหล่" /></SelectTrigger>
              <SelectContent>
                {parts.map((p) => (
                  <SelectItem key={p.id as string} value={p.id as string}>
                    {p.part_number as string} - {p.name as string} (คงเหลือ: {Number(p.stock_quantity)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPart && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span>สต็อก: <strong>{Number(selectedPart.stock_quantity)}</strong> {selectedPart.unit as string}</span>
                <span>ราคาทุนเฉลี่ย: <strong>{formatCurrency(Number(selectedPart.cost_price))}</strong></span>
              </div>
            </div>
          )}

          {/* FEFO Warning - expiring batches */}
          {partExpiringBatches.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-warning">
                <AlertTriangle className="h-4 w-4" />
                Lot ที่ใกล้หมดอายุ (จะเบิกก่อน)
              </div>
              <div className="mt-2 space-y-1">
                {partExpiringBatches.slice(0, 3).map((b) => (
                  <div key={b.id as string} className="flex justify-between text-xs text-muted-foreground">
                    <span>หมดอายุ: {formatDateShort(b.expiry_date as string)}</span>
                    <span>เหลือ: {Number(b.quantity_remaining)} ชิ้น | ทุน: {formatCurrency(Number(b.cost_per_unit))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="withdraw_qty">จำนวนที่เบิก *</Label>
              <Input id="withdraw_qty" name="quantity" type="number" min="0.01" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw_notes">หมายเหตุ</Label>
              <Input id="withdraw_notes" name="notes" />
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">ยกเลิก</button>
            <button type="submit" disabled={isPending || !partId || !jobId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? 'กำลังเบิก...' : 'ยืนยันเบิก'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
