# KPServicePro - Setup & Deployment Guide

คู่มือการตั้งค่าและ deploy โปรเจกต์ KPServicePro ทั้ง local development และ production บน Vercel

---

## สารบัญ

1. [ข้อกำหนดเบื้องต้น](#1-ข้อกำหนดเบื้องต้น)
2. [ตั้งค่า Supabase](#2-ตั้งค่า-supabase)
3. [ตั้งค่า VAPID Keys (Push Notification)](#3-ตั้งค่า-vapid-keys-push-notification)
4. [Environment Variables ทั้งหมด](#4-environment-variables-ทั้งหมด)
5. [รัน Local Development](#5-รัน-local-development)
6. [Deploy บน Vercel](#6-deploy-บน-vercel)
7. [รัน Database Migrations](#7-รัน-database-migrations)
8. [ตั้งค่า LINE OA (Optional)](#8-ตั้งค่า-line-oa-optional)
9. [หลัง Deploy - ตรวจสอบระบบ](#9-หลัง-deploy---ตรวจสอบระบบ)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. ข้อกำหนดเบื้องต้น

| รายการ | เวอร์ชันขั้นต่ำ |
|--------|----------------|
| Node.js | 18.17 ขึ้นไป (แนะนำ 22.x) |
| npm | 9.x ขึ้นไป |
| Supabase Project | สร้างผ่าน [supabase.com](https://supabase.com) |
| Vercel Account | สมัครผ่าน [vercel.com](https://vercel.com) |

---

## 2. ตั้งค่า Supabase

### 2.1 สร้าง Supabase Project

1. ไปที่ [app.supabase.com](https://app.supabase.com) แล้วสร้าง project ใหม่
2. เลือก region ที่ใกล้ที่สุด (แนะนำ **Southeast Asia - Singapore**)
3. ตั้ง database password (เก็บไว้ให้ดี)

### 2.2 ดึง API Keys

ไปที่ **Settings > API** ใน Supabase Dashboard จะเจอ:

| ค่า | ตำแหน่งใน Dashboard | ใช้เป็น Environment Variable |
|-----|---------------------|------------------------------|
| Project URL | Settings > API > Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public key | Settings > API > Project API keys > anon | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | Settings > API > Project API keys > service_role | `SUPABASE_SERVICE_ROLE_KEY` |

> **คำเตือน:** `SUPABASE_SERVICE_ROLE_KEY` เป็น secret key ที่มีสิทธิ์เข้าถึงทุกอย่าง ห้ามเปิดเผยหรือใช้ฝั่ง client เด็ดขาด

### 2.3 รัน Database Schema

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. รัน SQL จากไฟล์ `src/lib/supabase/database.sql` (schema หลัก)
3. รัน SQL จากไฟล์ `src/lib/supabase/migrations/001_push_notifications.sql` (push notification tables)

### 2.4 ตั้งค่า Authentication

1. ไปที่ **Authentication > Providers**
2. เปิด **Email** provider (เปิดอยู่แล้วโดย default)
3. ไปที่ **Authentication > URL Configuration**
4. ตั้ง **Site URL** เป็น URL ของ production site (เช่น `https://your-domain.com`)
5. เพิ่ม **Redirect URLs**:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (สำหรับ dev)

---

## 3. ตั้งค่า VAPID Keys (Push Notification)

VAPID Keys ใช้สำหรับ Web Push Notification ต้องสร้างครั้งเดียวแล้วใช้ตลอด

### 3.1 สร้าง VAPID Keys

```bash
npx web-push generate-vapid-keys
```

ผลลัพธ์:

```
=======================================
Public Key:
BJ2oMw01C5viZMCN7fX0zZI_jyncuPzMUqFWuKshtg3_6Qsj5D3XAcn96HL1gpRYiqc7kg_tUYmJTjBIIYKrEoQ

Private Key:
zeDQsOaFYMR6nxmWmRTxyIHzYDkD3Ngsd8OfJxcxpiE
=======================================
```

### 3.2 ค่า VAPID Keys ปัจจุบัน (สำหรับโปรเจกต์นี้)

| Variable | ค่า |
|----------|-----|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BJ2oMw01C5viZMCN7fX0zZI_jyncuPzMUqFWuKshtg3_6Qsj5D3XAcn96HL1gpRYiqc7kg_tUYmJTjBIIYKrEoQ` |
| `VAPID_PRIVATE_KEY` | `zeDQsOaFYMR6nxmWmRTxyIHzYDkD3Ngsd8OfJxcxpiE` |
| `VAPID_SUBJECT` | `mailto:admin@kpservicepro.com` |

> **หมายเหตุ:** หากต้องการเปลี่ยน VAPID keys ใหม่ ผู้ใช้ทุกคนจะต้อง re-subscribe push notification ใหม่ทั้งหมด

---

## 4. Environment Variables ทั้งหมด

### 4.1 ตารางสรุป

| Variable | ประเภท | จำเป็น | คำอธิบาย | ตัวอย่างค่า |
|----------|--------|:------:|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | **ใช่** | Supabase Project URL | `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | **ใช่** | Supabase anon/public API key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | **ใช่** | Supabase service role key (server-side only) | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_APP_URL` | Public | **ใช่** | URL ของแอป (ไม่มี trailing slash) | `https://your-domain.com` |
| `NEXT_PUBLIC_SITE_URL` | Public | **ใช่** | URL ของเว็บไซต์ (ใช้สำหรับ auth redirect) | `https://your-domain.com` |
| `NEXT_PUBLIC_APP_NAME` | Public | ไม่ | ชื่อแอป (default: KPServicePro) | `KPServicePro` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public | **ใช่** | VAPID public key สำหรับ Web Push | `BJ2oMw01C5vi...` |
| `VAPID_PRIVATE_KEY` | Secret | **ใช่** | VAPID private key สำหรับ Web Push | `zeDQsOaFYMR6...` |
| `VAPID_SUBJECT` | Secret | **ใช่** | VAPID subject (email ผู้ดูแล) | `mailto:admin@kpservicepro.com` |
| `INTERNAL_API_KEY` | Secret | ไม่ | API key สำหรับ internal API calls (cron jobs) | `your-random-secret-key` |

### 4.2 ไฟล์ .env.local (สำหรับ Local Development)

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์:

```env
# =============================================================================
# Supabase
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-role-key

# =============================================================================
# Application
# =============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=KPServicePro
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# =============================================================================
# Web Push (VAPID)
# =============================================================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJ2oMw01C5viZMCN7fX0zZI_jyncuPzMUqFWuKshtg3_6Qsj5D3XAcn96HL1gpRYiqc7kg_tUYmJTjBIIYKrEoQ
VAPID_PRIVATE_KEY=zeDQsOaFYMR6nxmWmRTxyIHzYDkD3Ngsd8OfJxcxpiE
VAPID_SUBJECT=mailto:admin@kpservicepro.com

# =============================================================================
# Internal (Optional)
# =============================================================================
# INTERNAL_API_KEY=your-random-secret-key-for-cron-jobs
```

> **สำคัญ:** ไฟล์ `.env.local` อยู่ใน `.gitignore` แล้ว จะไม่ถูก push ขึ้น Git

---

## 5. รัน Local Development

```bash
# 1. Clone repository
gh repo clone kpcrmv4/servicepro
cd servicepro

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env.local (ดูหัวข้อ 4.2)
cp .env.example .env.local
# แก้ไขค่าใน .env.local ตามจริง

# 4. รัน development server
npm run dev

# เปิด http://localhost:3000
```

---

## 6. Deploy บน Vercel

### 6.1 เชื่อมต่อ Repository

1. ไปที่ [vercel.com/new](https://vercel.com/new)
2. Import Git Repository: `kpcrmv4/servicepro`
3. เลือก **Framework Preset**: Next.js (auto-detect)
4. เลือก **Root Directory**: `./` (default)

### 6.2 ตั้ง Environment Variables บน Vercel

ไปที่ **Settings > Environment Variables** แล้วเพิ่มทีละตัว:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (ค่าจาก Supabase Dashboard) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | (ค่าจาก Supabase Dashboard) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-preview-url.vercel.app` | Preview |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://your-preview-url.vercel.app` | Preview |
| `NEXT_PUBLIC_APP_NAME` | `KPServicePro` | Production, Preview, Development |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BJ2oMw01C5viZMCN7fX0zZI_jyncuPzMUqFWuKshtg3_6Qsj5D3XAcn96HL1gpRYiqc7kg_tUYmJTjBIIYKrEoQ` | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | `zeDQsOaFYMR6nxmWmRTxyIHzYDkD3Ngsd8OfJxcxpiE` | Production, Preview, Development |
| `VAPID_SUBJECT` | `mailto:admin@kpservicepro.com` | Production, Preview, Development |
| `INTERNAL_API_KEY` | (สร้างค่า random เอง) | Production |

### 6.3 Build Settings

Vercel จะ auto-detect ค่าเหล่านี้ แต่ตรวจสอบให้แน่ใจ:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Node.js Version | 22.x |

### 6.4 Custom Domain (Optional)

1. ไปที่ **Settings > Domains**
2. เพิ่ม domain ของคุณ (เช่น `app.kpservicepro.com`)
3. ตั้ง DNS records ตามที่ Vercel แนะนำ
4. อัปเดต `NEXT_PUBLIC_APP_URL` และ `NEXT_PUBLIC_SITE_URL` เป็น domain ใหม่
5. อัปเดต **Site URL** ใน Supabase Authentication settings ด้วย

### 6.5 Deploy

```bash
# Push code ไปที่ main branch จะ auto-deploy
git push origin main

# หรือใช้ Vercel CLI
npx vercel --prod
```

---

## 7. รัน Database Migrations

### 7.1 Schema หลัก (ครั้งแรก)

1. เปิด **SQL Editor** ใน [Supabase Dashboard](https://app.supabase.com)
2. คัดลอกเนื้อหาจาก `src/lib/supabase/database.sql`
3. กด **Run** เพื่อสร้าง tables, RLS policies, functions ทั้งหมด

### 7.2 Push Notification Migration

1. เปิด **SQL Editor** ใน Supabase Dashboard
2. คัดลอกเนื้อหาจาก `src/lib/supabase/migrations/001_push_notifications.sql`
3. กด **Run** เพื่อสร้าง:
   - `push_subscriptions` - เก็บ Web Push subscription ของแต่ละ user/device
   - `notifications` - เก็บประวัติแจ้งเตือนทั้งหมด
   - `tenant_notification_config` - ตั้งค่าแจ้งเตือนระดับร้าน
   - RLS policies สำหรับทุก table
   - Trigger function สำหรับ auto-seed notification config เมื่อสร้าง tenant ใหม่

### 7.3 ตรวจสอบ Migration สำเร็จ

รัน query นี้ใน SQL Editor เพื่อตรวจสอบว่า tables ถูกสร้างแล้ว:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

ควรเห็น tables เหล่านี้ (อย่างน้อย):

```
customers
dvi_inspections
insurance_claims
job_items
jobs
notifications          -- จาก migration 001
push_subscriptions     -- จาก migration 001
tenant_notification_config  -- จาก migration 001
tenants
time_clock_entries
users
vehicles
...
```

---

## 8. ตั้งค่า LINE OA (Optional)

LINE OA integration ตั้งค่าผ่าน Dashboard ของแต่ละร้าน ไม่ต้องตั้ง environment variable

1. สร้าง LINE Official Account ที่ [LINE Developers Console](https://developers.line.biz)
2. สร้าง Messaging API channel
3. ไปที่ **Dashboard > ตั้งค่า > LINE OA** ในระบบ KPServicePro
4. กรอก Channel ID, Channel Secret, Channel Access Token
5. ตั้ง Webhook URL เป็น `https://your-domain.com/api/line/webhook`

---

## 9. หลัง Deploy - ตรวจสอบระบบ

### 9.1 Checklist

- [ ] เปิดเว็บไซต์ได้ปกติ
- [ ] สมัครสมาชิก/เข้าสู่ระบบได้
- [ ] Dashboard แสดงข้อมูลถูกต้อง
- [ ] PWA: เปิด Chrome DevTools > Application > Manifest ตรวจสอบว่า manifest โหลดได้
- [ ] PWA: ตรวจสอบ Service Worker ลงทะเบียนสำเร็จ
- [ ] Push Notification: ไปที่ ตั้งค่า > การแจ้งเตือน > กดเปิดการแจ้งเตือน
- [ ] Push Notification: ตรวจสอบว่า browser ขอ permission สำเร็จ

### 9.2 ตรวจสอบ PWA

เปิด Chrome DevTools (F12) > **Application** tab:

- **Manifest**: ควรเห็นข้อมูลแอป, icons
- **Service Workers**: ควรเห็น `sw.js` status = activated and running
- **Cache Storage**: ควรเห็น `kpservicepro-v1` cache

### 9.3 ทดสอบ Push Notification

1. เข้าสู่ระบบ
2. ไปที่ **ตั้งค่า > การแจ้งเตือน**
3. กดปุ่ม **เปิดการแจ้งเตือน**
4. อนุญาต notification permission ใน browser
5. ระบบจะ subscribe สำเร็จ

---

## 10. Troubleshooting

### Build ไม่ผ่าน

```bash
# ลบ cache แล้ว build ใหม่
rm -rf .next node_modules
npm install
npm run build
```

### Push Notification ไม่ทำงาน

1. ตรวจสอบว่า `NEXT_PUBLIC_VAPID_PUBLIC_KEY` และ `VAPID_PRIVATE_KEY` ตั้งค่าถูกต้อง
2. ตรวจสอบว่า browser รองรับ Push API (Chrome, Firefox, Edge)
3. ตรวจสอบว่า Service Worker ลงทะเบียนสำเร็จ (DevTools > Application > Service Workers)
4. ตรวจสอบว่าเว็บไซต์ใช้ HTTPS (Push Notification ต้องใช้ HTTPS ยกเว้น localhost)

### Supabase connection error

1. ตรวจสอบว่า `NEXT_PUBLIC_SUPABASE_URL` ถูกต้อง
2. ตรวจสอบว่า `NEXT_PUBLIC_SUPABASE_ANON_KEY` ถูกต้อง
3. ตรวจสอบว่า Supabase project ยัง active อยู่ (free tier จะ pause หลัง 7 วันไม่ใช้งาน)

### PWA ไม่แสดง Install Prompt

1. ต้องเปิดผ่าน HTTPS (หรือ localhost)
2. ต้องมี `manifest.json` ที่ถูกต้อง
3. ต้องมี Service Worker ลงทะเบียนสำเร็จ
4. ต้องมี icon อย่างน้อย 192x192 และ 512x512
5. ผู้ใช้ต้องเข้าเว็บอย่างน้อย 2 ครั้ง ห่างกัน 5 นาที (Chrome requirement)

---

## โครงสร้างไฟล์ที่เกี่ยวข้อง

```
servicepro/
├── .env.example                    # Template environment variables
├── .env.local                      # Local env (ไม่อยู่ใน Git)
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service Worker
│   └── icons/                      # PWA icons (72-512px)
├── src/
│   ├── app/
│   │   ├── layout.tsx              # PWA meta tags
│   │   ├── offline/page.tsx        # Offline fallback
│   │   ├── api/
│   │   │   ├── push/
│   │   │   │   ├── send/route.ts   # Web Push API + VAPID
│   │   │   │   └── subscribe/route.ts
│   │   │   └── notifications/
│   │   │       └── config/route.ts # Tenant notification config API
│   │   └── (dashboard)/
│   │       ├── layout.tsx          # PWARegister component
│   │       └── dashboard/
│   │           ├── notifications/page.tsx        # Notification Center
│   │           └── settings/notifications/page.tsx # Notification Settings
│   ├── components/
│   │   ├── pwa/pwa-register.tsx    # SW registration + install/update banners
│   │   └── notifications/notification-bell.tsx
│   ├── hooks/
│   │   ├── use-push-notification.ts
│   │   └── use-notifications.ts
│   └── lib/
│       ├── actions/notifications.ts
│       ├── notifications/triggers.ts
│       ├── types/notifications.ts
│       └── supabase/
│           ├── database.sql        # Main schema
│           └── migrations/
│               └── 001_push_notifications.sql
└── docs/
    ├── setup.md                    # (ไฟล์นี้)
    └── pwa-push-notification.md    # เอกสาร PWA + Push Notification
```
