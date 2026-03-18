// =============================================================================
// Financial Calculation Helpers
// ใช้แทน VAT/financial calculations ที่ซ้ำใน quotations.ts, finance.ts, etc.
// =============================================================================

const VAT_RATE = 0.07

/**
 * คำนวณ VAT 7% จาก subtotal (ปัดเศษ 2 ตำแหน่ง)
 */
export function calculateVAT(subtotal: number): number {
  return Math.round(subtotal * VAT_RATE * 100) / 100
}

/**
 * คำนวณยอดรวมพร้อม VAT
 */
export function calculateTotalWithVAT(subtotal: number, discount: number = 0): {
  subtotal: number
  discount: number
  vat: number
  total: number
} {
  const discountedSubtotal = subtotal - discount
  const vat = calculateVAT(discountedSubtotal)
  const total = discountedSubtotal + vat
  return { subtotal, discount, vat, total }
}

/**
 * คำนวณยอดรวมของ line items
 */
export function calculateLineItemTotal(
  quantity: number,
  unitPrice: number,
  discount: number = 0
): number {
  return (quantity * unitPrice) - discount
}

/**
 * คำนวณยอดรวม subtotal จาก line items
 */
export function calculateSubtotal(
  items: Array<{ quantity: number; unitPrice: number; discount?: number }>
): number {
  return items.reduce(
    (sum, item) => sum + calculateLineItemTotal(item.quantity, item.unitPrice, item.discount || 0),
    0
  )
}
