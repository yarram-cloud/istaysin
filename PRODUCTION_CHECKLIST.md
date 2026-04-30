# iStays — Production Readiness Checklist

Track all tasks that must be completed before going live with any property.
Mark items `[x]` when done. Group owner signs off on each section before launch.

---

## 1. Error Monitoring & Observability

- [ ] **Sentry — activate for Next.js frontend**
  - Create project at https://sentry.io (free tier = 5k errors/month)
  - Choose platform: **Next.js**
  - Copy DSN and add to production env:
    ```
    NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
    NEXT_PUBLIC_SENTRY_ENV=production
    NEXT_PUBLIC_SENTRY_RELEASE=1.0.0   # bump on each deploy
    ```
  - Config already implemented in `apps/web/sentry.client.config.ts`
  - `sentry.server.config.ts` and `sentry.edge.config.ts` also need DSN once created
  - Verify errors appear in Sentry dashboard after first deploy

- [ ] **Sentry — activate for Express API**
  - Add `@sentry/node` to `packages/api`
  - Init before all routes with the same DSN
  - Add error handler middleware after all routes: `Sentry.setupExpressErrorHandler(app)`

- [ ] **Uptime monitoring**
  - Add https://betteruptime.com or similar (free tier)
  - Monitor: `https://<your-api>/health` and the main web domain
  - Set alert email/WhatsApp for downtime

---

## 2. Payments

- [ ] **Razorpay — replace test keys with live keys**
  ```
  RAZORPAY_KEY_ID=rzp_live_...
  RAZORPAY_KEY_SECRET=...
  RAZORPAY_WEBHOOK_SECRET=...
  ```
  - Enable webhook endpoint in Razorpay dashboard: `POST /api/v1/payments/webhook`
  - Test a real ₹1 payment before go-live

---

## 3. WhatsApp Notifications

- [ ] **Meta WhatsApp Business API — activate**
  - Get tokens from Meta Business Manager → WhatsApp → API Setup:
    ```
    META_WHATSAPP_TOKEN=<permanent-token>
    META_WHATSAPP_PHONE_ID=<phone-number-id>
    ```
  - Submit and get approval for 4 message templates:
    - `auth_otp_code`
    - `booking_confirmation_v2`
    - `checkin_confirmation_v1`
    - `checkout_receipt_v1`
  - Code is production-ready in `packages/api/src/services/whatsapp.ts` — just needs env vars

---

## 4. Security

- [ ] **Set strong JWT secrets (min 64 chars)**
  ```
  JWT_SECRET=<random-64-char-string>
  JWT_REFRESH_SECRET=<different-random-64-char-string>
  ```
  Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

- [ ] **AES-256 encryption for guest ID proofs** (DPDP Act requirement)
  ```
  ENCRYPTION_KEY=<32-byte-hex-key>
  ```
  - Implementation in `packages/api/src/services/encryption.ts` — verify it's wired to `idProofImageUrl` storage

- [ ] **Rate limiting — verify Redis is configured**
  ```
  REDIS_URL=redis://...
  ```
  - Without Redis, rate limiter falls back to in-memory (resets on restart)
  - Use Upstash Redis (free tier) for serverless-friendly rate limiting

- [ ] **CORS origins — restrict to actual domains**
  - Remove wildcard `*` from API CORS config
  - Set `ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com`

- [ ] **HTTP security headers**
  - Verify `next.config.js` has `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`

---

## 5. Database

- [ ] **Use a managed Postgres instance** (not local/dev)
  - Recommended: Supabase (free), Neon (free), or Railway ($5/mo)
  ```
  DATABASE_URL=postgresql://...
  ```
- [ ] **Enable automated daily backups** on your Postgres provider
- [ ] **Run `prisma migrate deploy`** (not `dev`) in production CI

---

## 6. GST & Tax Compliance

- [ ] **Set GSTIN per tenant** in Dashboard → Settings → Property
- [ ] **Set property state** in tenant settings (required for CGST/SGST vs IGST split)
- [ ] **Verify GST slab config** in Platform Admin → GST Settings matches current Indian rules
- [ ] **GSTR-1 export** is live at `GET /billing/gstr1?month=YYYY-MM` — test with accountant before first filing

---

## 7. Infrastructure & Environment

- [ ] **All `.env` secrets moved to hosting platform's secrets manager**
  - Never commit `.env.production` to git
  - Use Vercel Environment Variables / Railway Variables / AWS Secrets Manager

- [ ] **`NODE_ENV=production`** set in the deployment environment

- [ ] **Cloudinary** configured for image uploads:
  ```
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ```

- [ ] **Custom domain** pointed to hosting provider with SSL (auto via Vercel/Cloudflare)

- [ ] **`NEXT_PUBLIC_API_URL`** set to the production API base URL (not localhost)

---

## 8. Pre-Launch Testing

- [ ] Run full Playwright E2E suite against staging: `npx playwright test`
- [ ] Test complete guest booking flow end-to-end on a real device (mobile)
- [ ] Test WhatsApp OTP flow with a real phone number
- [ ] Test PDF invoice download
- [ ] Test GSTR-1 CSV export and open in Excel — verify columns are aligned
- [ ] Test POS order creation and charge-to-room
- [ ] Verify Sentry receives a test error (throw one manually and delete it)

---

## 9. OTA Channel Manager (Post-Launch P1)

- [ ] Evaluate Channex.io or SiteMinder for OTA connectivity
- [ ] The current OTA module is mock-only — do not market OTA sync until integrated

---

*Last updated: 2026-04-28*
