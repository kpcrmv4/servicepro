'use client'

import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { CustomerDialog } from './customer-dialog'

export function AddCustomerButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" /> เพิ่มลูกค้า
      </button>
      <CustomerDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function EditCustomerButton({ customer }: { customer: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        <Pencil className="h-4 w-4" /> แก้ไข
      </button>
      <CustomerDialog open={open} onOpenChange={setOpen} editCustomer={customer} />
    </>
  )
}
