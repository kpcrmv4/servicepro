'use server'

import { sendNotification } from '@/lib/actions/notifications'
import type { NotificationEventType } from '@/lib/types/notifications'

// =============================================================================
// Notification Triggers
// =============================================================================
// Helper functions ที่เรียกจาก server actions ต่างๆ เพื่อส่งแจ้งเตือน
// แต่ละ function จะเรียก sendNotification ซึ่งจะตรวจสอบ tenant config
// ว่าเปิดแจ้งเตือนอยู่หรือไม่ และส่งไปยัง roles ที่ตั้งค่าไว้
// =============================================================================

// =============================================================================
// Job Triggers
// =============================================================================

export async function notifyJobCreated(params: {
  tenantId: string
  jobNumber: string
  vehiclePlate: string
  customerName: string
  jobType: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'job_created',
    title: 'งานซ่อมใหม่',
    body: `งาน ${params.jobNumber} - ${params.vehiclePlate} (${params.customerName})`,
    url: '/dashboard/jobs',
    data: { jobNumber: params.jobNumber, vehiclePlate: params.vehiclePlate },
  })
}

export async function notifyJobStatusChanged(params: {
  tenantId: string
  jobNumber: string
  vehiclePlate: string
  oldStatus: string
  newStatus: string
  jobId: string
}) {
  const statusLabels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังซ่อม',
    quality_check: 'ตรวจสอบคุณภาพ',
    waiting_pickup: 'รอรับรถ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
  }

  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'job_status_changed',
    title: 'สถานะงานเปลี่ยน',
    body: `${params.jobNumber} (${params.vehiclePlate}): ${statusLabels[params.newStatus] || params.newStatus}`,
    url: `/dashboard/jobs/${params.jobId}`,
    data: { jobId: params.jobId, oldStatus: params.oldStatus, newStatus: params.newStatus },
  })
}

export async function notifyJobAssigned(params: {
  tenantId: string
  jobNumber: string
  vehiclePlate: string
  technicianId: string
  technicianName: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'job_assigned',
    title: 'ได้รับมอบหมายงาน',
    body: `งาน ${params.jobNumber} - ${params.vehiclePlate} มอบหมายให้คุณ`,
    url: '/dashboard/jobs',
    targetUserId: params.technicianId,
    data: { jobNumber: params.jobNumber },
  })
}

export async function notifyJobCompleted(params: {
  tenantId: string
  jobNumber: string
  vehiclePlate: string
  customerName: string
  jobId: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'job_completed',
    title: 'งานเสร็จสิ้น',
    body: `${params.jobNumber} (${params.vehiclePlate}) - ${params.customerName} เสร็จเรียบร้อย`,
    url: `/dashboard/jobs/${params.jobId}`,
    data: { jobId: params.jobId },
  })
}

export async function notifyJobUrgent(params: {
  tenantId: string
  jobNumber: string
  vehiclePlate: string
  reason?: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'job_urgent',
    title: 'งานเร่งด่วน!',
    body: `${params.jobNumber} (${params.vehiclePlate})${params.reason ? ` - ${params.reason}` : ''}`,
    url: '/dashboard/jobs',
    data: { jobNumber: params.jobNumber, urgent: true },
  })
}

// =============================================================================
// Quotation Triggers
// =============================================================================

export async function notifyQuotationPending(params: {
  tenantId: string
  quotationNumber: string
  customerName: string
  total: number
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'quotation_pending',
    title: 'ใบเสนอราคารออนุมัติ',
    body: `${params.quotationNumber} - ${params.customerName} (${params.total.toLocaleString()} บาท)`,
    url: '/dashboard/quotations',
    data: { quotationNumber: params.quotationNumber },
  })
}

export async function notifyQuotationApproved(params: {
  tenantId: string
  quotationNumber: string
  customerName: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'quotation_approved',
    title: 'ใบเสนอราคาอนุมัติแล้ว',
    body: `${params.quotationNumber} - ${params.customerName} อนุมัติแล้ว`,
    url: '/dashboard/quotations',
    data: { quotationNumber: params.quotationNumber },
  })
}

export async function notifyQuotationRejected(params: {
  tenantId: string
  quotationNumber: string
  customerName: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'quotation_rejected',
    title: 'ใบเสนอราคาถูกปฏิเสธ',
    body: `${params.quotationNumber} - ${params.customerName} ปฏิเสธใบเสนอราคา`,
    url: '/dashboard/quotations',
    data: { quotationNumber: params.quotationNumber },
  })
}

