# KPServicePro — UI/UX Redesign Plan

> เอกสารวางแผนรีดีไซน์ระบบ KPServicePro ทุกหน้า (60+ routes) ทั้งบนจอใหญ่และจอเล็ก
> เริ่มจากวิเคราะห์ปัญหาที่เห็นจาก production (`servicepro-sage.vercel.app`)
> และ codebase ปัจจุบัน แล้วเสนอ design system + roadmap แก้เป็นเฟส
>
> สถานะ: 🟡 **Phase 0 — Design Audit** (ยังไม่เริ่มเขียนโค้ด)
> Stack: Next.js 16 + React 19 + Tailwind v4 + Supabase + Framer Motion + Recharts

---

## 1. สรุปสภาพปัจจุบัน (Current State)

### 1.1 ที่ทำดีอยู่แล้ว (จะเก็บไว้)

- **Design tokens** ที่ `globals.css` ใช้ CSS custom properties + tailwind v4 `@theme inline` — รองรับ light/dark mode ครบ
- **สี soft purple** (#7C5BFB primary + lavender bg) เอกลักษณ์ชัด ดูทันสมัย
- **Pastel palette** (purple/pink/cyan/mint/amber/rose) สำหรับ stat cards
- **Font stack** Figtree + Noto Sans Thai รองรับไทยดี
- **Print styles** มี `.no-print` + `print-clean` ใช้กับใบเสนอราคา/ใบเสร็จได้ทันที
- **Min touch target 44px + font 16px บน mobile input** กัน iOS zoom — ดี
- **PWA register + offline page** มีรากฐานแล้ว

### 1.2 ปัญหาที่พบจากสกรีนช็อต (3 หน้า)

#### ⚠️ Dashboard (`/dashboard`)

| # | ปัญหา | ผลกระทบ |
|---|------|---------|
| D1 | **Hero card สีม่วง gradient สูงเกิน 200px** แสดง "รายรับเดือนนี้ ฿0" + "0 งานเดือนนี้" — ข้อมูลซ้ำกับ stat row ด้านล่างแน่นอน | เสียพื้นที่เหนือ fold, fold มี data ซ้ำ |
| D2 | **Stat row 3 ใบ pastel** — icon มุมขวาเล็กมาก padding ไม่สม่ำเสมอ ไม่มี trend indicator | ดู unbalanced เทียบ hero |
| D3 | **Monthly chart Y-axis 1/2/3/4** เต็มจำนวน → ค่าจริง 0 จึงไม่ขึ้นเส้น | ดูเหมือนกราฟพัง |
| D4 | **Donut "สถานะงานทั้งหมด" บอก 6 งาน** แต่ Hero บอก "0 งานเดือนนี้" | ขัดแย้งในตา |
| D5 | **Theme toggle 3 ปุ่ม light/system/dark** ติดกัน — กินพื้นที่มาก | ไม่จำเป็น 3-state |
| D6 | **Header search input ขนาดใหญ่** แต่ขวาเปล่า | ไม่สมดุล |

#### ⚠️ Jobs Management (`/dashboard/jobs`)

| # | ปัญหา | ผลกระทบ |
|---|------|---------|
| J1 | **Tab bar 5 tab ไม่มี count badge** — `รับรถ / คิว / รายการ / ตาราง / ใบเสนอ` | user ไม่รู้แต่ละ tab มีกี่ใบ |
| J2 | **ตารางมี 9 columns** บนจอใหญ่ก็แน่นแล้ว, mobile ต้อง scroll แนวนอน — ไม่มี mobile card view | mobile ใช้ไม่ได้จริง |
| J3 | **Status column ซ้อน 2 ชั้น** (badge "กำลังซ่อม" + 4 dots progress) | สับสน อ่านยาก |
| J4 | **ไม่มี action menu (kebab)** ในแต่ละแถว → user ต้องคลิก JOB number เพื่อเข้า detail | flow ช้า |
| J5 | **column header ไม่คลิก sort ได้, ไม่มี filter pop-over** | filter เฉพาะ status ไม่พอ |
| J6 | **ไม่มี pagination + bulk select** | 1000 rows = freeze |
| J7 | **Search input + filter chip + sub-tab status ทั้ง 3 อย่างกระจาย** วางคนละจุด | UX แตก |
| J8 | **ช่าง = text plain ไม่มี avatar** | ดูจืด, brand ของอู่หาย |

#### ⚠️ Create Job Order (`/dashboard/jobs/new`)

| # | ปัญหา | ผลกระทบ |
|---|------|---------|
| F1 | **`<select>` native ทุก field** (ลูกค้า, รถ, ประเภท, priority, ช่าง) | ดูเก่า, ลูกค้า 1000 คนเลือกไม่ได้ |
| F2 | **Layout 1 column max-w-2xl** บนจอใหญ่ฝั่งขวาเปล่า | ไม่ใช้ space |
| F3 | **ไม่มี grouping** — 8 fields ไหลต่อกัน | scan ยาก |
| F4 | **ไม่มี breadcrumb** มีแค่ปุ่มย้อนกลับ | navigation context หาย |
| F5 | **Bay = text input** ไม่ใช้ availability data | บันทึก typo ได้ |
| F6 | **Description textarea ไม่มี template** | technician พิมพ์ซ้ำซาก |
| F7 | **Submit button ไม่มี progress copy** "กำลังสร้าง..." แค่ disable | ไม่รู้กำลังทำอะไร |

### 1.3 ปัญหาเชิงระบบ (System-level — กระทบทุกหน้า)

| # | ปัญหา | กระทบหน้า |
|---|------|-----------|
| S1 | **Sidebar 14 items + แค่ divider** ไม่มี collapsible group → สูง 700px+ | ทุก dashboard |
| S2 | **ไม่มี breadcrumb global** ใน Header | ทุก detail page |
| S3 | **Radius ใช้ปนกัน** rounded-lg / xl / 2xl / 3xl ในหน้าเดียว | ทุกหน้า — ดู inconsistent |
| S4 | **Shadow ไม่มี hierarchy** — shadow-sm / md / lg / xl / 2xl ปนกัน | ทุกหน้า |
| S5 | **Native `<select>`** ใช้ทั่วระบบ — ไม่อยู่ใน UI library | jobs/new, customers, finance, settings |
| S6 | **ไม่มี Combobox / Searchable Select / Date Range Picker** | dropdown ที่ option > 20 ใช้ไม่ได้ |
| S7 | **`<table>` raw + ไม่มี mobile fallback** | jobs, customers, inventory, finance, super-admin |
| S8 | **ไม่มี `EmptyState` component** ใช้ Inbox icon + ข้อความ — ไม่มี CTA | ทุก list page |
| S9 | **ไม่มี skeleton loading** | server fetch ช้า → blank screen |
| S10 | **PageHeader padding double** (Header padding + main padding 4–6) | spacing ไม่ตรง |
| S11 | **Bottom nav floating pill** — contrast/elevation/safe-area ไม่ครบ (จะคงรูปทรง pill ไว้แต่ fix attribute เหล่านี้) | mobile dashboard |
| S12 | **Theme toggle ใช้ 3-state pill** กว้างเกินจำเป็น | header desktop |
| S13 | **ไม่มี global command palette (⌘K)** placeholder ใน search แต่ยัง stub | productivity |
| S14 | **Mobile sidebar = drawer 260px** เปิดมาทับเต็มจอ ไม่มี swipe gesture | tablet/mobile |

---

## 2. หลักการรีดีไซน์ (Design Principles)

### 2.1 หลักการหลัก
1. **Mobile-first จริง ๆ** — design จาก 360px แล้วค่อย expand ไป tablet/desktop ไม่ใช่ทำ desktop แล้วบีบลง
2. **Information density ปรับตามอุปกรณ์** — table 9-column บนเดสก์ท็อป → card stack บนมือถือ (ไม่ใช่ scroll แนวนอน)
3. **Hierarchy ผ่าน spacing + typography ไม่ใช่ shadow** — flat-ish ลด shadow แค่ 2 level (resting + raised)
4. **Action ใกล้ context** — แทนที่ user จะวิ่งหา "ปุ่มสร้าง" ที่มุมขวาบน ใส่ inline action ตรงที่งานเกิด
5. **Progressive disclosure** — ฟอร์มยาวซ่อน optional ไว้ใน "เพิ่มเติม" เห็น required ก่อน
6. **One brand voice** — purple primary + neutral grays + status colors เท่านั้น ไม่เพิ่มสีอื่น

### 2.2 Token Adjustments (รวมเข้า globals.css)

```css
/* Spacing scale แบบ deterministic */
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */

/* Radius — ลดเหลือ 4 step */
--radius-sm: 0.5rem;     /* input, badge */
--radius-md: 0.75rem;    /* button, small card */
--radius-lg: 1rem;       /* card, dialog, panel */
--radius-xl: 1.25rem;    /* hero, big section */
/* ลบ --radius-2xl 2rem ออก — ใช้น้อย ดูเหมือน "round bubble" เกินไป */

/* Shadow — เหลือ 2 level + focus ring */
--shadow-resting: 0 1px 2px 0 rgba(15, 12, 40, 0.04), 0 1px 3px 0 rgba(15, 12, 40, 0.06);
--shadow-raised: 0 4px 6px -1px rgba(15, 12, 40, 0.06), 0 10px 15px -3px rgba(15, 12, 40, 0.08);
/* primary glow เก็บไว้สำหรับ CTA เด่น */
--shadow-primary: 0 8px 20px -4px rgba(124, 91, 251, 0.35);

/* Typography scale — match Tailwind v4 */
--text-display: 2rem / 2.5rem;     /* 32 / 40 — page title */
--text-h1: 1.5rem / 2rem;          /* 24 / 32 — section */
--text-h2: 1.125rem / 1.5rem;      /* 18 / 24 — card title */
--text-body: 0.875rem / 1.375rem;  /* 14 / 22 */
--text-caption: 0.75rem / 1rem;    /* 12 / 16 */
```

### 2.3 Layout Grid (ใหม่)

| Breakpoint | Sidebar | Content padding | Bottom nav |
|------------|---------|----------------|------------|
| < 640 (mobile) | drawer | 16px | floating pill |
| 640–1023 (tablet) | drawer | 20px | floating pill |
| ≥ 1024 (desktop) | rail 72 / full 256 | 32px | — |
| ≥ 1280 (wide) | full 256 | 40px (max-w-7xl center) | — |

**สำคัญ**: คง **floating pill (เดิม)** ไว้ แต่ปรับ:
- backdrop ใช้ `bg-surface/85 + backdrop-blur-md` (อ่านง่ายเหนือ content)
- shadow ใช้ `--shadow-raised` + `--shadow-primary` ตอน active
- bottom inset = `max(16px, env(safe-area-inset-bottom))`
- content padding-bottom = `calc(64px + env(safe-area-inset-bottom) + 16px)` ≈ `pb-24`
- รองรับ scroll-hide: ซ่อน pill ตอน scroll ลง, โผล่ตอน scroll ขึ้น (Phase 1.11)

---

## 3. Design System ใหม่ — Component Library

> Component ใหม่ที่จะสร้างในโฟลเดอร์ `src/components/ui/` (เพิ่มจาก 8 ที่มีอยู่)

### 3.1 Atoms (เพิ่ม)

| Component | สถานะ | หน้าที่ |
|-----------|------|---------|
| `Button` | ✅ มีแล้ว — ปรับ variant/size | เพิ่ม `loading` prop พร้อม spinner inline |
| `Input` | ✅ มีแล้ว — ปรับ height 44 → 40 desktop, 44 mobile | เพิ่ม `prefix/suffix icon`, `error` state |
| `Card` | ✅ มีแล้ว | ลบ shadow-sm default ออก (ให้ caller เลือก) |
| `Badge` | ✅ มีแล้ว | เพิ่ม `dot` prop, `tone: success/warn/error/info/neutral` |
| `Avatar` | ✅ มีแล้ว | เพิ่ม `AvatarGroup` (ซ้อน 3 + count) |
| `Skeleton` | ❌ ใหม่ | block / text / circle variants |
| `Spinner` | ❌ ใหม่ | sm/md/lg + color |
| `Tooltip` | ❌ ใหม่ | radix-style แต่ไม่ติด radix dependency (ใช้ framer-motion) |
| `Kbd` | ❌ ใหม่ | render `⌘K`, `Esc` keyboard hints |

### 3.2 Form Controls (สร้างใหม่)

| Component | แทน | feature |
|-----------|-----|---------|
| `Select` | native `<select>` | keyboard nav, placeholder, prefix icon |
| `Combobox` | — | search + virtualized list (สำหรับลูกค้า/ช่าง 1000+ items) |
| `MultiSelect` | — | chips + clear all (สำหรับ filter หลาย status) |
| `DatePicker` | native `<input type="date">` | แสดง พ.ศ., today shortcut, range mode |
| `RadioGroup` | radio inputs | segmented look (chip-style) |
| `Switch` | checkbox | iOS-style |
| `Textarea` | ✅ มีแล้ว | เพิ่ม char count + auto-resize |
| `FileUpload` | input file | preview thumbnail + drag-drop |
| `FormField` | label+input | unified label + error + hint slot |

### 3.3 Molecules (สร้างใหม่)

| Component | หน้าที่ |
|-----------|--------|
| `StatCard` | label + value + delta + icon — รองรับ pastel tone, sparkline (optional) |
| `EmptyState` | icon + title + body + CTA — มี variant: `no-data`, `error`, `search-no-result` |
| `PageHeader` | ✅ ปรับ — เพิ่ม slot breadcrumb, slot tabs, sticky behavior |
| `SearchBar` | input + filter chips + clear all |
| `FilterPopover` | dropdown สำหรับ table column filter |
| `Pagination` | page nav + items-per-page + total count |
| `Toolbar` | search + filter + sort + bulk actions row (ด้านบน table) |
| `KbdHint` | inline help text "กด `⌘K` เพื่อค้น" |

### 3.4 Organisms (สร้างใหม่ — กระทบหลายหน้า)

| Component | ใช้ที่ไหน |
|-----------|-----------|
| `DataTable` | jobs, customers, vehicles, parts, suppliers, finance, super-admin (≥ 8 หน้า) — รองรับ sort/filter/pagination/row-action/bulk |
| `MobileCardList` | mobile fallback ของ DataTable (auto-render เมื่อ < 640px) |
| `KanbanBoard` | jobs queue, time-clock — column + drag-drop (optional Phase 2) |
| `Timeline` | jobs detail audit, customer service history |
| `FormSection` | grouping fields + collapsible (สำหรับ jobs/new, settings) |
| `CommandPalette` | ⌘K global search — quick nav + create actions |
| `Drawer` | edit panel แทน full-page edit (jobs detail, customer detail) |
| `ConfirmDialog` | delete/destructive action — ใช้แทน window.confirm |
| `Toast` | success/error feedback — รวมจาก scattered alert state |

---

## 4. Layout Redesign — Sidebar / Header / Bottom Nav

### 4.1 Sidebar (เดิม 14 items flat → ใหม่ grouped)

```
┌─────────────────────────────┐
│ [KP] KPServicePro           │ <- logo block 56px
│      ระบบจัดการอู่ซ่อมรถ   │
├─────────────────────────────┤
│ ⌘K  ค้นหา                  │ <- inline command trigger
├─────────────────────────────┤
│ ── หลัก                    │
│ 🏠 แดชบอร์ด                 │
│                             │
│ ── ปฏิบัติการ              │
│ 🔧 งานซ่อม          [12]    │ <- badge active
│ 📅 คิวจอง           [3]    │
│ ✅ ตรวจสภาพรถ              │
│ 📋 รับรถ                   │ <- ใหม่ แยกจาก "งานซ่อม"
│                             │
│ ── ทรัพย์สิน               │
│ 📦 คลังอะไหล่              │
│ 💰 การเงิน           [!]    │ <- alert dot
│ 🛡 รับประกัน                │
│                             │
│ ── คน                      │
│ 👥 ลูกค้า                   │
│ 👤 ทีมงาน                   │
│                             │
│ ── การสื่อสาร              │
│ 🔔 แจ้งเตือนลูกค้า          │
│ 📚 คลังความรู้              │
│ 📊 รายงาน                   │
│                             │
│ ── ช่องทางขาย              │
│ 🌐 Landing Page            │
│ 🏪 ร้านค้าออนไลน์          │
├─────────────────────────────┤
│ ⚙️ ตั้งค่า                  │
│ 👤 [Avatar] สมศักดิ์         │ <- user pill (ย้ายจาก header)
└─────────────────────────────┘
```

**การเปลี่ยน**:
1. Group เป็น 6 หมวด: หลัก / ปฏิบัติการ / ทรัพย์สิน / คน / การสื่อสาร / ช่องทางขาย
2. แต่ละ group มี text label เล็ก uppercase เป็นหัวข้อ ไม่ใช่แค่เส้น divider
3. ย้าย user avatar จาก header → ก้น sidebar (Linear/Notion pattern)
4. เพิ่ม **command palette trigger** "⌘K ค้นหา" ที่หัว sidebar
5. **Active badge** สำหรับเมนูที่มี action ที่ต้องดู (jobs ที่รออนุมัติ, การเงินที่ overdue)
6. Rail mode (72px) ตอน collapse — แสดงเฉพาะ icon + tooltip on hover

### 4.2 Header (Desktop)

เดิม: search กลาง + theme + bell + user menu — header สูง 64px เปลี่ยนเป็น:

```
┌───────────────────────────────────────────────────┐
│  Dashboard › งานซ่อม › #JOB-2026-0003            │ <- breadcrumb
│  รายละเอียดงาน                          [+ Action]│ <- title + primary CTA
└───────────────────────────────────────────────────┘
```

ลบ search bar กลางออก (ไปอยู่ใน sidebar เป็น ⌘K) ลบ theme toggle 3-button ออก เหลือ icon toggle 1 ปุ่มใน user dropdown แทน — header เหลือสูง **48px (mobile) / 56px (desktop)**

### 4.3 Header (Mobile)

```
┌───────────────────────────┐
│  ☰  KPServicePro    🔔 KP │ <- 48px
└───────────────────────────┘
```

แค่ menu trigger + brand + bell + avatar — ไม่มี search bar (ใช้ ⌘K floating action ในหน้า list)

### 4.4 Bottom Nav (Mobile) — **floating pill (คงเดิม + refactor)**

ปัจจุบัน floating pill + center-bumped action ดีอยู่แล้วในแง่ visual แต่:
- contrast/legibility ต่ำเมื่อทับ content สีอ่อน
- pb-24 ของ content เผื่อไว้แต่ใช้ภายในไม่สม่ำเสมอ
- ไม่มี safe-area-inset-bottom ในบางหน้า → กิน gesture bar iPhone
- ไม่มี scroll-hide → บังเนื้อหาตอน scan list ยาว

**ใหม่ (คงรูปทรง pill)**:
- 4 tab + center primary action FAB-style (เช่น "+ สร้างงาน" บน list page)
- `bg-surface/85 + backdrop-blur-md` เพิ่ม legibility
- shadow `--shadow-raised`; ปุ่ม active = `--shadow-primary`
- safe-area `bottom: max(16px, env(safe-area-inset-bottom))`
- scroll-hide ด้วย `useScrollDirection()` hook (Phase 1.11)

```
┌───────────────────────────┐
│                           │
│         (content)         │
│                           │
│                           │
│   ╭──────────────────╮    │ <- pill ลอยอยู่ มี margin รอบ
│   │ 🏠  🔧  ➕  👥 ⋯ │    │ <- 4 tabs + center FAB action
│   ╰──────────────────╯    │
└───────────────────────────┘
```

ลด tab จาก 5 เหลือ **4 + ⋯** (more menu = bottom sheet) — มากกว่านั้นไม่จำ
center FAB **context-aware**: list page = "+ สร้าง", detail page = "เปลี่ยนสถานะ" ฯลฯ

---

## 5. Page-by-Page Redesign Plan

> ตาราง mapping 60+ หน้าเข้า phase. ระดับ effort: S=ครึ่งวัน, M=1 วัน, L=2-3 วัน, XL=> 3 วัน

### 5.1 Group A — Marketing & Auth (Public)

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/` (marketing) | L | Hero ใหม่ + screenshot real ไม่ใช่ placeholder + testimonial — **Phase 4 (สุดท้าย)** |
| `/login` | S | Card layout, social login slot, error state ใช้ Toast |
| `/register` | S | 2-step wizard (account → shop info) |
| `/forgot-password` | S | success state + resend countdown |
| `/trial` | M | hero + plan compare + form ใน 1 หน้า — convert focus |

### 5.2 Group B — Customer Facing (LIFF + PWA)

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/c` | M | Hero card + active job list + quick actions — mobile only design |
| `/c/login` | S | OTP-style |
| `/c/booking` | M | Step booking wizard |
| `/c/membership` | S | Tier card + points history |
| `/c/quotation/[id]` | M | mobile-friendly quote view + accept/reject button + signature |
| `/c/track/[token]` | M | Timeline ของ job + photo gallery |
| `/c/vehicles/[id]` | S | service history + warranty badge |
| `/inspect/[token]` | M | photo grid + check items + accept signature |
| `/liff/booking` | S | embed of /c/booking |
| `/shop/[slug]` + 4 sub | L | E-commerce — แยกออกเป็น sub-project ก็ได้ |

### 5.3 Group C — Dashboard Core (Operations)

#### C1. Dashboard Home — `/dashboard` (M)

**Layout ใหม่ (mobile)**:
```
┌──────────────────┐
│ สวัสดี สมศักดิ์ 👋 │  <- 64px greeting bar (no big hero)
│ อู่ช่างมิตร...      │
├──────────────────┤
│ [+ สร้างงานซ่อม]   │  <- primary CTA prominent
├──────────────────┤
│ 4 stat cards 2x2 │  <- grid, ไม่ใช้ pastel ใหญ่
│ • งานวันนี้ 5     │
│ • รายรับ ฿0       │
│ • ลูกค้า 5        │
│ • ค้างชำระ 0      │
├──────────────────┤
│ [Tab: งานล่าสุด]  │  <- จัดเป็น tabs
│  รายการล่าสุด...    │
├──────────────────┤
│ Donut + Chart    │  <- collapse to single chart
└──────────────────┘
```

**Layout ใหม่ (desktop ≥ 1024)**:
```
┌────────────────────────────────────────┐
│ Greeting  +  CTA                       │
├──────────────────┬─────────────────────┤
│ Monthly chart    │ Stat cards 2x2      │
│ (60% width)      │ (40%)               │
├──────────────────┴─────────────────────┤
│ Donut │ Recent Jobs │ Low Stock        │  <- 3-column
└────────────────────────────────────────┘
```

**สำคัญ**: 
- ลบ Hero gradient ใหญ่ — ใช้ greeting bar แบน + CTA แทน
- รวมข้อมูล "รายรับ + jobs count" ไป stat cards (ไม่ซ้ำ)
- Chart auto-scale Y axis (recharts ทำได้) ไม่ตั้ง 1-2-3-4 ตาย
- Donut เพิ่ม **center label** "งานทั้งหมด 6"

#### C2. Jobs Flow

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/jobs` (list) | L | DataTable + MobileCardList + bulk select + saved view |
| `/dashboard/jobs?tab=queue` | L | Kanban + drag-drop (Phase 2) |
| `/dashboard/jobs?tab=reception` | M | grid card + "รับรถใหม่" CTA prominent |
| `/dashboard/jobs?tab=planning` | M | timeline view + group-by-date — ปรับ visual |
| `/dashboard/jobs?tab=quotes` | M | แยก /dashboard/quotations เป็น standalone page |
| `/dashboard/jobs/new` | L | Multi-step form + Combobox + smart defaults |
| `/dashboard/jobs/[id]` | XL | Tabs (สรุป / ตรวจสภาพ / อะไหล่ / ใบเสนอ / ใบเสร็จ / ประวัติ) + sticky action bar |
| `/dashboard/jobs/[id]/quotation` | M | print-ready + signature + LINE share |
| `/dashboard/queue` | M | merge into jobs?tab=queue หรือลบ |
| `/dashboard/quotations` | M | DataTable + status filter |
| `/dashboard/planning` | M | calendar view (week/month) — สลับกับ list |
| `/dashboard/reception` | S | merge into jobs?tab=reception |
| `/dashboard/reception/new` | M | step wizard — ใช้ checkin-wizard ที่มีอยู่ + ปรับ visual |

**Jobs list (`/dashboard/jobs?tab=list`) — Detailed redesign**

```
┌────────────────────────────────────────────────────────────┐
│ 📋 จัดการงานซ่อม                              [+ สร้าง Job]│
│ Dashboard › งานซ่อม                                         │
├────────────────────────────────────────────────────────────┤
│ [รับรถ 0] [Kanban 5] [รายการ 5] [ตาราง 3] [ใบเสนอ 0]       │ <- tab + count
├────────────────────────────────────────────────────────────┤
│ 🔍 [search]  [⛕ Filter ▾]  [↕ Sort ▾]      [⚙ Columns]     │ <- toolbar
│ ┌─ Saved view: ทั้งหมด / กำลังซ่อม / รอตรวจ ─┐               │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ ☐ │ Job #     │ ลูกค้า/รถ      │ ประเภท │ ช่าง  │ สถานะ │ ⋯ │
├───┼───────────┼────────────────┼────────┼───────┼───────┼───┤
│ ☐ │ 2026-0001 │ คุณวิชัย       │ ซ่อม   │ [Av]  │ [pill]│ ⋯ │
│   │           │ 🚗 กข 1234     │        │ ประ.. │       │   │
│   │           │ Toyota Camry   │        │       │       │   │
└────────────────────────────────────────────────────────────┘
[« 1 2 3 ... 10 »]   100 รายการ • 25/หน้า ▾
```

- ลบ status dots ที่ซ้ำกับ pill — ใช้แค่ pill อย่างเดียว
- รวม customer + vehicle ใน column เดียว (vehicle เป็น sub-row)
- ช่าง = avatar + ชื่อย่อ
- เพิ่ม row action menu (⋯) — แก้ไข / กำหนดช่าง / เปลี่ยนสถานะ / ลบ
- เพิ่ม **bulk action bar** ที่ขึ้นเมื่อเลือก checkbox

**Mobile fallback**:
```
┌─────────────────────────┐
│ JOB-2026-0001  [pill]  │
│ คุณวิชัย สุขสบาย         │
│ 🚗 กข 1234 Toyota Camry │
│ 👤 ประเสริฐ • 17 มี.ค.   │
│ ฿2,193                  │
│ ─────────────────────── │
│ [ดู] [แก้ไข] [⋯]       │
└─────────────────────────┘
```

#### C3. Customers / Vehicles

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/customers` | M | DataTable + 3 stat cards + tier pill |
| `/dashboard/customers/[id]` | L | Tabs (รถ / ประวัติ / ใบเสนอ / สมาชิก) + sticky header |
| `/dashboard/vehicles` | M | DataTable + due-for-service alert column |

#### C4. Inspections

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/inspections` | M | DataTable + status filter |
| `/dashboard/inspections/new` | L | step form + photo upload UX (drag-drop) |
| `/dashboard/inspections/templates` | M | template card grid |
| `/dashboard/inspections/[id]` | L | photo gallery + section checklist + share button |

#### C5. Inventory

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/inventory` | L | tabs ผ่าน DataTable + summary stats เหนือ table |
| `/dashboard/service-packages` | M | card grid (visual product cards) |

#### C6. Finance

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/finance` | XL | tabs 6 อัน → ปรับเป็น 3 หลัก (Revenue/Expense/AP) + sub-tab ภายใน |
| `/dashboard/insurance` | M | claim DataTable + status filter |
| `/dashboard/warranty` | M | policy DataTable + expiring soon alert |

#### C7. Team / People

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/team` | M | member card grid + role badge + invite drawer |
| `/dashboard/employees` | M | merge into team หรือชี้ว่าใช้ทำอะไร |
| `/dashboard/time-clock` | M | clock-in card + history table |

#### C8. Comms & Reports

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/notifications` | S | inbox layout — group by today/yesterday |
| `/dashboard/reminders` | M | rule builder + channel toggle |
| ~~`/dashboard/knowledge-base`~~ | — | ❌ **ลบหน้านี้ทิ้ง** (ตัดออกจาก scope) |
| `/dashboard/reports` | L | dashboard with date range + chart presets |

#### C9. Sales Channels

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/landing` | L | section editor preview — เก็บ section-renderer |
| `/dashboard/shop-manage` | M | product DataTable + draft/published filter |
| `/dashboard/shop-manage/orders` | M | order DataTable + status pill |

#### C10. Settings (8 sub-pages)

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/dashboard/settings` (hub) | M | sidebar nav + content panel — Stripe/Linear style 2-pane |
| `/dashboard/settings/branding` | M | live preview ของ brand + color picker |
| `/dashboard/settings/booking` | M | toggle + working hours grid |
| `/dashboard/settings/customer-notifications` | M | template editor + variable picker |
| `/dashboard/settings/notifications` | S | channel toggle table |
| `/dashboard/settings/line` | M | OA setup wizard + verify |
| `/dashboard/settings/domain` | M | DNS verify steps |
| `/dashboard/settings/subscription` | L | plan compare + invoice list |

### 5.4 Group D — Super Admin

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `/super-admin` | M | KPI cards + tenant table + trial alert |
| `/super-admin/tenants` | L | DataTable + suspend/extend action |
| `/super-admin/users` | L | DataTable + role filter |
| `/super-admin/subscriptions` | M | DataTable + revenue summary |
| `/super-admin/subscriptions/invoices` | M | DataTable + export CSV |

### 5.5 Group E — Errors & Edge

| Page | Effort | สิ่งที่แก้ |
|------|--------|----------|
| `error.tsx` | S | illustration + retry button |
| `not-found.tsx` | S | illustration + back home + popular pages |
| `offline/page.tsx` | S | offline mode + sync queue indicator |

---

## 6. Mobile-Specific Requirements

### 6.1 Tap target & spacing
- ปุ่มทุกตัว `min-height: 44px` — ✅ มีอยู่แล้วใน `globals.css`
- input padding x ≥ 12px, y ≥ 10px
- card horizontal margin ≥ 12px จากขอบจอ
- list item เดิมใน `/c` มี padding 16px — ดี

### 6.2 Mobile patterns
- **Bottom sheet** แทน modal — ใช้สำหรับ filter, sort, action menu บน mobile
- **Pull-to-refresh** — ทุก list page (jobs, customers, inventory)
- **Swipe action** — list item swipe ซ้าย → archive / swipe ขวา → done (Phase 2 optional)
- **FAB context** — แทน bottom nav center action — แสดงบน list pages เท่านั้น
- **Sticky action bar** — บน detail pages (jobs/[id]) ปุ่ม "เปลี่ยนสถานะ" / "พิมพ์" sticky bottom

### 6.3 Performance budget
- Initial JS ≤ 200KB gzipped per route
- LCP ≤ 2.5s บน 3G
- ใช้ `next/dynamic` สำหรับ heavy editors (landing/editor)
- Recharts → ใช้ผ่าน dynamic import (ลด bundle 50KB)

---

## 7. Implementation Phases (Roadmap)

### Phase Dependency Graph

```
Phase 0 (Audit ✅)
   │
   ▼
Phase 1 (Foundation: tokens + atoms + shell + PWA)   ← ทุกอย่างขึ้นกับนี้
   │
   ├─────────────┬──────────────┬──────────────┐
   ▼             ▼              ▼              ▼
Phase 2       Phase 3        Phase 4         Phase 6
(Forms)      (Tables)       (Dashboard +    (Customer/LIFF)
   │            │            Detail + Kan)      │
   └─────┬──────┴──────┬─────────┘              │
         ▼             ▼                        │
      Phase 5      Phase 7 ◀────────────────────┘
      (Settings)   (Polish + QA + Launch)
```

**Rule of thumb**: Phase 1 ต้องเสร็จก่อนเริ่ม 2-6. Phase 7 ทำทับ end-of-line ของทุกเฟส (in-flight QA) แต่ release gate อยู่หลังเฟสอื่นเสร็จหมด

---

### Phase 0 — Audit & Approval ✅ DONE
> เอกสารนี้

- [x] Inventory 60+ routes
- [x] วิเคราะห์ปัญหาจาก screenshot 3 หน้า + system-level S1-S14
- [x] ออกแบบ design system + token + components
- [x] Pre-approval checklist อนุมัติ (Section 8)

---

### Phase 1 — Foundation (≈ 6-7 วัน) ⭐ Critical Path

> **Goal**: ปรับฐานทั้งระบบ (token + atoms + shell + PWA + bottom-sheet primitive) ให้หน้าเก่ายังใช้ได้ระหว่างรื้อ

**Deliverables**
- Design tokens แบบ deterministic (radius 4-step, shadow 2-level, type scale)
- Atoms ใหม่ + ปรับ atoms เดิม
- Layout shell (Sidebar grouped, Header เรียบ, BottomNav floating pill ปรับใหม่)
- Toast provider
- **PWA P0** เต็มรูปแบบ
- BottomSheet primitive (กดใช้ได้ใน Phase 2-6)

**Tasks**

| # | Task | Owner | Est | Dep |
|---|------|-------|-----|-----|
| 1.1 | `globals.css` — radius 4-step, shadow 2-level, typography scale, ลบ token ไม่ใช้ | FE | 0.5d | — |
| 1.2 | `Button` — `loading` prop + spinner inline; size sm=36 / default=40 / lg=48 | FE | 0.5d | 1.1 |
| 1.3 | `Input` — height responsive (40 desktop / 44 mobile), prefix/suffix icon, error state | FE | 0.5d | 1.1 |
| 1.4 | `Card` — ลบ default shadow ให้ caller เลือก (`elevation` prop) | FE | 0.25d | 1.1 |
| 1.5 | `Badge` — `dot` variant + `tone: success/warn/error/info/neutral` | FE | 0.25d | 1.1 |
| 1.6 | สร้าง `Skeleton` (block/text/circle), `Spinner`, `Tooltip` (no-radix, framer), `Kbd` | FE | 1d | 1.1 |
| 1.7 | สร้าง `EmptyState` (no-data/error/search-no-result), `Pagination`, `Toolbar` | FE | 1d | 1.1 |
| 1.8 | `PageHeader` — breadcrumb + tabs slot + sticky behavior + double-padding fix | FE | 0.5d | 1.1 |
| 1.9 | `Sidebar` — 6 groups (ภาษาไทย labels), `⌘K` trigger, user pill ที่ก้น, rail mode 72px | FE | 1d | 1.1 |
| 1.10 | `Header` — ลบ search กลาง, ลบ theme 3-state (เหลือ icon ใน user dropdown), breadcrumb | FE | 0.5d | 1.9 |
| 1.11 | `BottomNav` (floating pill **คงเดิม**) — refactor: `bg-surface/85` + `backdrop-blur-md` + safe-area + scroll-hide hook + center FAB context-aware | FE | 1d | 1.1 |
| 1.12 | `Toast` provider — `sonner`-style API, success/error/loading/promise variants | FE | 0.5d | 1.1 |
| 1.13 | **PWA P0** — manifest, icons (192/512/maskable), service worker (`next-pwa` หรือ Workbox), runtime cache (NetworkFirst สำหรับ API, CacheFirst สำหรับ static), offline shell, install prompt, sync queue indicator (Background Sync API) | FE | 1.5d | — |
| 1.14 | `BottomSheet` primitive — drag-to-dismiss (framer-motion), snap points, backdrop, focus trap | FE | 1d | 1.1 |
| 1.15 | `useScrollDirection`, `useMediaQuery`, `useSafeArea` hooks | FE | 0.25d | — |

**Files**
```
src/app/globals.css
src/components/ui/{button,input,card,badge,avatar}.tsx           ← edit
src/components/ui/{skeleton,spinner,tooltip,kbd}.tsx              ← new
src/components/ui/{empty-state,pagination,toolbar}.tsx            ← new
src/components/ui/bottom-sheet.tsx                                ← new
src/components/layout/{sidebar,header,bottom-nav,page-header}.tsx ← edit
src/components/providers.tsx                                      ← +Toast
src/lib/hooks/{use-scroll-direction,use-media-query,use-safe-area}.ts  ← new
public/manifest.json                                              ← edit/new
public/icons/{192,512,maskable}.png                               ← new
src/app/sw.ts (หรือ next-pwa config)                              ← new
src/app/offline/page.tsx                                          ← edit
```

**Acceptance criteria**
- [ ] หน้าเดิมทุกหน้ายัง render + click ได้ (no regression)
- [ ] ไม่มี radius/shadow ที่ไม่อยู่ใน token (grep audit)
- [ ] Lighthouse PWA score ≥ 90 (installable, offline ready)
- [ ] BottomNav ไม่บังเนื้อหา + safe-area กิน iPhone gesture bar ถูก
- [ ] Toast แสดงครบ 4 variant + auto-dismiss + stacking
- [ ] Sidebar collapse → rail 72px แสดง icon + tooltip
- [ ] Service Worker register ผ่าน + cache offline page

**QA gate before Phase 2**: smoke test 5 critical flows (login → dashboard → jobs list → jobs/new → settings)

---

### Phase 2 — Form Stack (≈ 4 วัน)

> **Goal**: รื้อ native `<select>` ทิ้งทั้งระบบ + เปิดทาง `/jobs/new` รีดีไซน์

**Deliverables**
- Form controls ครบ (Select, Combobox, MultiSelect, DatePicker, RadioGroup, Switch, FileUpload, FormField, FormSection)
- Mobile pattern: filter/sort/picker เปิดเป็น **BottomSheet** ที่ < 640px
- 3 หน้า prototype (jobs/new, customers create, inventory part dialog)

**Tasks**

| # | Task | Owner | Est | Dep |
|---|------|-------|-----|-----|
| 2.1 | `Select` — keyboard nav, placeholder, prefix icon, hidden input mirror สำหรับ FormData | FE | 0.5d | 1.x |
| 2.2 | `Combobox` — search + virtualized list (`@tanstack/react-virtual`), async loader | FE | 1d | 2.1 |
| 2.3 | `MultiSelect` — chips + clear all + max-display | FE | 0.5d | 2.1 |
| 2.4 | `DatePicker` — พ.ศ. display, today/tomorrow shortcut, range mode | FE | 1d | — |
| 2.5 | `RadioGroup` (segmented chip-style), `Switch` (iOS-look) | FE | 0.5d | — |
| 2.6 | `FormField` (label + input + error + hint slot), `FormSection` (collapsible group) | FE | 0.5d | — |
| 2.7 | `FileUpload` — drag-drop + preview thumbnail + progress + multi-file | FE | 0.75d | — |
| 2.8 | Mobile sheet integration — `<Select>` < 640px → render เป็น BottomSheet auto | FE | 0.25d | 1.14, 2.1 |
| 2.9 | รีดีไซน์ `/dashboard/jobs/new` — multi-step form (3 step), Combobox สำหรับ customer/vehicle/technician, smart defaults | FE | 1d | 2.1-2.7 |
| 2.10 | รีดีไซน์ `/dashboard/customers` create dialog | FE | 0.25d | 2.x |
| 2.11 | รีดีไซน์ `/dashboard/inventory` part dialog | FE | 0.25d | 2.x |

**Files**
```
src/components/ui/{select,combobox,multi-select,date-picker}.tsx    ← new
src/components/ui/{radio-group,switch,file-upload}.tsx              ← new
src/components/ui/{form-field,form-section}.tsx                     ← new
src/app/(dashboard)/dashboard/jobs/new/page.tsx                     ← rewrite
src/components/dialogs/customer-create-dialog.tsx                   ← rewrite
src/components/dialogs/part-create-dialog.tsx                       ← rewrite
```

**Acceptance criteria**
- [ ] Native `<select>` count = 0 ใน 3 หน้าเป้าหมาย
- [ ] Combobox virtualized ใช้กับ 1000+ rows ไม่กระตุก
- [ ] DatePicker แสดง พ.ศ. ถูก, range mode ใช้ได้
- [ ] FormData submit ทำงานเหมือนเดิม (hidden input mirror ทดสอบ)
- [ ] Mobile (< 640px): Select เปิด BottomSheet, Desktop: Popover dropdown
- [ ] FileUpload รองรับ drag-drop + clipboard paste

---

### Phase 3 — DataTable + Mobile Card (≈ 5 วัน)

> **Goal**: รื้อ `<table>` 8 หน้า → unified DataTable + mobile card fallback

**Deliverables**
- `DataTable` ที่รองรับ sort/filter/pagination/bulk-select/column-visibility/saved-view
- `MobileCardList` auto-render เมื่อ < 640px
- 8 list pages migrated

**Tasks**

| # | Task | Owner | Est | Dep |
|---|------|-------|-----|-----|
| 3.1 | `DataTable` — column config, sort, filter popover, pagination, row action menu, bulk select, sticky header, empty/loading/error state | FE | 2d | 1.x, 2.x |
| 3.2 | `MobileCardList` — render rule + tap-to-detail + swipe action (Phase 2 optional) | FE | 0.75d | 3.1 |
| 3.3 | Saved view system — localStorage + URL param sync | FE | 0.5d | 3.1 |
| 3.4 | Bulk action bar (sticky bottom) — appear on selection | FE | 0.25d | 3.1 |
| 3.5 | รีดีไซน์ `/dashboard/jobs` (list tab) — pilot — รวม customer+vehicle column, ลบ status dots, action ⋯ | FE | 0.75d | 3.1-3.4 |
| 3.6 | รีดีไซน์ `/dashboard/customers` | FE | 0.25d | 3.5 |
| 3.7 | รีดีไซน์ `/dashboard/vehicles` (+ due-for-service alert column) | FE | 0.25d | 3.5 |
| 3.8 | รีดีไซน์ `/dashboard/inventory` parts tab | FE | 0.25d | 3.5 |
| 3.9 | รีดีไซน์ `/dashboard/finance` invoices/receipts tab | FE | 0.25d | 3.5 |
| 3.10 | รีดีไซน์ `/super-admin/{tenants,users,subscriptions,subscriptions/invoices}` (4 หน้า) | FE | 0.5d | 3.5 |

**Files**
```
src/components/ui/{data-table,mobile-card-list,saved-view}.tsx      ← new
src/components/data-table/{column,filter-popover,pagination,bulk-bar}.tsx  ← new
src/app/(dashboard)/dashboard/jobs/page.tsx                          ← rewrite
src/app/(dashboard)/dashboard/customers/page.tsx                     ← rewrite
src/app/(dashboard)/dashboard/vehicles/page.tsx                      ← rewrite
src/app/(dashboard)/dashboard/inventory/page.tsx                     ← rewrite
src/app/(dashboard)/dashboard/finance/page.tsx                       ← rewrite
src/app/super-admin/**/page.tsx                                      ← rewrite
```

**Acceptance criteria**
- [ ] 8 หน้า list ใช้ DataTable เดียวกัน, ไม่มี `<table>` raw
- [ ] Mobile (< 640px) → MobileCardList อัตโนมัติ ไม่มี horizontal scroll
- [ ] Filter popover เปิด BottomSheet บน mobile
- [ ] Saved view persist ผ่าน reload + sync URL
- [ ] Bulk select + action bar ทำงานครบ (delete, change status, export)

---

### Phase 4 — Dashboard + Detail Pages + Kanban (≈ 6 วัน)

> **Goal**: หน้า traffic สูงสุด + Kanban drag-drop (P1 จำเป็น)

**Deliverables**
- Dashboard home redesign (mobile + desktop layout ตาม Section 5.3 C1)
- Detail pages: jobs, customers, inspections, planning calendar
- KanbanBoard with drag-drop

**Tasks**

| # | Task | Owner | Est | Dep |
|---|------|-------|-----|-----|
| 4.1 | `/dashboard` (home) — ลบ hero, greeting bar + CTA + stat 2x2 + tabs + chart auto-scale + donut center label | FE | 1d | 1.x |
| 4.2 | `/dashboard/jobs/[id]` — tabs (สรุป/ตรวจสภาพ/อะไหล่/ใบเสนอ/ใบเสร็จ/ประวัติ) + sticky action bar (เปลี่ยนสถานะ/พิมพ์/แชร์) | FE | 1.5d | 1.x |
| 4.3 | `/dashboard/customers/[id]` — tabs (รถ/ประวัติ/ใบเสนอ/สมาชิก) + sticky header + Drawer edit | FE | 0.75d | 1.x, 2.x |
| 4.4 | `/dashboard/inspections/[id]` — photo gallery + section checklist + share button | FE | 0.75d | 1.x |
| 4.5 | `/dashboard/inspections/new` — step form + photo upload + signature pad | FE | 0.75d | 2.x |
| 4.6 | `KanbanBoard` component — `@dnd-kit/core` + `@dnd-kit/sortable`, columns auto-virtualized, optimistic update + revert on fail | FE | 1d | 1.x |
| 4.7 | `/dashboard/queue` (Kanban view) — apply KanbanBoard, persist drag → API | FE | 0.5d | 4.6 |
| 4.8 | `/dashboard/planning` calendar (week/month) — toggle list/calendar, drag job to slot | FE | 0.5d | 4.6 |

**Files**
```
src/app/(dashboard)/dashboard/page.tsx                          ← rewrite
src/app/(dashboard)/dashboard/jobs/[id]/page.tsx                ← rewrite
src/app/(dashboard)/dashboard/customers/[id]/page.tsx           ← rewrite
src/app/(dashboard)/dashboard/inspections/[id]/page.tsx         ← rewrite
src/app/(dashboard)/dashboard/inspections/new/page.tsx          ← rewrite
src/app/(dashboard)/dashboard/queue/page.tsx                    ← rewrite
src/app/(dashboard)/dashboard/planning/page.tsx                 ← rewrite
src/components/kanban/{board,column,card,drag-overlay}.tsx      ← new
src/components/calendar/{week-view,month-view}.tsx              ← new
src/components/signature-pad.tsx                                ← new
```

**Acceptance criteria**
- [ ] Dashboard home: ไม่มี data ซ้ำซ้อน, chart auto-scale Y axis, donut มี center label
- [ ] Jobs/[id] tabs ทำงาน + sticky action bar ติดล่างบน mobile
- [ ] Kanban drag-drop ทำงานทั้ง desktop (mouse) + mobile (touch) — `@dnd-kit` รองรับ
- [ ] Optimistic update + revert ตอน API fail ทำงานถูก
- [ ] Calendar planning toggle list/calendar smooth

---

### Phase 5 — Settings + Reports + Comms (≈ 4 วัน)

> **Goal**: 8 หน้า settings + reports + notifications/reminders + ลบ knowledge-base

**Deliverables**
- Settings hub แบบ 2-pane (Linear/Stripe pattern)
- 8 settings sub-pages
- Reports dashboard with date range
- Notifications/reminders inbox
- ลบ `/dashboard/knowledge-base/*` ทั้งหมด

**Tasks**

| # | Task | Owner | Est | Dep |
|---|------|-------|-----|-----|
| 5.1 | Settings hub — 2-pane layout (sidebar nav + content panel), responsive collapse | FE | 0.5d | 1.x |
| 5.2 | `/dashboard/settings/branding` — color picker + live preview | FE | 0.5d | 5.1 |
| 5.3 | `/dashboard/settings/booking` — toggle + working hours grid | FE | 0.5d | 5.1, 2.x |
| 5.4 | `/dashboard/settings/customer-notifications` — template editor + variable picker (`{{customer_name}}` ฯลฯ) | FE | 0.75d | 5.1 |
| 5.5 | `/dashboard/settings/notifications` — channel toggle table | FE | 0.25d | 5.1 |
| 5.6 | `/dashboard/settings/line` — OA setup wizard + test connection (verify endpoint) | FE | 0.5d | 5.1 |
| 5.7 | `/dashboard/settings/domain` — DNS verify steps with copy-to-clipboard | FE | 0.5d | 5.1 |
| 5.8 | `/dashboard/settings/subscription` — plan compare + invoice list (DataTable) | FE | 0.75d | 3.1 |
| 5.9 | `/dashboard/reports` — date range + chart presets (revenue/jobs/parts/labor) | FE | 1d | 1.x |
| 5.10 | `/dashboard/notifications` — inbox layout group by today/yesterday/older | FE | 0.5d | 1.x |
| 5.11 | `/dashboard/reminders` — rule builder + channel toggle | FE | 0.5d | 5.10 |
| 5.12 | **ลบ `/dashboard/knowledge-base/*`** — ลบ routes, sidebar link, schema/migration ถ้ามี | FE+BE | 0.5d | — |

**Files**
```
src/app/(dashboard)/dashboard/settings/**/page.tsx              ← rewrite
src/app/(dashboard)/dashboard/reports/page.tsx                  ← rewrite
src/app/(dashboard)/dashboard/notifications/page.tsx            ← rewrite
src/app/(dashboard)/dashboard/reminders/page.tsx                ← rewrite
src/app/(dashboard)/dashboard/knowledge-base/                   ← DELETE
src/components/layout/sidebar.tsx                                ← remove KB link
```

**Acceptance criteria**
- [ ] Settings hub: 8 หน้าเข้าถึงได้, mobile collapse ทำงาน
- [ ] LINE settings: test connection ปุ่ม verify token success
- [ ] Reports: date range picker + 4 chart preset
- [ ] Knowledge-base routes return 404, sidebar ไม่มีลิงก์ค้าง
- [ ] No dead links (run link-checker)

---

### Phase 6 — Customer/LIFF + Marketing + Auth (≈ 5 วัน)

> **Goal**: หน้าฝั่งลูกค้า (LIFF) + marketing + auth — mobile-first จริงๆ

**Deliverables**
- `/c/*` — 7 หน้า mobile-first redesign
- `/inspect/[token]` + `/liff/booking`
- `/shop/[slug]/*` — e-commerce flow
- `/` (marketing) — real screenshots
- login/register/trial

**Tasks**

| # | Task | Owner | Est | Dep |
|---|------|-------|-----|-----|
| 6.1 | `/c` (customer home) — hero card + active job + quick actions | FE | 0.5d | 1.x |
| 6.2 | `/c/login` — OTP-style | FE | 0.25d | — |
| 6.3 | `/c/booking` — step booking wizard | FE | 0.5d | 2.x |
| 6.4 | `/c/membership` — tier card + points history | FE | 0.25d | — |
| 6.5 | `/c/quotation/[id]` — mobile quote view + accept/reject + signature | FE | 0.5d | 4.5 |
| 6.6 | `/c/track/[token]` — timeline + photo gallery | FE | 0.5d | — |
| 6.7 | `/c/vehicles/[id]` — service history + warranty badge | FE | 0.25d | — |
| 6.8 | `/inspect/[token]` — photo grid + check items + accept signature | FE | 0.5d | 4.5 |
| 6.9 | `/liff/booking` — embed of /c/booking + LIFF SDK init | FE | 0.25d | 6.3 |
| 6.10 | `/shop/[slug]` (4 sub-pages) — product list, detail, cart, checkout | FE | 1.5d | 1.x, 2.x, 3.x |
| 6.11 | `/` (marketing) — hero + real screenshot + testimonial — convert focus | FE | 1d | 1.x |
| 6.12 | `/login` (Card layout, social slot, error → Toast), `/register` (2-step), `/forgot-password`, `/trial` | FE | 0.75d | 1.x, 2.x |

**Files**
```
src/app/(customer)/c/**/page.tsx                                ← rewrite
src/app/(public)/inspect/[token]/page.tsx                       ← rewrite
src/app/(public)/liff/booking/page.tsx                          ← rewrite
src/app/(public)/shop/[slug]/**/page.tsx                        ← rewrite
src/app/(marketing)/page.tsx                                    ← rewrite
src/app/(auth)/{login,register,forgot-password,trial}/page.tsx  ← rewrite
```

**Acceptance criteria**
- [ ] PWA install prompt ปรากฏใน `/c` (Android Chrome + iOS Safari)
- [ ] LIFF init ทำงานใน LINE app + redirect after auth
- [ ] Quote signature → save image + accept status update
- [ ] Marketing hero LCP < 2.5s บน 3G
- [ ] Auth pages: error เป็น Toast (ไม่ใช่ alert), success → redirect ถูก

---

### Phase 7 — Polish + QA + Launch (≈ 3-4 วัน)

> **Goal**: ⌘K, animation, dark mode QA, a11y, perf, cross-browser, launch checklist

**Deliverables**
- Command palette
- Skeleton states ครบ
- Animation polish
- A11y / Lighthouse / cross-browser pass
- Feature flag rollout plan

**Tasks**

| # | Task | Owner | Est | Dep |
|---|------|-------|-----|-----|
| 7.1 | `CommandPalette` (⌘K) — global navigation + create actions + recent items | FE | 1d | 1.x |
| 7.2 | Skeleton states — ทุก server component ที่ fetch — list of 30+ files | FE | 0.75d | 1.x |
| 7.3 | Animation polish — page transition (framer-motion fade), list stagger, modal slide | FE | 0.5d | — |
| 7.4 | Dark mode QA — sweep ทุกหน้า, fix contrast, fix shadow visibility | FE | 0.5d | — |
| 7.5 | A11y audit — WCAG AA contrast, keyboard nav (Tab order, Esc close), ARIA labels, skip-to-content | FE | 0.75d | — |
| 7.6 | Performance audit — Lighthouse target ≥ 95 mobile, bundle analyzer, dynamic import heavy chunks (Recharts, signature pad, kanban) | FE | 0.5d | — |
| 7.7 | Cross-browser — Safari iOS 14+, Chrome Android, Edge, Firefox — smoke test 10 critical flows | QA | 0.5d | — |
| 7.8 | Feature flag rollout — `?ui=v2` query / cookie toggle + A/B 1 week | FE+PM | 0.25d | — |
| 7.9 | Launch checklist — analytics events placeholder, error tracking sanity, rollback plan | PM | 0.25d | — |

**Files**
```
src/components/command-palette.tsx                              ← new
src/app/**/loading.tsx                                          ← add Skeleton
src/lib/feature-flags.ts                                        ← new
.lighthouserc.js                                                ← new (CI)
```

**Acceptance criteria**
- [ ] ⌘K: 50ms first-paint, fuzzy search ทำงาน, esc close
- [ ] Lighthouse: Performance ≥ 90, A11y ≥ 95, PWA ≥ 90, Best Practices ≥ 95 (mobile + desktop)
- [ ] Bundle: initial route ≤ 200KB gz (verify ทุก route)
- [ ] All critical flows pass บน 4 browsers
- [ ] Feature flag toggle ทำงาน + analytics เก็บ click event
- [ ] Rollback plan documented

---

### Cross-cutting Concerns (อยู่ทุกเฟส)

| หัวข้อ | เฟสที่เริ่ม | หัวข้อย่อย |
|-------|------------|-----------|
| **PWA + offline** | Phase 1.13 | manifest, SW, install prompt, offline shell, sync queue, background fetch |
| **Bottom sheet** | Phase 1.14 → ใช้ใน 2-6 | filter / sort / picker / mobile menu |
| **Drag-drop kanban** | Phase 4.6 | `@dnd-kit/core` (touch-friendly) |
| **i18n** | คงไว้ — ไม่แตะใน redesign | Roadmap EN: Phase 8+ (หลัง launch) |
| **Knowledge-base removal** | Phase 5.12 | route + link + schema cleanup |
| **Feature flag** | Phase 7.8 | `?ui=v2` toggle |
| **Visual regression test** | Phase 7 | Playwright + screenshot |
| **Accessibility** | Phase 1+ ทุก component | min 44px tap, keyboard nav, ARIA |

---

### Total Estimate

| Phase | Days | Cumulative |
|-------|------|-----------|
| 0 — Audit | ✅ 0 | 0 |
| 1 — Foundation | 6-7 | 6-7 |
| 2 — Form Stack | 4 | 10-11 |
| 3 — DataTable | 5 | 15-16 |
| 4 — Dashboard + Detail + Kanban | 6 | 21-22 |
| 5 — Settings + Reports + Comms | 4 | 25-26 |
| 6 — Customer/LIFF + Marketing + Auth | 5 | 30-31 |
| 7 — Polish + QA + Launch | 3-4 | **33-35 working days** |

**Realistic timeline**: ≈ 7 weeks สำหรับ 1 dev full-time, หรือ ≈ 4 weeks ถ้าทำ 2 dev คู่ขนาน (1 = atoms/forms/tables, 1 = pages/detail) หลัง Phase 1 เสร็จ

---

### Release Strategy

1. **Internal alpha** หลัง Phase 4 — staff อู่ทดลอง dashboard + jobs ใหม่ (1 week)
2. **Beta with flag** หลัง Phase 6 — `?ui=v2` toggle, ลูกค้า opt-in (1-2 week)
3. **GA** หลัง Phase 7 — flip default, deprecate old UI 2 weeks later
4. **Rollback trigger**: critical bug, > 5% increase in error rate, or > 20% drop in form completion → toggle flag off, root cause, re-test

---

## 8. Pre-Approval Checklist ✅ APPROVED (2026-05-04)

- [x] **Brand color**: `#7C5BFB` (ยืนยัน)
- [x] **Theme**: dual (light + dark) — คงไว้ตามเดิม
- [x] **Bottom nav**: floating pill (เดิม)
- [x] **Sidebar group label**: ภาษาไทย
- [x] **Mobile pattern**: bottom sheet (สำหรับ filter / detail panel)
- [x] **Drag-drop Kanban**: Phase 1 (จำเป็น)
- [x] **Knowledge-base**: ❌ **ลบหน้านี้ทิ้ง** — ตัดออกจาก scope
- [x] **Browser support**: ทั้งหมด (Safari iOS 14+, Chrome 100+, Edge, Firefox)
- [x] **PWA scope**: full PWA + offline = **P0** (ต้องทำตั้งแต่ Phase 1)
- [x] **i18n**: เก็บ `next-intl` — รองรับ EN ใน roadmap (ไม่ใช่ Phase 1)

---

## 9. Non-Goals (ตั้งใจไม่ทำในแผนนี้)

- ❌ ไม่เปลี่ยน Tech Stack (Next.js / Supabase / Tailwind)
- ❌ ไม่เปลี่ยน data model / API contract
- ❌ ไม่เพิ่ม dependency หนัก (radix/shadcn full) — เก็บ minimal
- ❌ ไม่ทำ multi-language ใน redesign นี้ (i18n เฟสหลัง)
- ❌ ไม่ทำ A/B testing infrastructure
- ❌ ไม่ทำ analytics tracking events (เพิ่มทีหลัง)
- ❌ ไม่แตะ Sentry / Upstash setup

---

## 10. ความเสี่ยงและการป้องกัน

| ความเสี่ยง | ผลกระทบ | การจัดการ |
|-----------|---------|----------|
| **Visual regression** ใน 60 หน้าเปลี่ยน token พร้อมกัน | สูง | ใช้ feature flag `?ui=v2` สลับชั่วคราว / เก็บ snapshot |
| **DataTable ใหม่ refactor 8 หน้า** — bug หนึ่งกระทบหลายหน้า | สูง | เริ่มจาก 1 หน้า (jobs) ทดสอบ ผ่านแล้ว roll-out |
| **Native select → Combobox** ทำลาย form action FormData | กลาง | hidden input mirror ค่า, ทดสอบ submit ก่อน rollout |
| **Bottom nav redesign** ผู้ใช้คุ้นเดิม | กลาง | ทำ A/B 1 สัปดาห์ ดู bounce rate |
| **Drag-drop Kanban** complexity | กลาง | ใช้ `@dnd-kit/core` (เบา) หรือเลื่อน Phase 2 |
| **Rich text editor** bundle size | กลาง | dynamic import + lazy load |
| **เพิ่ม Combobox virtualized list** dependency | ต่ำ | ใช้ `@tanstack/react-virtual` (4KB) |

---

## 11. Files ที่จะถูกแตะหลัก

### Phase 1 — Foundation
```
src/app/globals.css
src/components/ui/{button,input,card,badge,avatar}.tsx
src/components/ui/{skeleton,spinner,tooltip,kbd}.tsx          ← ใหม่
src/components/ui/{empty-state,pagination,toolbar}.tsx        ← ใหม่
src/components/layout/{sidebar,header,bottom-nav,page-header}.tsx
src/components/providers.tsx                                   ← +Toast provider
```

### Phase 2 — Forms
```
src/components/ui/{select,combobox,multi-select,date-picker}.tsx     ← ใหม่
src/components/ui/{radio-group,switch,file-upload}.tsx              ← ใหม่
src/components/ui/{form-field,form-section}.tsx                     ← ใหม่
src/app/(dashboard)/dashboard/jobs/new/page.tsx                     ← rewrite
```

### Phase 3 — Tables
```
src/components/ui/{data-table,mobile-card-list}.tsx          ← ใหม่
src/app/(dashboard)/dashboard/jobs/page.tsx                  ← rewrite
src/app/(dashboard)/dashboard/customers/page.tsx             ← rewrite
... (8 list pages)
```

### Phase 4-7
```
src/app/(dashboard)/dashboard/page.tsx                       ← rewrite
src/app/(dashboard)/dashboard/jobs/[id]/page.tsx             ← rewrite
src/app/(dashboard)/dashboard/customers/[id]/page.tsx        ← rewrite
src/app/(dashboard)/dashboard/settings/**/page.tsx           ← rewrite
src/app/(customer)/c/**/page.tsx                             ← rewrite
src/app/(marketing)/page.tsx                                 ← rewrite
src/components/command-palette.tsx                           ← ใหม่
```

---

## 12. Success Metrics (จะวัดเมื่อ ship)

- ⏱ **Time to first action** บน dashboard < 5 วินาที (วัดจาก click ปุ่มแรก)
- 📱 **Mobile usability score** ≥ 95 (Lighthouse)
- ♿ **Accessibility score** ≥ 95 (Lighthouse)
- 🎨 **Visual consistency** — ไม่มี radius/shadow ที่ไม่อยู่ใน design system
- 🚀 **Bundle size** initial route ≤ 200KB gz
- 📊 **LCP** ≤ 2.5s บน 3G simulated
- 🔍 **Form completion rate** `/dashboard/jobs/new` เพิ่ม 20%+ (วัดจาก analytics ภายหลัง)

---

**Status**: 🟢 Phase 0 ✅ Approved — Pre-flight checklist อนุมัติครบ พร้อมเริ่ม Phase 1
**Last updated**: 2026-05-04
**Owner**: UI/UX team
**Next step**: เริ่ม Phase 1.1 (`globals.css` token refactor) — branch `redesign/phase-1-foundation`
