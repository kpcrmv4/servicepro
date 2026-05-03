'use client'

import { useState } from 'react'
import { Plus, FileText, Receipt, CreditCard } from 'lucide-react'
import {
  CreateInvoiceDialog,
  CreateReceiptDialog,
  CreateExpenseDialog,
} from './finance-dialogs'

interface FinanceActionsProps {
  jobs: Array<Record<string, unknown>>
  customers: Array<Record<string, unknown>>
  pendingInvoices: Array<Record<string, unknown>>
  shopPromptPayId?: string | null
  shopPromptPayName?: string | null
}

export function CreateInvoiceButton({ jobs, customers }: { jobs: Array<Record<string, unknown>>; customers: Array<Record<string, unknown>> }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> สร้างใบแจ้งหนี้
      </button>
      <CreateInvoiceDialog open={open} onOpenChange={setOpen} jobs={jobs} customers={customers} />
    </>
  )
}

export function CreateReceiptButton({
  pendingInvoices,
  shopPromptPayId,
  shopPromptPayName,
}: {
  pendingInvoices: Array<Record<string, unknown>>
  shopPromptPayId?: string | null
  shopPromptPayName?: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        <Receipt className="h-4 w-4" /> สร้างใบเสร็จ
      </button>
      <CreateReceiptDialog
        open={open}
        onOpenChange={setOpen}
        pendingInvoices={pendingInvoices}
        shopPromptPayId={shopPromptPayId}
        shopPromptPayName={shopPromptPayName}
      />
    </>
  )
}

export function CreateExpenseButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        <CreditCard className="h-4 w-4" /> บันทึกค่าใช้จ่าย
      </button>
      <CreateExpenseDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function FinanceActionButtons({
  jobs,
  customers,
  pendingInvoices,
  shopPromptPayId,
  shopPromptPayName,
}: FinanceActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <CreateInvoiceButton jobs={jobs} customers={customers} />
      <CreateReceiptButton
        pendingInvoices={pendingInvoices}
        shopPromptPayId={shopPromptPayId}
        shopPromptPayName={shopPromptPayName}
      />
      <CreateExpenseButton />
    </div>
  )
}
