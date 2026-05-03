// =============================================================================
// Status Configurations กลาง
// ใช้แทน statusConfig ที่ซ้ำใน 9+ หน้า
// =============================================================================

export interface StatusStyle {
  label: string
  color: string       // bg + text class เช่น "bg-warning/10 text-warning"
  className?: string  // full className (สำหรับ border ด้วย)
}

// -----------------------------------------------------------------------------
// Job Status
// -----------------------------------------------------------------------------

export const JOB_STATUS: Record<string, StatusStyle> = {
  pending:           { label: "รอดำเนินการ",      color: "bg-warning/10 text-warning",         className: "bg-warning/10 text-warning border-warning/20" },
  diagnosing:        { label: "กำลังตรวจสอบ",     color: "bg-purple-500/10 text-purple-600",   className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  quoted:            { label: "รอลูกค้าอนุมัติ",    color: "bg-blue-500/10 text-blue-600",       className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  ready_to_repair:   { label: "พร้อมซ่อม",         color: "bg-emerald-500/10 text-emerald-700", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  in_progress:       { label: "กำลังซ่อม",        color: "bg-info/10 text-info",               className: "bg-info/10 text-info border-info/20" },
  waiting_parts:     { label: "รออะไหล่",         color: "bg-orange-500/10 text-orange-600",   className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  waiting_insurance: { label: "รอประกัน",         color: "bg-amber-500/10 text-amber-700",     className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  on_hold:           { label: "พักงาน",           color: "bg-slate-500/10 text-slate-600",     className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  quality_check:     { label: "รอตรวจ QC",        color: "bg-purple-500/10 text-purple-600",   className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  waiting_pickup:    { label: "รอลูกค้ารับ",       color: "bg-cyan-500/10 text-cyan-700",       className: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20" },
  completed:         { label: "เสร็จแล้ว",         color: "bg-success/10 text-success",         className: "bg-success/10 text-success border-success/20" },
  cancelled:         { label: "ยกเลิก",           color: "bg-error/10 text-error",             className: "bg-error/10 text-error border-error/20" },
}

// Hold states — when a job is paused mid-repair waiting for something.
export const HOLD_STATES = ['waiting_parts', 'waiting_insurance', 'on_hold'] as const
export type HoldState = (typeof HOLD_STATES)[number]
export const isHoldState = (s: string): s is HoldState =>
  (HOLD_STATES as readonly string[]).includes(s)

// -----------------------------------------------------------------------------
// Quotation Status
// -----------------------------------------------------------------------------

export const QUOTATION_STATUS: Record<string, StatusStyle> = {
  draft:    { label: "แบบร่าง",     color: "bg-muted text-muted-foreground" },
  sent:     { label: "ส่งแล้ว",     color: "bg-blue-100 text-blue-700" },
  approved: { label: "อนุมัติ",     color: "bg-success/10 text-success" },
  rejected: { label: "ไม่อนุมัติ",   color: "bg-error/10 text-error" },
  expired:  { label: "หมดอายุ",     color: "bg-warning/10 text-warning" },
}

// -----------------------------------------------------------------------------
// Invoice / Payment Status
// -----------------------------------------------------------------------------

export const PAYMENT_STATUS: Record<string, StatusStyle> = {
  pending:  { label: "รอชำระ",     color: "bg-warning/10 text-warning" },
  paid:     { label: "ชำระแล้ว",   color: "bg-success/10 text-success" },
  overdue:  { label: "เกินกำหนด",  color: "bg-error/10 text-error" },
  partial:  { label: "ชำระบางส่วน", color: "bg-blue-100 text-blue-700" },
  cancelled:{ label: "ยกเลิก",     color: "bg-muted text-muted-foreground" },
}

// -----------------------------------------------------------------------------
// Insurance Status
// -----------------------------------------------------------------------------

export const INSURANCE_STATUS: Record<string, StatusStyle> = {
  active:   { label: "ใช้งาน",       color: "bg-success/10 text-success" },
  expired:  { label: "หมดอายุ",      color: "bg-error/10 text-error" },
  pending:  { label: "รอดำเนินการ",  color: "bg-warning/10 text-warning" },
}

// -----------------------------------------------------------------------------
// Stock Status (Inventory)
// -----------------------------------------------------------------------------

export const STOCK_STATUS: Record<string, StatusStyle> = {
  in_stock:  { label: "มีสต็อก",      color: "bg-success/10 text-success" },
  low_stock: { label: "สต็อกต่ำ",     color: "bg-warning/10 text-warning" },
  out_stock: { label: "หมด",         color: "bg-error/10 text-error" },
}

// -----------------------------------------------------------------------------
// Job Priority
// -----------------------------------------------------------------------------

export const JOB_PRIORITY: Record<string, StatusStyle> = {
  urgent: { label: "ด่วน",    color: "bg-error/10 text-error",                  className: "bg-error/10 text-error border-error/20" },
  normal: { label: "ปกติ",    color: "bg-info/10 text-info",                    className: "bg-info/10 text-info border-info/20" },
  low:    { label: "รอได้",   color: "bg-muted text-muted-foreground",          className: "bg-muted text-muted-foreground border-border" },
}

// -----------------------------------------------------------------------------
// Job Type Labels
// -----------------------------------------------------------------------------

export const JOB_TYPE_LABELS: Record<string, string> = {
  repair: "ซ่อม",
  maintenance: "ซ่อมบำรุง",
  inspection: "ตรวจเช็ค",
  body_paint: "สี/ตัวถัง",
  electrical: "ไฟฟ้า",
  tire: "ยางรถ",
  warranty: "รับประกัน",
  insurance: "ประกัน",
  other: "อื่นๆ",
}

// -----------------------------------------------------------------------------
// Queue Kanban Columns (สำหรับ Queue/Kanban view)
// -----------------------------------------------------------------------------

export const QUEUE_COLUMNS = [
  { key: "pending",           label: "รอดำเนินการ",  bg: "bg-warning/10",         color: "border-warning",         dot: "bg-warning" },
  { key: "diagnosing",        label: "ตรวจสอบ",     bg: "bg-purple-500/10",      color: "border-purple-500",      dot: "bg-purple-500" },
  { key: "quoted",            label: "รออนุมัติ",    bg: "bg-blue-500/10",        color: "border-blue-500",        dot: "bg-blue-500" },
  { key: "ready_to_repair",   label: "พร้อมซ่อม",    bg: "bg-emerald-500/10",     color: "border-emerald-500",     dot: "bg-emerald-500" },
  { key: "in_progress",       label: "กำลังซ่อม",    bg: "bg-info/10",            color: "border-info",            dot: "bg-info" },
  { key: "waiting_parts",     label: "รออะไหล่",     bg: "bg-orange-500/10",      color: "border-orange-500",      dot: "bg-orange-500" },
  { key: "waiting_insurance", label: "รอประกัน",     bg: "bg-amber-500/10",       color: "border-amber-500",       dot: "bg-amber-500" },
  { key: "on_hold",           label: "พักงาน",      bg: "bg-slate-500/10",       color: "border-slate-500",       dot: "bg-slate-500" },
  { key: "quality_check",     label: "ตรวจ QC",     bg: "bg-purple-500/10",      color: "border-purple-500",      dot: "bg-purple-500" },
  { key: "waiting_pickup",    label: "รอลูกค้ารับ",   bg: "bg-cyan-500/10",        color: "border-cyan-500",        dot: "bg-cyan-500" },
  { key: "completed",         label: "เสร็จแล้ว",    bg: "bg-success/10",         color: "border-success",         dot: "bg-success" },
] as const

// -----------------------------------------------------------------------------
// Helper: ดึง status label/color อย่างปลอดภัย
// -----------------------------------------------------------------------------

export function getStatusStyle(
  config: Record<string, StatusStyle>,
  status: string,
  fallback: StatusStyle = { label: status, color: "bg-muted text-muted-foreground" }
): StatusStyle {
  return config[status] || fallback
}
