'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { createPosSale } from '@/lib/actions/parts'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'

interface CartItem {
  part_id: string
  name: string
  quantity: number
  unit_price: number
  total: number
}

interface PosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parts: Array<Record<string, unknown>>
}

export function PosDialog({ open, onOpenChange, parts }: PosDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPartId, setSelectedPartId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function addToCart() {
    if (!selectedPartId) return
    const part = parts.find((p) => p.id === selectedPartId)
    if (!part) return

    const existing = cart.find((c) => c.part_id === selectedPartId)
    if (existing) {
      setCart(cart.map((c) =>
        c.part_id === selectedPartId
          ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.unit_price }
          : c
      ))
    } else {
      const price = Number(part.selling_price) || 0
      setCart([...cart, {
        part_id: selectedPartId,
        name: part.name as string,
        quantity: 1,
        unit_price: price,
        total: price,
      }])
    }
    setSelectedPartId('')
  }

  function updateCartQty(partId: string, qty: number) {
    if (qty <= 0) { removeFromCart(partId); return }
    setCart(cart.map((c) =>
      c.part_id === partId ? { ...c, quantity: qty, total: qty * c.unit_price } : c
    ))
  }

  function updateCartPrice(partId: string, price: number) {
    setCart(cart.map((c) =>
      c.part_id === partId ? { ...c, unit_price: price, total: c.quantity * price } : c
    ))
  }

  function removeFromCart(partId: string) {
    setCart(cart.filter((c) => c.part_id !== partId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const grandTotal = subtotal - discount

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (cart.length === 0) { setError('กรุณาเพิ่มสินค้า'); return }
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.set('items', JSON.stringify(cart))
    formData.set('discount', String(discount))
    formData.set('vat', '0')
    formData.set('payment_method', paymentMethod)

    startTransition(async () => {
      const result = await createPosSale(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(`ขายสำเร็จ! เลขที่: ${result?.saleNumber}`)
        setCart([])
        setDiscount(0)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            ขายสินค้าหน้าร้าน (POS)
          </DialogTitle>
          <DialogDescription>ขายสินค้าที่ไม่เกี่ยวกับการซ่อม</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Add item */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                <SelectContent>
                  {parts.filter((p) => Number(p.stock_quantity) > 0).map((p) => (
                    <SelectItem key={p.id as string} value={p.id as string}>
                      {p.name as string} - {formatCurrency(Number(p.selling_price))} (เหลือ {Number(p.stock_quantity)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button type="button" onClick={addToCart} disabled={!selectedPartId}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Cart */}
          {cart.length > 0 ? (
            <div className="rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">สินค้า</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-20">จำนวน</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-28">ราคา</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-24">รวม</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.part_id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">
                        <Input type="number" min="1" value={item.quantity}
                          onChange={(e) => updateCartQty(item.part_id, Number(e.target.value) || 0)}
                          className="h-8 text-center" />
                      </td>
                      <td className="px-3 py-2">
                        <Input type="number" step="0.01" value={item.unit_price}
                          onChange={(e) => updateCartPrice(item.part_id, Number(e.target.value) || 0)}
                          className="h-8 text-center" />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                      <td className="px-1 py-2">
                        <button type="button" onClick={() => removeFromCart(item.part_id)}
                          className="text-muted-foreground hover:text-error"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              ยังไม่มีสินค้าในตะกร้า
            </div>
          )}

          {/* Summary */}
          {cart.length > 0 && (
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">รวมสินค้า</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">ส่วนลด</span>
                <Input type="number" step="0.01" min="0" value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="h-8 w-28 text-right" />
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>ยอดรวม</span>
                <span className="text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>วิธีชำระเงิน</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">เงินสด</SelectItem>
                <SelectItem value="transfer">โอนเงิน</SelectItem>
                <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                <SelectItem value="promptpay">PromptPay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
          {success && <p className="text-sm text-success">{success}</p>}

          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">ปิด</button>
            <button type="submit" disabled={isPending || cart.length === 0}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50">
              {isPending ? 'กำลังดำเนินการ...' : `ชำระเงิน ${formatCurrency(grandTotal)}`}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
