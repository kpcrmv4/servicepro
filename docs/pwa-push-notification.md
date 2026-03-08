# PWA + Push Notification System

## สรุปภาพรวม

ระบบ KPServicePro รองรับ **Progressive Web App (PWA)** และ **Push Notification** ครบวงจร โดยแต่ละร้าน (tenant) สามารถตั้งค่าได้เองว่าต้องการให้แจ้งเตือนอะไรไปยังบทบาทใดบ้าง

---

## 1. PWA (Progressive Web App)

### ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | คำอธิบาย |
|------|----------|
| `public/manifest.json` | Web App Manifest - ข้อมูลแอป, ไอคอน, สี |
| `public/sw.js` | Service Worker - cache, offline, push handler |
| `public/icons/` | App icons ทุกขนาด (72-512px) |
| `src/app/offline/page.tsx` | หน้า Offline fallback |
| `src/components/pwa/pwa-register.tsx` | Component ลงทะเบียน SW + แสดง install/update banner |
| `src/app/layout.tsx` | PWA meta tags, manifest link, apple-touch-icon |

### ความสามารถ

- ติดตั้งเป็นแอปบนมือถือ/เดสก์ท็อป (Add to Home Screen)
- Offline fallback page เมื่อไม่มีอินเทอร์เน็ต
- Cache static assets สำหรับโหลดเร็วขึ้น
- Auto-update detection พร้อม banner แจ้งเตือนเวอร์ชันใหม่
- Install prompt banner (แสดงหลัง 30 วินาที)

---

## 2. Push Notification System

### Architecture

```
[Event เกิดขึ้น] → [Trigger Function] → [sendNotification()]
                                              ↓
                                    [ตรวจ tenant_notification_config]
                                              ↓
                                    [หา users ตาม role config]
                                              ↓
                              ┌───────────────┼───────────────┐
                              ↓               ↓               ↓
                        [In-App DB]    [Web Push API]    [LINE (future)]
                              ↓               ↓
                    [Notification Bell]  [Browser Push]
```

### ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | คำอธิบาย |
|------|----------|
| **Types & Config** | |
| `src/lib/types/notifications.ts` | Types, event definitions, categories, default configs |
| **Backend** | |
| `src/lib/actions/notifications.ts` | Server actions: CRUD, subscribe, send |
| `src/lib/notifications/triggers.ts` | Trigger functions สำหรับทุก event |
| `src/app/api/push/send/route.ts` | API: ส่ง web-push + VAPID key |
| `src/app/api/push/subscribe/route.ts` | API: จัดการ push subscription |
| `src/app/api/notifications/config/route.ts` | API: GET/PUT tenant notification config |
| **Frontend** | |
| `src/hooks/use-push-notification.ts` | Hook: push subscribe/unsubscribe/permission |
| `src/hooks/use-notifications.ts` | Hook: in-app notifications + realtime |
| `src/components/notifications/notification-bell.tsx` | Dropdown bell ใน header |
| **Pages** | |
| `src/app/(dashboard)/dashboard/notifications/page.tsx` | Notification Center (ดูทั้งหมด) |
| `src/app/(dashboard)/dashboard/settings/notifications/page.tsx` | ตั้งค่าแจ้งเตือน per-tenant |
| **Database** | |
| `src/lib/supabase/migrations/001_push_notifications.sql` | Migration: 3 tables + RLS + trigger |

---

## 3. Database Tables

### push_subscriptions
เก็บ Web Push subscription ของแต่ละ user/device

### notifications
เก็บประวัติแจ้งเตือนทั้งหมด (in-app + push)

### tenant_notification_config
ตั้งค่าแจ้งเตือนระดับร้าน - เจ้าของร้าน/admin กำหนดได้ว่า event ไหนส่งไปยัง role ไหน ผ่านช่องทางไหน

---

## 4. Notification Events (27 events, 12 categories)

| หมวดหมู่ | Events |
|----------|--------|
| งานซ่อม | job_created, job_status_changed, job_assigned, job_completed, job_urgent |
| ใบเสนอราคา | quotation_pending, quotation_approved, quotation_rejected |
| ตรวจสภาพรถ (DVI) | dvi_completed, dvi_sent_customer |
| การเงิน | payment_received, payment_overdue |
| สต็อกอะไหล่ | stock_low, stock_out, po_received |
| LINE OA | line_new_message, line_new_follower |
| นัดหมาย | booking_new, booking_reminder |
| การเตือน | service_reminder, warranty_expiring |
| พนักงาน | employee_clock_in, employee_clock_out |
| รายงาน | daily_summary |
| ประกัน | insurance_claim_update |
| งานเพิ่มเติม | additional_work_request |
| รีวิว | review_received |

---

## 5. Role-Based Notification Matrix (Default)

| Event | Owner | Admin | Manager | Technician | Receptionist |
|-------|:-----:|:-----:|:-------:|:----------:|:------------:|
| งานซ่อมใหม่ | ✅ | ✅ | ✅ | - | ✅ |
| สถานะงานเปลี่ยน | ✅ | ✅ | ✅ | ✅ | ✅ |
| ได้รับมอบหมายงาน | - | - | - | ✅ | - |
| งานเสร็จสิ้น | ✅ | ✅ | ✅ | - | ✅ |
| งานเร่งด่วน | ✅ | ✅ | ✅ | ✅ | ✅ |
| สต็อกต่ำ/หมด | ✅ | ✅ | ✅ | - | - |
| ข้อความ LINE ใหม่ | - | - | - | - | ✅ |
| พนักงานเข้า/ออกงาน | ✅ | ✅ | ✅ | - | - |

> **หมายเหตุ:** เจ้าของร้าน/admin สามารถปรับเปลี่ยน matrix นี้ได้ทั้งหมดผ่านหน้าตั้งค่า

---

## 6. Environment Variables ที่ต้องตั้ง

```env
# VAPID Keys สำหรับ Web Push (สร้างด้วย: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ=
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# VAPID Subject (email ของผู้ดูแลระบบ)
VAPID_SUBJECT=mailto:admin@kpservicepro.com

# App URL (สำหรับ internal API calls)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### วิธีสร้าง VAPID Keys

```bash
npx web-push generate-vapid-keys
```

---

## 7. วิธี Integrate กับ Server Actions ที่มีอยู่

ตัวอย่าง: เมื่อสร้างงานซ่อมใหม่

```typescript
// ใน src/lib/actions/jobs.ts
import { notifyJobCreated } from '@/lib/notifications/triggers'

export async function createJob(formData: FormData) {
  // ... สร้างงานซ่อม ...
  
  // ส่งแจ้งเตือน
  await notifyJobCreated({
    tenantId: userInfo.tenant_id,
    jobNumber: newJob.job_number,
    vehiclePlate: newJob.vehicle_plate,
    customerName: newJob.customer_name,
    jobType: newJob.job_type,
  })
  
  return { success: true }
}
```

---

## 8. Database Migration

รัน SQL migration ใน Supabase:

```bash
# ไฟล์: src/lib/supabase/migrations/001_push_notifications.sql
```

Migration นี้จะ:
1. สร้าง 3 tables: `push_subscriptions`, `notifications`, `tenant_notification_config`
2. เปิด RLS policies
3. สร้าง trigger function ที่จะ auto-create default notification config เมื่อสร้าง tenant ใหม่