// =============================================================================
// DVI Triggers
// =============================================================================

export async function notifyDVICompleted(params: {
  tenantId: string
  vehiclePlate: string
  inspectorName: string
  overallScore: number | null
  inspectionId: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'dvi_completed',
    title: 'ตรวจสภาพรถเสร็จ',
    body: `${params.vehiclePlate} - ตรวจโดย ${params.inspectorName}${params.overallScore ? ` (${params.overallScore}/10)` : ''}`,
    url: `/dashboard/inspections/${params.inspectionId}`,
    data: { inspectionId: params.inspectionId },
  })
}

export async function notifyDVISentToCustomer(params: {
  tenantId: string
  vehiclePlate: string
  customerName: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'dvi_sent_customer',
    title: 'ส่ง DVI ให้ลูกค้าแล้ว',
    body: `ส่งรายงานตรวจสภาพ ${params.vehiclePlate} ให้ ${params.customerName} แล้ว`,
    url: '/dashboard/inspections',
    data: { vehiclePlate: params.vehiclePlate },
  })
}

// =============================================================================
// Finance Triggers
// =============================================================================

export async function notifyPaymentReceived(params: {
  tenantId: string
  invoiceNumber: string
  amount: number
  customerName: string
  paymentMethod: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'payment_received',
    title: 'รับชำระเงิน',
    body: `${params.invoiceNumber} - ${params.customerName} ชำระ ${params.amount.toLocaleString()} บาท (${params.paymentMethod})`,
    url: '/dashboard/finance',
    data: { invoiceNumber: params.invoiceNumber, amount: params.amount },
  })
}

export async function notifyPaymentOverdue(params: {
  tenantId: string
  invoiceNumber: string
  amount: number
  customerName: string
  daysOverdue: number
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'payment_overdue',
    title: 'ค้างชำระเกินกำหนด',
    body: `${params.invoiceNumber} - ${params.customerName} ค้าง ${params.amount.toLocaleString()} บาท (${params.daysOverdue} วัน)`,
    url: '/dashboard/finance',
    data: { invoiceNumber: params.invoiceNumber, daysOverdue: params.daysOverdue },
  })
}

// =============================================================================
// Inventory Triggers
// =============================================================================

export async function notifyStockLow(params: {
  tenantId: string
  partName: string
  partNumber: string
  currentStock: number
  minStock: number
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'stock_low',
    title: 'สต็อกอะไหล่ต่ำ',
    body: `${params.partName} (${params.partNumber}) เหลือ ${params.currentStock} ชิ้น (ขั้นต่ำ ${params.minStock})`,
    url: '/dashboard/inventory',
    data: { partNumber: params.partNumber, currentStock: params.currentStock },
  })
}

export async function notifyStockOut(params: {
  tenantId: string
  partName: string
  partNumber: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'stock_out',
    title: 'อะไหล่หมด!',
    body: `${params.partName} (${params.partNumber}) หมดสต็อกแล้ว`,
    url: '/dashboard/inventory',
    data: { partNumber: params.partNumber },
  })
}

export async function notifyPOReceived(params: {
  tenantId: string
  poNumber: string
  supplierName: string
  itemCount: number
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'po_received',
    title: 'รับอะไหล่เข้าสต็อก',
    body: `PO ${params.poNumber} จาก ${params.supplierName} (${params.itemCount} รายการ)`,
    url: '/dashboard/inventory',
    data: { poNumber: params.poNumber },
  })
}

// =============================================================================
// LINE OA Triggers
// =============================================================================

export async function notifyLineNewMessage(params: {
  tenantId: string
  displayName: string
  messagePreview: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'line_new_message',
    title: 'ข้อความ LINE ใหม่',
    body: `${params.displayName}: ${params.messagePreview.substring(0, 100)}`,
    url: '/dashboard',
    icon: '/icons/icon-192x192.png',
    data: { displayName: params.displayName },
  })
}

export async function notifyLineNewFollower(params: {
  tenantId: string
  displayName: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'line_new_follower',
    title: 'ผู้ติดตาม LINE ใหม่',
    body: `${params.displayName} เริ่มติดตาม LINE OA ของคุณ`,
    url: '/dashboard/settings/line',
    data: { displayName: params.displayName },
  })
}

// =============================================================================
// Booking & Reminder Triggers
// =============================================================================

