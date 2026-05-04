/**
 * Customer-facing LINE notification config — separate from the
 * staff-facing notifications system (notifications/notification-events.ts).
 * Stored in tenants.settings.customer_line_notifications.
 */

export type CustomerNotifyEvent =
  | 'in_progress'
  | 'ready_to_repair'
  | 'waiting_parts'
  | 'waiting_insurance'
  | 'on_hold'
  | 'resumed'
  | 'quality_check'
  | 'waiting_pickup'
  | 'completed'
  | 'cancelled'
  | 'quote_sent'
  | 'inspection_sent';

export interface CustomerNotifyEventConfig {
  enabled: boolean;
  auto: boolean;       // true = send without confirmation; false = open prompt
  template: string;    // supports {{variables}}
}

export interface CustomerLineNotifyConfig {
  default_mode: 'ask' | 'auto' | 'off';
  events: Partial<Record<CustomerNotifyEvent, CustomerNotifyEventConfig>>;
}

export const EVENT_LABELS: Record<CustomerNotifyEvent, string> = {
  in_progress: 'เริ่มซ่อม',
  ready_to_repair: 'อนุมัติแล้ว — เข้าคิว',
  waiting_parts: 'รออะไหล่',
  waiting_insurance: 'รอประกัน',
  on_hold: 'พักงาน',
  resumed: 'กลับมาทำต่อ',
  quality_check: 'ส่งตรวจ QC',
  waiting_pickup: 'พร้อมให้รับรถ',
  completed: 'งานเสร็จสิ้น',
  cancelled: 'ยกเลิกงาน',
  quote_sent: 'ส่งใบเสนอราคา',
  inspection_sent: 'ส่งรายงานตรวจสภาพ',
};

const DEFAULT_TEMPLATES: Record<CustomerNotifyEvent, string> = {
  in_progress:
    `🔧 เริ่มซ่อมรถของคุณแล้ว\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\n\nติดตามสถานะ: {{tracking_url}}`,
  ready_to_repair:
    `✅ ใบเสนอราคาอนุมัติแล้ว\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nกำลังเข้าคิวซ่อม จะแจ้งเตือนอีกครั้งเมื่อช่างเริ่มงาน\n\nติดตามสถานะ: {{tracking_url}}`,
  waiting_parts:
    `⏸ พักงานรอ — รออะไหล่\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nสาเหตุ: {{hold_reason}}\nคาดว่ากลับมาทำต่อ: {{eta}}\n\nติดตาม: {{tracking_url}}`,
  waiting_insurance:
    `⏸ พักงานรอ — รอประกันอนุมัติ\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nสาเหตุ: {{hold_reason}}\nคาดว่ากลับมาทำต่อ: {{eta}}\n\nติดตาม: {{tracking_url}}`,
  on_hold:
    `⏸ พักงาน\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nสาเหตุ: {{hold_reason}}\nคาดว่ากลับมาทำต่อ: {{eta}}\n\nติดตาม: {{tracking_url}}`,
  resumed:
    `▶ กลับมาทำงานต่อแล้ว\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\n\nติดตาม: {{tracking_url}}`,
  quality_check:
    `🔍 กำลังตรวจ QC\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nกำลังตรวจสอบคุณภาพก่อนส่งมอบ\n\nติดตาม: {{tracking_url}}`,
  waiting_pickup:
    `🚗 รถพร้อมให้รับแล้ว!\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nสามารถมารับรถได้ตามเวลาทำการ\n\nรายละเอียด: {{tracking_url}}`,
  completed:
    `✅ งานเสร็จสิ้นแล้ว\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nขอบคุณที่ใช้บริการ — กรุณารีวิวงานบริการของเราด้วยนะคะ`,
  cancelled:
    `❌ ยกเลิกงาน\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nหากต้องการสอบถาม กรุณาติดต่อทางร้าน`,
  quote_sent:
    `📋 ใบเสนอราคา\n\nงาน: {{job_number}}\nรถ: {{vehicle}}\nกรุณาตรวจสอบและอนุมัติ\n\n{{tracking_url}}`,
  inspection_sent:
    `🔍 รายงานตรวจสภาพรถ\n\nรถ: {{vehicle}}\nคลิกเพื่อดูรายงานเต็ม\n\n{{tracking_url}}`,
};

export const DEFAULT_CUSTOMER_NOTIFY_CONFIG: CustomerLineNotifyConfig = {
  default_mode: 'ask',
  events: Object.fromEntries(
    (Object.keys(EVENT_LABELS) as CustomerNotifyEvent[]).map((k) => [
      k,
      {
        enabled: true,
        auto: ['ready_to_repair', 'waiting_pickup', 'completed', 'resumed'].includes(k),
        template: DEFAULT_TEMPLATES[k],
      },
    ]),
  ) as CustomerLineNotifyConfig['events'],
};

export function parseCustomerNotifyConfig(raw: unknown): CustomerLineNotifyConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_CUSTOMER_NOTIFY_CONFIG;
  const r = raw as Partial<CustomerLineNotifyConfig>;
  const events: CustomerLineNotifyConfig['events'] = { ...DEFAULT_CUSTOMER_NOTIFY_CONFIG.events };
  if (r.events && typeof r.events === 'object') {
    for (const [key, val] of Object.entries(r.events)) {
      if (val && typeof val === 'object') {
        const cfg = val as Partial<CustomerNotifyEventConfig>;
        events[key as CustomerNotifyEvent] = {
          enabled: cfg.enabled ?? true,
          auto: cfg.auto ?? false,
          template: cfg.template ?? DEFAULT_TEMPLATES[key as CustomerNotifyEvent] ?? '',
        };
      }
    }
  }
  return {
    default_mode: r.default_mode ?? 'ask',
    events,
  };
}

/** Substitutes {{variable}} placeholders in a template. */
export function renderTemplate(
  template: string,
  vars: Record<string, string | undefined | null>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? '' : String(v);
  });
}
