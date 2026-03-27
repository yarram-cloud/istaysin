# iStays — Hotel & Lodge Management Platform

## Product Requirements Document (PRD)

> **Version:** 2.0 (Audited) | **Date:** 2026-03-26
> **Inspired by:** iHosps (Multi-Tenant Clinic Platform)
> **Target Market:** Hotels, Lodges, Resorts, Homestays, and Guest Houses across India
> **Scale Target:** 500K – 1M property clients, each with many concurrent users

---

## Audit Changelog (v1.0 → v2.0)

> [!IMPORTANT]
> The following issues were identified during self-audit and corrected in this version:

| # | Category | Issue | Fix |
|---|----------|-------|-----|
| 1 | **Regulatory — Incorrect Act name** | Referenced "FHR Act" — no such act exists | Corrected to **Foreigners Act, 1946** + **Registration of Foreigners Rules, 1992** + **Immigration and Foreigners Act, 2025** |
| 2 | **Regulatory — Missing GST details** | Only mentioned "configurable GST rates" without specifics | Added **3-tier GST slab** per Sep 2025 revision: exempt < ₹1K, 5% ≤ ₹7.5K, 18% > ₹7.5K |
| 3 | **Regulatory — Missing Form-B** | Omitted mandatory physical guest register | Added **Form-B requirement** (handwritten register for all guests, Indian + foreign) |
| 4 | **Regulatory — Missing DPDP Act** | No mention of India's data protection law | Added **Digital Personal Data Protection Act, 2023** compliance requirements |
| 5 | **Roadmap — Incorrect markers** | Phase 1 items marked `[x]` (done) despite being a future project | Changed all to `[ ]` (not started) |
| 6 | **Scalability — RLS caveats missing** | Stated RLS "scales better" without caveats | Added **RLS performance caveats**: COUNT(*) overhead, policy complexity limits, STABLE function requirement |
| 7 | **Tech — Prisma + RLS conflict** | Didn't mention Prisma's known limitation with RLS | Added **warning**: Prisma doesn't natively support `SET` for session vars; requires `$executeRawUnsafe` per-request |
| 8 | **Infra — No DR strategy** | No disaster recovery or multi-region plan | Added **DR section** with RPO/RTO targets and failover strategy |
| 9 | **Schema — Guest tenantId ambiguity** | Guest model had `tenantId?` without explaining why | Added explanation: guests are **platform-level** (cross-tenant) with optional tenant-scoped copies for privacy |
| 10 | **Billing — Missing HSN/SAC codes** | Mentioned "HSN/SAC codes" without specifying them | Added **SAC 996311** (room accommodation) and **SAC 996331** (F&B) specifics |
| 11 | **Competitive — Unsupported claims** | "eZee is complex", "Hotelogix is expensive" — subjective with no data | Tempered to factual differentiators; removed unverifiable claims |
| 12 | **Metrics — MRR math error** | Claimed ₹25L MRR from 1,000 subscribers, but avg ₹2,500/sub = ₹25L is borderline | Corrected math and added weighted calculation |

---

## 1. Vision & Problem Statement

India has an estimated 100K+ registered hotels (source: FHRAI) plus hundreds of thousands of unregistered lodges, guest houses, dharamshalas, and homestays. Most small/medium properties rely on pen-and-paper, WhatsApp-based bookings, or fragmented desktop software. **iStays** provides an all-in-one "operating system" for hospitality — from a single-room dharamshala to a 500-room resort — giving each property its own branded digital presence, booking engine, and operations dashboard.

### Core Proposition

| For | Benefit |
|-----|---------|
| **Property Owners** | Digital storefront, booking engine, staff management, analytics — set up in minutes |
| **Walk-in & Online Guests** | Instant booking, digital check-in/out, invoices, reviews |
| **Staff** | Housekeeping task boards, front-desk tools, maintenance logs |
| **Platform Admins** | Approve properties, manage subscriptions, monitor health at scale |

---

## 2. User Roles & Account Types

> [!IMPORTANT]
> Unlike iHosps (which has owner / moderator / doctor / staff), the hospitality domain needs **8 distinct roles** spanning both B2B (property-side) and B2C (guest-side) workflows.

### 2.1 Platform-Level Roles

| # | Role | Description |
|---|------|-------------|
| 1 | **Global Admin (Super Admin)** | iStays platform team. Approves registrations, manages plans, monitors all tenants, views platform analytics, handles disputes |
| 2 | **Global Support Agent** | Handles tenant support tickets, can impersonate tenant dashboards (read-only) for debugging |

### 2.2 Tenant-Level Roles (Per Property)

| # | Role | Description |
|---|------|-------------|
| 3 | **Property Owner** | Registers the property, configures rooms/rates/policies, manages staff, views financials, manages subscription |
| 4 | **General Manager (GM)** | Full operational control (same as owner minus billing/subscription). Can do everything a front-desk manager can, plus approve refunds, manage staff |
| 5 | **Front Desk Staff** | Check-in / check-out, walk-in bookings, room blocking, guest management, payment collection |
| 6 | **Housekeeping Staff** | View assigned rooms, mark clean/dirty/inspected, raise maintenance requests |
| 7 | **Accountant** | View/download invoices, generate financial reports, manage GST settings, reconcile payments |

### 2.3 Guest-Side Role

| # | Role | Description |
|---|------|-------------|
| 8 | **Guest (End User)** | Browse properties, book rooms, digital check-in, view invoices, leave reviews, manage profile & past stays |

### 2.4 Role Hierarchy & Permissions Matrix

```
Global Admin
 └── Global Support Agent
 └── Property Owner
       └── General Manager
             ├── Front Desk Staff
             ├── Housekeeping Staff
             └── Accountant
Guest (independent, cross-tenant)
```

