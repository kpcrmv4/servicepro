-- =============================================================================
-- KPServicePro Push Notification System Migration
-- =============================================================================
-- Tables:
--   1. push_subscriptions     - เก็บ Push subscription ของแต่ละ device
--   2. notifications          - เก็บประวัติแจ้งเตือนทั้งหมด (in-app + push)
--   3. tenant_notification_config - ตั้งค่าแจ้งเตือนระดับร้าน (per-event per-role)
-- =============================================================================

-- 1. Push Subscriptions - เก็บ Web Push subscription endpoint ของแต่ละ user/device
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_tenant ON push_subscriptions(tenant_id, is_active);

-- 2. Notifications - ประวัติแจ้งเตือนทั้งหมด (ทั้ง in-app และ push)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,          -- เช่น 'job_created', 'job_status_changed', 'stock_low'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,                          -- icon URL
  url TEXT,                           -- URL ที่จะเปิดเมื่อคลิก
  data JSONB,                         -- ข้อมูลเพิ่มเติม เช่น job_id, vehicle_plate
  channel TEXT NOT NULL DEFAULT 'push', -- 'push', 'in_app', 'both'
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  push_sent BOOLEAN NOT NULL DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(tenant_id, event_type);

-- 3. Tenant Notification Config - ตั้งค่าแจ้งเตือนระดับร้าน
-- เจ้าของร้าน/admin ตั้งค่าได้ว่า event ไหน ส่งแจ้งเตือนไปยัง role ไหนบ้าง
CREATE TABLE IF NOT EXISTS tenant_notification_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  -- แต่ละ role สามารถเปิด/ปิดได้
  notify_owner BOOLEAN NOT NULL DEFAULT false,
  notify_admin BOOLEAN NOT NULL DEFAULT false,
  notify_manager BOOLEAN NOT NULL DEFAULT false,
  notify_technician BOOLEAN NOT NULL DEFAULT false,
  notify_receptionist BOOLEAN NOT NULL DEFAULT false,
  -- ช่องทางการแจ้งเตือน
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  line_enabled BOOLEAN NOT NULL DEFAULT false,
  -- ตั้งค่าเพิ่มเติม
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_notification_config_unique 
  ON tenant_notification_config(tenant_id, event_type);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_notification_config ENABLE ROW LEVEL SECURITY;

-- push_subscriptions: users can manage their own subscriptions
CREATE POLICY push_subscriptions_select ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY push_subscriptions_insert ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY push_subscriptions_update ON push_subscriptions FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY push_subscriptions_delete ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- notifications: users can read their own notifications
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- tenant_notification_config: same-tenant users can read, owner/admin can write
CREATE POLICY tenant_notification_config_select ON tenant_notification_config FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =============================================================================
-- Insert default notification config for existing tenants
-- =============================================================================
-- This function creates default notification config when a new tenant is created
CREATE OR REPLACE FUNCTION create_default_notification_config()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
BEGIN
  -- Default notification events with their role assignments
  FOR event_record IN
    SELECT * FROM (VALUES
      ('job_created',          true,  true,  true,  false, true,  'งานซ่อมใหม่'),
      ('job_status_changed',   true,  true,  true,  true,  true,  'สถานะงานเปลี่ยน'),
      ('job_assigned',         false, false, false, true,  false, 'ได้รับมอบหมายงาน'),
      ('job_completed',        true,  true,  true,  false, true,  'งานเสร็จสิ้น'),
      ('job_urgent',           true,  true,  true,  true,  true,  'งานเร่งด่วน'),
      ('quotation_pending',    true,  true,  true,  false, false, 'ใบเสนอราคารออนุมัติ'),
      ('quotation_approved',   true,  true,  true,  false, true,  'ใบเสนอราคาอนุมัติแล้ว'),
      ('quotation_rejected',   true,  true,  true,  false, true,  'ใบเสนอราคาถูกปฏิเสธ'),
      ('dvi_completed',        true,  true,  true,  false, true,  'ตรวจสภาพรถเสร็จ'),
      ('dvi_sent_customer',    true,  true,  true,  false, true,  'ส่ง DVI ให้ลูกค้าแล้ว'),
      ('payment_received',     true,  true,  true,  false, true,  'รับชำระเงิน'),
      ('payment_overdue',      true,  true,  true,  false, false, 'ค้างชำระเกินกำหนด'),
      ('stock_low',            true,  true,  true,  false, false, 'สต็อกอะไหล่ต่ำ'),
      ('stock_out',            true,  true,  true,  false, false, 'อะไหล่หมด'),
      ('po_received',          true,  true,  true,  false, false, 'รับอะไหล่เข้าสต็อก'),
      ('line_new_message',     false, false, false, false, true,  'ข้อความ LINE ใหม่'),
      ('line_new_follower',    true,  true,  true,  false, true,  'ผู้ติดตาม LINE ใหม่'),
      ('booking_new',          true,  true,  true,  false, true,  'นัดหมายใหม่'),
      ('booking_reminder',     false, false, false, false, true,  'เตือนนัดหมาย'),
      ('service_reminder',     true,  true,  true,  false, true,  'เตือนเช็คระยะ'),
      ('warranty_expiring',    true,  true,  true,  false, false, 'รับประกันใกล้หมด'),
      ('employee_clock_in',    true,  true,  true,  false, false, 'พนักงานเข้างาน'),
      ('employee_clock_out',   true,  true,  true,  false, false, 'พนักงานออกงาน'),
      ('daily_summary',        true,  true,  true,  false, false, 'สรุปรายวัน'),
      ('insurance_claim_update', true, true, true,  false, false, 'อัปเดตเคลมประกัน'),
      ('additional_work_request', true, true, true, true,  true,  'ขอทำงานเพิ่มเติม'),
      ('review_received',      true,  true,  true,  false, false, 'ได้รับรีวิวจากลูกค้า')
    ) AS t(event_type, o, a, m, tech, r, label)
  LOOP
    INSERT INTO tenant_notification_config (
      tenant_id, event_type,
      notify_owner, notify_admin, notify_manager, notify_technician, notify_receptionist,
      push_enabled, in_app_enabled, line_enabled, is_enabled
    ) VALUES (
      NEW.id, event_record.event_type,
      event_record.o, event_record.a, event_record.m, event_record.tech, event_record.r,
      true, true, false, true
    ) ON CONFLICT (tenant_id, event_type) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-create default config when tenant is created
DROP TRIGGER IF EXISTS trg_create_default_notification_config ON tenants;
CREATE TRIGGER trg_create_default_notification_config
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_config();
