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
  createRecurringExpense,
  toggleRecurringExpense,
  generateFixedExpenseNow,
  recordVariableExpense,
  processRecurringExpenses,
} from '@/lib/actions/finance'
import { formatCurrency } from '@/lib/utils'
import { Plus, Play, Clock, Bell, Zap, ToggleLeft, ToggleRight } from 'lucide-react'

const expenseCategories = [
  { value: 'salary', label: 'ค่าจ้างพนักงาน' },
  { value: 'rent', label: 'ค่าเช่า' },
  { value: 'utilities', label: 'ค่าน้ำ/ค่าไฟ' },
  { value: 'insurance', label: 'ประกันภัย' },
  { value: 'internet', label: 'ค่าอินเทอร์เน็ต' },
  { value: 'phone', label: 'ค่าโทรศัพท์' },
  { value: 'software', label: 'ค่าซอฟต์แวร์/สมาชิก' },
  { value: 'maintenance', label: 'ค่าบำรุงรักษา' },
  { value: 'other', label: 'อื่นๆ' },
]

const categoryLabels: Record<string, string> = {}
expenseCategories.forEach((c) => { categoryLabels[c.value] = c.label })

interface RecurringExpenseManagerProps {
  recurringExpenses: Array<Record<string, unknown>>
}

export function RecurringExpenseManager({ recurringExpenses }: RecurringExpenseManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = useState('')
  const [selectedExpenseName, setSelectedExpenseName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, currentActive: boolean) {
    startTransition(async () => {
      await toggleRecurringExpense(id, !currentActive)
    })
  }

  function handleGenerateNow(id: string) {
    startTransition(async () => {
      const result = await generateFixedExpenseNow(id)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  function handleProcessAll() {
    startTransition(async () => {
      const result = await processRecurringExpenses()
      if (result?.error) {
        alert(result.error)
      } else if (result && 'generated' in result) {
        alert(`สร้างค่าใช้จ่ายคงที่ ${result.generated} รายการ, แจ้งเตือนค่าใช้จ่ายไม่คงที่ ${result.notified} รายการ`)
      }
    })
  }

  function openRecordDialog(id: string, name: string) {
    setSelectedExpenseId(id)
    setSelectedExpenseName(name)
    setShowRecordDialog(true)
  }

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">ค่าใช้จ่ายประจำ (รายเดือน)</h3>
        <div className="flex gap-2">
          <button
            onClick={handleProcessAll}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            ประมวลผลวันนี้
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* Recurring Expense List */}
      {recurringExpenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          ยังไม่มีค่าใช้จ่ายประจำ กดปุ่ม &quot;เพิ่มรายการ&quot; เพื่อตั้งค่า
        </div>
      ) : (
        <div className="space-y-2">
          {recurringExpenses.map((expense) => {
            const isGenerated = expense.last_generated_month === currentMonth
            const isFixed = expense.type === 'fixed'
            const isActive = expense.is_active as boolean

            return (
              <div
                key={expense.id as string}
                className={`flex items-center justify-between rounded-lg border border-border p-3 ${!isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${isFixed ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                      {isFixed ? <Clock className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                      {isFixed ? 'คงที่' : 'ไม่คงที่'}
                    </span>
                    <span className="text-sm font-medium text-card-foreground truncate">{expense.name as string}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{categoryLabels[expense.category as string] || expense.category as string}</span>
                    <span>ทุกวันที่ {expense.day_of_month as number}</span>
                    {isFixed && <span className="font-medium text-card-foreground">{formatCurrency(Number(expense.amount))}</span>}
                    {isGenerated && (
                      <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] text-success">
                        สร้างเดือนนี้แล้ว
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  {isFixed && !isGenerated && isActive && (
                    <button
                      onClick={() => handleGenerateNow(expense.id as string)}
                      disabled={isPending}
                      className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-[11px] font-medium text-success hover:bg-success/20 disabled:opacity-50"
                      title="สร้างค่าใช้จ่ายทันที"
                    >
                      <Play className="h-3 w-3" />
                      สร้างทันที
                    </button>
                  )}
                  {!isFixed && !isGenerated && isActive && (
                    <button
                      onClick={() => openRecordDialog(expense.id as string, expense.name as string)}
                      disabled={isPending}
                      className="flex items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning hover:bg-warning/20 disabled:opacity-50"
                      title="กรอกจำนวนเงินและบันทึก"
                    >
                      บันทึกยอด
                    </button>
                  )}
                  <button
                    onClick={() => handleToggle(expense.id as string, isActive)}
                    disabled={isPending}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    title={isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                  >
                    {isActive ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Recurring Expense Dialog */}
      <CreateRecurringExpenseDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Record Variable Expense Dialog */}
      <RecordVariableExpenseDialog
        open={showRecordDialog}
        onOpenChange={setShowRecordDialog}
        expenseId={selectedExpenseId}
        expenseName={selectedExpenseName}
      />
    </div>
  )
}

// =============================================================================
// Create Recurring Expense Dialog
// =============================================================================

function CreateRecurringExpenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState('fixed')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('type', type)
    formData.set('category', category)

    startTransition(async () => {
      const result = await createRecurringExpense(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setType('fixed')
        setCategory('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มค่าใช้จ่ายประจำ</DialogTitle>
          <DialogDescription>
            ตั้งค่าค่าใช้จ่ายรายเดือนที่เกิดขึ้นซ้ำ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อค่าใช้จ่าย</Label>
            <Input id="name" name="name" placeholder="เช่น ค่าเช่าสำนักงาน, เงินเดือนช่าง" required />
          </div>

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
            <Label>ประเภท</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">คงที่ (สร้างอัตโนมัติ)</SelectItem>
                <SelectItem value="variable">ไม่คงที่ (แจ้งเตือนให้กรอก)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {type === 'fixed'
                ? 'ระบบจะสร้างค่าใช้จ่ายอัตโนมัติตามจำนวนเงินที่กำหนด'
                : 'ระบบจะแจ้งเตือนผู้ดูแลให้กรอกจำนวนเงินและบันทึก'}
            </p>
          </div>

          {type === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="day_of_month">วันที่ในเดือน (1-28)</Label>
            <Input
              id="day_of_month"
              name="day_of_month"
              type="number"
              min="1"
              max="28"
              defaultValue="1"
              required
            />
            <p className="text-xs text-muted-foreground">
              ระบบจะสร้าง/แจ้งเตือนทุกเดือนในวันที่กำหนด (ใช้ได้ 1-28 เพื่อให้ทำงานได้ทุกเดือน)
            </p>
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
              {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Record Variable Expense Dialog
// =============================================================================

function RecordVariableExpenseDialog({
  open,
  onOpenChange,
  expenseId,
  expenseName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenseId: string
  expenseName: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const amount = Number(formData.get('amount'))

    if (!amount || amount <= 0) {
      setError('กรุณากรอกจำนวนเงินที่ถูกต้อง')
      return
    }

    startTransition(async () => {
      const result = await recordVariableExpense(expenseId, amount)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>บันทึกค่าใช้จ่าย</DialogTitle>
          <DialogDescription>
            กรอกจำนวนเงินสำหรับ &quot;{expenseName}&quot; เดือนนี้
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="var-amount">จำนวนเงิน (บาท)</Label>
            <Input id="var-amount" name="amount" type="number" step="0.01" placeholder="0.00" required autoFocus />
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
              disabled={isPending}
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
