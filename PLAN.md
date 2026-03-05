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
│   │   ├── shop-manage/          # [Premium] จัดการร้านค้าออนไลน์
│   │   │   ├── products/         # จัดการสินค้า
│   │   │   ├── orders/           # จัดการคำสั่งซื้อ
│   │   │   ├── coupons/          # คูปองส่วนลด
│   │   │   ├── shipping/         # ตั้งค่าจัดส่ง
│   │   │   └── analytics/        # รายงานยอดขาย
│   │   ├── landing-manage/       # [Premium] จัดการ Landing Page
│   │   │   ├── editor/           # Drag & drop page builder
│   │   │   ├── seo/              # ตั้งค่า SEO
│   │   │   └── domain/           # ตั้งค่า Custom Domain
│   │   └── settings/             # ตั้งค่าระบบ
│   ├── (public-shop)/            # [Premium] หน้าร้านออนไลน์สาธารณะ
│   │   ├── shop/                 # หน้าร้าน Shop
│   │   │   ├── page.tsx          # Shop home
│   │   │   ├── [category]/       # หมวดหมู่สินค้า
│   │   │   ├── product/[slug]/   # หน้ารายละเอียดสินค้า
│   │   │   ├── cart/             # ตะกร้าสินค้า
│   │   │   ├── checkout/         # Checkout flow
│   │   │   └── orders/           # ประวัติคำสั่งซื้อ (ลูกค้า)
│   │   └── [...slug]/            # Landing Page (dynamic sections)
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

### 4.2 Subscription Plans (2 แพ็คเกจ)

| ฟีเจอร์ | **Pro** | **Premium** |
|---|---|---|
| **ราคา/ปี** | ฿X,XXX | ฿XX,XXX |
| **สาขา** | 1 สาขา | ไม่จำกัด |
| **Users** | 10 users | ไม่จำกัด |
| **ระบบหน้าร้าน** | ✅ เต็ม | ✅ เต็ม |
| **วางแผนการซ่อม** | ✅ เต็ม | ✅ เต็ม |
| **จัดการอะไหล่** | ✅ เต็ม | ✅ เต็ม |
| **ระบบการเงิน** | ✅ เต็ม | ✅ เต็ม |
| **CRM ลูกค้า** | ✅ เต็ม | ✅ เต็ม |
| **Dashboard & Reports** | ✅ เต็ม | ✅ เต็ม |
| **PWA & Mobile** | ✅ | ✅ |
| **Dark Mode / i18n** | ✅ | ✅ |
| **โดเมนเฉพาะร้าน** | ❌ ใช้ subdomain (shop.kpservicepro.com) | ✅ Custom domain (www.myshop.com) |
| **Landing Page ร้าน** | ❌ | ✅ สร้าง Landing Page สวยงามเฉพาะร้าน |
| **ร้านค้าออนไลน์ (Shop)** | ❌ | ✅ ขายอะไหล่/สินค้าให้ลูกค้าออนไลน์ |
| **SEO สำหรับร้าน** | ❌ | ✅ Meta tags, OG, Sitemap, Schema.org |
| **API Access** | ❌ | ✅ REST API สำหรับ integration |
| **Priority Support** | ❌ | ✅ ช่องทางพิเศษ |
| **Branding** | KPServicePro watermark | ✅ White-label (ใช้โลโก้ร้านเอง) |

#### Pro Plan - ระบบจัดการอู่ซ่อมรถครบวงจร
- ทุกฟีเจอร์หลักของระบบจัดการอู่ซ่อม
- Subdomain: `yourshop.kpservicepro.com`
- Customer self-service portal (ดูสถานะงาน, อนุมัติใบเสนอราคา)
- เหมาะสำหรับอู่ซ่อมรถทั่วไปที่ต้องการระบบจัดการครบวงจร

#### Premium Plan - ระบบครบ + โดเมนเฉพาะ + ร้านค้าออนไลน์
- ทุกอย่างใน Pro +
- **Custom Domain**: ใช้โดเมนของร้านเอง (เช่น www.mygarage.com)
- **Landing Page Builder**: สร้างหน้าเว็บร้านสวยงาม แสดงบริการ, ราคา, รีวิว, แผนที่
- **Online Shop (E-Commerce)**: ขายอะไหล่/สินค้า/ผลิตภัณฑ์ดูแลรถให้ลูกค้าได้
- **White-label**: ไม่มี KPServicePro branding, ใช้โลโก้ร้านทั้งหมด
- เหมาะสำหรับอู่ซ่อมรถที่ต้องการมี digital presence ครบวงจร

### 4.3 Custom Domain Architecture (Premium)

```
┌──────────────────────────────────────────────────┐
│                  Vercel Platform                  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │           Next.js Middleware               │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  Request: www.mygarage.com           │  │  │
│  │  │  → lookup tenant by custom_domain    │  │  │
│  │  │  → resolve tenant_id                 │  │  │
│  │  │  → route to tenant's public site     │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  Request: shop.kpservicepro.com      │  │  │
│  │  │  → lookup tenant by subdomain        │  │  │
│  │  │  → resolve tenant_id                 │  │  │
│  │  │  → route to tenant's dashboard       │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Vercel Domains API → Add/verify custom domains  │
└──────────────────────────────────────────────────┘
```

