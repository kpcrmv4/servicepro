# KPServicePro - Redesign & Improvement Plan

> วิเคราะห์เมื่อ: 2026-03-18
> สถานะ: รอการตัดสินใจจากเจ้าของโปรเจค

---

## สารบัญ

1. [สรุปภาพรวมระบบปัจจุบัน](#1-สรุปภาพรวมระบบปัจจุบัน)
2. [ปัญหาที่พบ: Logic ทับซ้อน](#2-ปัญหาที่พบ-logic-ทับซ้อน)
3. [ปัญหาที่พบ: เมนูและ Navigation](#3-ปัญหาที่พบ-เมนูและ-navigation)
4. [ปัญหาที่พบ: Responsive/Mobile](#4-ปัญหาที่พบ-responsivemobile)
5. [ฟีเจอร์ที่ออกแบบ Schema แล้วแต่ยังไม่มี UI](#5-ฟีเจอร์ที่ออกแบบ-schema-แล้วแต่ยังไม่มี-ui)
6. [หน้าที่เป็น Skeleton/ยังไม่สมบูรณ์](#6-หน้าที่เป็น-skeletonยังไม่สมบูรณ์)
7. [แผนปรับปรุง Phase 1-5](#7-แผนปรับปรุง)
8. [สรุปแผนเพื่อตัดสินใจ](#8-สรุปแผนเพื่อตัดสินใจ)

---

## 1. สรุปภาพรวมระบบปัจจุบัน

### Tech Stack
| เทคโนโลยี | เวอร์ชัน |
|-----------|---------|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| Supabase | 2.98.0 |
| Tailwind CSS | 4 |
| TypeScript | 5 |
| Zustand | 5.0.11 |
| shadcn/ui | new-york style |

### สถิติระบบ
- **Route pages**: 29 หน้าในส่วน Dashboard
- **Server Actions**: 24 ไฟล์ (~5,272 บรรทัด)
- **Database Tables**: 60+ ตาราง (ตามที่ออกแบบใน types)
- **Components**: 30+ components
- **User Roles**: 6 roles (owner, admin, manager, technician, receptionist, viewer)

### สถานะฟีเจอร์
| ฟีเจอร์ | Schema | Actions | Pages | สถานะ |
|---------|--------|---------|-------|--------|
| Job Management | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Reception/Check-in | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Inventory/PO/Stock | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Finance/Invoicing | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Customers | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Inspections (DVI) | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Service Reminders | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Time Clock | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Quotations | ✅ | ✅ | ✅ | **สมบูรณ์** |
| LINE OA | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Customer Portal | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Queue/Kanban | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Planning/Timeline | ✅ | ✅ | ✅ | **สมบูรณ์** |
| Service Packages | ✅ | ✅ | ⚠️ | **30% - Skeleton** |
| Insurance Claims | ✅ | ⚠️ | ⚠️ | **20% - Skeleton** |
| Employees | ✅ | ⚠️ | ⚠️ | **20% - Skeleton** |
| Vehicles | ✅ | ✅ | ⚠️ | **50% - List only** |
| Warranty System | ✅ | ❌ | ❌ | **0%** |
| E-Commerce/Shop | ✅ | ❌ | ❌ | **0%** |
| Knowledge Base | ✅ | ❌ | ❌ | **0%** |
| Commission System | ✅ | ❌ | ❌ | **0%** |
| Referral Program | ✅ | ❌ | ❌ | **0%** |
| Employee Skills | ✅ | ❌ | ❌ | **0%** |
| Landing Page Builder | ✅ | ❌ | ❌ | **0%** |

---

## 2. ปัญหาที่พบ: Logic ทับซ้อน

### 2.1 Auth/Tenant Helper ซ้ำใน 10+ ไฟล์ (ร้ายแรง: สูง)

**ปัญหา**: ทุก action file ใน `src/lib/actions/` เขียน pattern เดิมซ้ำ:

```typescript
// ซ้ำใน 10+ ไฟล์:
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return null
const { data: profile } = await supabase
  .from('users')
  .select('id, tenant_id, role')
  .eq('id', user.id)
  .single()
```

**ไฟล์ที่ซ้ำ**:
- `src/lib/actions/customers.ts` - `getTenantId()`
- `src/lib/actions/jobs.ts` - `getUserInfo()`
- `src/lib/actions/dashboard.ts` - inline auth
- `src/lib/actions/quotations.ts` - `getUserInfo()`
- `src/lib/actions/vehicles.ts` - `getTenantId()`
- `src/lib/actions/finance.ts` - `getUserInfo()`
- `src/lib/actions/parts.ts` - `getUserInfo()`
- `src/lib/actions/reception.ts` - `getUserInfo()`
- `src/lib/actions/quotation-line.ts` - `getUserInfo()`
- `src/lib/actions/inspections.ts` - inline
- `src/lib/actions/notifications.ts` - `getCurrentUser()`

**แก้ไข**: สร้าง `src/lib/actions/auth-helpers.ts` แชร์ทั้งระบบ

---

### 2.2 Sequential Number Generation ซ้ำ 7 ที่ (ร้ายแรง: สูง)

**ปัญหา**: Logic สร้างเลขเอกสาร (JOB-YYYY-XXXX, QT-YYYY-XXXX, INV-YYYY-XXXX ฯลฯ) เขียนซ้ำ:

```typescript
// ซ้ำ 7 ที่:
const { count } = await supabase
  .from('TABLE')
  .select('id', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)
const number = `PREFIX-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`
```

**ไฟล์ที่ซ้ำ**:
- `jobs.ts` → JOB-YYYY-XXXX
- `quotations.ts` → QT-YYYY-XXXX
- `finance.ts` → INV-YYYY-XXXX, REC-YYYY-XXXX
- `parts.ts` → PO-YYYY-XXXX, SALE-YYYY-XXXX
- `reception.ts` → JOB-YYYY-XXXX (ซ้ำกับ jobs.ts อีก)

**แก้ไข**: สร้าง utility function `generateSequenceNumber(supabase, table, prefix, tenantId)`

---

### 2.3 FEFO Stock Deduction ซ้ำ 2 ที่ (ร้ายแรง: ปานกลาง-สูง)

**ปัญหา**: Logic ตัดสต็อกแบบ FEFO เขียนซ้ำ 2 ฟังก์ชันใน `parts.ts`:
- `withdrawPart()` (บรรทัด 425-493)
- `withdrawPartForSale()` (บรรทัด 605-663) — **แทบจะเหมือนกันทั้ง function**

**แก้ไข**: Extract เป็น `deductStockBatchesFEFO()` ใช้ร่วมกัน

---

### 2.4 Status Config ซ้ำใน 9 หน้า (ร้ายแรง: ปานกลาง)

**ปัญหา**: แต่ละหน้ากำหนด statusConfig ของตัวเอง (สี, label, className):

```typescript
// ซ้ำใน 9 หน้า:
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "รอดำเนินการ", color: "bg-warning/10 text-warning" },
  // ...
}
```

**หน้าที่ซ้ำ**: jobs, jobs/[id], reception, quotations, insurance, inventory, queue, planning, super-admin/subscriptions

**แก้ไข**: สร้าง `src/lib/constants/status-config.ts` เก็บ config กลาง

---

### 2.5 Date/Financial Calculations ซ้ำ (ร้ายแรง: ปานกลาง)

- **Date Helpers**: คำนวณวันเดือนปีแบบเดียวกันใน 4+ ไฟล์
- **VAT Calculation**: `Math.round(subtotal * 0.07 * 100) / 100` ซ้ำ 3 ที่
- **Financial Aggregation**: Dashboard และ Finance คำนวณ revenue/expense ซ้ำกัน

**แก้ไข**: สร้าง `src/lib/utils/date-helpers.ts` และ `src/lib/utils/financial.ts`

---

### 2.6 UI Pattern ซ้ำ (ร้ายแรง: ต่ำ-ปานกลาง)

| Pattern | จำนวนที่ซ้ำ | แก้ไข |
|---------|------------|-------|
| Search Input | 5+ หน้า | สร้าง `SearchInput` component |
| Summary/Stat Cards | 3+ หน้า | สร้าง `StatCard` component |
| Job Type Labels | 2+ ที่ | ย้ายไป constants |

---

### สรุป: ตารางปัญหา Logic ทับซ้อน

| ปัญหา | ความร้ายแรง | จำนวนไฟล์ | ผลกระทบ |
|--------|-----------|-----------|---------|
| Auth/Tenant Helpers | **สูง** | 10+ | Bug risk สูง, ต้องแก้ทุกไฟล์ถ้าเปลี่ยน logic |
| Number Generation | **สูง** | 5 | เลขเอกสารอาจชนกันถ้า logic ไม่ sync |
| FEFO Stock Logic | **ปานกลาง-สูง** | 1 (2 fn) | ตัดสต็อกผิดพลาดได้ |
| Status Configs | **ปานกลาง** | 9 | สีไม่ consistent, แก้ 9 ที่ |
| Date/Financial | **ปานกลาง** | 4+ | คำนวณผิดพลาดได้ |
| UI Patterns | **ต่ำ-ปานกลาง** | 5+ | UX ไม่ consistent |

---

## 3. ปัญหาที่พบ: เมนูและ Navigation — แผนยุบรวมหน้า

### 3.1 ปัญหาหลัก: 17 เมนูมากเกินไป

```
ปัจจุบัน (17 รายการ)              →    เสนอใหม่ (8 รายการ)
─────────────────────────              ─────────────────────────
 1. แดชบอร์ด                            1. แดชบอร์ด
 2. รับรถ           ─┐                  2. งานซ่อม (5 tabs)
 3. งานซ่อม          ├─→ รวมเป็น 1        ├─ รับรถ
 4. ตารางงาน        ─┤                    ├─ คิว/Kanban
 5. (คิวงาน)*       ─┤                    ├─ รายการงาน
 6. (ใบเสนอราคา)*  ─┘                    ├─ ตารางงาน
                                          └─ ใบเสนอราคา
 7. ตรวจสภาพรถ                          3. ตรวจสภาพรถ
 8. อะไหล่          ─┐                  4. คลังอะไหล่ (6 tabs)
 9. แพ็กเกจบริการ   ─┘ รวมเป็น 1          ├─ อะไหล่
                                          ├─ ใบสั่งซื้อ
                                          ├─ ประวัติเคลื่อนไหว
                                          ├─ หมวดหมู่
                                          ├─ POS
                                          └─ แพ็กเกจบริการ
10. การเงิน         ─┐                  5. การเงิน (5 tabs)
11. ประกัน          ─┘ รวมเป็น 1          ├─ ใบแจ้งหนี้
                                          ├─ ใบเสร็จ
                                          ├─ รายจ่าย
                                          ├─ รายจ่ายประจำ
                                          └─ เคลมประกัน
12. ลูกค้า          ─┐                  6. ลูกค้า (tabs ใน detail)
13. รถ              ─┤ รวมเป็น 1          ├─ รายชื่อลูกค้า
14. แจ้งเตือนบริการ ─┘                    ├─ รถ (ดูผ่าน customer detail)
                                          └─ แจ้งเตือน (ดูผ่าน customer detail)
15. พนักงาน         ─┐                  7. ทีมงาน (3 tabs)
16. บันทึกเวลา      ─┘ รวมเป็น 1          ├─ สมาชิก
                                          ├─ บันทึกเวลา
                                          └─ สรุปเวลางาน
17. รายงาน                              8. รายงาน
18. LINE OA         ─┐
19. ตั้งค่า          ─┘ รวมใน Settings   (เข้าผ่าน user menu / icon)

* คิวงาน + ใบเสนอราคา = มีหน้าแล้วแต่ไม่มีในเมนู
```

**ผลลัพธ์: ลดจาก 17 → 8 เมนูหลัก (ลด 53%)**

---

### 3.2 วิเคราะห์การยุบรวมแต่ละกลุ่ม

#### A. รับรถ + คิวงาน + งานซ่อม + ตารางงาน + ใบเสนอราคา → **"งานซ่อม"** (5 tabs)

**เหตุผล**: ทั้ง 5 หน้าแสดง **ข้อมูลชุดเดียวกัน** (jobs) คนละมุมมอง

| หน้าปัจจุบัน | แสดงอะไร | สถานะที่ filter |
|-------------|---------|---------------|
| รับรถ (Reception) | Card grid งานรับเข้า | pending, diagnosing, quoted |
| คิวงาน (Queue) | Kanban board | pending → in_progress → completed |
| งานซ่อม (Jobs) | Table งานซ่อม | in_progress → completed |
| ตารางงาน (Planning) | Timeline ตามวัน | ทุกงาน active |
| ใบเสนอราคา (Quotations) | Table ใบเสนอราคา | draft → approved |

**ปัญหาที่แก้ได้**:
- ผู้ใช้สับสนว่า "งานอยู่หน้าไหน?" → ตอนนี้อยู่หน้าเดียว เลือก tab
- Queue + Quotations ไม่มีในเมนู → ตอนนี้เป็น tab เข้าถึงได้
- ช่างเทคนิคเข้า Queue ง่าย → เลือก tab "คิว" ได้เลย

**โครงสร้างใหม่**:
```
/dashboard/jobs              → Tab: รับรถ (default สำหรับ receptionist)
/dashboard/jobs?tab=queue    → Tab: คิว/Kanban (default สำหรับ technician)
/dashboard/jobs?tab=list     → Tab: รายการงาน
/dashboard/jobs?tab=planning → Tab: ตารางงาน
/dashboard/jobs?tab=quotes   → Tab: ใบเสนอราคา
/dashboard/jobs/new          → สร้างงานใหม่
/dashboard/jobs/[id]         → รายละเอียดงาน
```

---

#### B. อะไหล่ + แพ็กเกจบริการ → **"คลังอะไหล่"** (6 tabs)

**เหตุผล**: Inventory มี 5 tabs อยู่แล้ว, Service Packages คือ "สินค้าบริการ" ที่ขายให้ลูกค้า

| Tab ปัจจุบัน (Inventory) | Tab ใหม่ |
|-------------------------|---------|
| อะไหล่ | อะไหล่ |
| ใบสั่งซื้อ (PO) | ใบสั่งซื้อ |
| ประวัติเคลื่อนไหว | ประวัติ |
| หมวดหมู่ | หมวดหมู่ |
| POS | POS |
| *(ไม่มี)* | **แพ็กเกจบริการ** ← เพิ่มใหม่ |

---

#### C. การเงิน + ประกัน → **"การเงิน"** (5 tabs)

**เหตุผล**: เคลมประกันเป็น **ธุรกรรมการเงิน** — เงินเข้าจากบริษัทประกัน

| Tab ปัจจุบัน (Finance) | Tab ใหม่ |
|-----------------------|---------|
| ใบแจ้งหนี้ | ใบแจ้งหนี้ |
| ใบเสร็จ | ใบเสร็จ |
| รายจ่าย | รายจ่าย |
| รายจ่ายประจำ | รายจ่ายประจำ |
| *(ไม่มี)* | **เคลมประกัน** ← ย้ายมา |

---

#### D. ลูกค้า + รถ + แจ้งเตือนบริการ → **"ลูกค้า"**

**เหตุผล**:
- หน้า Customer Detail **มีรายการรถอยู่แล้ว** → หน้า Vehicles ซ้ำ
- แจ้งเตือนบริการ = แจ้งเตือน**ลูกค้า** → เป็น context ของลูกค้า

| สิ่งที่เปลี่ยน | รายละเอียด |
|---------------|-----------|
| ลบหน้า "รถ" ออกจากเมนู | เข้าถึงรถผ่าน Customer Detail แทน |
| เพิ่ม "ค้นหาตามทะเบียน" | filter ในหน้า Customers เพื่อหารถ |
| ย้าย "แจ้งเตือนบริการ" | เป็น tab ในหน้า Customers หรือ section ใน Customer Detail |

---

#### E. พนักงาน + บันทึกเวลา → **"ทีมงาน"** (3 tabs)

**เหตุผล**: ทั้งสองหน้าจัดการ "คน" ในร้าน

| Tab | เนื้อหา |
|-----|---------|
| สมาชิก | รายชื่อพนักงาน, role, สถานะ (จากหน้า Employees) |
| บันทึกเวลา | Clock in/out, timer ของฉัน (จากหน้า Time Clock) |
| สรุปเวลางาน | ตารางสรุปรายสัปดาห์ (จากหน้า Time Clock) |

---

#### F. LINE OA + ตั้งค่า → Settings (ไม่แสดงในเมนูหลัก)

**เหตุผล**: Settings เข้าถึงไม่บ่อย → เข้าผ่าน icon gear ใน header หรือ user menu

| ส่วนย่อยใน Settings | เนื้อหา |
|-------------------|---------|
| ข้อมูลร้าน | ชื่อร้าน, ที่อยู่, เลขภาษี |
| สมาชิกทีม | invite/manage team |
| แจ้งเตือน | ตั้งค่า notification routing |
| LINE OA | เชื่อมต่อ LINE Official Account |

---

### 3.3 Sidebar ใหม่ที่เสนอ

```
┌────────────────────────────────────┐
│  KPServicePro            [⚙️] [🔔] │  ← Settings + Notifications ใน header
├────────────────────────────────────┤
│                                    │
│  📊  แดชบอร์ด                      │
│                                    │
│  🔧  งานซ่อม            🔴 12      │  ← badge: งานรอดำเนินการ
│  🔍  ตรวจสภาพรถ                    │
│  📦  คลังอะไหล่          🟡 3       │  ← badge: low stock
│                                    │
│  💰  การเงิน             🟡 5       │  ← badge: overdue invoices
│  👥  ลูกค้า                        │
│                                    │
│  👷  ทีมงาน                        │
│  📈  รายงาน                        │
│                                    │
├────────────────────────────────────┤
│  [User Avatar] ชื่อผู้ใช้          │
│  Owner · ร้าน KP Service          │
│  [ออกจากระบบ]                      │
└────────────────────────────────────┘
```

**8 เมนูหลัก — สะอาด, จำง่าย, เข้าถึงเร็ว**

---

### 3.4 Role-Based Default Tab

เมื่อแต่ละ Role คลิก "งานซ่อม" → ไปที่ tab ที่เหมาะกับ role อัตโนมัติ:

| Role | Default Tab | เหตุผล |
|------|------------|--------|
| Owner/Admin | รายการงาน (List) | ดูภาพรวมทุกงาน |
| Manager | รายการงาน (List) | จัดการงานทั้งหมด |
| Technician | คิว (Queue/Kanban) | เห็นงานที่ได้รับมอบหมาย |
| Receptionist | รับรถ (Reception) | รับงานเข้าระบบ |
| Viewer | รายการงาน (List) | ดูอย่างเดียว |

---

### 3.5 Role-Based Menu Visibility (Desktop)

| เมนู | Owner | Admin | Manager | Tech | Reception | Viewer |
|------|-------|-------|---------|------|-----------|--------|
| แดชบอร์ด | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| งานซ่อม | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ตรวจสภาพรถ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| คลังอะไหล่ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| การเงิน | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| ลูกค้า | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| ทีมงาน | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| รายงาน | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 4. ปัญหาที่พบ: Responsive/Mobile

### 4.1 ปัญหาร้ายแรง

| ปัญหา | ไฟล์ | บรรทัด | รายละเอียด |
|--------|-----|--------|-----------|
| Jobs table ไม่มี overflow-x-auto | `dashboard/jobs/page.tsx` | ~160 | ตารางล้นจอมือถือ |
| Queue Kanban ไม่ responsive | `dashboard/queue/page.tsx` | ~52 | min-w-[900px] ไม่ stack บน mobile |
| Dialog กว้างเกินบนมือถือ | `components/ui/dialog.tsx` | 83 | max-w-lg (512px) ไม่มี responsive |
| Part Dialog ไม่มี mobile max-width | `components/inventory/part-dialog.tsx` | 57 | ขยายเต็มจอบน mobile |

### 4.2 ปัญหาปานกลาง

| ปัญหา | ไฟล์ | รายละเอียด |
|--------|-----|-----------|
| Tab overflow ไม่มี visual indicator | หลายหน้า | Tab ล้นแต่ไม่มีลูกศร/indicator |

### 4.3 หน้าที่ Mobile ดีอยู่แล้ว

- **Dashboard** — KPI cards responsive ดี (1→2→4 columns)
- **Employees** — Card grid responsive ดี
- **Customers** — Summary + table responsive ดี
- **Inventory** — ทุก table มี overflow-x-auto
- **Finance** — Card + table responsive ดี
- **Planning** — Timeline layout responsive ดี
- **Inspections** — Card-based responsive ดี
- **Bottom Nav** — Role-based mobile nav ยอดเยี่ยม

### 4.4 แนวทางแก้ไข

```
1. Jobs table → เพิ่ม <div className="overflow-x-auto"> ครอบ
2. Queue Kanban → เพิ่ม responsive: stack vertically บน mobile
3. Dialog → เปลี่ยน max-w-lg เป็น max-w-[calc(100vw-2rem)] sm:max-w-lg
4. Part Dialog → เพิ่ม max-w-[calc(100vw-2rem)]
5. Tab navigation → เพิ่ม scroll-snap สำหรับ mobile
```

### 4.5 แผนปรับปรุง Bottom Navigation (Mobile) — Implementation Spec

#### โครงสร้างปัจจุบัน (วิเคราะห์จากโค้ดจริง)

**ไฟล์**: `src/components/layout/bottom-nav.tsx` (~385 บรรทัด)

```
[ปุ่ม1] [ปุ่ม2]  ( ปุ่มลอย3 )  [ปุ่ม4] [เพิ่มเติม5]
                     ↑
              ปุ่มกลมลอยขึ้น (h-14 w-14, -mt-5)
              action หลักของ role
```

**สิ่งที่ดีอยู่แล้ว (คงไว้)**:
- Layout 5 ปุ่ม (2-left, center-float, 2-right) → **เก็บไว้เหมือนเดิม**
- Glow effect บนปุ่มกลาง → **เก็บไว้**
- Safe area support (`pb-[env(safe-area-inset-bottom)]`) → **เก็บไว้**
- Backdrop blur nav bar (`bg-card/95 backdrop-blur-lg`) → **เก็บไว้**
- Close on outside click + route change → **เก็บไว้**
- `active:scale-95` animation → **เก็บไว้**
- Role loading จาก Supabase → **เก็บไว้**

**ปัญหาที่ต้องแก้**:
1. **`allMenuItems` มี 19 items** → ต้องลดเป็น 8 items ใหม่
2. **`roleNavConfigs` อ้าง route เก่า** → เช่น `/dashboard/reception`, `/dashboard/queue`, `/dashboard/planning`
3. **ปุ่มกลาง link ไป `/dashboard/reception`** → ต้องเปลี่ยนเป็น `/dashboard/jobs?tab=reception`
4. **More menu เป็น grid 4x5 ต้อง scroll** → ลดเป็น grid 4x2 พอดีจอ
5. **ไม่มี badge count** → เพิ่ม badge แสดงจำนวนงานค้าง/แจ้งเตือน
6. **ไม่มี role-based visibility ใน More menu** → ซ่อนเมนูที่ role ไม่มีสิทธิ์
7. **`isActive()` ไม่รองรับ query params** → tab-based routes ต้องตรวจ `?tab=` ด้วย

---

#### โครงสร้างใหม่ (5 ปุ่ม)

```
┌─────────────────────────────────────────┐
│                                         │
│  [ปุ่ม1]  [ปุ่ม2]  (ปุ่ม3)  [ปุ่ม4]  [ปุ่ม5]  │
│                      ↑↑                 │
│               ปุ่มกลมลอยขึ้น             │
│          = PRIMARY ACTION ของ Role       │
│                                         │
│  ปุ่ม 5 = "เพิ่มเติม" → เปิด grid       │
│           เมนูทั้ง 8 รายการ              │
└─────────────────────────────────────────┘
```

---

#### การเปลี่ยนแปลงโค้ดทีละส่วน

##### ส่วน 1: `allMenuItems` — ลด 19 → 8 items

```typescript
// ======== ก่อน (19 items) ========
const allMenuItems: NavItem[] = [
  { title: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
  { title: "รับรถ", href: "/dashboard/reception", icon: ClipboardList },
  { title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench },
  { title: "คิวงาน", href: "/dashboard/queue", icon: CheckSquare },
  // ... 15 items อื่นๆ
]

// ======== หลัง (8 items) ========
const allMenuItems: NavItem[] = [
  { title: "แดชบอร์ด", href: "/dashboard",            icon: LayoutDashboard },
  { title: "งานซ่อม",   href: "/dashboard/jobs",       icon: Wrench },
  { title: "ตรวจสภาพ",  href: "/dashboard/inspections", icon: ClipboardCheck },
  { title: "คลังอะไหล่", href: "/dashboard/inventory",  icon: Package },
  { title: "การเงิน",   href: "/dashboard/finance",     icon: DollarSign },
  { title: "ลูกค้า",    href: "/dashboard/customers",   icon: Users },
  { title: "ทีมงาน",    href: "/dashboard/team",        icon: UserCog },
  { title: "รายงาน",    href: "/dashboard/reports",     icon: BarChart3 },
]
```

**Route mapping เก่า → ใหม่**:

| Route เก่า | Route ใหม่ | หมายเหตุ |
|------------|-----------|---------|
| `/dashboard/reception` | `/dashboard/jobs?tab=reception` | ยุบเข้า jobs |
| `/dashboard/queue` | `/dashboard/jobs?tab=queue` | ยุบเข้า jobs |
| `/dashboard/planning` | `/dashboard/jobs?tab=planning` | ยุบเข้า jobs |
| `/dashboard/quotations` | `/dashboard/jobs?tab=quotes` | ยุบเข้า jobs |
| `/dashboard/service-packages` | `/dashboard/inventory?tab=packages` | ยุบเข้า inventory |
| `/dashboard/insurance` | `/dashboard/finance?tab=insurance` | ยุบเข้า finance |
| `/dashboard/vehicles` | ลบ (เข้าผ่าน customer detail) | — |
| `/dashboard/reminders` | ลบ (เข้าผ่าน customer detail) | — |
| `/dashboard/employees` | `/dashboard/team` | เปลี่ยนชื่อ |
| `/dashboard/time-clock` | `/dashboard/team?tab=timeclock` | ยุบเข้า team |
| `/dashboard/settings/line` | `/dashboard/settings?tab=line` | ซ่อนจากเมนูหลัก |

---

##### ส่วน 2: `roleNavConfigs` — อัปเดต route + labels

```typescript
// ======== หลัง ========
const roleNavConfigs: Record<UserRole, RoleNavConfig> = {
  // เจ้าของ: เน้นภาพรวม + การเงิน
  owner: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard",         icon: LayoutDashboard },
      { title: "การเงิน",  href: "/dashboard/finance",  icon: DollarSign },
      { title: "รายงาน",   href: "/dashboard/reports",  icon: BarChart3 },
      { title: "เพิ่มเติม", href: "#more",              icon: MoreHorizontal },
    ],
    centerAction: {
      title: "สร้างงาน",
      href: "/dashboard/jobs/new",           // ← เปลี่ยนจาก /reception
      icon: Plus,
      color: "bg-primary",
    },
  },
  // ผู้ดูแล: เน้นจัดการระบบ
  admin: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard",      icon: LayoutDashboard },
      { title: "งานซ่อม",  href: "/dashboard/jobs",  icon: Wrench },
      { title: "ทีมงาน",   href: "/dashboard/team",  icon: UserCog },
      { title: "เพิ่มเติม", href: "#more",           icon: MoreHorizontal },
    ],
    centerAction: {
      title: "สร้างงาน",
      href: "/dashboard/jobs/new",
      icon: Plus,
      color: "bg-primary",
    },
  },
  // ผู้จัดการ: เน้น operations
  manager: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard",          icon: LayoutDashboard },
      { title: "งานซ่อม",  href: "/dashboard/jobs",      icon: Wrench },
      { title: "คลังอะไหล่", href: "/dashboard/inventory", icon: Package },
      { title: "เพิ่มเติม", href: "#more",               icon: MoreHorizontal },
    ],
    centerAction: {
      title: "รับรถ",
      href: "/dashboard/jobs?tab=reception", // ← เปลี่ยนจาก /reception
      icon: ClipboardList,
      color: "bg-emerald-500",
    },
  },
  // ช่าง: เน้นงานของตัวเอง
  technician: {
    items: [
      { title: "งานซ่อม",  href: "/dashboard/jobs",          icon: Wrench },
      { title: "คลังอะไหล่", href: "/dashboard/inventory",    icon: Package },
      { title: "ตรวจสภาพ",  href: "/dashboard/inspections",  icon: ClipboardCheck },
      { title: "เพิ่มเติม", href: "#more",                   icon: MoreHorizontal },
    ],
    centerAction: {
      title: "คิวงาน",
      href: "/dashboard/jobs?tab=queue",     // ← เปลี่ยนจาก /queue
      icon: CheckSquare,
      color: "bg-orange-500",
    },
  },
  // พนักงานต้อนรับ: เน้นรับลูกค้า
  receptionist: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard",            icon: LayoutDashboard },
      { title: "ลูกค้า",   href: "/dashboard/customers",   icon: Users },
      { title: "งานซ่อม",  href: "/dashboard/jobs",        icon: Wrench },
      { title: "เพิ่มเติม", href: "#more",                 icon: MoreHorizontal },
    ],
    centerAction: {
      title: "รับรถ",
      href: "/dashboard/jobs?tab=reception",
      icon: ClipboardList,
      color: "bg-emerald-500",
    },
  },
  // ผู้ดู: ดูอย่างเดียว
  viewer: {
    items: [
      { title: "หน้าหลัก", href: "/dashboard",         icon: LayoutDashboard },
      { title: "งานซ่อม",  href: "/dashboard/jobs",     icon: Wrench },
      { title: "รายงาน",   href: "/dashboard/reports",  icon: BarChart3 },
      { title: "เพิ่มเติม", href: "#more",              icon: MoreHorizontal },
    ],
    centerAction: {
      title: "ดูงาน",
      href: "/dashboard/jobs?tab=list",
      icon: Wrench,
      color: "bg-primary",
    },
  },
}
```

---

##### ส่วน 3: `isActive()` — รองรับ query params

```typescript
// ======== ก่อน ========
const isActive = (href: string) => {
  if (href === "/dashboard") return pathname === "/dashboard"
  if (href === "#more") return false
  return pathname.startsWith(href)
}

// ======== หลัง ========
const isActive = (href: string) => {
  if (href === "/dashboard") return pathname === "/dashboard"
  if (href === "#more") return false
  // แยก path กับ query params
  const [hrefPath] = href.split("?")
  return pathname.startsWith(hrefPath)
}
```

---

##### ส่วน 4: More Menu Grid — ลด 19 → 8 + Role Filter + Badge

```
┌──────────────────────────────────┐
│  เมนูทั้งหมด                  ✕  │
├──────────────────────────────────┤
│                                  │
│  📊 แดชบอร์ด      🔧 งานซ่อม 🔴12 │  ← badge: งานค้าง
│  🔍 ตรวจสภาพ      📦 คลังอะไหล่   │
│  💰 การเงิน 🟡5   👥 ลูกค้า      │  ← badge: overdue
│  👷 ทีมงาน        📈 รายงาน      │
│                                  │
├──────────────────────────────────┤
│  [⚙️ ตั้งค่า]     [🔔 แจ้งเตือน]  │  ← Quick Actions
└──────────────────────────────────┘

Grid: 4 คอลัมน์ x 2 แถว = พอดีจอ (ไม่ scroll!)
```

**Role-based visibility ใน More menu**:

| เมนู | Owner | Admin | Manager | Tech | Reception | Viewer |
|------|-------|-------|---------|------|-----------|--------|
| แดชบอร์ด | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| งานซ่อม | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ตรวจสภาพ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| คลังอะไหล่ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| การเงิน | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| ลูกค้า | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| ทีมงาน | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| รายงาน | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

**Implementation**:
```typescript
// เพิ่ม roles ที่มีสิทธิ์เห็นแต่ละเมนู
interface MenuItemWithAccess extends NavItem {
  allowedRoles: UserRole[]
  badgeKey?: "pendingJobs" | "overdueInvoices" | "lowStock"
}

const allMenuItems: MenuItemWithAccess[] = [
  {
    title: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard,
    allowedRoles: ["owner","admin","manager","technician","receptionist","viewer"],
  },
  {
    title: "งานซ่อม", href: "/dashboard/jobs", icon: Wrench,
    allowedRoles: ["owner","admin","manager","technician","receptionist","viewer"],
    badgeKey: "pendingJobs",
  },
  {
    title: "ตรวจสภาพ", href: "/dashboard/inspections", icon: ClipboardCheck,
    allowedRoles: ["owner","admin","manager","technician","receptionist"],
  },
  {
    title: "คลังอะไหล่", href: "/dashboard/inventory", icon: Package,
    allowedRoles: ["owner","admin","manager","technician"],
    badgeKey: "lowStock",
  },
  {
    title: "การเงิน", href: "/dashboard/finance", icon: DollarSign,
    allowedRoles: ["owner","admin","manager"],
    badgeKey: "overdueInvoices",
  },
  {
    title: "ลูกค้า", href: "/dashboard/customers", icon: Users,
    allowedRoles: ["owner","admin","manager","receptionist","viewer"],
  },
  {
    title: "ทีมงาน", href: "/dashboard/team", icon: UserCog,
    allowedRoles: ["owner","admin","manager"],
  },
  {
    title: "รายงาน", href: "/dashboard/reports", icon: BarChart3,
    allowedRoles: ["owner","admin","manager","viewer"],
  },
]

// Filter ตาม role
const visibleMenuItems = allMenuItems.filter(item =>
  item.allowedRoles.includes(role)
)
```

---

##### ส่วน 5: Badge Count System

```typescript
// เพิ่ม state สำหรับ badge counts
const [badges, setBadges] = useState<Record<string, number>>({})

// โหลด badge counts (เรียกพร้อม loadUserRole)
async function loadBadgeCounts(tenantId: string) {
  const supabase = createClient()

  const [pendingJobs, overdueInvoices, lowStock] = await Promise.all([
    // นับงานค้าง
    supabase.from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["pending", "in_progress"]),
    // นับ invoice ค้างจ่าย
    supabase.from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "overdue"),
    // นับอะไหล่ stock ต่ำ
    supabase.from("parts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .lt("current_stock", "min_stock"),  // stock < min
  ])

  setBadges({
    pendingJobs: pendingJobs.count || 0,
    overdueInvoices: overdueInvoices.count || 0,
    lowStock: lowStock.count || 0,
  })
}

// Badge component (ใช้ทั้งใน nav bar และ More menu)
function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center
      justify-center rounded-full bg-destructive px-1 text-[9px]
      font-bold text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  )
}
```

---

##### ส่วน 6: More Menu — Quick Actions ปรับปรุง

```
├──────────────────────────────────┤
│  ⚙️ ตั้งค่า       🔔 แจ้งเตือน 🔴  │  ← แจ้งเตือนมี badge
│                                  │
│  [ออกจากระบบ]                     │  ← สีแดง, แยกชัดเจน
└──────────────────────────────────┘
```

- **ตั้งค่า** → `/dashboard/settings` (รวม LINE OA, ข้อมูลร้าน, ทีม)
- **แจ้งเตือน** → `/dashboard/notifications` (แสดง badge count)
- **ออกจากระบบ** → เรียก `supabase.auth.signOut()` (เพิ่มใหม่ — ปัจจุบันต้องเข้า Settings)

---

##### ส่วน 7: Haptic Feedback + Long Press (เพิ่มใหม่)

```typescript
// สำหรับ PWA / native feel:
// 1. Haptic feedback เมื่อกดปุ่มกลาง (ถ้า browser รองรับ)
const triggerHaptic = () => {
  if (navigator.vibrate) navigator.vibrate(10)
}

// 2. Long press บนปุ่มงานซ่อม → เปิด Quick Create dialog
//    (optional, ทำใน Phase ถัดไปได้)
```

---

##### ส่วน 8: Animation ปรับปรุง

```css
/* ปัจจุบัน: slide up เฉพาะ More menu */
/* เพิ่ม: spring animation ให้รู้สึกเป็น native app */

@keyframes slide-up-spring {
  0%   { transform: translateY(100%); opacity: 0; }
  60%  { transform: translateY(-3%); }
  80%  { transform: translateY(1%); }
  100% { transform: translateY(0); opacity: 1; }
}

.animate-slide-up-spring {
  animation: slide-up-spring 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

#### Role-Based Bottom Nav Config (สรุปภาพ)

**Owner** — เน้นภาพรวม + การเงิน
```
[แดชบอร์ด] [การเงิน]  (+ สร้างงาน)  [รายงาน] [เพิ่มเติม]
                          ↑
                    bg-primary (blue)
                    → /dashboard/jobs/new
```

**Admin** — เน้นจัดการระบบ
```
[แดชบอร์ด] [งานซ่อม]  (+ สร้างงาน)  [ทีมงาน] [เพิ่มเติม]
                          ↑
                    bg-primary (blue)
                    → /dashboard/jobs/new
```

**Manager** — เน้น operations
```
[แดชบอร์ด] [งานซ่อม]  (รับรถ)  [คลังอะไหล่] [เพิ่มเติม]
                         ↑
                   bg-emerald-500
                   → /dashboard/jobs?tab=reception
```

**Technician** — เน้นงานของตัวเอง
```
[งานซ่อม] [คลังอะไหล่]  (คิวงาน)  [ตรวจสภาพ] [เพิ่มเติม]
                           ↑
                     bg-orange-500
                     → /dashboard/jobs?tab=queue
```

**Receptionist** — เน้นรับลูกค้า
```
[แดชบอร์ด] [ลูกค้า]  (รับรถ)  [งานซ่อม] [เพิ่มเติม]
                        ↑
                  bg-emerald-500
                  → /dashboard/jobs?tab=reception
```

**Viewer** — ดูอย่างเดียว
```
[แดชบอร์ด] [งานซ่อม]  (ดูงาน)  [รายงาน] [เพิ่มเติม]
                         ↑
                   bg-primary (blue)
                   → /dashboard/jobs?tab=list
```

---

#### สรุปการเปลี่ยนแปลง Bottom Nav

| ส่วน | ปัจจุบัน | ใหม่ | ผลกระทบ |
|------|---------|------|---------|
| Layout (5 ปุ่ม) | [1] [2] (center) [4] [more] | **เหมือนเดิม** | ไม่ต้องเรียนรู้ใหม่ |
| `allMenuItems` | 19 items (ต้อง scroll) | **8 items** (พอดีจอ) | ค้นหาเร็วขึ้น |
| `roleNavConfigs` | 6 roles, route เก่า | 6 roles, **route ใหม่** | สอดคล้องกับ sidebar |
| ปุ่ม 3 (ลอย) | `/dashboard/reception` | `/dashboard/jobs?tab=...` | ตาม role ใหม่ |
| Role visibility | ทุก role เห็น 19 items | **filter ตาม role** | ไม่เห็นสิ่งที่ทำไม่ได้ |
| Badge counts | ❌ ไม่มี | ✅ **งานค้าง, overdue, low stock** | เห็นปัญหาทันที |
| Quick Actions | โปรไฟล์ + ตั้งค่า | ตั้งค่า + แจ้งเตือน + **ออกจากระบบ** | ครบ flow |
| `isActive()` | ตรวจ path อย่างเดียว | **รองรับ query params** | highlight ถูกต้อง |
| Animation | slide-up ธรรมดา | **spring animation** | รู้สึก native |

#### Checklist งานที่ต้องทำ (เรียงลำดับ)

- [ ] อัปเดต `allMenuItems` → 8 items + `allowedRoles` + `badgeKey`
- [ ] อัปเดต `roleNavConfigs` → route ใหม่ทั้ง 6 roles
- [ ] แก้ `isActive()` → รองรับ `?tab=` query params
- [ ] เพิ่ม `NavBadge` component + `loadBadgeCounts()` function
- [ ] แก้ More menu grid → filter ตาม role, แสดง badge
- [ ] เพิ่มปุ่ม "ออกจากระบบ" ใน Quick Actions
- [ ] เปลี่ยน animation เป็น spring (optional)
- [ ] เพิ่ม haptic feedback บนปุ่มกลาง (optional)
- [ ] ทดสอบบน iPhone (safe area) + Android (back button)
- [ ] ทดสอบทุก role ว่าเห็นเมนูถูกต้อง

---

## 5. ฟีเจอร์ที่ออกแบบ Schema แล้วแต่ยังไม่มี UI

### 5.1 E-Commerce/Shop (0% สมบูรณ์)
**Schema** (`database.ts`):
- `ShopSettings`, `ProductCategory`, `Product`, `ProductVariant`
- `ProductReview`, `Order`, `OrderItem`, `Coupon`, `Wishlist`, `ShippingRate`

**สถานะ**: 10 ตาราง schema ครบ, ไม่มี server actions, ไม่มีหน้า, ไม่มี components

**ความสำคัญ**: ต่ำ — เป็นฟีเจอร์ขยาย ยังไม่จำเป็นสำหรับ core business

---

### 5.2 Warranty System (0% สมบูรณ์)
**Schema** (`database.ts`):
- `WarrantyPolicy` (นโยบายรับประกัน)
- `WarrantyRecord` (บันทึกรับประกัน)
- `WarrantyClaim` (เคลมรับประกัน)

**สถานะ**: Schema ครบ 3 ตาราง, ไม่มี server actions, ไม่มีหน้า
`JobType` รองรับ `'warranty'` แล้วแต่ไม่มี workflow

**ความสำคัญ**: **สูง** — ศูนย์บริการรถต้องติดตามการรับประกัน

---

### 5.3 Knowledge Base (0% สมบูรณ์)
**Schema**: `KnowledgeArticle` (title, content, category, tags, author, is_published)

**สถานะ**: Schema 1 ตาราง, ไม่มีอะไรอื่น

**ความสำคัญ**: ต่ำ — nice-to-have สำหรับเก็บความรู้ภายใน

---

### 5.4 Commission System (0% สมบูรณ์)
**Schema**:
- `CommissionRule` (กฎคำนวณค่าคอมมิชชั่น)
- `CommissionRecord` (บันทึกค่าคอม)

**สถานะ**: Schema 2 ตาราง, ไม่มี actions/UI

**ความสำคัญ**: ปานกลาง — จำเป็นสำหรับร้านที่มีระบบค่าคอม

---

### 5.5 Referral Program (0% สมบูรณ์)
**Schema**:
- `ReferralCode` (รหัสแนะนำ)
- `Referral` (บันทึกการแนะนำ)

**สถานะ**: Schema 2 ตาราง, ไม่มี actions/UI

**ความสำคัญ**: ต่ำ — marketing feature

---

### 5.6 Employee Skills/Training (0% สมบูรณ์)
**Schema**: `EmployeeSkill` (skill_name, proficiency_level, certified, certified_at)

**สถานะ**: Schema 1 ตาราง, ไม่มี actions/UI, หน้า Employees ไม่ใช้

**ความสำคัญ**: ปานกลาง — ช่วยมอบหมายงานตามความเชี่ยวชาญ

---

### 5.7 Landing Page Builder & Custom Domains (0% สมบูรณ์)
**Schema**:
- `LandingPage`, `LandingSection` (สร้าง landing page)
- `TenantDomain` (custom domain per tenant)

**สถานะ**: Schema 3 ตาราง, ไม่มี actions/UI

**ความสำคัญ**: ต่ำ — enterprise feature

---

## 6. หน้าที่เป็น Skeleton/ยังไม่สมบูรณ์

### 6.1 Insurance Claims (`/dashboard/insurance`) — 20%
- ✅ แสดง list ใบเคลม
- ❌ ไม่มีฟอร์ม เพิ่ม/แก้ไข เคลม
- ❌ ไม่มีจัดการบริษัทประกัน
- ❌ ไม่มี status update workflow
- ❌ ไม่มี upload เอกสาร

**ต้องทำ**: เพิ่ม CRUD dialog, Insurance Company management, status workflow

---

### 6.2 Service Packages (`/dashboard/service-packages`) — 30%
- ✅ แสดง list แพ็กเกจ
- ⚠️ Actions มีแล้ว (create, update, delete) แต่ UI ไม่ expose
- ❌ ไม่มี dialog เพิ่ม/แก้ไขแพ็กเกจ
- ❌ ไม่มีจัดการ items/parts ในแพ็กเกจ
- ❌ ไม่มี category management

**ต้องทำ**: สร้าง CRUD dialog, package items management, category filter

---

### 6.3 Employees (`/dashboard/employees`) — 20%
- ✅ แสดง list พนักงาน (card grid)
- ❌ ปุ่ม "เพิ่มพนักงาน" ไม่ทำงาน
- ❌ ไม่มี invite/create employee flow
- ❌ ไม่มี edit modal
- ❌ ไม่มี skill/certification tracking
- ❌ ไม่มี commission tracking

**ต้องทำ**: เพิ่ม invite flow, edit dialog, skill management panel

---

### 6.4 Vehicles (`/dashboard/vehicles`) — 50%
- ✅ แสดง list รถพร้อมข้อมูลลูกค้า
- ✅ มี search
- ❌ ไม่มี detail view แบบ standalone
- ❌ ไม่มี edit functionality
- ❌ ไม่มี maintenance history view

**ต้องทำ**: เพิ่ม vehicle detail page, edit dialog, history timeline

---

## 7. แผนปรับปรุง

### Phase 1: Foundation — Refactor Shared Logic (แนะนำทำก่อน)
> ลดความซ้ำซ้อน, ป้องกัน bug, เพิ่มความสะดวกในการพัฒนาต่อ

| # | งาน | ไฟล์ที่สร้าง/แก้ | ผลกระทบ |
|---|------|-----------------|---------|
| 1.1 | สร้าง Auth Helper รวมศูนย์ | สร้าง `src/lib/actions/auth-helpers.ts` แก้ 10+ action files | ลด code ซ้ำ ~200 บรรทัด |
| 1.2 | สร้าง Sequence Number Generator | สร้าง utility function ใน `auth-helpers.ts` | ลด code ซ้ำ ~70 บรรทัด |
| 1.3 | Extract FEFO Stock Logic | สร้าง `src/lib/actions/stock-helpers.ts` | ป้องกัน bug ตัดสต็อก |
| 1.4 | สร้าง Status Config กลาง | สร้าง `src/lib/constants/status-config.ts` | ลด code ซ้ำ ~180 บรรทัด, consistent UI |
| 1.5 | สร้าง Date/Financial Helpers | สร้าง `src/lib/utils/date-helpers.ts` + `financial.ts` | ป้องกัน bug คำนวณ |
| 1.6 | สร้าง Shared UI Components | สร้าง `SearchInput`, `StatCard` components | ลด code ซ้ำ, consistent UX |

**ประมาณ scope**: ~15 ไฟล์ใหม่ + แก้ไข ~25 ไฟล์เดิม

---

### Phase 2: ยุบรวมเมนู 17 → 8 + แก้ Responsive (สำคัญที่สุด)
> ลดเมนูจาก 17 เหลือ 8 โดยยุบหน้าที่แสดงข้อมูลชุดเดียวกัน + แก้ปัญหา mobile

| # | งาน | รายละเอียด | ไฟล์ที่แก้/สร้าง |
|---|------|-----------|-----------------|
| **2.1** | **ยุบ Jobs Workflow → "งานซ่อม" (5 tabs)** | รวม Reception + Queue + Jobs List + Planning + Quotations เป็นหน้าเดียว 5 tabs, role-based default tab | สร้าง `jobs/page.tsx` ใหม่ทั้งหน้า, ย้าย logic จาก reception/queue/planning/quotations |
| **2.2** | **ยุบ Inventory + Service Packages → "คลังอะไหล่" (6 tabs)** | เพิ่ม tab "แพ็กเกจบริการ" ใน Inventory พร้อม CRUD dialog | แก้ `inventory/page.tsx`, สร้าง `components/inventory/package-tab.tsx` |
| **2.3** | **ยุบ Finance + Insurance → "การเงิน" (5 tabs)** | เพิ่ม tab "เคลมประกัน" ใน Finance พร้อม CRUD dialog | แก้ `finance/page.tsx`, สร้าง `components/finance/insurance-tab.tsx` |
| **2.4** | **ยุบ Customers + Vehicles + Reminders → "ลูกค้า"** | ลบ Vehicles จากเมนู (เข้าผ่าน Customer Detail), เพิ่มค้นหาตามทะเบียน, ย้าย Reminders เป็น tab/section | แก้ `customers/page.tsx`, แก้ `customers/[id]/page.tsx` |
| **2.5** | **ยุบ Employees + Time Clock → "ทีมงาน" (3 tabs)** | Members / บันทึกเวลา / สรุปเวลางาน | สร้าง `team/page.tsx` ใหม่, ย้าย logic จาก employees + time-clock |
| **2.6** | **ย้าย Settings + LINE OA ออกจากเมนูหลัก** | เข้าผ่าน gear icon ใน header / user menu | แก้ `sidebar.tsx`, แก้ `header.tsx` |
| **2.7** | **สร้าง Sidebar ใหม่ 8 เมนู + Badge + Role Filter** | Sidebar สะอาด, badge counts, role-based visibility | เขียน `sidebar.tsx` ใหม่, สร้าง `actions/sidebar.ts` สำหรับ badge counts |
| **2.8** | **อัปเดต Bottom Nav (Mobile)** | ปรับให้สอดคล้องกับ menu ใหม่ | แก้ `bottom-nav.tsx` |
| **2.9** | **แก้ Responsive Issues** | Jobs table overflow, Dialog sizes, Tab scroll indicators | แก้ `dialog.tsx`, `part-dialog.tsx`, หน้าต่างๆ |

**ประมาณ scope**: ~8 ไฟล์ใหม่ + ~15 ไฟล์แก้ไข

**ผลลัพธ์**:
```
ก่อน (17 เมนู)           →  หลัง (8 เมนู)
──────────────────           ──────────────────
แดชบอร์ด                     แดชบอร์ด
รับรถ                   ─┐
งานซ่อม                  ├→  งานซ่อม (5 tabs)
ตารางงาน                ─┤
(คิวงาน)                ─┤
(ใบเสนอราคา)            ─┘
ตรวจสภาพรถ                   ตรวจสภาพรถ
อะไหล่                  ─┐
แพ็กเกจบริการ            ─┘→  คลังอะไหล่ (6 tabs)
การเงิน                 ─┐
ประกัน                  ─┘→  การเงิน (5 tabs)
ลูกค้า                  ─┐
รถ                      ─┤→  ลูกค้า
แจ้งเตือนบริการ          ─┘
พนักงาน                 ─┐
บันทึกเวลา              ─┘→  ทีมงาน (3 tabs)
รายงาน                       รายงาน
LINE OA                 ─┐
ตั้งค่า                  ─┘→  (เข้าผ่าน header icon)
```

---

### Phase 3: เติมเต็ม Skeleton Pages — ทำหน้าที่ยุบรวมแล้วให้ครบ
> เมื่อยุบรวมแล้ว ทำส่วนที่ยัง skeleton ให้สมบูรณ์

| # | งาน | ไฟล์ที่สร้าง/แก้ | ผลกระทบ |
|---|------|-----------------|---------|
| 3.1 | **Insurance Tab (ใน Finance)** — CRUD Dialog + Company Management | สร้าง `components/finance/claim-dialog.tsx`, `company-manager.tsx` | จัดการเคลมประกันได้ |
| 3.2 | **Service Packages Tab (ใน Inventory)** — CRUD Dialog + Item Management | สร้าง `components/inventory/package-dialog.tsx`, `package-items.tsx` | จัดการแพ็กเกจได้ |
| 3.3 | **Team/Members Tab** — Invite/Create + Edit Employee | สร้าง `components/team/employee-dialog.tsx` | เพิ่ม/แก้ไขพนักงานได้ |
| 3.4 | **Customer Detail** — เพิ่ม Vehicle Edit + Reminders Section | แก้ `customers/[id]/page.tsx`, สร้าง `components/customers/reminder-section.tsx` | จัดการรถ+แจ้งเตือนในที่เดียว |
| 3.5 | **Customer List** — เพิ่มค้นหาตามทะเบียนรถ | แก้ `customers/page.tsx` | ค้นหารถได้โดยไม่ต้องมีหน้า Vehicles แยก |

**ประมาณ scope**: ~8 ไฟล์ใหม่ + ~4 ไฟล์แก้ไข

---

### Phase 4: Warranty System — ฟีเจอร์ใหม่ที่สำคัญ
> Schema พร้อมแล้ว, เพิ่มเป็น tab ใน "งานซ่อม" หรือหน้าใหม่

| # | งาน | ไฟล์ที่สร้าง | ผลกระทบ |
|---|------|-------------|---------|
| 4.1 | สร้าง Warranty Server Actions | `src/lib/actions/warranty.ts` | CRUD warranty policies/records/claims |
| 4.2 | เพิ่ม Warranty เป็น tab ใน Jobs (หรือหน้าแยก) | แก้ `jobs/page.tsx` หรือสร้าง tab ใหม่ | จัดการรับประกันได้ |
| 4.3 | สร้าง Warranty Dialogs | `components/warranty/policy-dialog.tsx`, `claim-dialog.tsx` | สร้าง/แก้ไขนโยบาย+เคลม |
| 4.4 | เชื่อม Warranty กับ Job Detail | แก้ `jobs/[id]/page.tsx` | งานประเภท warranty มี flow |

**ประมาณ scope**: ~5 ไฟล์ใหม่ + ~2 ไฟล์แก้ไข

---

### Phase 5: Nice-to-Have Features — ฟีเจอร์เสริม
> ทำได้ในอนาคตเมื่อ core สมบูรณ์แล้ว

| # | ฟีเจอร์ | ความสำคัญ | Schema พร้อม | หมายเหตุ |
|---|---------|----------|-------------|---------|
| 5.1 | Employee Skills & Training | ปานกลาง | ✅ | เพิ่มเป็น tab ใน "ทีมงาน" |
| 5.2 | Commission System | ปานกลาง | ✅ | เพิ่มเป็น tab ใน "ทีมงาน" หรือ "การเงิน" |
| 5.3 | Knowledge Base | ต่ำ | ✅ | เก็บความรู้/คู่มือภายใน |
| 5.4 | Referral Program | ต่ำ | ✅ | เพิ่มใน "ลูกค้า" |
| 5.5 | E-Commerce/Shop | ต่ำ | ✅ | ขายอะไหล่ออนไลน์ |
| 5.6 | Landing Page Builder | ต่ำ | ✅ | สร้าง landing page per tenant |
| 5.7 | Custom Domains | ต่ำ | ✅ | โดเมนเฉพาะ per tenant |

---

## 8. สรุปแผนเพื่อตัดสินใจ

### Overview ทั้ง 5 Phase

```
Phase 1: Foundation Refactor     ██████████ ← แนะนำทำก่อน (ลด tech debt, เตรียมฐาน)
Phase 2: ยุบรวมเมนู 17→8        ██████████ ← สำคัญที่สุด (UX ดีขึ้นทันที)
Phase 3: เติมเต็ม Skeleton       ████████   ← ทำทุกหน้าให้ครบ
Phase 4: Warranty System          ██████     ← ฟีเจอร์ใหม่ที่สำคัญ
Phase 5: Nice-to-Have Features    ████████   ← ทำในอนาคต
```

### ตัวเลือกแผนงาน

#### ตัวเลือก A: ทำ Phase 1→2→3→4 ทั้งหมด (แนะนำ)
- ✅ ระบบ clean, ไม่มี tech debt
- ✅ เมนู 8 รายการ สะอาด ไม่ซ้ำซ้อน
- ✅ ทุกหน้าทำงานครบ + responsive
- ✅ Warranty พร้อมใช้
- ⚠️ ขอบเขตงานใหญ่ (~40 ไฟล์)

#### ตัวเลือก B: ทำ Phase 1→2 ก่อน (เร็วที่สุดที่เห็นผล)
- ✅ Code ไม่ซ้ำ + เมนู 8 รายการ
- ✅ ขอบเขตปานกลาง (~30 ไฟล์)
- ⚠️ บาง tab ยัง skeleton (Insurance CRUD, Package CRUD)
- ⚠️ Warranty ยังไม่มี

#### ตัวเลือก C: ทำ Phase 2 อย่างเดียว (Focus เมนู)
- ✅ เห็นผลเร็วที่สุด — เมนูเปลี่ยนทันที
- ✅ ขอบเขตเล็ก (~23 ไฟล์)
- ⚠️ ยังมี code ซ้ำ
- ⚠️ บาง tab ยัง skeleton

#### ตัวเลือก D: เลือกเอง
- เลือกทำเฉพาะ Phase หรือ task ที่ต้องการ

---

### รอการตัดสินใจ

**กรุณาเลือก**:
1. ตัวเลือก A, B, C, หรือ D?
2. มีฟีเจอร์ไหนใน Phase 5 ที่อยากทำก่อน?
3. มี priority พิเศษที่อยากเพิ่ม?
