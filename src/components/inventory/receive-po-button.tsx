'use client'

import { useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { ReceivePODialog } from './receive-po-dialog'

export function ReceivePOButton({ purchaseOrder }: { purchaseOrder: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-[11px] font-medium text-success hover:bg-success/20"
        title="นำเข้าอะไหล่">
        <PackageCheck className="h-3.5 w-3.5" /> นำเข้า
      </button>
      <ReceivePODialog open={open} onOpenChange={setOpen} purchaseOrder={purchaseOrder} />
    </>
  )
}
