# KPServicePro - แผนงานสร้างระบบจัดการอู่ซ่อมรถครบวงจร

## สารบัญ
1. [ภาพรวมโปรเจกต์](#1-ภาพรวมโปรเจกต์)
2. [เทคโนโลยีที่ใช้](#2-เทคโนโลยีที่ใช้)
3. [สถาปัตยกรรมระบบ](#3-สถาปัตยกรรมระบบ)
4. [ระบบ Multi-Tenant SaaS](#4-ระบบ-multi-tenant-saas)
5. [การออกแบบ UI/UX](#5-การออกแบบ-uiux)
6. [โมดูลฟีเจอร์ทั้งหมด](#6-โมดูลฟีเจอร์ทั้งหมด)
7. [โครงสร้าง Database](#7-โครงสร้าง-database)
8. [แผนการพัฒนาเป็น Phase](#8-แผนการพัฒนาเป็น-phase)
9. [PWA & Mobile First](#9-pwa--mobile-first)
10. [Security & Performance](#10-security--performance)

---

## 1. ภาพรวมโปรเจกต์

**KPServicePro** คือ SaaS platform สำหรับจัดการอู่ซ่อมรถครบวงจร รองรับ multi-tenant
โดยแต่ละอู่ซ่อมรถจะเป็น tenant แยกกัน สมัครสมาชิกแบบ subscription รายปี

### เป้าหมายหลัก
- ระบบหน้าร้าน (Reception & Job Management)
- ระบบวางแผนการซ่อม (Repair Planning & Scheduling)
- ระบบจัดการอะไหล่ (Parts & Inventory Management)
- ระบบการเงิน (Finance & Accounting)
- ระบบจัดการลูกค้า (CRM - Customer Relationship Management)
- ระบบ Dashboard & Analytics

---

## 2. เทคโนโลยีที่ใช้

| เทคโนโลยี | วัตถุประสงค์ |
|---|---|
| **Next.js 15 (App Router)** | Framework หลัก, SSR/SSG, API Routes |
| **React 19** | UI Library |
| **TypeScript** | Type Safety |
| **Supabase** | Database (PostgreSQL), Auth, Realtime, Storage |
| **TailwindCSS 4** | Styling Framework |
| **shadcn/ui** | UI Component Library (สวยงาม ทันสมัย) |
| **Framer Motion** | Animation & Modal transitions |
| **Zustand** | Client State Management |
| **React Hook Form + Zod** | Form Management & Validation |
| **Vercel** | Hosting & Deployment |
| **next-pwa** | Progressive Web App |
| **Recharts** | Charts & Analytics |
| **date-fns** | Date manipulation (Thai locale) |
| **next-intl** | i18n (ไทย/อังกฤษ) |

### ตาม Vercel Agent Skills Best Practices
- **react-best-practices**: 40+ rules, ลด waterfalls, optimize bundle size, server components
- **web-design-guidelines**: 100+ rules, accessibility, performance, UX, dark mode
- **composition-patterns**: Compound components, state lifting, ลด prop drilling

---

## 3. สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js 15 App Router                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │   Pages/    │  │  API Routes │  │ Middleware│  │  │
│  │  │  App Router │  │  (Server)   │  │ (Auth/   │  │  │
│  │  │  (RSC+CSC)  │  │             │  │  Tenant) │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  Supabase                         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────┐  │  │
│  │  │PostgreSQL│ │   Auth   │ │Realtime│ │Storage│  │  │
│  │  │  (RLS)   │ │          │ │        │ │       │  │  │
│  │  └──────────┘ └──────────┘ └────────┘ └───────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### โครงสร้างโฟลเดอร์
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, register, forgot-password)
│   ├── (marketing)/              # Landing page, pricing, about
│   ├── (dashboard)/              # Protected dashboard area
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard overview
│   │   ├── reception/            # ระบบหน้าร้าน
│   │   ├── jobs/                 # จัดการงานซ่อม
│   │   ├── planning/             # วางแผนการซ่อม
│   │   ├── inventory/            # จัดการอะไหล่
│   │   ├── finance/              # ระบบการเงิน
│   │   ├── customers/            # จัดการลูกค้า
│   │   ├── vehicles/             # จัดการรถ
│   │   ├── employees/            # จัดการพนักงาน
│   │   ├── reports/              # รายงาน & Analytics
│   │   └── settings/             # ตั้งค่าระบบ
│   ├── api/                      # API routes
│   ├── globals.css
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── modals/                   # Modal components (แจ้งเตือน/ยืนยัน)
│   ├── forms/                    # Reusable form components
│   ├── layout/                   # Layout components (Sidebar, Header, etc.)
│   ├── charts/                   # Chart components
│   └── shared/                   # Shared components
├── lib/
│   ├── supabase/                 # Supabase client & helpers
│   ├── utils/                    # Utility functions
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand stores
│   ├── validations/              # Zod schemas
│   └── types/                    # TypeScript types
├── middleware.ts                  # Auth & Tenant middleware
└── i18n/                         # Internationalization (TH/EN)
```

---

## 4. ระบบ Multi-Tenant SaaS

### 4.1 Tenant Isolation Strategy
- ใช้ **Row-Level Security (RLS)** ของ Supabase/PostgreSQL
- ทุก table มี `tenant_id` column
- RLS policies บังคับให้ user เข้าถึงได้เฉพาะข้อมูลของ tenant ตัวเอง

### 4.2 Subscription Plans

| แพลน | รายละเอียด | ราคา/ปี |
|---|---|---|
| **Starter** | 1 สาขา, 3 users, ฟีเจอร์พื้นฐาน | ฿X,XXX |
| **Professional** | 3 สาขา, 10 users, ฟีเจอร์เต็ม | ฿XX,XXX |
| **Enterprise** | ไม่จำกัดสาขา/users, API access, priority support | ฿XXX,XXX |

### 4.3 Subscription Features
- **ระบบทดลองใช้ฟรี** (14 วัน)
- **ระบบต่ออายุอัตโนมัติ**
- **ระบบแจ้งเตือนก่อนหมดอายุ** (30 วัน, 7 วัน, 1 วัน)
- **ระบบ grace period** (หลังหมดอายุยังเข้าดูข้อมูลได้ 7 วัน แต่ไม่สร้างข้อมูลใหม่)
- **ระบบ payment** ผ่าน QR PromptPay / บัตรเครดิต / โอนธนาคาร

### 4.4 User Roles per Tenant
| Role | สิทธิ์ |
|---|---|
| **Owner** | ทุกอย่าง + จัดการ subscription + ลบ tenant |
| **Admin** | ทุกอย่างยกเว้น billing |
| **Manager** | จัดการงาน, ดู reports, จัดการพนักงาน |
| **Technician** | ดู/อัปเดตงานที่ได้รับมอบหมาย |
| **Receptionist** | รับงาน, จัดการลูกค้า, ออกใบเสนอราคา |
| **Viewer** | ดูข้อมูลอย่างเดียว |

---

## 5. การออกแบบ UI/UX

### 5.1 Design System - โทนสี

```
Primary Colors (น้ำเงินเข้ม - ความน่าเชื่อถือ):
  --primary-50:  #eff6ff
  --primary-100: #dbeafe
  --primary-500: #3b82f6
  --primary-600: #2563eb   ← Main Primary
  --primary-700: #1d4ed8
  --primary-900: #1e3a5f

Accent Colors (ส้มทอง - พลังงาน):
  --accent-400:  #fb923c
  --accent-500:  #f97316   ← Main Accent
  --accent-600:  #ea580c

Success (เขียว):  #10b981
Warning (เหลือง): #f59e0b
Error (แดง):      #ef4444
Info (ฟ้า):       #06b6d4

Neutral (เทา):
  --gray-50:  #f8fafc
  --gray-100: #f1f5f9
  --gray-200: #e2e8f0
  --gray-800: #1e293b
  --gray-900: #0f172a

Dark Mode:
  --dark-bg:      #0f172a
  --dark-surface: #1e293b
  --dark-border:  #334155
```

### 5.2 Typography
- **หัวข้อ**: Inter (EN) / Noto Sans Thai (TH)
- **เนื้อหา**: Inter (EN) / Sarabun (TH)
- ขนาด: Mobile-first responsive scale

### 5.3 Modal System (สวยงาม ทันสมัย)

```typescript
// Modal Types ที่จะสร้าง:
1. ConfirmModal       - ถามยืนยันการทำรายการ (ลบ, อนุมัติ, etc.)
2. AlertModal         - แจ้งเตือนทั่วไป (success, error, warning, info)
3. FormModal          - Modal ที่มี form ข้างใน
4. FullScreenModal    - Modal เต็มจอ (สำหรับมือถือ)
5. DrawerModal        - Slide-in จากขวา (สำหรับรายละเอียด)
6. ToastNotification  - แจ้งเตือนมุมจอ (auto-dismiss)
7. CommandPalette     - ⌘K search modal

// Features:
- Framer Motion animations (fade, scale, slide)
- Backdrop blur effect
- Keyboard shortcuts (Esc to close, Enter to confirm)
- Focus trap (accessibility)
- Stacked modals support
- Mobile: bottom sheet style
```

### 5.4 Layout Design
- **Sidebar** แบบ collapsible (icon-only mode สำหรับจอเล็ก)
- **Top bar** มี search, notifications, user menu
- **Breadcrumb** navigation
- **Tab navigation** ภายในแต่ละโมดูล
- **Floating Action Button (FAB)** บนมือถือ

---

## 6. โมดูลฟีเจอร์ทั้งหมด

### 📋 Module 1: ระบบหน้าร้าน (Reception)

#### 1.1 รับรถเข้าซ่อม (Vehicle Check-in)
- ฟอร์มรับรถ: ข้อมูลลูกค้า, ข้อมูลรถ, อาการเสีย
- ถ่ายรูปรถก่อนซ่อม (กล้องมือถือ / upload)
- บันทึกสภาพรถ (body diagram - จุดที่มีรอย)
- เลือกประเภทงาน: ซ่อม / บำรุงรักษา / ตรวจเช็ค / ประกัน / อื่นๆ
- ลงนาม digital signature ของลูกค้า
- พิมพ์ใบรับรถ / ส่ง SMS/Line แจ้งลูกค้า
- QR Code สำหรับลูกค้าติดตามสถานะ

#### 1.2 ใบเสนอราคา (Quotation)
- สร้างใบเสนอราคาอัตโนมัติจาก job
- เพิ่ม/ลบ รายการค่าแรง + อะไหล่
- คำนวณภาษีมูลค่าเพิ่ม (VAT 7%)
- ส่วนลด (เปอร์เซ็นต์ / จำนวนเงิน)
- ส่งใบเสนอราคาให้ลูกค้าอนุมัติ (Email/Line/SMS)
- ลูกค้าอนุมัติออนไลน์ (digital approval)
- แปลงเป็น Job Order เมื่อลูกค้าอนุมัติ
- ประวัติ version ของใบเสนอราคา

#### 1.3 Job Order Management
- สร้าง Job Order จากใบเสนอราคาที่อนุมัติแล้ว
- กำหนดช่างรับผิดชอบ
- กำหนด priority (ด่วน / ปกติ / รอได้)
- ตั้ง estimated completion date
- สถานะ job: รอดำเนินการ → กำลังซ่อม → รอตรวจสอบ → รอลูกค้ารับ → เสร็จ
- Timeline แสดงประวัติการดำเนินงาน
- แนบรูป/วิดีโอระหว่างซ่อม
- แจ้งเตือนเมื่อสถานะเปลี่ยน

#### 1.4 คิวรอ (Queue Board)
- Kanban board แสดง job ทั้งหมดตามสถานะ
- Drag & drop เปลี่ยนสถานะ
- กรองตาม: ช่าง, ประเภทงาน, priority, วันที่
- แสดงจำนวนวันที่ค้างในแต่ละสถานะ
- มุมมอง: Kanban / List / Calendar

### 🔧 Module 2: ระบบวางแผนการซ่อม (Repair Planning)

#### 2.1 Scheduling & Calendar
- ปฏิทินรายวัน/สัปดาห์/เดือน แสดง job ทั้งหมด
- จัดตารางช่าง (Technician Scheduler)
- กำหนด bay/lift ที่จะใช้
- ป้องกัน double booking
- แสดง workload ของช่างแต่ละคน
- Drag & drop ย้ายงาน
- สีตาม priority / ประเภทงาน

#### 2.2 Repair Checklist & Templates
- สร้าง template checklist ตามประเภทงาน
  - เช็คระยะ 10,000 km
  - เปลี่ยนน้ำมันเครื่อง
  - ซ่อมเบรค
  - ซ่อมช่วงล่าง
  - งานสี/ตัวถัง
  - ซ่อมเครื่องยนต์
  - ซ่อมระบบไฟฟ้า
  - ซ่อมแอร์
- ช่างเช็คเครื่องหมาย ✓ ทีละรายการ
- แนบรูปถ่ายในแต่ละ checklist item
- หมายเหตุ/comment ในแต่ละ item

#### 2.3 เวลาทำงาน (Time Tracking)
- ช่าง clock-in/clock-out แต่ละ job
- คำนวณเวลาจริงที่ใช้ vs เวลาที่ประมาณ
- รายงานประสิทธิภาพช่าง
- รายงาน utilization rate

#### 2.4 การตรวจสอบคุณภาพ (QC - Quality Control)
- Checklist QC ก่อนส่งมอบ
- ผู้ตรวจสอบ sign-off
- ถ่ายรูปหลังซ่อมเสร็จ
- เปรียบเทียบ before/after

### 📦 Module 3: ระบบจัดการอะไหล่ (Parts & Inventory)

#### 3.1 คลังอะไหล่ (Parts Catalog)
- รายการอะไหล่ทั้งหมด
- หมวดหมู่ (category / subcategory)
- รหัสอะไหล่ (Part Number / SKU)
- รูปภาพอะไหล่
- ข้อมูล: ชื่อ, ยี่ห้อ, รุ่นรถที่ใช้ได้, ราคาทุน, ราคาขาย
- Barcode / QR Code scan
- ค้นหาและ filter ขั้นสูง
- สถานะ: มีสต็อก / ใกล้หมด / หมด / สั่งแล้ว

#### 3.2 การจัดการสต็อก (Stock Management)
- รับสินค้าเข้า (Goods Receiving)
- เบิกอะไหล่ใช้ในงาน (Issue to Job)
- คืนอะไหล่ (Return to Stock)
- ปรับยอดสต็อก (Stock Adjustment)
- นับสต็อก (Stock Count / Stocktake)
- ประวัติการเคลื่อนไหว (Stock Movement History)
- ตั้งจุดสั่งซื้อ (Reorder Point)
- ตั้งจำนวนสั่งซื้อขั้นต่ำ (Min Order Quantity)

#### 3.3 การสั่งซื้อ (Purchase Orders)
- สร้างใบสั่งซื้อ (PO)
- รายการ supplier
- เปรียบเทียบราคาจาก supplier หลายราย
- อนุมัติ PO (workflow approval)
- ติดตามสถานะ PO
- รับสินค้าตาม PO (partial / full receiving)
- บันทึกใบกำกับภาษีจาก supplier

#### 3.4 การแจ้งเตือนสต็อก
- แจ้งเตือนเมื่อสต็อกต่ำกว่า reorder point
- แจ้งเตือนอะไหล่หมดอายุ
- แจ้งเตือนอะไหล่ไม่เคลื่อนไหวนาน (dead stock)
- สร้าง PO อัตโนมัติเมื่อสต็อกต่ำ (auto-reorder)

### 💰 Module 4: ระบบการเงิน (Finance)

#### 4.1 ใบแจ้งหนี้ (Invoice)
- สร้างใบแจ้งหนี้จาก Job Order
- รายละเอียดค่าแรง + อะไหล่ + ค่าบริการอื่นๆ
- ภาษีมูลค่าเพิ่ม (VAT)
- ส่วนลด
- ส่ง invoice ทาง Email/Line
- พิมพ์ invoice (PDF)
- Duplicate / Credit Note

#### 4.2 ใบเสร็จรับเงิน (Receipt)
- สร้างใบเสร็จเมื่อรับชำระ
- ช่องทางชำระ: เงินสด / โอน / บัตรเครดิต / QR PromptPay
- รับชำระบางส่วน (Partial Payment)
- ประวัติการชำระเงินทั้งหมด

#### 4.3 ค่าใช้จ่าย (Expenses)
- บันทึกค่าใช้จ่ายทั่วไป (ค่าน้ำ/ไฟ/เช่า/เงินเดือน)
- หมวดหมู่ค่าใช้จ่าย
- แนบหลักฐาน (ใบเสร็จ/ใบกำกับภาษี)
- ระบบอนุมัติค่าใช้จ่าย

#### 4.4 รายงานการเงิน
- **รายรับ-รายจ่ายรายวัน** (Daily Cash Flow)
- **สรุปยอดรายเดือน** (Monthly Summary)
- **รายงานกำไรขาดทุน** (P&L Report)
- **รายงานลูกหนี้** (Accounts Receivable - AR)
- **รายงานเจ้าหนี้** (Accounts Payable - AP)
- **รายงานภาษี** (Tax Report)
- Export เป็น Excel / PDF

#### 4.5 การชำระเงินออนไลน์
- QR PromptPay generation
- Slip verification (ตรวจสอบสลิปโอนเงิน)
- Integration กับ payment gateway (ในอนาคต)

### 👥 Module 5: ระบบจัดการลูกค้า (CRM)

#### 5.1 ข้อมูลลูกค้า (Customer Profile)
- ข้อมูลพื้นฐาน: ชื่อ, เบอร์โทร, Email, Line ID, ที่อยู่
- ประเภทลูกค้า: บุคคล / นิติบุคคล / ประกัน
- ประวัติการใช้บริการทั้งหมด
- รถทั้งหมดของลูกค้า
- ยอดค่าใช้จ่ายสะสม
- หมายเหตุพิเศษ (เช่น VIP, เครดิต 30 วัน)
- คะแนนสะสม (Loyalty Points)

#### 5.2 ข้อมูลรถ (Vehicle Profile)
- ข้อมูลรถ: ยี่ห้อ, รุ่น, ปี, สี, ทะเบียน, เลขตัวถัง (VIN)
- ประวัติการซ่อมทั้งหมด
- ตารางบำรุงรักษา (Maintenance Schedule)
- แจ้งเตือนเมื่อถึงกำหนดเช็คระยะ
- แจ้งเตือน พ.ร.บ. / ประกัน หมดอายุ
- เลขไมล์ล่าสุด

#### 5.3 การสื่อสาร (Communication)
- ส่ง SMS แจ้งสถานะงาน
- ส่ง Line Notify
- ส่ง Email (invoice, receipt, status update)
- Template ข้อความสำเร็จรูป
- ประวัติการสื่อสารทั้งหมด

#### 5.4 Loyalty & Promotions
- ระบบสะสมคะแนน
- คูปองส่วนลด
- โปรโมชั่นตามฤดูกาล
- ส่ง campaign ให้ลูกค้า (Birthday, ครบรอบ, etc.)

#### 5.5 Customer Self-Service Portal
- ลูกค้าดูสถานะงานผ่าน QR Code / Link
- ลูกค้าอนุมัติใบเสนอราคาออนไลน์
- ลูกค้าดูประวัติการซ่อม
- ลูกค้าจองคิวซ่อมออนไลน์

### 👨‍💼 Module 6: ระบบจัดการพนักงาน (Employee Management)

#### 6.1 ข้อมูลพนักงาน
- โปรไฟล์: ชื่อ, ตำแหน่ง, ความเชี่ยวชาญ, เบอร์โทร
- สิทธิ์การเข้าถึง (Role-based)
- ตารางทำงาน
- วันหยุด/ลา

#### 6.2 ผลงาน (Performance)
- จำนวนงานที่ทำสำเร็จ
- เวลาเฉลี่ยต่องาน
- คะแนนคุณภาพ (QC pass rate)
- Commission / ค่าแรงตาม job

### 📊 Module 7: Dashboard & Analytics

#### 7.1 Dashboard หน้าหลัก
- **สรุปวันนี้**: งานใหม่, งานระหว่างดำเนินการ, งานเสร็จ, รายรับวันนี้
- **กราฟรายรับ** 7 วันย้อนหลัง (Bar chart)
- **สถานะ jobs** (Donut chart)
- **อะไหล่ใกล้หมด** (Alert list)
- **ตารางงานวันนี้** (Timeline)
- **ลูกค้ารอรับรถ** (List)
- **Top 5 บริการยอดนิยม**
- **KPI Cards**: รายรับเดือนนี้, จำนวนงานเดือนนี้, ลูกค้าใหม่, อัตราลูกค้ากลับมาใช้บริการ

#### 7.2 Reports
- รายงานรายรับ-รายจ่าย (วัน/สัปดาห์/เดือน/ปี)
- รายงานยอดขายอะไหล่
- รายงานประสิทธิภาพช่าง
- รายงานความถี่ประเภทงานซ่อม
- รายงานลูกค้ากลับมาใช้บริการ
- รายงานอะไหล่ขายดี / dead stock
- รายงานเปรียบเทียบ month-over-month
- Custom report builder (เลือกเงื่อนไขเอง)

### ⚙️ Module 8: ระบบตั้งค่า (Settings)

#### 8.1 ข้อมูลอู่ (Shop Profile)
- ชื่ออู่, โลโก้, ที่อยู่, เบอร์โทร, เลขผู้เสียภาษี
- เวลาเปิด-ปิด
- จำนวน bay/lift
- ข้อมูลบัญชีธนาคาร

#### 8.2 Customization
- ตั้งค่าลำดับเลขที่เอกสาร (Running Number)
- ตั้งค่ารายการค่าแรงมาตรฐาน (Labor Rates)
- ตั้งค่าประเภทงาน
- ตั้งค่าสถานะ job (custom statuses)
- ตั้งค่า warranty terms
- ตั้งค่าข้อความ template

#### 8.3 Subscription & Billing
- ดูแพลนปัจจุบัน
- อัปเกรด/ดาวน์เกรด แพลน
- ประวัติการชำระค่าบริการ
- ใบเสร็จค่าสมาชิก

---

## 7. โครงสร้าง Database (Supabase/PostgreSQL)

### Core Tables

```sql
-- Multi-tenant
tenants (id, name, slug, logo_url, address, phone, tax_id, settings, subscription_plan, subscription_status, subscription_expires_at, created_at)

-- Auth & Users
users (id, email, full_name, avatar_url, phone, tenant_id, role, is_active, created_at)

-- Customers
customers (id, tenant_id, customer_type, name, company_name, phone, email, line_id, address, tax_id, notes, loyalty_points, created_at)

-- Vehicles
vehicles (id, tenant_id, customer_id, license_plate, brand, model, year, color, vin, engine_number, mileage, insurance_expiry, act_expiry, notes, created_at)
vehicle_photos (id, vehicle_id, photo_url, photo_type, created_at)

-- Jobs
jobs (id, tenant_id, job_number, vehicle_id, customer_id, assigned_to, job_type, priority, status, description, estimated_hours, actual_hours, estimated_completion, actual_completion, total_labor, total_parts, total_amount, discount, vat, grand_total, notes, created_at)
job_items (id, job_id, item_type, description, quantity, unit_price, discount, total, part_id, created_at)
job_status_history (id, job_id, from_status, to_status, changed_by, notes, created_at)
job_photos (id, job_id, photo_url, photo_type, caption, created_at)
job_checklists (id, job_id, template_id, created_at)
job_checklist_items (id, checklist_id, description, is_checked, checked_by, photo_url, notes, sort_order, created_at)

-- Time Tracking
time_entries (id, job_id, user_id, tenant_id, clock_in, clock_out, duration_minutes, notes, created_at)

-- Quotations
quotations (id, tenant_id, quotation_number, job_id, customer_id, vehicle_id, status, items, total_labor, total_parts, discount, vat, grand_total, valid_until, approved_at, approved_by, version, created_at)

-- Inventory
parts (id, tenant_id, sku, name, description, category_id, brand, unit, cost_price, selling_price, stock_quantity, reorder_point, min_order_qty, location, barcode, image_url, is_active, created_at)
part_categories (id, tenant_id, name, parent_id, created_at)
stock_movements (id, tenant_id, part_id, movement_type, quantity, reference_type, reference_id, unit_cost, notes, created_by, created_at)

-- Purchase Orders
purchase_orders (id, tenant_id, po_number, supplier_id, status, total_amount, notes, approved_by, approved_at, received_at, created_at)
po_items (id, po_id, part_id, quantity, unit_cost, received_quantity, created_at)
suppliers (id, tenant_id, name, contact_person, phone, email, address, tax_id, payment_terms, notes, created_at)

-- Finance
invoices (id, tenant_id, invoice_number, job_id, customer_id, status, subtotal, discount, vat, total, due_date, paid_at, created_at)
payments (id, tenant_id, invoice_id, payment_method, amount, reference_number, slip_url, notes, received_by, created_at)
expenses (id, tenant_id, expense_number, category, description, amount, receipt_url, approved_by, approved_at, expense_date, created_at)

-- Communication
notifications (id, tenant_id, user_id, title, message, type, is_read, link, created_at)
communication_logs (id, tenant_id, customer_id, channel, message, status, sent_at, created_at)

-- Settings
checklist_templates (id, tenant_id, name, job_type, items, is_active, created_at)
labor_rates (id, tenant_id, name, description, rate, job_type, created_at)
document_sequences (id, tenant_id, document_type, prefix, next_number, created_at)

-- Subscription
subscription_history (id, tenant_id, plan, amount, payment_method, payment_reference, started_at, expires_at, created_at)
```

### Row-Level Security (RLS) Policy Pattern
```sql
-- ทุก table ใช้ pattern เดียวกัน:
CREATE POLICY "tenant_isolation" ON table_name
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

---

## 8. แผนการพัฒนาเป็น Phase

### Phase 1: Foundation (สัปดาห์ 1-2)
> โครงสร้างพื้นฐาน, Auth, Multi-tenant

- [ ] สร้างโปรเจกต์ Next.js 15 + TypeScript + TailwindCSS
- [ ] ติดตั้งและ config shadcn/ui
- [ ] ตั้งค่า Supabase project + Database schema
- [ ] ระบบ Auth (Login, Register, Forgot Password)
- [ ] Multi-tenant middleware
- [ ] RLS policies
- [ ] Layout หลัก (Sidebar, Header, Responsive)
- [ ] Modal system (ConfirmModal, AlertModal, ToastNotification)
- [ ] Dark mode toggle
- [ ] PWA setup (manifest, service worker)
- [ ] i18n setup (TH/EN)

### Phase 2: Core - Reception & Jobs (สัปดาห์ 3-4)
> ระบบหน้าร้านหลัก

- [ ] Customer CRUD
- [ ] Vehicle CRUD
- [ ] Job creation flow (รับรถ → ใบเสนอราคา → Job Order)
- [ ] Quotation management
- [ ] Job board (Kanban view)
- [ ] Job detail page + status management
- [ ] Photo upload (vehicle/job photos)
- [ ] Document number generation

### Phase 3: Repair Planning (สัปดาห์ 5-6)
> ระบบวางแผนและจัดการการซ่อม

- [ ] Calendar view (day/week/month)
- [ ] Technician scheduling
- [ ] Checklist templates CRUD
- [ ] Job checklists with photo
- [ ] Time tracking (clock-in/out)
- [ ] QC workflow
- [ ] Bay/Lift management

### Phase 4: Inventory (สัปดาห์ 7-8)
> ระบบจัดการอะไหล่

- [ ] Parts catalog CRUD
- [ ] Part categories
- [ ] Stock management (receive, issue, adjust, count)
- [ ] Stock movement history
- [ ] Supplier management
- [ ] Purchase orders (create, approve, receive)
- [ ] Low stock alerts
- [ ] Barcode/QR support

### Phase 5: Finance (สัปดาห์ 9-10)
> ระบบการเงิน

- [ ] Invoice generation from job
- [ ] Payment recording (multiple methods)
- [ ] Receipt generation
- [ ] Expense tracking
- [ ] Daily cash report
- [ ] Monthly P&L report
- [ ] AR/AP reports
- [ ] PDF generation
- [ ] QR PromptPay

### Phase 6: CRM & Communication (สัปดาห์ 11-12)
> ระบบลูกค้าสัมพันธ์

- [ ] Customer portal (status tracking via QR)
- [ ] Online quotation approval
- [ ] Online booking
- [ ] Notification system (in-app, email)
- [ ] Maintenance reminders
- [ ] Insurance/Act expiry alerts
- [ ] Loyalty points system
- [ ] SMS/Line integration

### Phase 7: Dashboard & Analytics (สัปดาห์ 13)
> รายงานและ Dashboard

- [ ] Main dashboard with KPI cards
- [ ] Revenue charts
- [ ] Job statistics charts
- [ ] Technician performance reports
- [ ] Inventory reports
- [ ] Customer analytics
- [ ] Export to Excel/PDF

### Phase 8: SaaS & Polish (สัปดาห์ 14-15)
> ระบบ subscription และปรับแต่ง

- [ ] Landing page / Marketing site
- [ ] Pricing page
- [ ] Subscription management
- [ ] Payment for subscription (QR/Transfer)
- [ ] Trial period logic
- [ ] Subscription renewal & reminders
- [ ] Settings page (shop profile, customization)
- [ ] User management (invite, roles)
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Final testing & bug fixes

---

## 9. PWA & Mobile First

### Progressive Web App
- **Service Worker**: Offline caching strategy (stale-while-revalidate)
- **Manifest**: App icon, splash screen, theme color
- **Install prompt**: แจ้งเตือนให้ติดตั้ง app
- **Offline support**: ดูข้อมูลที่แคชไว้ได้แม้ไม่มี internet
- **Push notifications**: แจ้งเตือนงานใหม่, สถานะเปลี่ยน
- **Camera access**: ถ่ายรูปจาก browser

### Mobile First Design Principles
- Touch-friendly: ปุ่มขั้นต่ำ 44x44px
- Bottom navigation สำหรับ mobile
- Swipe gestures (swipe to change status)
- Pull-to-refresh
- Infinite scroll สำหรับ lists
- Full-screen modals (bottom sheet) บนมือถือ
- Floating Action Button (FAB)
- Responsive breakpoints: 320px / 640px / 768px / 1024px / 1280px

---

## 10. Security & Performance

### Security
- Supabase Auth (JWT) + RLS
- CSRF protection (Next.js built-in)
- Rate limiting on API routes
- Input sanitization (Zod validation)
- File upload validation (type, size)
- Content Security Policy headers
- HTTPS only (Vercel default)
- Audit log (ใครทำอะไร เมื่อไหร่)

### Performance (ตาม react-best-practices)
- **Server Components** เป็นหลัก (ลด JS bundle)
- **Streaming SSR** สำหรับหน้าที่ load ช้า
- **Dynamic imports** สำหรับ components ที่ไม่จำเป็นทันที
- **Image optimization** (next/image)
- **Font optimization** (next/font)
- **Parallel data fetching** (ไม่ waterfall)
- **Optimistic updates** (UI ตอบสนองทันที)
- **Realtime subscriptions** (Supabase Realtime) สำหรับ job board
- **Pagination** + **Virtual scrolling** สำหรับรายการยาว
- **Edge middleware** สำหรับ auth check

---

## สรุป Feature Highlights

| # | Feature | รายละเอียด |
|---|---------|-----------|
| 1 | 🏪 Reception | รับรถ, ใบเสนอราคา, Job Order, คิวรอ |
| 2 | 🔧 Repair Planning | Calendar, Scheduling, Checklist, QC, Time Tracking |
| 3 | 📦 Inventory | คลังอะไหล่, Stock, PO, Supplier, Alerts |
| 4 | 💰 Finance | Invoice, Receipt, Expense, P&L, Tax Report |
| 5 | 👥 CRM | Customer, Vehicle, Communication, Loyalty |
| 6 | 👨‍💼 Employees | Profile, Performance, Commission |
| 7 | 📊 Dashboard | KPI, Charts, Reports, Export |
| 8 | ⚙️ Settings | Shop Profile, Customization, Subscription |
| 9 | 📱 PWA | Offline, Push Notification, Camera, Install |
| 10 | 🌐 SaaS | Multi-tenant, Subscription, Billing, Plans |
| 11 | 🔐 Security | RLS, Auth, Audit Log, Validation |
| 12 | 🎨 UI/UX | Dark Mode, Modal System, Responsive, i18n |

---

*แผนนี้ออกแบบตามหลัก Vercel Agent Skills: react-best-practices (40+ rules), web-design-guidelines (100+ rules), composition-patterns*