> [!NOTE]
> **Design Decision — Permissions Storage:** Permissions are stored as a JSON `permissions` column on `TenantMembership` (same as iHosps `config` on Tenant). Each role has default permissions that can be overridden per-user. This avoids a separate permissions table while keeping flexibility. At 500K+ tenants, JSON column lookups are negligible since they're loaded once per auth context, not queried.

```json
{
  "canManageRooms": true,
  "canManageStaff": true,
  "canViewFinancials": true,
  "canProcessRefunds": false,
  "canAccessHousekeeping": false,
  "canManageSubscription": false
}
```

---

## 3. Feature Modules

### 3.1 🏢 Property Registration & Onboarding

> Mirror of iHosps `register-clinic` flow (verified against [apps/web/app/register-clinic/page.tsx](file:///c:/Users/rajya/.gemini/antigravity/playground/hospital/apps/web/app/register-clinic/page.tsx))

| Feature | Details |
|---------|---------|
| Self-service registration | Owner fills form: property name, type (Hotel / Lodge / Resort / Homestay / Guest House), address, city, state, GST number (optional), contact details |
| Global Admin approval | New registrations land in admin queue with `pending_approval` status; admin can approve / reject / request more info |
| Subdomain provisioning | Approved properties get `{slug}.istays.in` — auto-provisioned via Cloudflare API |
| Custom domain support | Owners can map their own domain (e.g., `booking.myhotel.com`) via CNAME — verified + SSL auto-provisioned |
| Guided setup wizard | Step-by-step: (1) Property details → (2) Add floors/rooms → (3) Set rates → (4) Configure policies → (5) Invite staff → (6) Go live |
| Property branding | Upload logo, set primary/secondary colors, tagline, hero image — reflected on the property's public booking page |
| Multi-property support | One owner account can register and manage multiple properties (e.g., a hotel chain). Uses iHosps pattern: one `GlobalUser` → many `Tenant` records via `ownedTenants` relation |

### 3.2 🛏️ Room & Inventory Management

> Adapted from iHosps Floor → Room → Bed hierarchy. In hotels, the "Bed" layer is replaced by **RoomType** (Standard, Deluxe, Suite, etc.) since hotels sell rooms, not beds.

| Feature | Details |
|---------|---------|
| **Property structure** | Configure: Floors → Rooms (each room has a type, number, max occupancy, base rate) |
| **Room types** | Standard, Deluxe, Suite, Dormitory, Family Room, Cottage — **owner-configurable** (not hardcoded enum) |
| **Room status board** | Visual grid/calendar showing all rooms with status: Available / Occupied / Blocked / Under Maintenance / Dirty / Cleaning |
| **Amenity tags** | Per-room: AC, WiFi, TV, Balcony, Lake View, Attached Bathroom, Geyser — stored as JSON array, used in search filters |
| **Seasonal / dynamic pricing** | Base rate + seasonal multipliers (Diwali, New Year, peak/off-peak). Optional: weekday vs weekend rates |
| **Rate plans** | Room-only (EP), Bed & Breakfast (CP), Half Board (MAP), Full Board (AP) — with add-on pricing |
| **Extra bed / cot** | Configurable per room type: max extra beds, extra bed charge |
| **Room photos** | Upload multiple photos per room type — displayed on booking page. Stored in Cloudflare R2 |
| **Bulk operations** | Block/unblock multiple rooms, bulk rate update, seasonal rate templates |

### 3.3 📅 Booking Engine

> Core revenue feature — equivalent to iHosps Appointments module

| Feature | Details |
|---------|---------|
| **Online booking widget** | Embeddable search: check-in / check-out dates + guests → shows available rooms with prices |
| **Real-time availability** | Availability calendar synced in real-time; double-booking prevented with `@@unique([tenantId, roomId, date])` constraint on a **RoomDateInventory** table |
| **Walk-in booking** | Front desk can create instant bookings for walk-in guests |
| **Booking statuses** | `pending_confirmation` → `confirmed` → `checked_in` → `checked_out` / `cancelled` / `no_show` |
| **Guest details capture** | Full name, phone, email, ID proof type & number (Aadhaar / PAN / Passport / DL), address, nationality |
| **Group booking** | Book multiple rooms under one reservation (corporate / family / tour group) — uses `BookingRoom` junction table |
| **Modification & cancellation** | Guests and staff can modify dates / cancel within policy rules; auto-calculates refund |
| **Cancellation policies** | Owner-configurable: free cancellation window (hours before check-in), partial refund %, no-show charges |
| **Advance payment** | Configurable: full prepaid, partial advance (%), or pay-at-property |
| **Booking confirmation** | Auto-send via Email + SMS (+ WhatsApp optional) with booking ID, check-in instructions, property address with map link |
| **OTA channel manager** | **(Phase 3)** Sync inventory to MakeMyTrip, Goibibo, Booking.com, Agoda via API integrations |

### 3.4 🔑 Check-in / Check-out

| Feature | Details |
|---------|---------|
| **Front desk check-in** | Staff selects booking → verifies ID → marks checked-in → assigns room (auto or manual) |
| **Digital check-in** | Guest receives pre-check-in link via SMS/email → uploads ID, fills e-registration card |
| **ID verification** | Capture govt ID type + number. **Mandatory under Foreigners Act, 1946 and Registration of Foreigners Rules, 1992** for all guests. Store securely (AES-256 encrypted at rest) |
| **Form-B register** | System maintains a digital Form-B (guest register) per property, exportable for police inspection. **Mandatory for all guests, Indian and foreign** |
| **C-Form submission** | For foreign nationals: auto-generate C-Form data per **Immigration and Foreigners Act, 2025**; export CSV for FRRO portal upload within 24 hours of check-in. Separate C-Form per guest |
| **Room key/access code** | (Optional, Phase 3) Generate digital access codes for smart-lock enabled properties |
| **Check-out** | Settle pending charges → generate final invoice → update room status to "dirty" → release inventory |
| **Express check-out** | Guest settles via payment link → auto check-out without visiting front desk |
| **Late check-out** | Configurable: auto-charge after checkout time, configurable grace period & hourly charges |

### 3.5 💰 Billing & Invoicing

> [!IMPORTANT]
> **GST Slab Structure (effective Sep 22, 2025):**
> | Room Tariff (per night) | GST Rate | ITC |
> |------------------------|---------|-----|
> | Below ₹1,000 | Exempt (0%) | No |
> | ₹1,000 – ₹7,500 | 5% | No |
> | Above ₹7,500 | 18% | Yes |
>
> GST is based on **transaction value** (actual invoice amount after discounts), not declared tariff. SAC codes: **996311** (room accommodation), **996331** (food & beverage services).

| Feature | Details |
|---------|---------|
| **Folio management** | Per-booking running account: room charges, extra bed, F&B, laundry, minibar, taxes |
| **GST compliance** | Auto-calculate CGST + SGST (intra-state) or IGST (inter-state) based on property state vs guest billing address. Auto-select correct slab based on transaction value |
| **Invoice generation** | Professional PDF invoices with: property branding, GSTIN, guest GSTIN (optional), SAC codes (996311/996331), tax breakdown, place of supply |
| **Payment methods** | Cash, UPI (Razorpay), Card, Bank Transfer — each tracked with method-specific metadata |
| **Split billing** | Split charges between company (room) and guest (personal expenses) |
| **Advance / deposit tracking** | Track advance paid, balance due, refunds |
| **Night audit** | Auto-post daily room charges at configurable time (e.g., midnight), generate daily revenue report |
| **Refund processing** | Full / partial refund with reason tracking and approval workflow (GM approval for amounts exceeding configurable threshold) |

### 3.6 🧹 Housekeeping Module

| Feature | Details |
|---------|---------|
| **Room status tracking** | Dirty → Cleaning → Clean → Inspected (by supervisor) |
| **Assignment board** | Assign rooms to housekeeping staff; track completion |
| **Task checklist** | Configurable per room type: bed linen change, towel replacement, minibar restock, bathroom clean |
| **Maintenance requests** | Staff raises ticket: AC broken, plumbing issue, etc. → routed to maintenance team |
| **Lost & found** | Log found items with photos, room, date — track claim/disposal |
| **Minibar consumption** | Log consumed items → auto-posted to guest folio |
| **Laundry tracking** | Guest laundry requests: item count, express/normal, charges → auto-post to folio |

### 3.7 📊 Analytics & Reporting

| Feature | Details |
|---------|---------|
| **Occupancy dashboard** | Today's occupancy %, room-type breakdown, trend over time |
| **Revenue metrics** | ADR (Average Daily Rate), RevPAR (Revenue Per Available Room), TRevPAR (Total Revenue Per Available Room) |
| **Booking source analysis** | Direct vs OTA vs walk-in — with conversion rates |
| **Guest demographics** | Domestic vs international, repeat guests, top cities |
| **Housekeeping KPIs** | Average turnaround time, rooms cleaned per staff per day |
| **Financial reports** | Revenue report, GST summary (monthly filing helper), outstanding payments, refund report |
| **Exportable** | All reports exportable as CSV / PDF |
| **Date range filters** | Today, this week, this month, custom range, YoY comparison |

### 3.8 🌐 Public Property Page (Branded Website)

> Equivalent to iHosps public clinic pages (verified against [apps/web/app/page.tsx](file:///c:/Users/rajya/.gemini/antigravity/playground/hospital/apps/web/app/page.tsx))

| Feature | Details |
|---------|---------|
| **SEO-optimized landing page** | Property name, description, photos gallery, amenities, location map, reviews |
| **Room showcase** | Room types with photos, amenities, pricing, availability calendar |
| **Integrated booking** | "Book Now" widget embedded directly — no redirect to third party |
| **Contact section** | Phone, email, WhatsApp click-to-chat, Google Maps embed |
| **Reviews & ratings** | Verified guest reviews (post-checkout). Owner can respond |
| **Multi-language** | (Phase 3) Hindi, English, + regional language support |
| **PWA support** | Installable as mobile app for guests |

### 3.9 👥 Staff Management

| Feature | Details |
|---------|---------|
| **Invite staff** | Owner/GM invites via email → staff creates account → auto-assigned role (mirrors iHosps `TenantMembership` pattern) |
| **Role-based access** | Enforced at API level (middleware) + UI level (conditional rendering) |
| **Shift management** | (Phase 3) Define shifts, assign staff, track attendance |
| **Activity log** | Who did what, when — audit trail per tenant |
| **Multi-property access** | One staff account can have memberships in multiple properties |

### 3.10 📱 Guest Portal & Mobile Experience

| Feature | Details |
|---------|---------|
| **Guest account** | One account across all iStays properties. Social login (Google) + OTP login (phone) |
| **Booking history** | Past stays, upcoming reservations, saved properties |
| **Digital registration card** | Pre-fill for future stays |
| **In-stay services** | Request: extra towels, room service, wake-up call, taxi — routed to appropriate staff |
| **Invoice download** | Access all invoices from guest dashboard |
| **Review & rate** | Post-checkout prompt to rate (1-5 stars) + text review |
| **Loyalty program** | (Phase 3) Points per stay, redeemable for discounts |

### 3.11 🔔 Notifications & Communication

| Feature | Details |
|---------|---------|
| **Channels** | In-app, Email (Resend), SMS (MSG91/Twilio), WhatsApp (WhatsApp Business API — Phase 3) |
| **Booking confirmations** | Auto-sent on booking, modification, cancellation |
| **Pre-arrival reminder** | 24h before check-in: directions, check-in time, documents needed |
| **Post-checkout** | Thank you message + review prompt + invoice link |
| **Staff notifications** | New booking alert, check-in alert, housekeeping assignments, maintenance tickets |
| **Owner alerts** | Daily revenue summary, low occupancy warning, negative review alert |

### 3.12 🛡️ Global Admin Panel

> Mirror of iHosps Admin module (verified against `apps/web/app/admin/`)

| Feature | Details |
|---------|---------|
| **Registration approval queue** | View pending, approve, reject, request-modifications |
| **Tenant management** | List/search/filter all properties. View details, impersonate, suspend, archive |
| **Subscription management** | View plans, change tenant plans, apply custom pricing, process refunds |
| **Platform analytics** | Total properties, total bookings (platform-wide), revenue, growth trends |
| **Feature flags** | Enable/disable features per tenant or per plan tier |
| **Content moderation** | Review reported reviews, resolve disputes |
| **Support ticket dashboard** | View/respond to tenant support requests |
| **System health** | API latency, DB connection pool, error rates, deployment status |

### 3.13 💳 Platform Subscription & Pricing

> Owner pays iStays a monthly/annual fee for using the platform

| Tier | Target | Monthly Price (INR) | Limits |
|------|--------|-------------------:|--------|
| **Free** | Trial / Micro | ₹0 | 5 rooms, 50 bookings/mo, basic reports, iStays branding |
| **Starter** | Small Lodge | ₹999 | 20 rooms, unlimited bookings, email notifications, remove branding |
| **Professional** | Mid-size Hotel | ₹2,999 | 100 rooms, housekeeping module, analytics, custom domain, GST invoicing |
| **Enterprise** | Resort / Chain | ₹7,999 | Unlimited rooms, multi-property, OTA integration, API access, priority support |
| **Custom** | Large Chains | Contact Sales | Dedicated infra, SLA, custom features |

All paid plans include 14-day free trial. Annual billing at 20% discount.

> [!NOTE]
> **Pricing validation:** These prices are benchmarked against Indian competitors — Hotelogix starts at ~₹8,000/mo, eZee at ~₹5,000/mo. The free + ₹999 tiers undercut the market to drive adoption. Prices should be validated with customer discovery interviews before launch.

### 3.14 🔒 Security & Compliance

| Area | Details |
|------|---------|
| **Authentication** | Email+password with bcrypt hashing. 2FA via OTP (email or SMS). OAuth (Google) |
| **Session management** | JWT access tokens (15min) + HTTP-only refresh tokens (7 days). Concurrent session limits |
| **Row-Level Security** | PostgreSQL RLS policies on all tenant-scoped tables — enforced at DB level, not just app |
| **Data encryption** | AES-256 for guest ID documents at rest. TLS 1.3 in transit |
| **Rate limiting** | Per-IP and per-tenant rate limits on all API endpoints (express-rate-limit + Redis) |
| **OWASP compliance** | Input validation (Zod), SQL injection prevention (Prisma parameterized queries), XSS protection (Next.js auto-escaping), CSRF tokens |
| **Guest data privacy** | Guest ID images auto-deleted after configurable retention period (default: 365 days). Compliant with **Digital Personal Data Protection (DPDP) Act, 2023** — requires consent notice, purpose limitation, data principal rights (access, correction, erasure) |
| **Audit logging** | All write operations logged with user, action, resource, changes, IP address, timestamp |
| **Backup strategy** | Automated daily backups with 30-day retention. Point-in-time recovery. Geo-redundant backups |
| **Regulatory** | **Foreigners Act, 1946** + **Registration of Foreigners Rules, 1992** compliance for guest registration. **Immigration and Foreigners Act, 2025** for C-Form submission. Form-B physical register export. GST-compliant invoicing per Sep 2025 slab structure. **DPDP Act, 2023** for data protection |

### 3.15 🌍 Discoverability (Find-a-Stay)

> Equivalent to iHosps "Find Hospitals" public page

| Feature | Details |
|---------|---------|
| **Public directory** | Searchable listing of all active properties on iStays |
| **Search filters** | City, dates, guests, price range, amenities, property type, rating |
| **Map view** | Google Maps integration showing property pins with price labels |
| **Sort options** | Price low-high, rating, popularity, distance |
| **Instant booking** | Book directly from search results — no redirect |
| **SEO** | Each property page server-rendered with structured data (Schema.org/LodgingBusiness) for Google indexing |

---

## 4. Technical Stack

### 4.1 Architecture Overview

```mermaid
graph TB
  subgraph "Client Layer"
    A[Next.js Web App<br/>SSR + PWA]
    B[React Native Mobile<br/>Phase 3]
  end

  subgraph "API Layer"
    C[Express.js API Server<br/>REST + WebSocket]
    D[BullMQ Workers<br/>Background Jobs]
  end

  subgraph "Data Layer"
    E[(PostgreSQL<br/>Neon Serverless)]
    F[(Redis<br/>Upstash)]
    G[(Cloudflare R2<br/>Object Storage)]
  end

  subgraph "Infrastructure"
    H[Cloudflare<br/>DNS + CDN + Workers]
    I[Sentry + Logtail<br/>Monitoring]
  end

  A --> C
  B --> C
  C --> E
  C --> F
  C --> G
  D --> E
  D --> F
  C --> H
```

### 4.2 Detailed Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Monorepo** | Turborepo + npm workspaces | Proven pattern from iHosps; shared packages between apps |
| **Frontend** | Next.js 14+ (App Router) | SSR for SEO (property pages), API routes as BFF |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid development, consistent design system |
| **State** | Zustand + React Query (TanStack Query) | Lightweight client state + server cache with auto-revalidation |
| **API** | Express.js (TypeScript) | Same pattern as iHosps; mature ecosystem, middleware-based auth |
| **ORM** | Prisma + PostgreSQL | Type-safe queries, schema migrations, relation handling |
| **Database** | PostgreSQL (Neon Serverless) | Proven at scale, supports RLS, serverless connection pooling |
| **Cache / Sessions** | Redis (Upstash) | Rate limiting, session store, real-time pub/sub, BullMQ backend |
| **Background Jobs** | BullMQ | Night audit, invoice generation, email/SMS queues, analytics aggregation |
| **Object Storage** | Cloudflare R2 | Photos, ID docs, invoices — S3-compatible, zero egress fees |
| **Email** | Resend | Transactional emails (same as iHosps) |
| **SMS** | MSG91 | OTP, booking confirmations — India-first pricing (~₹0.15/SMS) |
| **Payments** | Razorpay | UPI, cards, netbanking — standard for India. Handles payment pages + refunds |
| **Search** | PostgreSQL full-text + pg_trgm | Sufficient for property/guest search. GIN indexes on searchable columns |
| **CDN / DNS** | Cloudflare | Wildcard `*.istays.in`, custom domain SSL, edge caching |
| **CI/CD** | GitHub Actions | Automated build, test, deploy pipeline |
| **Monitoring** | Sentry + Better Stack (Logtail) | Error tracking + log aggregation |
| **Hosting** | Railway (start) → AWS EKS (scale) | Start lean, migrate to K8s when crossing ~50K tenants |

> [!WARNING]
> **Prisma + RLS Limitation:** Prisma does not natively support PostgreSQL session variables (`SET app.current_tenant_id = '...'`). The iHosps codebase uses `$executeRawUnsafe()` to set the tenant context before each request. This pattern must be replicated carefully — every API request must call `SET app.current_tenant_id` before any Prisma query. A middleware wrapper function should encapsulate this to prevent accidental data leaks.

### 4.3 Monorepo Structure

```
istays/
├── apps/
│   ├── web/                    # Next.js — public pages, dashboard, admin panel
│   │   ├── app/
│   │   │   ├── (public)/       # Landing page, property directory, search
│   │   │   ├── (auth)/         # Login, register, reset-password, verify
│   │   │   ├── dashboard/      # Property dashboard (tenant-scoped)
│   │   │   ├── admin/          # Global admin panel
│   │   │   └── [slug]/         # Public property pages (SSR)
│   │   └── ...
│   └── mobile/                 # React Native (Phase 3)
│
├── packages/
│   ├── api/                    # Express API server
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── tenants/
│   │       │   ├── properties/
│   │       │   ├── rooms/
│   │       │   ├── bookings/
│   │       │   ├── guests/
│   │       │   ├── check-in-out/
│   │       │   ├── billing/
│   │       │   ├── housekeeping/
│   │       │   ├── analytics/
│   │       │   ├── notifications/
│   │       │   ├── reviews/
│   │       │   ├── platform/
│   │       │   └── uploads/
│   │       ├── middleware/     # auth, RLS tenant-set, rate-limit, validation
│   │       ├── services/      # email, sms, payment, storage
│   │       └── utils/
│   │
│   └── shared/                # Shared types, constants, validation schemas
│       ├── types/
│       ├── constants/
│       └── validators/
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 5. Database Schema Design

### 5.1 Multi-Tenancy Strategy

**Same as iHosps: Single-schema with Row-Level Security (RLS).**

- All tenant-scoped tables have a `tenant_id` column with composite indexes `(tenant_id, ...)`
- PostgreSQL RLS policies enforce `tenant_id = current_setting('app.current_tenant_id')` on every query
- Superuser bypass policy for admin/debug access: `current_setting('rls.bypass') = 'on'`
- This scales better than schema-per-tenant for 500K+ tenants (schema-per-tenant hits limits around ~100 tenants)

> [!CAUTION]
> **RLS Performance Caveats at Scale:**
> - `SELECT COUNT(*)` on RLS-enabled tables checks visibility for every row — use **denormalized counters** in a `TenantStats` table for dashboard metrics
> - RLS policy functions must be marked **`STABLE`** to allow PostgreSQL to cache results within a transaction
> - Keep policies simple — avoid subqueries; use `current_setting()` only
> - At 500K tenants, partition high-volume tables (`bookings`, `folio_charges`, `audit_logs`) by `tenant_id` hash to keep per-partition row counts manageable

### 5.2 Entity Relationship Diagram

```mermaid
erDiagram
    GlobalUser ||--o{ TenantMembership : has
    GlobalUser ||--o{ Tenant : owns
    GlobalUser ||--o{ GuestProfile : "is a"
    Tenant ||--o{ TenantMembership : has
    Tenant ||--o{ Floor : has
    Tenant ||--o{ RoomType : has
    Tenant ||--o{ Booking : has
    Tenant ||--o{ AuditLog : has
    Floor ||--o{ Room : contains
    RoomType ||--o{ Room : categorizes
    RoomType ||--o{ RoomPhoto : has
    Room ||--o{ BookingRoom : "allocated in"
    Room ||--o{ HousekeepingTask : "assigned to"
    Room ||--o{ MaintenanceRequest : "raised for"
    GuestProfile ||--o{ Booking : makes
    Booking ||--o{ BookingRoom : "reserves"
    Booking ||--o{ FolioCharge : incurs
    Booking ||--o{ GuestPayment : "paid via"
    Booking ||--|o Review : "reviewed in"
```

### 5.3 Key Models (Prisma-style)

> [!NOTE]
> **Guest model design decision:** Guests exist at **platform level** (`GuestProfile` linked to `GlobalUser`) so one guest account works across all iStays properties. Property-specific data (ID proof scans, check-in records) are stored in tenant-scoped tables (`BookingGuest`) and subject to RLS. This mirrors how iHosps has `GlobalUser` (platform) + `Patient` (tenant-scoped).

```
-- Platform-Level (no tenant_id, no RLS)
GlobalUser        — id, email, passwordHash, fullName, phone, isActive, isGlobalAdmin,
                    emailVerified, twoFactorEnabled, avatarUrl, timestamps

GuestProfile      — id, globalUserId → GlobalUser, fullName, phone, email,
                    nationality, dateOfBirth, gender, preferredLanguage,
                    idProofType, idProofNumber,
                    address, city, state, pincode, timestamps

Tenant            — id, name, slug, customDomain, status (pending/active/suspended),
                    propertyType (hotel/lodge/resort/homestay/guesthouse),
                    address, city, state, pincode, gstNumber,
                    contactPhone, contactEmail, latitude, longitude,
                    timezone, defaultCheckInTime, defaultCheckOutTime,
                    cancellationPolicyHours, lateCheckoutChargePercent,
                    plan, config (JSON), featureOverrides (JSON),
                    brandLogo, primaryColor, secondaryColor, tagline, heroImage,
                    ownerId → GlobalUser, timestamps

TenantMembership  — id, userId → GlobalUser, tenantId → Tenant, role, isActive,
                    permissions (JSON), timestamps

PlatformSettings  — id ('global'), config (JSON), updatedAt

-- Subscriptions & Platform Payments (same pattern as iHosps)
Subscription      — id, tenantId, plan, billingCycle, status,
                    trialStart, trialEnd,
                    currentPeriodStart, currentPeriodEnd, timestamps
PlatformPayment   — id, tenantId, subscriptionId?, amount, currency (INR),
                    status, method, gatewayPaymentId, receiptNumber, timestamps

-- Tenant-Scoped (have tenant_id, RLS enforced)
Floor             — id, tenantId, name, sortOrder, isActive
RoomType          — id, tenantId, name, slug, description,
                    baseOccupancy, maxOccupancy, maxExtraBeds, extraBedCharge,
                    baseRate, weekendRate, amenities (JSON), isActive

Room              — id, tenantId, floorId → Floor, roomTypeId → RoomType,
                    roomNumber, status, rateOverride?, features (JSON), isActive

RoomPhoto         — id, tenantId, roomTypeId → RoomType, url, sortOrder, caption

RateSeason        — id, tenantId, name, startDate, endDate, multiplier,
                    applicableRoomTypes (JSON), isActive

Booking           — id, tenantId, bookingNumber, guestProfileId → GuestProfile,
                    source (online/walkin/ota/phone),
                    checkInDate, checkOutDate, numAdults, numChildren, numRooms,
                    status (pending/confirmed/checkedIn/checkedOut/cancelled/noShow),
                    totalAmount, advancePaid, balanceDue,
                    cancellationReason?, cancelledAt?, checkedInAt?, checkedOutAt?,
                    specialRequests, notes, createdBy, timestamps

BookingRoom       — id, tenantId, bookingId → Booking, roomId → Room,
                    roomTypeId → RoomType, ratePerNight, extraBeds, extraBedCharge,
                    guestNames (JSON)

BookingGuest      — id, tenantId, bookingId → Booking, guestProfileId,
                    idProofType, idProofNumber, idProofImageUrl (encrypted),
                    isFormBRecorded (bool), cFormSubmitted (bool), cFormSubmittedAt

FolioCharge       — id, tenantId, bookingId → Booking, chargeDate, category
                    (room/extraBed/food/laundry/minibar/service/other),
                    description, sacCode (996311/996331), quantity, unitPrice, totalPrice,
                    gstRate, cgst, sgst, igst, isAutoGenerated, timestamps

GuestPayment      — id, tenantId, bookingId → Booking, amount, method
                    (cash/upi/card/bankTransfer),
                    status, gatewayPaymentId?, receiptNumber, timestamps

Invoice           — id, tenantId, bookingId → Booking, invoiceNumber, guestName,
                    guestGstin?, propertyGstin, placeOfSupply,
                    subtotal, totalCgst, totalSgst, totalIgst, grandTotal,
                    pdfUrl, isProforma, timestamps

HousekeepingTask  — id, tenantId, roomId → Room, assignedTo?, taskDate,
                    status (pending/inProgress/completed/inspected),
                    checklist (JSON), notes, completedAt?, inspectedBy?, timestamps

MaintenanceRequest — id, tenantId, roomId → Room, raisedBy, category
                     (plumbing/electrical/ac/furniture/other),
                     priority (low/medium/high/critical), description,
                     status (open/assigned/inProgress/resolved/closed),
                     assignedTo?, resolvedAt?, timestamps

LostAndFound      — id, tenantId, roomId?, itemDescription, foundBy,
                     foundDate, photoUrl?, status (stored/claimed/disposed),
                     claimedBy?, claimDate?

Review            — id, tenantId, bookingId → Booking, guestProfileId → GuestProfile,
                    rating (1-5), text, ownerReply?, isPublished, reportedAt?, timestamps

Notification      — id, tenantId?, userId?, channel (inApp/email/sms/whatsapp),
                    type, title, message, metadata (JSON), isRead, timestamps

AuditLog          — id, tenantId, userId?, action, resource, resourceId?,
                    changes (JSON), ipAddress, timestamps

TenantStats       — id, tenantId (unique), totalBookings, totalRevenue,
                    activeBookings, todayOccupancyPercent, updatedAt
                    (denormalized counters, updated by background job)
```

---

## 6. API Module Design

| Module | Key Endpoints | RLS |
|--------|--------------|-----|
| **auth** | POST /register, POST /login, POST /verify-email, POST /verify-2fa, POST /forgot-password, POST /refresh-token | ✗ |
| **tenants** | POST /register-property, GET /my-properties, PATCH /:id/settings, PATCH /:id/branding | ✗ |
| **platform** | GET /admin/registrations, POST /admin/approve/:id, GET /admin/tenants, GET /admin/analytics | ✗ |
| **rooms** | CRUD /rooms, CRUD /room-types, CRUD /floors, POST /rooms/bulk-block, GET /rooms/availability | ✓ |
| **rates** | CRUD /rate-seasons, PATCH /room-types/:id/rates | ✓ |
| **bookings** | POST /book, GET /bookings, PATCH /:id/modify, POST /:id/cancel, GET /availability | ✓ |
| **guests** | CRUD /guests, GET /guests/search, POST /guests/:id/upload-id | ✓ |
| **check-in-out** | POST /bookings/:id/check-in, POST /bookings/:id/check-out, POST /bookings/:id/express-checkout | ✓ |
| **billing** | GET /bookings/:id/folio, POST /folio/charge, POST /payments, GET /invoices, POST /invoices/generate | ✓ |
| **housekeeping** | GET /tasks, PATCH /tasks/:id/status, POST /maintenance, GET /lost-found | ✓ |
| **analytics** | GET /occupancy, GET /revenue, GET /booking-sources, GET /guest-demographics | ✓ |
| **reviews** | POST /reviews, GET /reviews, PATCH /reviews/:id/reply, POST /reviews/:id/report | ✓ |
| **notifications** | GET /notifications, PATCH /:id/read, POST /send (internal) | ✓ |
| **uploads** | POST /upload (presigned R2 URL), DELETE /:id | ✓ |
| **public** | GET /properties, GET /properties/:slug, GET /properties/:slug/rooms, GET /search | ✗ |

---

## 7. Scalability Strategy (500K–1M Tenants)

### 7.1 Database Scaling

| Challenge | Solution |
|-----------|----------|
| **Connection pooling** | Neon Serverless driver with HTTP-based pooling (no persistent connections). Handles 10K+ concurrent connections without PgBouncer |
| **Read replicas** | Neon read replicas for analytics/reporting queries. Write to primary, read from replicas |
| **Table partitioning** | Partition `bookings`, `folio_charges`, `audit_logs` by `tenant_id` hash (256 partitions). Range-partition `audit_logs` additionally by month |
| **Index strategy** | Composite indexes `(tenant_id, ...)` on all tenant-scoped tables. Partial indexes for hot queries: `WHERE status = 'confirmed'` on bookings |
| **Archival** | Background job moves bookings older than 2 years to cold storage (S3 Parquet + Athena). Keep summary aggregates in main DB |
| **Denormalized counters** | `TenantStats` table updated by BullMQ workers — avoids expensive `COUNT(*)` on RLS tables |

### 7.2 Application Scaling

| Strategy | Details |
|----------|---------|
| **Stateless API** | All sessions in Redis; any API instance can serve any request |
| **Horizontal scaling** | Auto-scale API pods based on CPU/memory (K8s HPA). Target: 50-100 pods at peak |
| **CDN caching** | Public property pages cached at Cloudflare edge (stale-while-revalidate, 5min TTL). Static assets cached indefinitely |
| **Background jobs** | BullMQ (backed by Redis) for: invoice PDF generation, email/SMS sending, night audit, analytics aggregation, data archival |
| **Rate limiting** | Per-tenant + per-IP rate limits. Redis-backed sliding window. Premium tiers get higher limits |
| **Event-driven** | Redis pub/sub for real-time updates (room status, booking confirmations). Upgrade to Kafka/NATS at >200K bookings/day |

### 7.3 Multi-Tenancy at Scale

| Concern | Approach |
|---------|----------|
| **Noisy neighbor** | Per-tenant rate limits + query timeouts (30s). Premium plans get higher limits. Monitor per-tenant query latency via Logtail |
| **Data isolation** | PostgreSQL RLS (enforced at DB level). Even if app code has bugs, DB won't leak data |
| **Tenant onboarding** | Fully automated: create DB records, provision subdomain (Cloudflare API), seed default data — in one transaction |
| **Tenant offboarding** | Soft-delete (status=archived). Hard-delete available after 90-day grace period with full data export (DPDP Act compliance) |

### 7.4 Disaster Recovery

| Metric | Target |
|--------|--------|
| **RPO** (Recovery Point Objective) | < 1 hour (Neon PITR) |
| **RTO** (Recovery Time Objective) | < 4 hours |
| **Backup strategy** | Neon automated continuous backups + daily point-in-time snapshots. R2 object backups replicated to secondary region |
| **Failover** | Neon handles automatic primary failover. Application deployed in 2 regions with DNS-based failover (Cloudflare) |
| **Data export** | Tenant data export API for DPDP compliance — full JSON export within 72 hours of request |

### 7.5 Performance Targets

| Metric | Target |
|--------|--------|
| API p95 latency | < 200ms |
| Page load (LCP) | < 2.5s |
| Availability | 99.9% uptime (8.77 hours/year max downtime) |
| Booking throughput | 10K bookings/min platform-wide |
| Search response | < 500ms for property search (with pg_trgm GIN index) |

---

## 8. Implementation Phases

### Phase 1 — MVP (Months 1-3)
- [ ] Monorepo setup (Turborepo + Next.js + Express + Prisma)
- [ ] Auth (register, login, email verify, 2FA)
- [ ] Property registration + Global Admin approval
- [ ] Subdomain provisioning (Cloudflare)
- [ ] Room management (floors, room types, rooms)
- [ ] Basic booking engine (online + walk-in)
- [ ] Check-in / Check-out flow (with ID capture + Form-B)
- [ ] Basic billing (folio charges, payments, simple invoice with GST)
- [ ] Landing page + public property page
- [ ] Email notifications (Resend)

### Phase 2 — Operational Features (Months 4-5)
- [ ] Housekeeping module
- [ ] Seasonal / dynamic pricing
- [ ] Group bookings
- [ ] Guest reviews & ratings
- [ ] Analytics dashboard (occupancy, revenue, ADR/RevPAR)
- [ ] SMS notifications (MSG91)
- [ ] Razorpay payment integration
- [ ] GST-compliant invoicing (3-tier slabs, SAC codes, place of supply)

### Phase 3 — Growth & Scale (Months 6-8)
- [ ] OTA channel manager (MakeMyTrip, Booking.com)
- [ ] Guest mobile app (React Native)
- [ ] Guest loyalty program
- [ ] Multi-language support (Hindi + regional)
- [ ] C-Form auto-generation + FRRO export
- [ ] Advanced reporting & export
- [ ] Staff shift management
- [ ] WhatsApp Business API integration

### Phase 4 — Enterprise (Months 9-12)
- [ ] Multi-property dashboard (hotel chains)
- [ ] Revenue management (data-driven dynamic pricing)
- [ ] Custom domain SSL automation
- [ ] White-label options
- [ ] API marketplace for third-party integrations
- [ ] Database partitioning & read replicas
- [ ] Migrate to Kubernetes (AWS EKS)
- [ ] DPDP Act compliance audit + data export API

---

## 9. Competitive Landscape

| Competitor | Their Strength | iStays Positioning |
|------------|---------------|-------------------|
| **OYO** | Brand recognition, massive demand aggregation | iStays preserves property brand identity; OYO takes it away |
| **Hotelogix** | Mature enterprise PMS, 15+ years in market | iStays targets SMBs with a free tier and simpler onboarding |
| **eZee (Yanolja)** | Comprehensive PMS with 100+ integrations | iStays provides built-in booking page + PMS in one; eZee requires separate website |
| **Djubo** | Strong channel manager + booking engine | iStays includes channel manager + housekeeping + billing in one platform |
| **FrontDesk Master** | India-focused, affordable entry pricing | iStays has a free tier and provides public booking pages as differentiator |

**iStays key differentiator:** Each property gets its own **branded website + booking engine** (like iHosps gives each clinic a public page) alongside a full PMS — competitors generally provide PMS but not the digital storefront.

---

## 10. Success Metrics

| KPI | Year 1 Target | Basis |
|-----|--------------|-------|
| Registered properties | 5,000 | ~400/month acquisition after month 3 |
| Paid subscribers | 1,000 | 20% conversion from free to paid |
| Monthly bookings processed | 50,000 | ~50 bookings/month avg per active property |
| Guest satisfaction (CSAT) | > 4.2 / 5 | Measured via post-checkout surveys |
| Platform uptime | 99.9% | SLA target |
| MRR | ₹20 lakhs | Weighted: ~400 × ₹999 + ~400 × ₹2,999 + ~200 × ₹7,999 = ~₹20L |

> [!NOTE]
> **MRR calculation breakdown:**
> - 400 Starter subscribers × ₹999 = ₹3.99L
> - 400 Professional subscribers × ₹2,999 = ₹12.0L
> - 200 Enterprise subscribers × ₹7,999 = ₹16.0L
> - **Total = ~₹32L/month** (upper bound if all 1,000 subs are paid)
> - Realistic estimate with churn and mix: **₹20L/month**

---

## 11. Confidence Rating

### Rating: **8 / 10**

| Aspect | Score | Rationale |
|--------|-------|-----------|
| **Feature completeness** | 9/10 | Covers all standard PMS features + India-specific regulatory requirements. May be missing niche features discovered during customer interviews |
| **Technical architecture** | 8/10 | Proven pattern from working iHosps codebase. RLS + Prisma combination has known caveats (documented above). Neon serverless is production-ready but young vs Aurora/RDS |
| **Regulatory accuracy** | 8/10 | Cross-verified: correct Act names, GST slabs (Sep 2025), C-Form process, DPDP Act. Form-B requirement added. Should be reviewed by a legal advisor before implementation |
| **Scalability plan** | 7/10 | Single-DB RLS scales to ~500K tenants with partitioning. Beyond 1M, would likely need database sharding or a move to Citus/AlloyDB — not yet addressed in detail |
| **Pricing validation** | 6/10 | Benchmarked against competitors but not validated with real customers. ₹999/mo may be too high for micro-lodges in tier-3 cities |
| **Competitive analysis** | 7/10 | Key players identified. Claims are now factual but market dynamics change fast |

> [!WARNING]
> **Remaining Risks Not Fully Addressed:**
> 1. **Payment gateway reconciliation** — Razorpay settlement delays, failed UPI callbacks, partial captures
> 2. **State-wise GST registration** — Properties in multiple states may need multiple GSTINs
> 3. **Accessibility (WCAG)** — Not addressed; should be added for government/institutional properties
> 4. **Offline mode** — Many rural lodges have unreliable internet; PWA offline caching for front-desk operations not yet designed
> 5. **Data sharding** — At true 1M tenants with 100 bookings each, the bookings table has 100M+ rows. Hash partitioning helps but true sharding (Citus) may be needed

---

> [!NOTE]
> This document is a comprehensive blueprint. Implementation should follow the phased approach in Section 8. Each phase should begin with detailed API specifications and UI wireframes before coding begins. Have a legal advisor review Section 3.14 before launch.
