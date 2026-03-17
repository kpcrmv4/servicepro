'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  createInvoice,
  createReceipt,
  createExpense,
} from '@/lib/actions/finance'
import { formatCurrency } from '@/lib/utils'

// =============================================================================
// Create Invoice Dialog
// =============================================================================

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobs: Array<Record<string, unknown>>
  customers: Array<Record<string, unknown>>
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  jobs,
  customers,
}: CreateInvoiceDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('job_id', selectedJobId)
    formData.set('customer_id', selectedCustomerId)

    // Auto-calculate from job if selected
    const job = jobs.find((j) => j.id === selectedJobId)
    if (job && !formData.get('subtotal')) {
      formData.set('subtotal', String(job.grand_total || job.total_amount || 0))
    }

    startTransition(async () => {
      const result = await createInvoice(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setSelectedJobId('')
        setSelectedCustomerId('')
      }
    })
  }

  // Auto-fill customer when job is selected
  function handleJobSelect(jobId: string) {
    setSelectedJobId(jobId)
    const job = jobs.find((j) => j.id === jobId)
    if (job?.customer_id) {
      setSelectedCustomerId(job.customer_id as string)
    }
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบแจ้งหนี้</DialogTitle>
          <DialogDescription>สร้างใบแจ้งหนี้ใหม่จากงานซ่อม</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>งานซ่อม</Label>
            <Select value={selectedJobId} onValueChange={handleJobSelect}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกงานซ่อม" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id as string} value={job.id as string}>
                    {job.job_number as string} - {(job.customers as Record<string, unknown>)?.name as string || 'ไม่ระบุ'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ลูกค้า</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกลูกค้า" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id as string} value={c.id as string}>
                    {c.name as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="subtotal">ยอดรวม</Label>
              <Input
                id="subtotal"
                name="subtotal"
                type="number"
                step="0.01"
                defaultValue={selectedJob ? String(selectedJob.grand_total || selectedJob.total_amount || 0) : ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">ส่วนลด</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                step="0.01"
                defaultValue={selectedJob ? String(selectedJob.discount || 0) : '0'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat">ภาษี (VAT)</Label>
              <Input
                id="vat"
                name="vat"
                type="number"
                step="0.01"
                defaultValue={selectedJob ? String(selectedJob.vat || 0) : '0'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">กำหนดชำระ</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Input id="notes" name="notes" placeholder="หมายเหตุ (ถ้ามี)" />
          </div>

          <input type="hidden" name="items" value={selectedJob ? JSON.stringify(selectedJob.items || []) : '[]'} />

          {error && <p className="text-sm text-error">{error}</p>}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedCustomerId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? 'กำลังสร้าง...' : 'สร้างใบแจ้งหนี้'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Create Receipt Dialog (linked to invoice)
// =============================================================================

interface CreateReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingInvoices: Array<Record<string, unknown>>
}

export function CreateReceiptDialog({
  open,
  onOpenChange,
  pendingInvoices,
}: CreateReceiptDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [error, setError] = useState('')

  const selectedInvoice = pendingInvoices.find((inv) => inv.id === selectedInvoiceId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('invoice_id', selectedInvoiceId)
    formData.set('payment_method', paymentMethod)

    startTransition(async () => {
      const result = await createReceipt(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setSelectedInvoiceId('')
        setPaymentMethod('cash')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างใบเสร็จ</DialogTitle>
          <DialogDescription>สร้างใบเสร็จรับเงินจากใบแจ้งหนี้</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>ใบแจ้งหนี้</Label>
            <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกใบแจ้งหนี้" />
              </SelectTrigger>
              <SelectContent>
                {pendingInvoices.map((inv) => {
                  const customer = inv.customers as Record<string, unknown> | null
                  return (
                    <SelectItem key={inv.id as string} value={inv.id as string}>
                      {inv.invoice_number as string} - {customer?.name as string || 'ไม่ระบุ'} ({formatCurrency(Number(inv.total))})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedInvoice && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p>ยอดค้างชำระ: <span className="font-bold">{formatCurrency(Number(selectedInvoice.total))}</span></p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">จำนวนเงินที่รับ</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              defaultValue={selectedInvoice ? String(selectedInvoice.total) : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>วิธีชำระเงิน</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">เงินสด</SelectItem>
                <SelectItem value="transfer">โอนเงิน</SelectItem>
                <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                <SelectItem value="promptpay">PromptPay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">เลขอ้างอิง / Transaction ID</Label>
            <Input id="reference" name="reference" placeholder="เลขอ้างอิง (ถ้ามี)" />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedInvoiceId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? 'กำลังสร้าง...' : 'สร้างใบเสร็จ'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Create Expense Dialog
// =============================================================================

interface CreateExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const expenseCategories = [
  { value: 'salary', label: 'ค่าจ้างพนักงาน' },
  { value: 'rent', label: 'ค่าเช่า' },
  { value: 'utilities', label: 'ค่าน้ำ/ค่าไฟ' },
  { value: 'supplies', label: 'วัสดุสิ้นเปลือง' },
  { value: 'equipment', label: 'อุปกรณ์/เครื่องมือ' },
  { value: 'marketing', label: 'การตลาด/โฆษณา' },
  { value: 'insurance', label: 'ประกันภัย' },
  { value: 'transport', label: 'ค่าขนส่ง' },
  { value: 'maintenance', label: 'ค่าบำรุงรักษา' },
  { value: 'other', label: 'อื่นๆ' },
]

export function CreateExpenseDialog({ open, onOpenChange }: CreateExpenseDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('category', category)

    startTransition(async () => {
      const result = await createExpense(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setCategory('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>บันทึกค่าใช้จ่าย</DialogTitle>
          <DialogDescription>บันทึกค่าใช้จ่ายรายวัน/รายเดือน</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>หมวดหมู่</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Input id="description" name="description" placeholder="รายละเอียดค่าใช้จ่าย" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">จำนวนเงิน</Label>
            <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">วันที่</Label>
            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending || !category}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? 'กำลังบันทึก...' : 'บันทึกค่าใช้จ่าย'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
