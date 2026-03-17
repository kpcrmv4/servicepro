'use client'

import { useState } from 'react'
import { Plus, ShoppingBag, FileDown, ShoppingCart } from 'lucide-react'
import { PartDialog } from './part-dialog'
import { PurchaseOrderDialog } from './purchase-order-dialog'
import { WithdrawDialog } from './withdraw-dialog'
import { PosDialog } from './pos-dialog'

interface InventoryActionsProps {
  parts: Array<Record<string, unknown>>
  categories: Array<Record<string, unknown>>
  suppliers: Array<Record<string, unknown>>
  jobs: Array<Record<string, unknown>>
  expiringBatches: Array<Record<string, unknown>>
}

export function InventoryActions({ parts, categories, suppliers, jobs, expiringBatches }: InventoryActionsProps) {
  const [showPartDialog, setShowPartDialog] = useState(false)
  const [showPODialog, setShowPODialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [showPosDialog, setShowPosDialog] = useState(false)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setShowPartDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> เพิ่มอะไหล่
        </button>
        <button onClick={() => setShowPODialog(true)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
          <ShoppingBag className="h-4 w-4" /> สั่งซื้อ
        </button>
        <button onClick={() => setShowWithdrawDialog(true)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
          <FileDown className="h-4 w-4" /> เบิกอะไหล่
        </button>
        <button onClick={() => setShowPosDialog(true)}
          className="flex items-center gap-2 rounded-lg border border-success/50 bg-success/10 px-3 py-2 text-sm font-medium text-success hover:bg-success/20">
          <ShoppingCart className="h-4 w-4" /> ขายหน้าร้าน
        </button>
      </div>

      <PartDialog open={showPartDialog} onOpenChange={setShowPartDialog} categories={categories} />
      <PurchaseOrderDialog open={showPODialog} onOpenChange={setShowPODialog} suppliers={suppliers} parts={parts} />
      <WithdrawDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog} parts={parts} jobs={jobs} expiringBatches={expiringBatches} />
      <PosDialog open={showPosDialog} onOpenChange={setShowPosDialog} parts={parts} />
    </>
  )
}

// Button to edit a specific part (used in table rows)
export function EditPartButton({ part, categories }: { part: Record<string, unknown>; categories: Array<Record<string, unknown>> }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-primary hover:underline text-sm font-medium">
        {part.part_number as string}
      </button>
      <PartDialog open={open} onOpenChange={setOpen} categories={categories} editPart={part} />
    </>
  )
}

// Button to receive PO
export { ReceivePOButton } from './receive-po-button'