- ใช้ **Vercel Domains API** สำหรับเพิ่ม/ลบ custom domain แบบ programmatic
- Middleware ตรวจสอบ hostname → map ไปยัง tenant
- SSL certificate อัตโนมัติผ่าน Vercel (Let's Encrypt)
- DNS: ลูกค้าชี้ CNAME → `cname.kpservicepro.com`

### 4.4 Subscription Features
- **ระบบทดลองใช้ฟรี** (14 วัน - ทดลองแพลน Pro)
- **ระบบต่ออายุอัตโนมัติ**
- **ระบบแจ้งเตือนก่อนหมดอายุ** (30 วัน, 7 วัน, 1 วัน)
- **ระบบ grace period** (หลังหมดอายุยังเข้าดูข้อมูลได้ 7 วัน แต่ไม่สร้างข้อมูลใหม่)
- **ระบบ payment** ผ่าน QR PromptPay / บัตรเครดิต / โอนธนาคาร
- **อัปเกรด Pro → Premium** ได้ทุกเมื่อ (คิดส่วนต่างตามวันที่เหลือ)

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

#### 1.2 ระบบเคลมประกัน (Insurance Claim Management) ⭐ NEW
- เลือกบริษัทประกัน จากรายการที่ตั้งไว้
- บันทึกเลขกรมธรรม์ + วันหมดอายุ
- ถ่ายรูปความเสียหายตามข้อกำหนดประกัน (มุมมาตรฐาน)
- สร้างใบประเมินราคาส่งประกัน (แยกค่าแรง/ค่าอะไหล่ตาม format ประกัน)
- ติดตามสถานะเคลม: ส่งเคลม → รออนุมัติ → อนุมัติแล้ว → เบิกเงินแล้ว
- บันทึกยอดที่ประกันอนุมัติ vs ยอดจริง (ส่วนต่างเก็บลูกค้า)
- แจ้งเตือนเคลมค้าง / รอติดตาม
- รายงานยอดเคลมรายเดือนแยกตามบริษัทประกัน
- รายการบริษัทประกันคู่สัญญา + เงื่อนไข + contact person

#### 1.3 ใบเสนอราคา (Quotation)
- สร้างใบเสนอราคาอัตโนมัติจาก job
- เพิ่ม/ลบ รายการค่าแรง + อะไหล่
- คำนวณภาษีมูลค่าเพิ่ม (VAT 7%)
- ส่วนลด (เปอร์เซ็นต์ / จำนวนเงิน)
- ส่งใบเสนอราคาให้ลูกค้าอนุมัติ (Email/Line/SMS)
- ลูกค้าอนุมัติออนไลน์ (digital approval)
- แปลงเป็น Job Order เมื่อลูกค้าอนุมัติ
- ประวัติ version ของใบเสนอราคา

#### 1.4 แจ้งพบปัญหาเพิ่มระหว่างซ่อม (Additional Work Request) ⭐ NEW
- ช่างพบปัญหาเพิ่มเติมระหว่างซ่อม → แจ้งผ่านระบบพร้อมรูปถ่าย/วิดีโอ
- ระบบสร้าง "ใบเสนอราคาเพิ่มเติม" อัตโนมัติ
- ส่งแจ้งลูกค้าทันที (Line/SMS) พร้อมรูปประกอบ
- ลูกค้าอนุมัติ/ปฏิเสธ ออนไลน์ ทีละรายการได้
- ถ้าอนุมัติ → เพิ่มเข้า Job Order + อัปเดตใบเสนอราคา อัตโนมัติ
- บันทึกประวัติ "สิ่งที่ลูกค้าปฏิเสธ" ไว้แนะนำครั้งหน้า

#### 1.5 Job Order Management
- สร้าง Job Order จากใบเสนอราคาที่อนุมัติแล้ว
- กำหนดช่างรับผิดชอบ
- กำหนด priority (ด่วน / ปกติ / รอได้)
- ตั้ง estimated completion date
- สถานะ job: รอดำเนินการ → กำลังซ่อม → รอตรวจสอบ → รอลูกค้ารับ → เสร็จ
- Timeline แสดงประวัติการดำเนินงาน
- แนบรูป/วิดีโอระหว่างซ่อม
- แจ้งเตือนเมื่อสถานะเปลี่ยน

#### 1.6 ระบบรับประกันงานซ่อม (Warranty Tracking) ⭐ NEW
- ตั้งระยะประกันงานซ่อมแต่ละประเภท (เช่น ซ่อมเครื่อง 6 เดือน, งานสี 1 ปี)
- ตั้งระยะประกันอะไหล่ (ตาม supplier/ยี่ห้อ)
- เมื่อลูกค้ากลับมา → ระบบแจ้งอัตโนมัติว่า job เดิมยังอยู่ในประกันหรือไม่
- สร้าง Warranty Claim job (ไม่คิดเงินลูกค้า)
- เคลมกลับ supplier ถ้าอะไหล่เสียในประกัน
- รายงาน warranty claim rate (วัดคุณภาพงาน)

#### 1.7 คิวรอ (Queue Board)
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

#### 2.3 Digital Vehicle Inspection (DVI) - ใบตรวจสภาพรถดิจิทัล ⭐ NEW
- **ตรวจสภาพรถรอบคัน** แบบมาตรฐาน (ไม่ใช่แค่จุดที่ลูกค้าแจ้ง)
- ระบบ traffic light: 🟢 ดี / 🟡 ควรเปลี่ยนเร็วๆนี้ / 🔴 ต้องซ่อมทันที
- หมวดตรวจ:
  - เบรค (ผ้าเบรค%, จานเบรค, น้ำมันเบรค)
  - ยาง (ดอกยาง mm, สภาพ, แรงดันลม)
  - ช่วงล่าง (ลูกหมากปีกนก, โช้คอัพ, บุชยาง)
  - ระบบไฟ (ไฟหน้า, ไฟเบรค, ไฟเลี้ยว, ไฟภายใน)
  - ของเหลว (น้ำมันเครื่อง, น้ำหล่อเย็น, น้ำมันเกียร์, น้ำมันพวงมาลัย)
  - แบตเตอรี่ (แรงดัน, สภาพ)
  - สายพาน, ท่อยาง, filter ต่างๆ
  - ใบปัดน้ำฝน, กระจก
- ช่างถ่ายรูป/วิดีโอ ทุกจุดที่ตรวจ
- **สร้าง "Vehicle Health Report" ส่งลูกค้า** (หน้าเว็บสวยงาม)
  - ลูกค้าเห็นสรุปสภาพรถ + รูปจริง
  - แสดงรายการ 🟡🔴 พร้อมราคาประมาณ
  - ลูกค้ากด "อนุมัติซ่อมเพิ่ม" ทีละรายการได้
  - ⭐ **สร้างโอกาสขายเพิ่ม (Upsell) แบบไม่กดดัน**
- บันทึกประวัติ inspection ทุกครั้ง → เห็น trend สภาพรถตลอดอายุการใช้งาน

#### 2.4 ช่าง Mobile App Experience ⭐ NEW
- **หน้าจอเฉพาะช่าง** (ง่าย ใช้งานสะดวกขณะมือเปื้อน)
  - ปุ่มใหญ่, UI minimal
  - Voice note (บันทึกเสียงแทนพิมพ์)
  - ถ่ายรูปง่ายๆ 1 tap
- ดูงานที่ได้รับมอบหมายวันนี้
- เริ่มงาน / หยุดพัก / เสร็จงาน (1 tap)
- เบิกอะไหล่จากมือถือ (scan barcode)
- แจ้งพบปัญหาเพิ่ม + ถ่ายรูป/วิดีโอ
- ดู repair history ของรถคันนี้ (เคยซ่อมอะไรมาบ้าง)
- เข้าถึง Knowledge Base / คู่มือซ่อม

#### 2.5 Knowledge Base & คู่มือซ่อม ⭐ NEW
- คลังความรู้การซ่อมแยกตามยี่ห้อ/รุ่นรถ
- Torque specs, ปริมาณน้ำมัน, ขนาดอะไหล่ ที่ใช้บ่อย
- Tips & Tricks จากช่างรุ่นพี่ (สร้างโดย technician ใน team)
- Common problems & solutions ตามรุ่นรถ
- วิดีโอสาธิตขั้นตอนซ่อม (upload ได้)
- ค้นหาได้ (เช่น "เปลี่ยนผ้าเบรค Civic 2020")

#### 2.6 เวลาทำงาน (Time Tracking)
- ช่าง clock-in/clock-out แต่ละ job
- คำนวณเวลาจริงที่ใช้ vs เวลาที่ประมาณ
- รายงานประสิทธิภาพช่าง
- รายงาน utilization rate

#### 2.7 การตรวจสอบคุณภาพ (QC - Quality Control)
- Checklist QC ก่อนส่งมอบ
- ผู้ตรวจสอบ sign-off
- ถ่ายรูปหลังซ่อมเสร็จ
- เปรียบเทียบ before/after
- **Test Drive Checklist** ⭐ (เช็คหลังทดสอบขับ: เสียงผิดปกติ, สั่น, เบรค, พวงมาลัย)

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

#### 3.4 อะไหล่ทดแทน & Cross-reference ⭐ NEW
- ระบบ **อะไหล่ทดแทน** (Alternative Parts)
  - อะไหล่ A หมดสต็อก → แนะนำ B, C ที่ใช้แทนได้
  - แสดงราคา, คุณภาพ, ระยะเวลาจัดส่ง เปรียบเทียบ
- **Cross-reference** part number ข้ามยี่ห้อ
  - OEM part number → aftermarket part number
  - ค้นหาจาก part number ของยี่ห้อหนึ่ง เจอของอีกยี่ห้อ
- **Parts compatibility** - อะไหล่นี้ใช้ได้กับรถรุ่นไหนบ้าง
- ประวัติราคาอะไหล่ (ราคาขึ้น/ลง ตาม supplier)

#### 3.5 ระบบเบิกอะไหล่อัจฉริยะ ⭐ NEW
- ช่าง scan barcode/QR → เบิกอะไหล่เข้า job ทันที
- **ตัดสต็อกอัตโนมัติ** เมื่อเบิก + บันทึกเข้า job cost
- ถ้าอะไหล่ไม่มีสต็อก → แจ้งแผนกสต็อกทันที + แนะนำอะไหล่ทดแทน
- **คืนอะไหล่ที่ไม่ได้ใช้** → สต็อกกลับ + ลดต้นทุน job
- ประวัติการเบิก/คืนทุก job (ป้องกันอะไหล่สูญหาย)
- **แจ้งเตือน**: ถ้า job ปิดแล้วยังไม่เบิกอะไหล่ (ลืมลง) หรือ เบิกเกินจำนวนผิดปกติ

#### 3.6 การแจ้งเตือนสต็อก
- แจ้งเตือนเมื่อสต็อกต่ำกว่า reorder point
- แจ้งเตือนอะไหล่หมดอายุ
- แจ้งเตือนอะไหล่ไม่เคลื่อนไหวนาน (dead stock)
- สร้าง PO อัตโนมัติเมื่อสต็อกต่ำ (auto-reorder)
- **แจ้งเตือนราคาอะไหล่เปลี่ยน** จาก supplier ⭐

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

#### 5.3 สมุดบันทึกประวัติรถดิจิทัล (Digital Service Book) ⭐ NEW
- **ลูกค้าได้ "สมุดซ่อมรถออนไลน์"** เข้าดูได้ตลอด (ผ่าน QR / Link / App)
- แสดง timeline ประวัติซ่อมทั้งชีวิตรถ
  - วันที่ | เลขไมล์ | รายการซ่อม | อะไหล่ที่เปลี่ยน | ค่าใช้จ่าย
- แสดง **Vehicle Health Score** (คะแนนสุขภาพรถ 0-100)
  - คำนวณจาก: อายุรถ, เลขไมล์, ประวัติเช็คระยะตรงเวลาหรือไม่, สภาพจาก DVI ล่าสุด
- แสดง **รายการที่ต้องดูแลเร็วๆนี้** (จาก DVI สีเหลือง/แดง)
- แสดง **กำหนดเช็คระยะครั้งถัดไป** + countdown
- **ใช้เป็นจุดขายตอนขายรถ** (ลูกค้าส่ง link ให้ผู้ซื้อดูประวัติ)
- ⭐ **ฟีเจอร์นี้ทำให้ลูกค้าอยากกลับมาใช้บริการเพราะข้อมูลอยู่ที่อู่**

#### 5.4 ระบบแจ้งเตือนอัจฉริยะ - ดึงลูกค้ากลับ (Smart Recall) ⭐ NEW
- **แจ้งเตือนตามระยะ/เวลา (Mileage & Time-based)**:
  - ถึงกำหนดเช็คระยะ (ทุก 10K/20K km หรือทุก 6 เดือน)
  - ถึงกำหนดเปลี่ยนน้ำมันเครื่อง
  - ถึงกำหนดเปลี่ยนยาง (ประมาณจากเลขไมล์)
  - ถึงกำหนดเปลี่ยนผ้าเบรค (จาก DVI ครั้งก่อน)
  - ถึงกำหนดต่อ พ.ร.บ. / ประกันภัย / ทะเบียน
- **แจ้งเตือนจากการวิเคราะห์** (Predictive):
  - ⭐ อะไหล่ที่เคยเปลี่ยน ใกล้ครบอายุการใช้งาน
  - ⭐ รายการ DVI สีเหลือง ที่ลูกค้ายังไม่ได้ซ่อม → follow up
  - ลูกค้าไม่กลับมาใช้บริการนานเกินกำหนด (เช่น 8 เดือน)
- **ช่องทางแจ้งเตือน**: Line OA / SMS / Email
- **พร้อม Deep Link** → ลูกค้ากดแล้วจองคิวได้เลย
- **แจ้งเตือนพร้อมโปรโมชั่น** (เช่น "ถึงกำหนดเช็คระยะ ลดค่าแรง 20% ถ้าจองภายใน 7 วัน")

#### 5.5 ระบบรีวิวและ Feedback ⭐ NEW
- ส่ง link ขอรีวิว หลังรับรถกลับ (อัตโนมัติ)
- ลูกค้าให้คะแนน: ⭐1-5 + comment
- ให้คะแนนแยก: คุณภาพงาน / ความเร็ว / ราคา / บริการ
- **ถ้าคะแนนต่ำ → แจ้ง Manager ทันที** (Service Recovery)
- ถ้าคะแนนสูง → ขอให้ลูกค้ารีวิวบน Google Maps / Facebook
- แสดงคะแนนรวมบน Landing Page (Premium)
- รายงาน Customer Satisfaction Score (CSAT) รายเดือน
- แสดง Net Promoter Score (NPS)

#### 5.6 Loyalty & Customer Retention ⭐ ENHANCED
- **ระบบสะสมคะแนน** (Points)
  - ทุกการใช้บริการได้คะแนน (เช่น 100 บาท = 1 point)
  - แลกส่วนลด / ของแถม / บริการฟรี
- **Membership Tiers** ⭐
  - 🥉 Bronze: สมาชิกทั่วไป
  - 🥈 Silver: ใช้บริการ 3+ ครั้ง/ปี → ส่วนลดค่าแรง 5%
  - 🥇 Gold: ใช้บริการ 6+ ครั้ง/ปี → ส่วนลด 10% + ลำดับความสำคัญสูง
  - 💎 Platinum: ยอดสะสม 50K+/ปี → ส่วนลด 15% + บริการรับ-ส่งรถ
- **คูปองส่วนลด**
  - คูปองวันเกิด (Auto-send)
  - คูปองครบรอบเป็นลูกค้า
  - คูปอง "คุณไม่ได้มานาน" (Win-back coupon)
  - คูปอง Referral (แนะนำเพื่อน)
- **โปรโมชั่นตามฤดูกาล**
  - ก่อนหน้าฝน: เช็คช่วงล่าง + ใบปัดน้ำฝน
  - ก่อนหน้าร้อน: เช็คแอร์ + น้ำหล่อเย็น
  - ก่อนเทศกาล: เช็คสภาพรถก่อนเดินทาง
- **Referral Program** ⭐ (แนะนำเพื่อน)
  - ลูกค้าได้ Referral Code / Link ส่วนตัว
  - เพื่อนมาใช้บริการ → ทั้งคู่ได้ส่วนลด
  - ติดตาม referral chain (ใครแนะนำใคร กี่คน)

#### 5.7 การสื่อสาร (Communication)
- ส่ง SMS แจ้งสถานะงาน
- ส่ง Line Notify / Line OA
- ส่ง Email (invoice, receipt, status update)
- Template ข้อความสำเร็จรูป
- ประวัติการสื่อสารทั้งหมด
- **Line OA Rich Menu** integration ⭐ (ลูกค้าเช็คสถานะ/จองคิว ผ่าน Line ได้เลย)

#### 5.8 Customer Self-Service Portal (ดูรายละเอียดใน Module 10)

### 👨‍💼 Module 6: ระบบจัดการพนักงาน (Employee Management)

#### 6.1 ข้อมูลพนักงาน
- โปรไฟล์: ชื่อ, ตำแหน่ง, ความเชี่ยวชาญ, เบอร์โทร
- สิทธิ์การเข้าถึง (Role-based)
- ตารางทำงาน
- วันหยุด/ลา
- **Skill Matrix** ⭐ (ช่างแต่ละคนถนัดงานประเภทไหน ระดับไหน)
  - เครื่องยนต์: ★★★★☆
  - ช่วงล่าง: ★★★☆☆
  - ระบบไฟฟ้า: ★★★★★
  - → ระบบแนะนำช่างที่เหมาะกับ job อัตโนมัติ

#### 6.2 ผลงาน (Performance) ⭐ ENHANCED
- จำนวนงานที่ทำสำเร็จ
- เวลาเฉลี่ยต่องาน vs เวลามาตรฐาน
- คะแนนคุณภาพ (QC pass rate)
- **Comeback rate** (อัตรางานกลับมาซ่อมซ้ำ - ยิ่งต่ำยิ่งดี) ⭐
- **คะแนนรีวิวจากลูกค้า** เฉลี่ยต่อช่าง ⭐
- **Upsell rate** (อัตราการแนะนำงานเพิ่มที่ลูกค้าอนุมัติ) ⭐
- Commission / ค่าแรงตาม job
- **Leaderboard** ⭐ (จัดอันดับช่างแต่ละเดือน - กระตุ้นการแข่งขัน)

#### 6.3 ระบบ Commission & Incentive ⭐ NEW
- ตั้งค่า commission rate ตามประเภทงาน (% ของค่าแรง)
- Commission พิเศษจาก upsell (งานเพิ่มเติมที่ช่างแนะนำ)
- โบนัสจาก customer review score สูง
- โบนัสจาก QC pass rate สูง
- สรุป commission รายเดือน → ส่งต่อแผนกบัญชี
- ช่างเข้าดูรายได้ commission ตัวเองได้

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

### 🌐 Module 9: Landing Page ร้าน (Premium Only)

> สร้างเว็บไซต์หน้าร้านสวยงามให้อู่ซ่อมรถ ใช้โดเมนเฉพาะของร้าน

#### 9.1 Landing Page Builder
- เลือก template สำเร็จรูป (3-5 แบบ เช่น Modern, Classic, Minimal, Bold, Elegant)
- Drag & drop จัดเรียง sections
- Customizable sections:
  - **Hero Banner**: รูปภาพหลัก + tagline + CTA button
  - **About Us**: ประวัติร้าน, วิสัยทัศน์, ทีมงาน
  - **Services**: รายการบริการพร้อมราคา + ไอคอน
  - **Gallery**: รูปผลงาน before/after + วิดีโอ
  - **Reviews/Testimonials**: รีวิวจากลูกค้าจริง (ดึงจากระบบ CRM)
  - **Team**: แสดงทีมช่าง + ความเชี่ยวชาญ
  - **Price List**: ตารางราคาบริการ
  - **Contact**: แผนที่ Google Maps, เบอร์โทร, Line, เวลาเปิด-ปิด
  - **FAQ**: คำถามที่พบบ่อย
  - **Promotion Banner**: โปรโมชั่นปัจจุบัน
- ปรับแต่งสี, ฟอนต์, โลโก้ ตาม branding ร้าน
- Responsive ทุกอุปกรณ์

#### 9.2 SEO & Social
- Meta title, description สำหรับทุกหน้า
- Open Graph tags (สำหรับ share Facebook/Line)
- Schema.org structured data (LocalBusiness, AutoRepair)
- Sitemap.xml อัตโนมัติ
- Google Analytics / Facebook Pixel integration
- Social media links

#### 9.3 Online Booking Widget
- ฝัง booking form บน Landing Page
- ลูกค้าเลือกวัน/เวลา + ประเภทบริการ
- ลูกค้าเลือกรถ (หรือเพิ่มรถใหม่)
- ส่ง confirmation อัตโนมัติ
- Sync กับ calendar ในระบบหลัก

#### 9.4 Custom Domain Management
- ตั้งค่า custom domain ในหน้า settings
- คำแนะนำตั้งค่า DNS (CNAME record)
- ตรวจสอบสถานะ domain verification
- SSL certificate อัตโนมัติ
- รองรับ www และ non-www redirect

### 📱 Module 10: Customer Portal - หน้าลูกค้า ⭐ NEW

> **แอปหน้าเว็บสำหรับลูกค้าโดยเฉพาะ** (PWA / LIFF in Line OA / Web Link)
> ลูกค้าเข้าผ่าน: QR Code ที่ร้าน / Link จาก SMS-Line / Line OA Rich Menu / Landing Page

#### 10.1 สมัครสมาชิก & Login (Customer Auth)
- **สมัครสมาชิกร้าน** ด้วย:
  - เบอร์โทร + OTP (ง่ายสุด สำหรับลูกค้าไทย)
  - Line Login (1-tap ผ่าน Line OA)
  - Email + Password (ทางเลือก)
- **สมัครครั้งแรก** → กรอกข้อมูลเบื้องต้น:
  - ชื่อ-นามสกุล, เบอร์โทร, Line ID (optional)
  - เพิ่มรถคันแรก: ทะเบียน, ยี่ห้อ, รุ่น, ปี, สี
  - ถ่ายรูปทะเบียนรถ → OCR อ่านข้อมูลอัตโนมัติ (optional, future)
- **ลูกค้าเก่า** (เคยมาใช้บริการก่อนสมัคร):
  - สมัครด้วยเบอร์เดิม → ระบบ match กับข้อมูลลูกค้าเดิมอัตโนมัติ
  - เห็นประวัติซ่อมย้อนหลังทันที (ไม่ต้องเริ่มจากศูนย์)
- **ไม่ต้องสมัคร** ก็เข้าดูสถานะงานได้ (ผ่าน QR Code / Link เฉพาะ job)

#### 11.2 หน้าหลัก (Customer Home)
- **ข้อมูลสมาชิก**: ชื่อ, ระดับ Membership (🥉🥈🥇💎), คะแนนสะสม
- **รถของฉัน** (My Vehicles):
  - แสดงรถทุกคันเป็น card (รูป + ทะเบียน + ยี่ห้อ-รุ่น)
  - เพิ่มรถใหม่ได้
  - กดเข้าดูรายละเอียดแต่ละคัน
- **งานปัจจุบัน** (Active Jobs):
  - แสดง job ที่กำลังซ่อมอยู่ (ถ้ามี)
  - สถานะ real-time + progress bar
- **การแจ้งเตือน** (Notifications badge)
- **Quick Actions**:
  - 📅 จองคิวซ่อม
  - 📞 โทรหาร้าน
  - 💬 แชทผ่าน Line

#### 11.3 รถของฉัน - รายคัน (Vehicle Detail Page)
- **ข้อมูลรถ**: ทะเบียน, ยี่ห้อ, รุ่น, ปี, สี, เลขไมล์ล่าสุด
- **อัปเดตเลขไมล์** (ลูกค้ากรอกเอง → ระบบคำนวณเวลาเช็คระยะครั้งถัดไปได้แม่นขึ้น)
- **Tabs**:

##### Tab 1: 📖 สมุดซ่อมรถ (Digital Service Book)
- Timeline ประวัติซ่อมทั้งหมด (เรียงจากล่าสุด)
  - แต่ละรายการ: วันที่ | เลขไมล์ | รายการซ่อม | อะไหล่ | ค่าใช้จ่าย
  - กดขยายดูรายละเอียด + รูปถ่ายก่อน/หลัง
- **Vehicle Health Score** 🏥 (0-100 คะแนน)
  - กราฟวงกลมแสดงคะแนน + สีตามระดับ (🟢 80+ / 🟡 50-79 / 🔴 <50)
  - คำนวณจาก: เช็คระยะตรงเวลา + สภาพจาก DVI + อายุรถ + ไมล์
- **Download / Share** ประวัติทั้งหมดเป็น PDF (ใช้ตอนขายรถ)

##### Tab 2: 🩺 รายงานตรวจสภาพ (Inspection Reports)
- รายการ DVI ทั้งหมด (Digital Vehicle Inspection)
- แต่ละรายการแสดง:
  - วันที่ตรวจ | ผู้ตรวจ
  - สรุป: กี่รายการ 🟢 / 🟡 / 🔴
  - กดเข้าดูรายละเอียด → **Vehicle Health Report** (หน้าสวยงาม)
    - แสดงทุกจุดที่ตรวจ + รูปจริง + สถานะ traffic light
    - รายการ 🟡🔴 มีราคาประมาณ
    - ปุ่ม **"ซ่อมรายการนี้"** → สร้าง booking ทันที
- **เปรียบเทียบ DVI ครั้งก่อน vs ครั้งนี้** (เห็น trend)

##### Tab 3: ⏰ กำหนดการดูแลรักษา (Maintenance Schedule)
- รายการที่ต้องทำถัดไป (เรียงตามวันที่ใกล้สุด):
  - 🔧 เช็คระยะ 30,000 km - อีก 2,000 km / ประมาณ 15 เม.ย.
  - 🛢️ เปลี่ยนน้ำมันเครื่อง - อีก 1 เดือน
  - 📋 ต่อ พ.ร.บ. - หมดอายุ 30 มิ.ย.
  - 🛡️ ต่อประกันภัย - หมดอายุ 15 ก.ค.
- กดแต่ละรายการ → **จองคิวทำเลย** (pre-fill ข้อมูลรถ + ประเภทงาน)

##### Tab 4: 📄 เอกสาร (Documents)
- ใบเสนอราคาทั้งหมด (รออนุมัติ / อนุมัติแล้ว)
- ใบแจ้งหนี้ + ใบเสร็จ
- ดูออนไลน์ + Download PDF

#### 11.4 ติดตามงานซ่อม (Live Job Tracking)
- **สถานะ real-time** แบบ delivery tracking:
  ```
  ✅ รับรถเข้าซ่อม          14:30
  ✅ เริ่มซ่อม (ช่าง: สมชาย)  15:00
  🔄 กำลังซ่อม...            ← สถานะปัจจุบัน
  ⬜ ตรวจสอบคุณภาพ (QC)
  ⬜ พร้อมรับรถ
  ```
- **รูปถ่าย/วิดีโอ** ระหว่างซ่อม (ช่างอัปโหลด → ลูกค้าเห็นทันที)
- **แจ้งเตือน** เมื่อสถานะเปลี่ยน (Push / Line / SMS)
- **ถ้ามี Additional Work Request** → แสดง popup:
  - "ช่างพบปัญหาเพิ่มเติม" + รูป/วิดีโอ + ราคาประมาณ
  - ปุ่ม ✅ อนุมัติ / ❌ ไม่ซ่อมตอนนี้ (ทีละรายการ)
- **Estimated completion time** + countdown

#### 11.5 จองคิวซ่อม (Online Booking)
- เลือกรถ (จาก "รถของฉัน")
- เลือกประเภทบริการ:
  - เช็คระยะ / เปลี่ยนถ่าย / ซ่อมทั่วไป / งานสี-ตัวถัง / แอร์ / อื่นๆ
- บอกอาการ (text / voice note / ถ่ายรูป)
- เลือกวัน-เวลา (แสดง slot ที่ว่าง)
- ยืนยัน → ได้ confirmation + reminder ก่อนวันนัด
- ระบบ suggest: "จากการตรวจครั้งก่อน คุณมีรายการ 🟡 ที่ยังไม่ได้ซ่อม ต้องการเพิ่มไหม?"

#### 11.6 สมาชิก & สิทธิพิเศษ (My Membership)
- **ระดับสมาชิก** ปัจจุบัน + progress bar ไประดับถัดไป
  - "อีก 2 ครั้ง จะเลื่อนเป็น 🥈 Silver (ได้ส่วนลด 5%)"
- **คะแนนสะสม** + ประวัติรับ/ใช้คะแนน
- **คูปองของฉัน**: ดูคูปองที่มี + วันหมดอายุ + ใช้คูปองตอนจอง
- **Referral Code**: แชร์ให้เพื่อน (copy link / share Line / QR)
  - แสดงจำนวนเพื่อนที่เคยแนะนำ + reward ที่ได้

#### 11.7 แจ้งเตือน (Notification Center)
- รวมแจ้งเตือนทั้งหมด:
  - สถานะงานเปลี่ยน
  - ใบเสนอราคา รออนุมัติ
  - Additional Work Request รออนุมัติ
  - ถึงกำหนดเช็คระยะ / ต่อ พ.ร.บ.
  - โปรโมชั่น / คูปองใหม่
  - คะแนนสะสมเพิ่ม
- Mark as read / Mark all as read

#### 10.8 Technical Architecture - Customer Portal
```
Route Structure (Next.js):
/c/                          → redirect to login หรือ home
/c/login                     → Login (Phone OTP / Line Login)
/c/register                  → สมัครสมาชิก + เพิ่มรถคันแรก
/c/home                      → Customer Home (รถ, งานปัจจุบัน, actions)
/c/vehicles                  → รายการรถทั้งหมด
/c/vehicles/[id]             → รถรายคัน (service book, DVI, schedule, docs)
/c/vehicles/[id]/add         → เพิ่มรถใหม่
/c/jobs/[id]                 → ติดตามงาน (live tracking)
/c/jobs/[id]/approve         → อนุมัติใบเสนอราคา / งานเพิ่ม
/c/booking                   → จองคิวซ่อม
/c/membership                → สมาชิก, คะแนน, คูปอง, referral
/c/notifications             → ศูนย์แจ้งเตือน
/c/profile                   → แก้ไขข้อมูลส่วนตัว

-- Public routes (ไม่ต้อง login):
/c/track/[token]             → ดูสถานะ job (จาก QR Code / Link)
/c/quote/[token]             → ดู + อนุมัติใบเสนอราคา
/c/report/[token]            → ดู Vehicle Health Report
/c/review/[token]            → ให้รีวิว

Auth: Separate customer auth table (ไม่ใช้ auth เดียวกับ staff)
- customer_accounts (id, customer_id, phone, email, line_user_id,
  password_hash, otp_code, otp_expires_at, last_login, created_at)
- customer_sessions (id, customer_account_id, token, device_info,
  expires_at, created_at)

Security:
- ลูกค้าเห็นเฉพาะข้อมูลของตัวเอง (RLS by customer_id)
- Token-based links หมดอายุได้ (สำหรับ public routes)
- Rate limiting on OTP requests
```

---

### 🛒 Module 11: ร้านค้าออนไลน์ - Shop (Premium Only)

> ระบบ e-commerce สำหรับขายอะไหล่/สินค้า/ผลิตภัณฑ์ดูแลรถให้ลูกค้า

#### 11.1 Shop Storefront (หน้าร้านออนไลน์)
- หน้าร้านสวยงามอยู่ภายใต้ custom domain (เช่น www.mygarage.com/shop)
- แสดงสินค้าเป็น grid / list view
- หมวดหมู่สินค้า (Categories)
- ค้นหาสินค้า + filter (ราคา, ยี่ห้อ, ประเภท, รุ่นรถ)
- Sorting: ยอดนิยม, ราคาต่ำ-สูง, ใหม่ล่าสุด
- สินค้าแนะนำ / สินค้ายอดนิยม / สินค้าลดราคา
- รูปภาพสินค้าหลายมุม (Image Gallery)
- รายละเอียดสินค้า: สเปค, รุ่นรถที่ใช้ได้, วิธีการติดตั้ง
- สินค้าที่เกี่ยวข้อง (Related Products)
- แสดง stock (มีของ / ใกล้หมด / หมด / สั่งจอง)

#### 11.2 ตะกร้าสินค้า (Shopping Cart)
- เพิ่ม/ลบ/แก้ไขจำนวนสินค้าในตะกร้า
- บันทึกตะกร้า (persistent cart - login แล้วเห็นตะกร้าเดิม)
- ใส่คูปองส่วนลด
- คำนวณค่าจัดส่ง (ตามน้ำหนัก/ระยะทาง หรือเรทคงที่)
- สรุปยอดรวม (สินค้า + ส่วนลด + ค่าส่ง + VAT)
- Quick checkout vs สมัครสมาชิก

#### 11.3 ระบบสั่งซื้อ (Order Management)
- Checkout flow: ตะกร้า → ข้อมูลจัดส่ง → ชำระเงิน → ยืนยัน
- ช่องทางชำระเงิน:
  - QR PromptPay
  - โอนธนาคาร (แนบสลิป)
  - เก็บเงินปลายทาง (COD)
  - บัตรเครดิต/เดบิต (ในอนาคต)
- สถานะ order: รอชำระ → ชำระแล้ว → กำลังจัด → ส่งแล้ว → สำเร็จ
- Tracking number (เลขพัสดุ)
- แจ้งเตือนลูกค้าทุกสถานะ (Email/Line/SMS)
- ประวัติคำสั่งซื้อ

#### 11.4 จัดการสินค้า (Product Management - Backend)
- สร้าง/แก้ไข/ลบ สินค้า
- **เชื่อมต่อกับระบบคลังอะไหล่ (Module 3)** - สต็อกเดียวกัน!
  - เลือกอะไหล่จากคลังมาขายใน shop
  - ตั้งราคาขายออนไลน์ (อาจต่างจากราคาหน้าร้าน)
  - สต็อกอัพเดทอัตโนมัติ (ขายหน้าร้าน = ลดในออนไลน์ด้วย)
- เพิ่มสินค้าเฉพาะออนไลน์ (ไม่อยู่ในคลังอะไหล่)
  - ผลิตภัณฑ์ดูแลรถ (แชมพู, wax, น้ำหอม)
  - Accessories
  - Merchandise ร้าน
- Upload รูปสินค้าหลายรูป
- ตั้ง variants (ขนาด, สี, เกรด)
- ตั้งน้ำหนักสำหรับคำนวณค่าส่ง
- เปิด/ปิดขาย, ตั้ง featured, ตั้ง sale price

#### 11.5 ระบบจัดส่ง (Shipping)
- ตั้งค่าค่าจัดส่ง:
  - ฟรีค่าส่ง (เมื่อซื้อครบตามกำหนด)
  - อัตราคงที่
  - ตามน้ำหนัก
  - รับที่ร้าน (Pick-up) - เชื่อมกับระบบหน้าร้าน
- เชื่อมต่อขนส่ง: Kerry, Flash, Thailand Post, J&T (ในอนาคต)
- พิมพ์ใบปะหน้าพัสดุ

#### 11.6 รายงาน Shop
- ยอดขายออนไลน์ (วัน/สัปดาห์/เดือน)
- สินค้าขายดี (Top sellers)
- สินค้าไม่ขาย (Low performers)
- Conversion rate (เข้าชม vs สั่งซื้อ)
- Revenue จาก shop vs หน้าร้าน
- **รวมยอดเข้ากับระบบการเงิน (Module 4)**

#### 11.7 ลูกค้า Shop
- ลูกค้าสมัครสมาชิก / สั่งซื้อแบบ guest
- **เชื่อมต่อกับ CRM (Module 5)** - ลูกค้า shop = ลูกค้าในระบบ
- ลูกค้ากลับมาดูประวัติ order
- ลูกค้าใช้ Loyalty Points ชำระเงิน
- Wishlist (สินค้าที่สนใจ)
- ลูกค้าเขียนรีวิว + ให้คะแนน

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

-- Insurance Claims ⭐ NEW
insurance_companies (id, tenant_id, name, contact_person, phone, email, contract_terms, is_active, created_at)
insurance_claims (id, tenant_id, job_id, insurance_company_id, policy_number, claim_status, estimated_amount, approved_amount, customer_copay, claim_photos, submitted_at, approved_at, paid_at, notes, created_at)

-- Warranty ⭐ NEW
warranty_policies (id, tenant_id, name, job_type, duration_days, mileage_limit, terms, created_at)
warranty_records (id, tenant_id, job_id, job_item_id, part_id, warranty_policy_id, start_date, end_date, start_mileage, max_mileage, status, created_at)
warranty_claims (id, tenant_id, warranty_record_id, new_job_id, claim_type, description, approved_by, created_at)

-- Digital Vehicle Inspection (DVI) ⭐ NEW
vehicle_inspections (id, tenant_id, vehicle_id, job_id, inspected_by, overall_score, status, sent_to_customer_at, customer_viewed_at, created_at)
inspection_items (id, inspection_id, category, item_name, condition, notes, photo_url, video_url, estimated_cost, customer_approved, sort_order, created_at)

-- Additional Work Requests ⭐ NEW
additional_work_requests (id, job_id, tenant_id, requested_by, description, photos, estimated_cost, status, customer_approved_at, customer_rejected_at, added_to_job_at, created_at)

-- Smart Recall / Reminders ⭐ NEW
service_reminders (id, tenant_id, vehicle_id, customer_id, reminder_type, trigger_date, trigger_mileage, message_template, status, sent_at, booking_id, created_at)
declined_services (id, tenant_id, vehicle_id, customer_id, job_id, description, estimated_cost, follow_up_date, status, created_at)

-- Reviews & Feedback ⭐ NEW
service_reviews (id, tenant_id, job_id, customer_id, overall_rating, quality_rating, speed_rating, price_rating, service_rating, comment, technician_id, is_public, created_at)

-- Loyalty & Referrals ⭐ NEW
membership_tiers (id, tenant_id, name, min_visits, min_spending, discount_percent, benefits, sort_order, created_at)
customer_memberships (id, customer_id, tier_id, points_balance, total_spending, total_visits, tier_upgraded_at, created_at)
points_transactions (id, customer_id, tenant_id, points, type, reference_type, reference_id, description, created_at)
referral_codes (id, customer_id, tenant_id, code, referral_count, total_discount_given, created_at)
referrals (id, referral_code_id, referred_customer_id, reward_given, created_at)

-- Knowledge Base ⭐ NEW
knowledge_articles (id, tenant_id, title, content, category, vehicle_brand, vehicle_model, tags, created_by, views, created_at)

-- Employee Skills & Commission ⭐ NEW
employee_skills (id, user_id, skill_category, skill_level, certified, created_at)
commission_rules (id, tenant_id, name, job_type, rate_percent, upsell_bonus_percent, is_active, created_at)
commission_records (id, tenant_id, user_id, job_id, base_amount, commission_amount, upsell_bonus, review_bonus, period, status, created_at)

-- Customer Portal Auth ⭐ NEW
customer_accounts (id, customer_id, tenant_id, phone, email, line_user_id, password_hash, otp_code, otp_expires_at, is_verified, last_login, created_at)
customer_sessions (id, customer_account_id, token, device_info, ip_address, expires_at, created_at)
customer_notifications (id, customer_account_id, tenant_id, type, title, message, data, is_read, created_at)

-- Custom Domain (Premium)
tenant_domains (id, tenant_id, domain, is_verified, verification_token, ssl_status, created_at)

-- Landing Page (Premium)
landing_pages (id, tenant_id, template, sections, theme_colors, custom_css, seo_title, seo_description, og_image_url, is_published, created_at)
landing_sections (id, landing_page_id, section_type, title, content, media_urls, sort_order, is_visible, created_at)

-- Shop / E-Commerce (Premium)
shop_settings (id, tenant_id, is_active, shop_name, shop_description, shipping_policy, return_policy, min_free_shipping, currency, created_at)
products (id, tenant_id, name, slug, description, category_id, part_id, images, price, sale_price, cost_price, stock_quantity, weight, is_active, is_featured, sort_order, created_at)
product_categories (id, tenant_id, name, slug, parent_id, image_url, sort_order, created_at)
product_variants (id, product_id, name, sku, price, stock_quantity, attributes, created_at)
product_reviews (id, product_id, customer_id, rating, comment, is_approved, created_at)

orders (id, tenant_id, order_number, customer_id, status, subtotal, discount, shipping_fee, vat, total, coupon_id, shipping_address, shipping_method, tracking_number, payment_method, payment_status, paid_at, shipped_at, delivered_at, notes, created_at)
order_items (id, order_id, product_id, variant_id, name, quantity, unit_price, total, created_at)

coupons (id, tenant_id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_from, valid_until, is_active, created_at)

wishlists (id, customer_id, product_id, created_at)

shipping_rates (id, tenant_id, name, type, rate, min_weight, max_weight, is_active, created_at)
```

### Row-Level Security (RLS) Policy Pattern
```sql
-- ทุก table ใช้ pattern เดียวกัน:
CREATE POLICY "tenant_isolation" ON table_name
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

---

## 7.5 Marketing Website - เว็บโปรโมทระบบ KPServicePro ⭐ NEW

> **เว็บไซต์หลักสำหรับนำเสนอระบบ KPServicePro ให้เจ้าของอู่ซ่อมรถ**
> เน้น SEO, ข้อมูลครบ, ดึงดูดให้ทดลองใช้ฟรี 30 วัน
> URL: https://kpservicepro.com (หรือ .co.th)

### Route Structure
```
/                         → หน้าหลัก (Hero + Features overview + CTA)
/features                 → ฟีเจอร์ทั้งหมด (แบ่งตามโมดูล)
/features/reception       → รายละเอียดระบบหน้าร้าน
/features/repair          → รายละเอียดระบบวางแผนซ่อม
/features/inventory       → รายละเอียดระบบสต็อก
/features/finance         → รายละเอียดระบบการเงิน
/features/crm             → รายละเอียดระบบ CRM
/features/customer-portal → รายละเอียด Customer Portal
/features/dvi             → รายละเอียด Digital Vehicle Inspection
/features/landing-page    → รายละเอียด Landing Page Builder (Premium)
/features/shop            → รายละเอียดร้านค้าออนไลน์ (Premium)
/pricing                  → ตารางราคา Pro vs Premium
/demo                     → ทดลองใช้ demo (sandbox)
/register                 → สมัครทดลองใช้ฟรี 30 วัน
/blog                     → บทความ SEO (ความรู้เกี่ยวกับการจัดการอู่)
/blog/[slug]              → บทความรายตัว
/case-studies             → กรณีศึกษาอู่ที่ใช้ระบบ
/contact                  → ติดต่อเรา / ขอ demo
/about                    → เกี่ยวกับเรา
/terms                    → เงื่อนไขการใช้บริการ
/privacy                  → นโยบายความเป็นส่วนตัว
/faq                      → คำถามที่พบบ่อย
```

### หน้าหลัก (Homepage) - โครงสร้าง Sections

#### Section 1: Hero Banner
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ระบบจัดการอู่ซ่อมรถออนไลน์                          │
│   ที่เข้าใจคนทำอู่จริงๆ                                │
│                                                     │
│   จัดการงานซ่อม สต็อก การเงิน ลูกค้า                   │
│   ครบจบในระบบเดียว                                    │
│                                                     │
│   [ทดลองใช้ฟรี 30 วัน]  [ดู Demo]                     │
│                                                     │
│   ✓ ไม่ต้องใส่บัตรเครดิต                               │
│   ✓ ใช้งานได้ทันที ไม่ต้องติดตั้ง                        │
│   ✓ ย้ายข้อมูลจากระบบเดิมได้                           │
│                                                     │
│   [Screenshot/Video ระบบ]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Section 2: Pain Points - ปัญหาที่เจ้าของอู่เจอ
```
"เคยเจอปัญหาเหล่านี้ไหม?"

❌ จดงานในสมุด / Excel หาย ไม่ครบ
❌ สต็อกอะไหล่ไม่ตรง นับทีไรก็ไม่เคยเท่า
❌ ลูกค้าโทรถามสถานะงานตลอด ไม่มีเวลาทำงาน
❌ ไม่รู้กำไร-ขาดทุนจริง คิดแต่ยอดรายรับ
❌ ลูกค้ามาครั้งเดียว แล้วไม่กลับมาอีก
❌ ช่างลืมเบิกอะไหล่ ลืมลงรายการ
❌ งานประกันเคลมช้า ติดตามยาก

→ KPServicePro แก้ปัญหาเหล่านี้ได้ทั้งหมด
```

#### Section 3: Features Overview (ฟีเจอร์เด่น)
```
แสดงเป็น Card Grid (6-8 cards) พร้อม Icon + คำอธิบายสั้นๆ:

📋 รับรถ & จัดการงาน     - รับรถ, ใบเสนอราคา, Job Order, คิวรอ Kanban
🔧 วางแผนซ่อม           - ตารางช่าง, Checklist, QC, จับเวลา
📦 สต็อกอะไหล่           - คลัง, เบิก-จ่าย, สั่งซื้อ, แจ้งเตือนหมด
💰 การเงินครบวงจร        - ใบแจ้งหนี้, ใบเสร็จ, กำไร-ขาดทุน, ภาษี
👥 CRM & ลูกค้ากลับมา   - สมาชิก, แจ้งเตือนอัจฉริยะ, สะสมแต้ม
🩺 ตรวจสภาพรถดิจิทัล    - DVI, Vehicle Health Report → upsell
📱 Customer Portal       - ลูกค้าดูสถานะ, สมุดซ่อมรถ, จองคิว
📊 Dashboard & Reports  - KPI, กราฟ, รายงานครบทุกมิติ

[ดูฟีเจอร์ทั้งหมด →]
```

#### Section 4: จุดแตกต่าง (Why KPServicePro)
```
"ทำไมต้อง KPServicePro?"

🩺 ตรวจสภาพรถดิจิทัล (DVI)
   → ส่ง Vehicle Health Report ให้ลูกค้า
   → เครื่องมือ Upsell ที่ดีที่สุด (ลูกค้าตัดสินใจเอง)

📖 สมุดซ่อมรถออนไลน์
   → ลูกค้าดูประวัติซ่อมได้ตลอด
   → ข้อมูลอยู่ที่อู่คุณ = ลูกค้าไม่ย้ายไปไหน

🔔 แจ้งเตือนอัจฉริยะ
   → ระบบดึงลูกค้ากลับมาอัตโนมัติ
   → ไม่ต้องจำเอง ไม่ต้องโทรตาม

📱 ลูกค้าดูสถานะงานเอง
   → ไม่ต้องรับโทรศัพท์ถามสถานะ
   → ลูกค้าอนุมัติงานเพิ่มผ่านมือถือ

💎 ระบบสมาชิก + Referral
   → ลูกค้าชวนเพื่อนมาใช้บริการ
   → ลดต้นทุนหาลูกค้าใหม่

"ไม่ใช่แค่โปรแกรมบันทึกงาน — แต่เป็นเครื่องมือเพิ่มรายได้"
```

#### Section 5: ภาพระบบจริง (Screenshots / Interactive Demo)
```
Tab switcher แสดงหน้าจอจริงของแต่ละโมดูล:
[Dashboard] [รับรถ] [Job Board] [สต็อก] [การเงิน] [CRM] [Customer Portal]

แต่ละ tab แสดง screenshot จริง + คำอธิบายสั้นๆ
+ ปุ่ม "ทดลองใช้งานจริง →"
```

#### Section 6: ตารางราคา (Pricing Preview)
```
┌──────────────────┬──────────────────┐
│    Pro Plan       │   Premium Plan   │
│   ฿X,XXX/เดือน    │   ฿X,XXX/เดือน   │
│                   │                  │
│ ✅ ระบบหน้าร้าน    │ ✅ ทุกอย่างใน Pro  │
│ ✅ วางแผนซ่อม      │ ✅ Landing Page    │
│ ✅ สต็อก           │ ✅ ร้านค้าออนไลน์   │
│ ✅ การเงิน         │ ✅ Custom Domain   │
│ ✅ CRM            │ ✅ White-label     │
│ ✅ Customer Portal │ ✅ SEO tools      │
│ ✅ DVI            │ ✅ Priority Support│
│ ✅ Dashboard      │                  │
│                   │                  │
│ [ทดลองฟรี 30 วัน] │ [ทดลองฟรี 30 วัน]│
└──────────────────┴──────────────────┘

ทุกแพลนรวม: ✓ Support ✓ อัพเดทฟรี ✓ ไม่จำกัดผู้ใช้*
[ดูรายละเอียดเพิ่มเติม →]
```

#### Section 7: Social Proof
```
📊 ตัวเลขความสำเร็จ (เมื่อมีข้อมูลจริง):
   "XXX อู่ซ่อมรถทั่วไทยใช้ KPServicePro"
   "XX,XXX งานซ่อมถูกจัดการผ่านระบบ"
   "ลูกค้ากลับมาใช้บริการเพิ่มขึ้น XX%"

⭐ Testimonials จากเจ้าของอู่จริง:
   "ตอนแรกกลัวใช้ยาก แต่พอเริ่มแล้ว ไม่มีทางกลับไปจดสมุดอีก..."
   - อู่ XXX, จ.XXX

🏆 เคสตัวอย่าง:
   "อู่ช่างสมศักดิ์ เพิ่มรายได้ 35% ใน 6 เดือนหลังใช้ระบบ DVI"
   [อ่านกรณีศึกษา →]
```

#### Section 8: FAQ (คำถามที่พบบ่อย)
```
❓ ใช้ยากไหม? ต้องเก่งคอมพิวเตอร์ไหม?
→ ออกแบบมาให้ง่าย ใช้ผ่านมือถือ/แท็บเล็ตได้ มีทีมช่วย setup ฟรี

❓ มีค่าติดตั้งไหม?
→ ไม่มี! ใช้ผ่านเว็บ ไม่ต้องติดตั้งอะไร เปิดบราวเซอร์ก็ใช้ได้เลย

❓ ข้อมูลเก่าย้ายมาได้ไหม?
→ ได้! ทีมเราช่วย import ข้อมูลลูกค้า/รถ จาก Excel ให้ฟรี

❓ ใช้ออฟไลน์ได้ไหม?
→ ได้บางส่วน (PWA) เช่น ดูข้อมูลที่เคยโหลด ถ่ายรูป

❓ ยกเลิกได้ไหม? ติดสัญญาไหม?
→ ยกเลิกได้ทุกเมื่อ ไม่ติดสัญญา ข้อมูลเป็นของคุณ export ได้

❓ รองรับกี่คน กี่เครื่อง?
→ ไม่จำกัดจำนวนผู้ใช้ ไม่จำกัดอุปกรณ์ (ขึ้นกับ plan)

❓ ปลอดภัยไหม?
→ ใช้ Supabase (AWS infrastructure), เข้ารหัสข้อมูล, สำรองข้อมูลทุกวัน

❓ มี support ไหม?
→ มี! Line OA / Chat / Email + คู่มือใช้งาน + วิดีโอสอน
```

#### Section 9: CTA Final
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   เริ่มต้นใช้งาน KPServicePro                         │
│   ทดลองฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต                │
│                                                     │
│   [สมัครทดลองใช้ฟรี]                                  │
│                                                     │
│   หรือโทรคุยกับทีมเรา: 0XX-XXX-XXXX                   │
│   Line: @kpservicepro                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Section 10: Footer
```
เกี่ยวกับเรา | ฟีเจอร์ | ราคา | บทความ | ติดต่อ | เข้าสู่ระบบ
เงื่อนไข | ความเป็นส่วนตัว
© 2026 KPServicePro - ระบบจัดการอู่ซ่อมรถออนไลน์
```

### หน้า Features (รายละเอียด) - /features

> แต่ละ feature page มีโครงสร้างเดียวกัน:

```
1. Hero: ชื่อฟีเจอร์ + tagline + screenshot ใหญ่
2. Problem: ปัญหาที่ฟีเจอร์นี้แก้
3. Solution: วิธีที่ KPServicePro แก้ปัญหา (พร้อม screenshot)
4. Benefits: ประโยชน์ที่ได้ (bullet points + ตัวเลข)
5. How it works: ขั้นตอนง่ายๆ 3-4 ขั้นตอน
6. CTA: ปุ่มทดลองใช้ฟรี
```

### หน้า Pricing - /pricing

```
ตารางเปรียบเทียบ Pro vs Premium แบบละเอียด:
- แสดงทุก feature + ✅/❌
- FAQ เกี่ยวกับราคา
- ปุ่ม "ทดลองฟรี 30 วัน" ทั้ง 2 แพลน
- หมายเหตุ: "ไม่ต้องใส่บัตรเครดิต, ยกเลิกได้ทุกเมื่อ"
```

### หน้าสมัครทดลองใช้ - /register

```
ฟอร์มสมัคร (เรียบง่าย, ไม่กดดัน):
Step 1: ข้อมูลเจ้าของ
  - ชื่อ-นามสกุล
  - เบอร์โทร
  - Email
  - Password

Step 2: ข้อมูลอู่
  - ชื่ออู่
  - จังหวัด
  - จำนวน bay/lift (เลือก range)
  - จำนวนช่าง (เลือก range)
  - ประเภทงานหลัก (multi-select: ซ่อมทั่วไป, งานสี, ช่วงล่าง, แอร์, ฯลฯ)

Step 3: เลือกแพลน
  - Pro / Premium
  - "ทดลองฟรี 30 วัน (ไม่ต้องใส่บัตรเครดิต)"

→ สร้าง tenant + setup เริ่มต้น → เข้าใช้งานได้ทันที
→ ส่ง Welcome Email + คู่มือเริ่มต้น
→ ทีม support ติดต่อกลับภายใน 24 ชม. (ช่วย setup)
```

### Blog / SEO Content Strategy - /blog

> สร้าง content ที่เจ้าของอู่ค้นหา → ติดอันดับ Google → เข้ามาอ่าน → เห็นระบบ → ทดลองใช้

#### SEO Keywords เป้าหมาย:
```
Primary:
- "โปรแกรมอู่ซ่อมรถ"
- "ระบบจัดการอู่ซ่อมรถ"
- "โปรแกรมจัดการอู่"
- "ซอฟต์แวร์อู่ซ่อมรถ"

Long-tail:
- "โปรแกรมจัดการอู่ซ่อมรถ ฟรี"
- "โปรแกรมจัดการสต็อกอะไหล่"
- "ระบบจัดการงานซ่อมรถ"
- "โปรแกรมออกใบเสนอราคาอู่"
- "วิธีจัดการอู่ซ่อมรถ ให้มีกำไร"
- "เพิ่มรายได้อู่ซ่อมรถ"
- "ลูกค้าอู่ซ่อมรถ ไม่กลับมา ทำยังไง"

Informational:
- "วิธีบริหารอู่ซ่อมรถ"
- "ปัญหาอู่ซ่อมรถ"
- "ต้นทุนเปิดอู่ซ่อมรถ"
- "วิธีเช็คระยะรถ"
```

#### แผนบทความ (เริ่มต้น 10 บทความ):
```
1. "วิธีจัดการอู่ซ่อมรถให้มีกำไร — 7 เรื่องที่เจ้าของอู่ต้องรู้"
2. "ปัญหาสต็อกอะไหล่ไม่ตรง แก้ได้อย่างไร?"
3. "ทำไมลูกค้าอู่ซ่อมรถถึงไม่กลับมา (และวิธีแก้)"
4. "Digital Vehicle Inspection (DVI) คืออะไร? ทำไมอู่ยุคใหม่ต้องมี"
5. "เปลี่ยนจากสมุดจดงาน มาใช้ระบบดิจิทัล — คุ้มไหม?"
6. "วิธีเพิ่มรายได้อู่ซ่อมรถ โดยไม่ต้องเพิ่มลูกค้า (Upsell)"
7. "ระบบเคลมประกัน สำหรับอู่ซ่อมรถ — จัดการอย่างไรให้ไม่ตกหล่น"
8. "สมุดซ่อมรถออนไลน์ — เครื่องมือรักษาลูกค้าที่อู่มองข้าม"
9. "วิธีเลือกโปรแกรมจัดการอู่ซ่อมรถ — ดูอะไรบ้าง?"
10. "5 KPI ที่เจ้าของอู่ต้องดูทุกเดือน"
```

#### Blog Technical:
```
- Static generation (SSG) สำหรับ SEO
- MDX content (เขียนง่าย, ใส่ components ได้)
- Table of Contents อัตโนมัติ
- Reading time estimate
- Related posts
- Author profile
- Social share buttons
- Schema.org Article structured data
- Open Graph + Twitter Cards
- CTA banner ท้ายบทความ ("ทดลองใช้ KPServicePro ฟรี 30 วัน")
```

### SEO Technical Implementation
```
✅ Next.js SSG/ISR (Static rendering สำหรับทุกหน้า)
✅ Metadata API (title, description ทุกหน้า)
✅ Open Graph + Twitter Cards
✅ Schema.org structured data:
   - Organization
   - SoftwareApplication
   - FAQPage
   - Article (blog)
   - BreadcrumbList
   - PricingTable (via Offer schema)
✅ Sitemap.xml อัตโนมัติ
✅ robots.txt
✅ Canonical URLs
✅ Hreflang (TH/EN ในอนาคต)
✅ Core Web Vitals optimization:
   - Image optimization (Next.js Image)
   - Font optimization (next/font)
   - Lazy loading
   - Prefetching
✅ Google Search Console integration
✅ Google Analytics 4
✅ Facebook Pixel
✅ Line Tag
✅ Structured FAQ schema (สำหรับ FAQ section)
✅ Internal linking strategy (blog → features → pricing → register)
```

### Conversion Optimization
```
🎯 ทุกหน้ามี CTA "ทดลองฟรี 30 วัน" อย่างน้อย 1 จุด
🎯 Sticky header มีปุ่ม "ทดลองฟรี" ตลอด
🎯 Exit-intent popup (กำลังจะปิดหน้า → "รอก่อน! ทดลองฟรี 30 วัน")
🎯 Floating WhatsApp/Line chat button
🎯 Blog → Feature → Pricing funnel (internal links)
🎯 Social proof ทุกหน้า (จำนวนผู้ใช้, รีวิว)
🎯 A/B testing CTA text + สี (ในอนาคต)
🎯 UTM tracking สำหรับ campaigns
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

### Phase 8: SaaS & Subscription (สัปดาห์ 14-15)
> ระบบ subscription และจัดการ tenant

- [ ] KPServicePro Marketing site (Landing page, Pricing page)
- [ ] Pricing page แสดง 2 แพลน (Pro vs Premium)
- [ ] Subscription management (สมัคร, อัปเกรด, ต่ออายุ)
- [ ] Payment for subscription (QR/Transfer)
- [ ] Trial period logic (14 วัน)
- [ ] Subscription renewal & reminders
- [ ] Grace period logic
- [ ] Settings page (shop profile, customization)
- [ ] User management (invite, roles)

### Phase 9: Landing Page Builder - Premium (สัปดาห์ 16-17)
> ระบบสร้าง Landing Page เฉพาะร้าน + Custom Domain

- [ ] Landing Page template system (3-5 templates)
- [ ] Section editor (Hero, About, Services, Gallery, Reviews, Contact, FAQ, Pricing)
- [ ] Theme customization (สี, ฟอนต์, โลโก้)
- [ ] Image/Video upload สำหรับ gallery
- [ ] Online booking widget (ฝังใน Landing Page)
- [ ] SEO settings (meta tags, OG, Schema.org, sitemap)
- [ ] Custom domain management (ตั้งค่า, verify, DNS guide)
- [ ] Vercel Domains API integration
- [ ] SSL auto-provisioning
- [ ] Middleware: hostname → tenant routing
- [ ] Preview / Publish workflow
- [ ] Google Analytics / Facebook Pixel integration

### Phase 10: ร้านค้าออนไลน์ - Shop - Premium (สัปดาห์ 18-20)
> ระบบ e-commerce สำหรับขายสินค้า

- [ ] Shop storefront (หน้าร้านออนไลน์สาธารณะ)
- [ ] Product listing (grid/list, search, filter, sort)
- [ ] Product detail page (รูปหลายมุม, specs, รุ่นรถที่ใช้ได้, reviews)
- [ ] Product management backend (CRUD, variants, images)
- [ ] เชื่อมต่อ inventory (Module 3) - shared stock
- [ ] Product categories CRUD
- [ ] Shopping cart (persistent, coupon, shipping calc)
- [ ] Checkout flow (ข้อมูลจัดส่ง → ชำระเงิน → ยืนยัน)
- [ ] Payment: QR PromptPay, โอนธนาคาร, COD
- [ ] Order management (สถานะ, tracking number)
- [ ] Order notifications (Email/Line/SMS)
- [ ] Shipping settings (rates, free shipping threshold)
- [ ] Coupon system (เปอร์เซ็นต์/จำนวนเงิน, วันหมดอายุ)
- [ ] Customer reviews & ratings
- [ ] Wishlist
- [ ] Shop analytics (ยอดขาย, top sellers, conversion)
- [ ] รวมยอดขาย shop เข้ากับ Finance (Module 4)
- [ ] รวมลูกค้า shop เข้ากับ CRM (Module 5)

### Phase 11: Polish & Launch (สัปดาห์ 21-22)
> ปรับแต่ง ทดสอบ และเปิดตัว

- [ ] Performance optimization (bundle size, lighthouse score)
- [ ] SEO optimization (ทั้ง marketing site และ tenant sites)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Security audit
- [ ] Load testing
- [ ] Final bug fixes
- [ ] Documentation / User guide

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

| # | Feature | แพลน | รายละเอียด |
|---|---------|------|-----------|
| 1 | 🏪 Reception | Pro+Premium | รับรถ, ใบเสนอราคา, Job Order, คิวรอ |
| 2 | 🛡️ Insurance Claims | Pro+Premium | ⭐ เคลมประกัน, ติดตามสถานะ, รายงานเคลม |
| 3 | 📋 Additional Work | Pro+Premium | ⭐ แจ้งพบปัญหาเพิ่ม + ลูกค้าอนุมัติออนไลน์ |
| 4 | 🔒 Warranty | Pro+Premium | ⭐ ประกันงานซ่อม, ประกันอะไหล่, เคลม supplier |
| 5 | 🔧 Repair Planning | Pro+Premium | Calendar, Scheduling, Checklist, QC, Time Tracking |
| 6 | 🩺 Digital Inspection (DVI) | Pro+Premium | ⭐ ตรวจสภาพรถ, Traffic Light, Vehicle Health Report |
| 7 | 📱 Tech Mobile UX | Pro+Premium | ⭐ UI สำหรับช่าง, Voice Note, 1-tap ถ่ายรูป, Barcode เบิกของ |
| 8 | 📚 Knowledge Base | Pro+Premium | ⭐ คลังความรู้ซ่อม, Tips ตามรุ่นรถ, วิดีโอสาธิต |
| 9 | 📦 Inventory | Pro+Premium | คลังอะไหล่, Stock, PO, Supplier, Alerts |
| 10 | 🔄 Alt Parts & Smart Issue | Pro+Premium | ⭐ อะไหล่ทดแทน, Cross-ref, เบิกอัจฉริยะ, Scan-to-Issue |
| 11 | 💰 Finance | Pro+Premium | Invoice, Receipt, Expense, P&L, Tax Report |
| 12 | 👥 CRM | Pro+Premium | Customer, Vehicle, Communication |
| 13 | 📖 Digital Service Book | Pro+Premium | ⭐ สมุดซ่อมรถดิจิทัล, Health Score, ประวัติตลอดชีพ |
| 14 | 🔔 Smart Recall | Pro+Premium | ⭐ แจ้งเตือนอัจฉริยะ, Follow-up DVI, Win-back |
| 15 | ⭐ Reviews & CSAT | Pro+Premium | ⭐ รีวิว, NPS, Service Recovery, Google Review redirect |
| 16 | 💎 Loyalty & Referral | Pro+Premium | ⭐ Points, Membership Tiers, Referral Program, Coupons |
| 17 | 👨‍💼 Employees | Pro+Premium | Profile, Skill Matrix, Leaderboard, Commission |
| 18 | 📊 Dashboard | Pro+Premium | KPI, Charts, Reports, Export |
| 19 | ⚙️ Settings | Pro+Premium | Shop Profile, Customization, Subscription |
| 20 | 📱 PWA | Pro+Premium | Offline, Push Notification, Camera, Install |
| 21 | 🌐 SaaS | Pro+Premium | Multi-tenant, Subscription, Billing, 2 Plans |
| 22 | 🔐 Security | Pro+Premium | RLS, Auth, Audit Log, Validation |
| 23 | 🎨 UI/UX | Pro+Premium | Dark Mode, Modal System, Responsive, i18n |
| 24 | 🌍 Landing Page | **Premium** | Template Builder, Custom Domain, SEO, Booking Widget |
| 25 | 🛒 Online Shop | **Premium** | E-Commerce, Products, Cart, Checkout, Orders, Shipping |
| 26 | 🏷️ White-label | **Premium** | ไม่มี KPServicePro branding, ใช้โลโก้ร้าน |
| 27 | 🌍 Marketing Website | **ของเรา** | ⭐ เว็บโปรโมทระบบ, SEO, Blog, ทดลองฟรี 30 วัน |

---

## ⭐ Competitive Differentiators - จุดแตกต่างจากคู่แข่ง

### vs ระบบจัดการอู่ซ่อมรถทั่วไปในไทย

| ฟีเจอร์ที่ทำให้แตกต่าง | ทำไมถึงสำคัญ |
|---|---|
| **Digital Vehicle Inspection (DVI) + Vehicle Health Report** | ลูกค้าเห็นสภาพรถจริง + เป็นเครื่องมือ upsell ที่ดีที่สุด (ลูกค้าตัดสินใจเอง ไม่รู้สึกถูกกดดัน) |
| **Digital Service Book + Health Score** | ลูกค้าผูกติดกับอู่ เพราะข้อมูลอยู่ที่นี่ + เพิ่มมูลค่าตอนขายรถ |
| **Smart Recall (แจ้งเตือนอัจฉริยะ)** | ดึงลูกค้ากลับมาใช้บริการอัตโนมัติ ไม่ต้องจำเอง |
| **Additional Work Request + ลูกค้าอนุมัติออนไลน์** | เพิ่มรายได้ต่อ job + ลูกค้ามั่นใจ (เห็นรูปจริง) |
| **Follow-up DVI สีเหลือง** | ลูกค้าปฏิเสธวันนี้ แต่ระบบติดตามให้ → ขายได้ในอนาคต |
| **Referral Program** | ลูกค้าชวนเพื่อนมา = ลดต้นทุนหาลูกค้าใหม่ |
| **Membership Tiers** | ยิ่งมาบ่อย ยิ่งได้ส่วนลด = lock ลูกค้าไว้ |
| **Review → Service Recovery** | คะแนนต่ำ = Manager รู้ทันที = แก้ปัญหาก่อนเสียลูกค้า |
| **ช่าง Mobile UX + Voice Note** | ช่างใช้งานจริงได้ (มือเปื้อน, ไม่ต้องพิมพ์) |
| **Knowledge Base** | ช่างใหม่เรียนรู้เร็ว + ลดข้อผิดพลาด |
| **Commission + Leaderboard** | ช่างมีแรงจูงใจ = งานดีขึ้น = ลูกค้าพอใจ |
| **Landing Page + Shop (Premium)** | อู่มี digital presence ครบ = ดึงลูกค้าใหม่จาก online |

### วงจรดึงลูกค้ากลับมา (Customer Retention Loop)

```
ลูกค้ามาใช้บริการ
    │
    ▼
ช่างทำ DVI ตรวจสภาพรถรอบคัน
    │
    ├──→ 🟢 ดี → บันทึกไว้
    ├──→ 🟡 ควรเปลี่ยนเร็วๆ → ลูกค้าเลือกซ่อมตอนนี้ หรือ ไว้ทีหลัง
    └──→ 🔴 ต้องซ่อม → แจ้งลูกค้า + Additional Work Request
    │
    ▼
ส่ง Vehicle Health Report ให้ลูกค้า
    │
    ▼
งานเสร็จ → ส่งรีวิว → ได้คะแนนสะสม
    │
    ▼
ระบบ Smart Recall ทำงานอัตโนมัติ:
    ├──→ 🟡 Follow-up: "ตอนนั้นผ้าเบรคเหลือ 30% ตอนนี้น่าจะถึงเวลาเปลี่ยนแล้ว"
    ├──→ ⏰ เช็คระยะ: "ครบ 10,000 km แล้ว จองเช็คระยะเลย"
    ├──→ 📅 พ.ร.บ./ประกัน: "พ.ร.บ. จะหมดเดือนหน้า ต่อที่อู่เราได้"
    └──→ 🎂 Birthday: "สุขสันต์วันเกิด! รับส่วนลด 15%"
    │
    ▼
ลูกค้ากลับมาใช้บริการอีก ← (วนลูป)
```

---

*แผนนี้ออกแบบตามหลัก Vercel Agent Skills: react-best-practices (40+ rules), web-design-guidelines (100+ rules), composition-patterns*