export async function notifyBookingNew(params: {
  tenantId: string
  customerName: string
  vehiclePlate: string
  bookingDate: string
  serviceType: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'booking_new',
    title: 'นัดหมายใหม่',
    body: `${params.customerName} (${params.vehiclePlate}) นัด ${params.serviceType} วันที่ ${params.bookingDate}`,
    url: '/dashboard/planning',
    data: { vehiclePlate: params.vehiclePlate, bookingDate: params.bookingDate },
  })
}

export async function notifyServiceReminder(params: {
  tenantId: string
  customerName: string
  vehiclePlate: string
  reminderType: string
  triggerDate: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'service_reminder',
    title: 'เตือนเช็คระยะ',
    body: `${params.vehiclePlate} (${params.customerName}) - ${params.reminderType} วันที่ ${params.triggerDate}`,
    url: '/dashboard/reminders',
    data: { vehiclePlate: params.vehiclePlate, reminderType: params.reminderType },
  })
}

// =============================================================================
// Employee Triggers
// =============================================================================

export async function notifyEmployeeClockIn(params: {
  tenantId: string
  employeeName: string
  time: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'employee_clock_in',
    title: 'พนักงานเข้างาน',
    body: `${params.employeeName} เข้างานเวลา ${params.time}`,
    url: '/dashboard/time-clock',
    data: { employeeName: params.employeeName },
  })
}

export async function notifyEmployeeClockOut(params: {
  tenantId: string
  employeeName: string
  time: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'employee_clock_out',
    title: 'พนักงานออกงาน',
    body: `${params.employeeName} ออกงานเวลา ${params.time}`,
    url: '/dashboard/time-clock',
    data: { employeeName: params.employeeName },
  })
}

// =============================================================================
// Other Triggers
// =============================================================================

export async function notifyDailySummary(params: {
  tenantId: string
  date: string
  jobsCompleted: number
  revenue: number
  newCustomers: number
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'daily_summary',
    title: `สรุปรายวัน ${params.date}`,
    body: `งานเสร็จ ${params.jobsCompleted} | รายได้ ${params.revenue.toLocaleString()} บาท | ลูกค้าใหม่ ${params.newCustomers}`,
    url: '/dashboard/reports',
    data: { date: params.date, jobsCompleted: params.jobsCompleted, revenue: params.revenue },
  })
}

export async function notifyInsuranceClaimUpdate(params: {
  tenantId: string
  claimId: string
  policyNumber: string
  status: string
  customerName: string
}) {
  const statusLabels: Record<string, string> = {
    submitted: 'ส่งเคลมแล้ว',
    pending_approval: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ถูกปฏิเสธ',
    paid: 'จ่ายแล้ว',
  }

  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'insurance_claim_update',
    title: 'อัปเดตเคลมประกัน',
    body: `${params.policyNumber} (${params.customerName}): ${statusLabels[params.status] || params.status}`,
    url: '/dashboard/insurance',
    data: { claimId: params.claimId, status: params.status },
  })
}

export async function notifyAdditionalWorkRequest(params: {
  tenantId: string
  jobNumber: string
  vehiclePlate: string
  description: string
  estimatedCost: number
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'additional_work_request',
    title: 'ขอทำงานเพิ่มเติม',
    body: `${params.jobNumber} (${params.vehiclePlate}): ${params.description} - ${params.estimatedCost.toLocaleString()} บาท`,
    url: '/dashboard/jobs',
    data: { jobNumber: params.jobNumber, estimatedCost: params.estimatedCost },
  })
}

export async function notifyReviewReceived(params: {
  tenantId: string
  customerName: string
  rating: number
  comment?: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: 'review_received',
    title: 'ได้รับรีวิวจากลูกค้า',
    body: `${params.customerName} ให้ ${'⭐'.repeat(params.rating)}${params.comment ? ` - "${params.comment.substring(0, 50)}"` : ''}`,
    url: '/dashboard',
    data: { rating: params.rating },
  })
}

// =============================================================================
// Generic trigger - สำหรับ custom events
// =============================================================================

export async function notifyCustomEvent(params: {
  tenantId: string
  eventType: NotificationEventType
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
  targetUserId?: string
}) {
  return sendNotification({
    tenantId: params.tenantId,
    eventType: params.eventType,
    title: params.title,
    body: params.body,
    url: params.url,
    data: params.data,
    targetUserId: params.targetUserId,
  })
}
