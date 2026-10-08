# 05 — Tech stack and deployment options (stack-selection review, 2026-10-07)

Scope: a lightweight, server-rendered web app for US nail salons (kiosk clock-in with PIN + webcam photo, daily ticket log with CSV import, weekly pay run, printable EN/VI pay statements, audit binder export, settings). Single-tenant per salon, multi-salon hosting, solo developer, lowest ops burden, 3+ year retention, strong audit trail. Toolchain available: Node 22.22, pnpm 10, bun 1.4.

Method: every version was read from the npm registry on 2026-10-07 (`npm view <pkg> version time`); release notes, docs and pricing were checked against GitHub sources and vendor pages where the sandbox allowed. Items marked **[unverified]** come from secondary summaries and should be re-checked before relying on the exact number.

---

## 1. Framework

| Option | Version (2026-10-07) | SSR / progressive forms | Client bundle | PWA tooling | Maturity |
|---|---|---|---|---|---|
| SvelteKit + Svelte 5 runes | kit 3.0.1 (3.0.0 on 2026-10-01), svelte 5.57.2 | Native form actions + `use:enhance` | Smallest; no VDOM runtime | Kit 3 ships `$app/manifest` + first-class `src/service-worker.ts`; `@vite-pwa/sveltekit` 1.1.0 still peers on Kit 1/2 | v3 is 6 days old; 2.70.3 maintained |
| Next.js | 16.4.0 | Server Actions | React runtime ≈ 45 kB gz | Community (serwist) | Mature, Vercel-shaped |
| React Router 8 (Remix lineage) | 8.4.0 (7.18.4 maintained) | Loaders/actions | React runtime | Community | Two major lines in flight |
| Astro + islands | 7.3.6 | Astro Actions | Near-zero by default | `@vite-pwa/astro` | App-heavy screens become islands |
| Hono + HTML/HTMX | 4.13.13 / htmx 2.0.11 | Hand-rolled | Tiny (htmx ≈ 14 kB) | Hand-rolled | You write form, validation, offline plumbing |
| Nuxt | 4.6.0 | Yes (Nitro) | Vue runtime | `@vite-pwa/nuxt` | No advantage over SvelteKit |

**Recommendation: SvelteKit 3 with Svelte 5 runes, `adapter-node` 6.0.0.** It combines real SSR, form actions that work with JavaScript disabled (a kiosk whose Wi-Fi drops mid-request), the smallest client payload for $80 Android tablets, and a first-party service-worker story. Kit 3 (2026-10-01) requires Node ≥ 22.17, TypeScript 6.x (npm `latest` is 7.0.2, so pin `typescript@^6`), Svelte ≥ 5.57.1, Vite ≥ 8.0.12 (Rolldown) and `vite-plugin-svelte` 7; config moves into `vite.config.ts`, `$lib` becomes `#lib`, `$service-worker` is replaced by `$app/manifest`/`$app/env`, remote functions stay experimental. The ecosystem lag is small and irrelevant here (`@vite-pwa/sveltekit` lacks Kit 3 support; we do not need it, see section 7). If a must-have plugin breaks in the first weeks, pin `@sveltejs/kit@^2.70.3` and run `npx sv migrate sveltekit-3` later.

---

## 2. Database, ORM, backups

| Option | Version / status | Fit |
|---|---|---|
| SQLite via `better-sqlite3` | 13.0.3 (2026-08-05), `engines.node >= 22`, prebuilt binaries | Synchronous, zero network; one file per salon is a tenant boundary and an audit artifact |
| Node `node:sqlite` | In Node 22.22 but still `ExperimentalWarning`; Drizzle has no driver for it | Not yet |
| libSQL / Turso | `@libsql/client` 0.18.0; README: "actively maintained, but new features are being developed in Turso" (Rust rewrite). Free: 100 DBs, 5 GB, 1-day PITR; Developer $4.99 **[secondary]** | Adds a vendor and an engine in transition |
| Neon Postgres | Free: 100 CU-hours, 0.5 GB/project, autosuspend after 5 min | Cold starts on a punch are unacceptable |
| Supabase Postgres | Free: 2 projects, 500 MB, pauses after 7 idle days; Pro $25 | Same objection |
| Cloudflare D1 | 500 MB/DB free, 10 GB paid; 10 / 50 000 DBs; Time Travel 7 / 30 days | Workers-only; rules out `better-sqlite3` and Playwright |

ORM: `drizzle-orm` 0.45.3 + `drizzle-kit` 0.31.11 (SQL-first, SQLite dialect with `better-sqlite3`, `libsql`, `d1` drivers; generated SQL migrations you can read and commit). Prisma's `latest` tag is `8.0.0-rc.21` with 7.10.0 the last stable, heavier runtime and migration engine; `kysely` 0.29.6 is a fine query builder but has no schema/migration generator.

Backups: Litestream v0.5.17 (2026-08-31) streams WAL frames in the LTX format to S3-compatible storage (S3, Cloudflare R2, Backblaze B2, Hetzner auto-detected), offers point-in-time restore, `-f` follow mode and VFS read replicas. LiteFS is a cluster/fail-over tool we do not need for a single writer. Fly volume snapshots ($0.08/GB-month after 10 GB free) are a second, coarser layer.

**Recommendation: SQLite (`better-sqlite3`) + Drizzle + Litestream → Cloudflare R2, one database file per salon** (`/data/salons/<id>/salon.db`, WAL, `synchronous=NORMAL`, foreign keys on). The audit trail is an append-only `audit_log` written in the same transaction as every mutation (who, when, before/after JSON, device id) plus triggers on `punch`, `ticket`, `pay_run` that reject `DELETE` and record `UPDATE`s. A per-salon file makes binder export and end-of-contract deletion trivial and keeps queries from ever touching another tenant. Litestream gives sub-second RPO at near-zero cost; add a nightly `VACUUM INTO` copy kept in R2 for 3+ years.

---

## 3. Auth

| Option | Version / status | Notes |
|---|---|---|
| Better Auth | 1.7.7 (2026-09-30; patch for a magic-link account-takeover bug, so pin ≥ 1.7.7) | Email+password (default `scrypt`, swappable `hash`/`verify` for argon2), `magic-link` plugin (5-min single-use tokens, atomic consume), `api-key` plugin (hashed keys, per-key rate limits, expiry, metadata), built-in rate limiter (prod default 100 req/10 s; per-path `customRules`, memory or DB storage, IPv6 /64 normalisation), SvelteKit `svelteKitHandler` + `sveltekitCookies` |
| Lucia | 3.2.2, npm-deprecated ("see lucia-auth.com/lucia-v3/migrate"); now a guide to writing your own sessions | Good reading, not a dependency |
| Auth.js | `@auth/core` 0.41.3 | OAuth-first; credentials/password flows are second-class |

Password hashing: `@node-rs/argon2` 2.2.2 ships prebuilt N-API binaries (linux x64 gnu/musl, arm64, darwin, win32), no node-gyp, argon2id by default. `argon2` 0.45.1 needs a native build on some targets; `bcrypt` 6.0.0 caps input at 72 bytes and is CPU-only.

**Recommendation: Better Auth 1.7.7 (Drizzle adapter, a shared `auth.db` because owners span salons) with argon2id via `@node-rs/argon2` for owner passwords and worker PINs.** Owners: email+password, magic link as the reset path. Kiosk: the owner pairs the tablet once, minting a salon-scoped `api-key` kept in IndexedDB; every punch is authenticated by that device key, never a cookie. Worker PIN: a 4-digit space is 10 000 keys, so hashing is defence-in-depth; the controls are (a) PINs are accepted only from an enrolled device of that salon, (b) a SQLite-backed per-device and per-worker limiter (5 failures → 30 s, doubling to 15 min, logged), (c) owner notification after 10 consecutive failures. Hash PINs with argon2id (m=19 MiB, t=2, p=1) plus a per-salon pepper from the environment so a leaked file alone does not expose PINs.

---

## 4. PDF generation

| Option | Version | VI fonts | Tables / page numbers | Memory |
|---|---|---|---|---|
| Playwright Chromium HTML→PDF | 1.63.0 (2026-09-04) | Any self-hosted woff2 (Be Vietnam Pro, Noto Sans) | CSS tables, `@page`, header/footer templates with `pageNumber`/`totalPages` | ~150–300 MB RSS per browser **[experience estimate]**; docs: use `--ipc=host` or Chromium "can run out of memory". 256 MB too tight; 1 GB with one reused browser is comfortable |
| pdfmake | 0.3.11 (2026-06-12) | Embed TTF via VFS | Declarative tables, `footer: (page, pages)` | Tens of MB, pure JS |
| @react-pdf/renderer | 4.9.0 | Register fonts | Yes | Pure JS, React-only |
| pdf-lib | 1.17.1 (2021) | Needs fontkit | No layout engine | Merge/stamp only |
| Typst (`typst.ts`) | 0.7.0 (2026-06-01) | Ship fonts into wasm | Excellent | Modest; new DSL |
| WeasyPrint / Gotenberg 8.37.0 | Python / Chromium 152 + LibreOffice | Good | Good | Second runtime or heavy sidecar |
| Cloudflare Browser Rendering | Free 10 min/day, 3 concurrent | Good | Good | Off-box; paid overage **[unverified]** |

**Recommendation: primary = Playwright Chromium rendering the same Svelte statement route the browser prints (`?format=pdf`); fallback = pdfmake.** One template serves screen, `window.print()` and PDF, so EN/VI parity is automatic. Install only Chromium, launch one browser at boot, render through a concurrency-1 queue, recycle the browser every N jobs, pre-load fonts with `font-display: block`. The audit binder is per-period PDFs merged with `pdf-lib`, zipped with the CSVs. If the host must shrink to 512 MB, a feature flag switches to pdfmake with embedded Noto Sans TTF, same tables and page numbers, no browser.

---

## 5. i18n

| Option | Version | Model | Fit |
|---|---|---|---|
| Paraglide JS (inlang) | `@inlang/paraglide-js` 2.26.0 (2026-10-06) | Compile-time, tree-shaken message functions; strategies `url`/`cookie`/`preferredLanguage`/`baseLocale`; SvelteKit Vite plugin + server middleware; message-format with `match`/plural selectors | Zero runtime, type-safe keys, ~nothing shipped for unused locales |
| i18next (+ svelte-i18n) | `i18next` 26.4.2; `svelte-i18n` 4.0.1 (last published 2024-10-21) | Runtime JSON loading | Battle-tested but heavier; the Svelte binding is stale |
| typesafe-i18n | 5.27.1 (2026-02-11) | Generator | Low activity |
| formatjs | `@formatjs/intl` 6.1.3 | ICU runtime | React-centric tooling |

Checked in Node 22.22: `Intl.PluralRules('vi')` yields only `other` (Vietnamese has no plural inflection; the same is true for Korean and Chinese; Spanish needs `one`/`many`/`other`), `Intl.NumberFormat('vi-VN', {style:'currency', currency:'USD'})` → `1.234,50 US$`, `Intl.DateTimeFormat('vi-VN', {dateStyle:'long'})` → `7 tháng 10, 2026`.

**Recommendation: Paraglide JS 2 with `cookie` strategy for the app and an explicit `?lang=` override for printable statements, all numbers/dates/currency via `Intl`.** Keep a `Money.format(cents, locale)` helper so the pay statement can print US-style `$1,234.50` even under `vi` when the salon prefers it (many Vietnamese-American owners do). Adding ES/KO/ZH later is a new message file plus a locale entry; plural logic is already expressed in the message format for the languages that need it.

---

## 6. Camera capture, photo storage, privacy

**Capture.** `getUserMedia` works in iPadOS home-screen (standalone) web apps since iOS 13 (WebKit bug 185448) and in Safari tabs; HTTPS and a user gesture are required. Constraints reported through iOS 17–26 **[compatibility trackers, not re-verified]**: the permission prompt returns on each standalone launch, the stream dies when backgrounded, no `ImageCapture`. So start the stream on the first PIN keypress and keep it alive; fall back to `<input type="file" accept="image/*" capture="user">` if `getUserMedia` rejects. Compression: draw the frame to a 480×640 canvas, `canvas.toBlob('image/jpeg', 0.6)` (≈ 25–45 kB); `browser-image-compression` (2.0.2, 2023) is unnecessary.

**Storage.** Cloudflare R2: $0.015/GB-month, Class A $4.50/M, Class B $0.36/M, free 10 GB + 1 M A + 10 M B ops/month, zero egress. Backblaze B2 ≈ $6/TB-month **[unverified]**. Sizing: 40 punches/day × 40 kB × 26 days ≈ 42 MB/salon/month → 10 salons ≈ 15 GB over 3 years (free), 200 salons ≈ 300 GB (≈ $4.50/month). Store object key + SHA-256 in the punch row so the binder can prove the image is unmodified.

**Privacy.** Illinois BIPA (740 ILCS 14/10) defines a biometric identifier as retina/iris scan, fingerprint, voiceprint or scan of hand/face geometry and expressly excludes photographs; a photo becomes regulated once software derives face geometry from it (the Google/Facebook/Shutterfly theory). Texas CUBI (§503.001) lists retina/iris scan, fingerprint, voiceprint, record of hand or face geometry; Washington RCW 19.375.010 excludes photographs and video; NYC Admin Code §22-1201 targets commercial establishments collecting customers' biometric identifiers (signage, no-sale). **[Statute texts could not be fetched from this sandbox; cite primary sources before publishing legal copy.]** Product rules: never run face detection, matching or embeddings on punch photos; call it "photo verification", not "facial recognition"; publish a retention schedule (photos 180 days, punch records 3 years to match FLSA 29 CFR 516) and an EN/VI employee notice shown at enrolment; let each salon switch photos off. That keeps the feature outside BIPA/CUBI by design while preserving consent artefacts.

---

## 7. Offline queue and service worker

| Piece | Version / status |
|---|---|
| `idb` | 8.0.4 (2026-10-06) — 1 kB Promise wrapper |
| `dexie` | 4.4.6 (2026-09-10) — richer, 25 kB |
| Background Sync | Chrome/Edge/Samsung only. WebKit standards-positions issue #14 is still "needs position" with labels *concerns: power* and *concerns: privacy*; Firefox also lacks it |
| Workbox | 7.4.1 (2026-05-04), still the current major |
| `vite-plugin-pwa` | 2.0.0 (2026-10-03), peers Vite ^8 and Workbox ^7.4.1; `@vite-pwa/sveltekit` 1.1.0 (2025-11-27) peers Kit ^1/^2 only |

**Recommendation: an IndexedDB outbox (`idb`) with retry-on-`online`, not Background Sync; SvelteKit 3's native `src/service-worker.ts` for the shell, no vite-pwa.** Each punch is written locally first (client UUID, device key, worker id, tablet timestamp + monotonic counter, JPEG blob); a flush loop runs on `online`, `visibilitychange`, after each punch and every 30 s. The server upserts on the UUID, records device and server time, and the audit log keeps the "queued offline, synced at" fact. The kiosk shows the unsynced count. With `$app/manifest` the service worker precaches the kiosk route and fonts so the PIN pad loads with Wi-Fi down; everything else is network-first.

---

## 8. CSV and spreadsheet import/export

| Lib | Version | Notes |
|---|---|---|
| `papaparse` | 5.7.0 (2026-08-24) | Browser + Node, streaming, `unparse` for export, header auto-detect, quotes/BOM handled |
| `csv-parse` | 7.0.3 | Node streams; good for server-side bulk import |
| SheetJS `xlsx` (npm) | 0.18.5, frozen since 2022-03-24 | Current CE builds (0.20.x) are published only from cdn.sheetjs.com, Apache-2.0 |
| `exceljs` | 4.4.0 (2023-10-19) | Dormant |

**Recommendation: `papaparse` for both import (client-side preview with row-level errors, then server re-parse with `csv-parse`) and export (`Papa.unparse`, UTF-8 BOM so Excel shows Vietnamese names).** Only add SheetJS CE from the cdn.sheetjs.com tarball if salons insist on `.xlsx` upload; export stays CSV because auditors and payroll providers accept it and it is diffable.

---

## 9. Validation, money, dates

| Concern | Choice | Alternatives |
|---|---|---|
| Schema validation | `zod` 4.6.5 (v4 stable since 2025-07-09; `zod/mini` for the client) | `valibot` 1.5.0 is smaller but Superforms/Better Auth ecosystems lean Zod |
| Money | Integer cents in SQLite `INTEGER`, a 60-line `Money` module (add, allocate with largest-remainder, format) | `dinero.js` 2.0.2 (stable 2026-03-13) is fine but adds a currency object model we do not need; `big.js` 7.0.1 / `decimal.js` 10.6.0 only if percentages must be exact beyond cents |
| Dates | `date-fns` 4.4.0 + `@date-fns/tz` 1.5.0 | Temporal is Stage 4 and shipped in Firefox 139, Chrome 144 (Jan 2026) and Node 26, but Safari has not shipped it and Node 22 has no `Temporal` (verified: `typeof Temporal === 'undefined'`); `temporal-polyfill` 1.0.5 (<20 kB) is an option later. Luxon 3.7.2 works but is larger |

Rules: store every timestamp as UTC ISO-8601 plus the salon's IANA zone; compute pay periods and overtime days in the salon zone; commissions and tip splits are computed in cents with deterministic rounding and the rounding remainder is itself written to the ledger so totals always reconcile.

---

## 10. UI

| Lib | Version | Use |
|---|---|---|
| Tailwind CSS | 4.3.3 via `@tailwindcss/vite` | All screens |
| bits-ui / shadcn-svelte | 2.19.5 / 1.7.0 (2026-09-16) | Headless, accessible primitives for the admin screens (dialog, combobox, date picker) |
| daisyUI | 5.7.47 | Alternative if you prefer class-based components; skip to avoid two systems |
| Skeleton | 5.0.1 | Fine, but Svelte 5 + Tailwind 4 coverage is thinner |
| Open Props | 1.7.23 | Not needed alongside Tailwind |
| Icons | `@lucide/svelte` 1.52.0 (`lucide-svelte` is deprecated) | |

Kiosk: 72–88 px keys with 12 px gaps (Apple's 44 pt is a floor), `touch-action: manipulation`, `user-select: none`, no hover-only states, ≥ 4.5:1 contrast, a 1.5 s "punched in, Linh — 9:02" confirmation, 20 s idle reset. Print: `@page { size: letter; margin: 0.5in }`, `thead { display: table-header-group }`, `tr { break-inside: avoid }`, a `.no-print` utility, EN/VI statement in two columns so one page serves both languages.

---

## 11. Testing

`vitest` 5.0.3 (5.0.0 on 2026-09-03), `@playwright/test` 1.63.0, `fast-check` 4.10.2 (2026-09-19). Property tests for the pay engine: gross = Σ components; commission is monotonic in sales; tip allocation sums to the pool exactly; results are invariant to ticket order; DST boundaries do not create 23- or 25-hour days in the weekly total; CSV round-trip is lossless. Playwright drives the kiosk flow with a fake camera (`--use-fake-device-for-media-stream`) and an offline toggle (`context.setOffline(true)`).

---

## 12. Deployment, email, SMS, monitoring

| Host | Price points (2026) | SQLite + Playwright? |
|---|---|---|
| Fly.io | shared-cpu-1x 256 MB $2.19, 512 MB $3.69, 1 GB $6.70, 2 GB $13.39; volumes $0.15/GB; snapshots $0.08/GB after 10 GB free; IPv4 $2; egress $0.02/GB; no plan fee | Yes: volume + long-running process |
| Hetzner + Coolify/Kamal/Dokku | CX23 2 vCPU/4 GB €3.99 + €0.50 IPv4 (post April-2026 increase); CAX11 €4.49 | Yes; you own patching, TLS, backups |
| Railway | Hobby $5 incl. $5 usage, then $10/GB-RAM + $20/vCPU per month | Yes, pricier at 1–2 GB |
| Render | Free spins down after 15 min; Starter $7 (512 MB); Standard $25 (2 GB) | Yes, 2 GB tier is $25+ |
| Vercel | Serverless | No: ephemeral FS, no Chromium |
| Cloudflare Workers + D1/R2 | D1 10 GB/DB paid; Browser Rendering free 10 min/day | Only with a rewrite |
| DigitalOcean App Platform | Basic ≈ $5/512 MB **[unverified]** | Yes; no win over Fly |

Email: Resend free 3 000/mo (100/day), Pro $20 for 50 000; Postmark free 100/mo, Basic $15/10 000. SMS: Twilio $0.0083/segment + carrier fees (T-Mobile 10DLC rose to $0.0045 on 2026-01-29) + $1.15/number; Telnyx $0.0040 + ≈ $0.003 carrier. 10DLC: brand $4, low-volume campaign $1.50–2/mo, $15 vetting; sole-prop registration is only for individuals without an EIN. Monitoring: Sentry Developer free (1 user, 5 000 errors/mo); Better Stack free (10 monitors, 3-min checks, status page).

**Recommendation: Fly.io, one `shared-cpu-1x` 1 GB machine in `dfw` (Texas and California, the largest Vietnamese-American salon markets, are both within ~40 ms), 10 GB volume, Litestream → R2, auto-stop off (the kiosk must never cold-start), Resend for email, optional Telnyx SMS under a Standard 10DLC brand, Sentry + Better Stack free tiers.** Deploy with `fly deploy` from a Dockerfile that installs only Chromium; `/healthz` also verifies the SQLite files open.

Estimated monthly cost:

| Item | 10 salons | 200 salons |
|---|---|---|
| Fly machine | 1 GB $6.70 | 2 GB $13.39 (+ a stopped 2 GB standby with a restored volume: ~$1.50 rootfs) |
| Fly volume + snapshots | 10 GB $1.50, snapshots free | 60 GB $9.00 + ~$4 snapshots |
| Dedicated IPv4 | $2.00 | $2.00 |
| R2 (photos + Litestream + binders) | within 10 GB free → $0 | ~300–450 GB → $4.50–6.75 |
| Resend | free | Pro $20 (≈ 200 salons × 60 statement emails) |
| Sentry / Better Stack | free | free (or Sentry Team $26 if volume demands) |
| Domain + misc | ~$1.50 | ~$1.50 |
| **Total (no SMS)** | **≈ $12/mo** | **≈ $55–60/mo** |
| Optional SMS (Telnyx, 1 statement link/worker/week) | 10 salons × 8 workers × 4.3 ≈ 350 msgs ≈ $3 + $1.15 number + $2 campaign ≈ $6 | ≈ 6 900 msgs ≈ $50 + fees ≈ $55 |

Hetzner CX23 + Coolify would be ≈ €4.50/mo at both scales and is the fallback if Fly pricing moves, at the cost of owning the box.

---

## 13. Billing

| Provider | SDK / status | Fees (US) |
|---|---|---|
| Stripe Checkout + Customer Portal | `stripe` 23.0.0 (2026-10-01) pins API `2026-09-30.endive`; 22.0.0 (2026-04-02) pinned `2026-03-25.dahlia` | 2.9% + 30¢; Stripe Tax optional |
| Stripe Managed Payments (MoR) | Public preview Feb 2026, built from the Lemon Squeezy team | +3.5% on top (≈ 6.4% + 30¢) |
| Lemon Squeezy | Acquired by Stripe July 2024; still operating but with an official migration path to Managed Payments; `@lemonsqueezy/lemonsqueezy.js` 4.0.0 last published 2024-11-05 | 5% + 50¢ |
| Paddle | `@paddle/paddle-node-sdk` 3.10.0 | 5% + 50¢ |

**Recommendation: Stripe Checkout (subscription mode, one price, quantity = salons on the owner account) + Customer Portal + three webhooks (`checkout.session.completed`, `customer.subscription.updated/deleted`) that flip `salon.plan_status`.** Customers are US businesses, so a merchant of record buys only a 3.5–5 % surcharge; enable Stripe Tax if you cross nexus in states that tax SaaS (Texas, New York, Washington, Pennsylvania). Pin the API version to `2026-09-30.endive` and upgrade deliberately.

---

## Recommended stack (exact packages, 2026-10-07)

Runtime and framework: Node 22.22 LTS (Kit 3 needs ≥ 22.17), pnpm 10, `@sveltejs/kit@3.0.1`, `svelte@5.57.2`, `@sveltejs/adapter-node@6.0.0`, `@sveltejs/vite-plugin-svelte@7.3.1`, `vite@8.3.3`, `typescript@^6` (not 7), `sv@1.1.1`, `sveltekit-superforms@3.0.0` (verify Kit 3 peer before adopting; otherwise plain form actions + zod).

Data: `better-sqlite3@13.0.3`, `drizzle-orm@0.45.3`, `drizzle-kit@0.31.11`, Litestream v0.5.17 (binary in the image) → Cloudflare R2; `@aws-sdk/client-s3@3.1147.0` for photo and binder uploads to R2.

Auth: `better-auth@1.7.7` (+ `magic-link`, `api-key` plugins), `@node-rs/argon2@2.2.2`.

PDF: `playwright-core@1.63.0` + Chromium (primary), `pdfmake@0.3.11` (fallback), `pdf-lib@1.17.1` (merge only); fonts: Be Vietnam Pro + Noto Sans self-hosted.

i18n and formatting: `@inlang/paraglide-js@2.26.0`, native `Intl`.

Client/offline: `idb@8.0.4`, SvelteKit 3 native service worker (`$app/manifest`), canvas `toBlob` compression.

Data exchange: `papaparse@5.7.0`, `csv-parse@7.0.3`.

Validation/money/time: `zod@4.6.5`, integer cents + in-house `Money`, `date-fns@4.4.0`, `@date-fns/tz@1.5.0`.

UI: `tailwindcss@4.3.3` + `@tailwindcss/vite@4.3.3`, `bits-ui@2.19.5` / `shadcn-svelte@1.7.0`, `@lucide/svelte@1.52.0`.

Testing: `vitest@5.0.3`, `@playwright/test@1.63.0`, `fast-check@4.10.2`.

Ops: Fly.io shared-cpu-1x 1 GB in `dfw` + 10 GB volume; Resend (`resend@6.32.1`); Telnyx (optional SMS); `@sentry/sveltekit@11.5.0`; Better Stack; `stripe@23.0.0`.

## Rejected alternatives and why

- **Next.js 16 / React Router 8 / Nuxt 4** — heavier client runtimes, no SSR/form advantage here; Next is shaped for Vercel, which cannot host SQLite + Chromium.
- **Astro 7** — the ticket grid and kiosk would become framework islands anyway.
- **Hono + HTMX** — you re-implement form actions, validation, offline and i18n plumbing SvelteKit provides.
- **`@vite-pwa/sveltekit`** — still peers on Kit 1/2; Kit 3's native service worker suffices and Safari has no Background Sync.
- **Turso/libSQL, Neon, Supabase, D1** — a storage engine in transition, autosuspending free tiers that the kiosk cannot tolerate, or a Workers-only database that forces a rewrite; SQLite + Litestream already serves a single-writer workload.
- **Prisma** — `latest` is an RC with a heavier runtime; **Kysely** has no migration generator.
- **Lucia (deprecated), Auth.js (OAuth-first), `bcrypt` (72-byte cap, no memory hardness), `argon2` (node-gyp build)** — Better Auth + `@node-rs/argon2` cover every flow with prebuilt binaries.
- **@react-pdf/renderer, Typst, WeasyPrint, Gotenberg** — React lock-in, a new DSL, a Python runtime or a LibreOffice-sized sidecar when one HTML template already covers screen, print and PDF.
- **i18next + svelte-i18n, typesafe-i18n, formatjs** — runtime loaders or stale bindings versus Paraglide's compiled, tree-shaken output.
- **SheetJS npm `xlsx` (frozen at 0.18.5 since 2022), exceljs (dormant)** — CSV covers the need.
- **dinero.js, big.js, decimal.js, Luxon, Temporal** — integer cents and date-fns 4 are enough; Temporal is absent from Safari and Node 22.
- **daisyUI, Skeleton, Open Props** — one component system (bits-ui on Tailwind 4) is less to maintain.
- **Vercel, Render Free, Railway** — ephemeral, spinning-down, or pricier per GB than one always-on Fly machine with a disk.
- **Lemon Squeezy / Paddle / Stripe Managed Payments** — merchant-of-record surcharges buy VAT handling a US-only product does not need; Lemon Squeezy is in migration posture after the Stripe acquisition.

## Open items to verify before build-out

1. Exact Cloudflare Browser Rendering paid pricing (only the free allowance was confirmed).
2. Primary-source text of Texas §503.001, Washington RCW 19.375.010 and NYC §22-1201 (sandbox could not fetch the statutes).
3. `sveltekit-superforms@3.0.0` peer range against Kit 3.
4. Headless Chromium RSS on the actual Fly 1 GB machine with Be Vietnam Pro loaded (expected 200–350 MB).
5. Current iPadOS 26 behaviour for camera permission persistence in home-screen web apps.

## Sources (accessed 2026-10-07)

- npm registry via `npm view <pkg> version time engines peerDependencies exports` for every package named above — https://registry.npmjs.org/
- SvelteKit 3 migration guide — https://github.com/sveltejs/kit/blob/main/documentation/docs/60-appendix/35-migrating-to-sveltekit-3.md
- What's new in Svelte, August 2026 — https://svelte.dev/blog/whats-new-in-svelte-august-2026
- SvelteKit 3 release coverage — https://infoq.com/news/2026/09/sveltekit-3-vite ; https://www.netlify.com/changelog/2026-10-01-sveltekit-3.md ; https://www.youngju.dev/blog/2026-07-17-sveltekit-3-pre-release-what-breaks.en
- vite-pwa/sveltekit releases and issues — https://github.com/vite-pwa/sveltekit/releases ; https://github.com/vite-pwa/sveltekit/issues
- vite-plugin-pwa releases — https://github.com/vite-pwa/vite-plugin-pwa/releases
- Workbox releases — https://github.com/GoogleChrome/workbox/releases
- WebKit standards position on Background Sync (#14) — https://github.com/WebKit/standards-positions/issues/14
- Litestream releases — https://github.com/benbjohnson/litestream/releases ; VFS read replicas — https://litestream.io/how-it-works/vfs/ ; Fly "Litestream: Revamped" — https://fly.io/blog/litestream-revamped/
- libSQL status notice — https://github.com/tursodatabase/libsql
- Turso pricing (secondary) — https://costbench.com/software/database-as-service/turso/free-plan ; https://toolradar.com/tools/turso/pricing
- Neon pricing (secondary) — https://www.jetadmin.io/blog/neon-pricing/ ; https://costbench.com/software/database-as-service/neon/free-plan
- Supabase pricing (secondary) — https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/ ; https://automationatlas.io/answers/supabase-free-tier-limits-2026/
- Cloudflare D1 limits (docs source) — https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/d1/platform/limits.mdx
- Cloudflare R2 pricing (docs source) — https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/r2/pricing.mdx
- Cloudflare Browser Rendering free allowance — https://developers.cloudflare.com/browser-rendering/ (via search summary) ; https://eastondev.com/blog/en/posts/dev/20260526-cloudflare-free-limits/
- Lucia deprecation — npm deprecation notice; https://github.com/lucia-auth/lucia ; https://www.wisp.blog/blog/lucia-auth-is-dead-whats-next-for-auth
- Better Auth docs (repo) — https://github.com/better-auth/better-auth/blob/main/docs/content/docs/authentication/email-password.mdx ; https://github.com/better-auth/better-auth/blob/main/docs/content/docs/concepts/rate-limit.mdx ; https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/magic-link.mdx ; https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/svelte-kit.mdx ; https://github.com/better-auth/better-auth/releases
- Playwright Docker guidance — https://github.com/microsoft/playwright/blob/main/docs/src/docker.md
- Gotenberg releases — https://github.com/gotenberg/gotenberg/releases
- Temporal status — https://github.com/tc39/proposal-temporal ; https://github.com/fullcalendar/temporal-polyfill
- iOS PWA camera — WebKit bug 185448 https://bugs.webkit.org/show_bug.cgi?id=185448 ; https://firt.dev/notes/pwa-ios/ ; https://developer.apple.com/forums/thread/776460
- BIPA and photo time clocks — https://netchex.com/blog/biometric-time-clocks-pros-cons-compliance/ ; https://ukg.cloudapper.ai/time-capture/pin-and-photo-verification-a-compliant-time-clock-option-where-biometric-facial-recognition-is-restricted/ ; https://www.privacyworld.blog/2021/03/data-extracted-from-photographs-covered-under-bipa/ ; https://calawyers.org/publications/antitrust-unfair-competition-law/competition-2016-vol-25-no-2-biometric-privacy-litigation-is-unique-personally-identifying-information-obtained-from-a-photograph-biometric-information/ ; https://www.ebglaw.com/commercial-litigation-update/biometric-backlash-the-rising-wave-of-litigation-under-bipa-and-beyond
- Fly.io pricing (docs source) — https://github.com/superfly/docs/blob/main/about/pricing.mdx ; https://fly.io/pricing.md
- Hetzner 2026 pricing — https://findstack.com/resources/hetzner-price-increase-2026 ; https://comparedge.com/tools/hetzner/pricing ; PaaS comparison https://wz-it.com/en/blog/self-hosted-paas-comparison-coolify-dokploy-caprover/
- Railway pricing — https://docs.railway.app/reference/pricing ; https://servercompass.app/blog/railway-pricing-what-youll-actually-pay
- Render pricing — https://livemy.app/blog/render-pricing ; https://costbench.com/software/developer-tools/render/free-plan
- Resend / Postmark pricing — https://automationatlas.io/answers/resend-pricing-explained-2026/ ; https://automationatlas.io/answers/postmark-pricing-explained-2026/
- Twilio / Telnyx SMS and 10DLC — https://www.twilio.com/en-us/sms/pricing/us ; https://support.twilio.com/hc/en-us/articles/44609260499995-T-Mobile-Messaging-Carrier-Fee-Changes-January-2026 ; https://telnyx.com/resources/twilio-telnyx-sms-pricing ; https://support.twilio.com/hc/en-us/articles/4407882914971-Comparision-between-Starter-and-Standard-registration-for-A2P-10DLC ; https://www.bandwidth.com/blog/how-to-register-with-10dlc-to-avoid-unnecessary-costs-in-2022/
- Sentry / Better Stack free tiers — https://costbench.com/software/developer-tools/sentry/free-plan/ ; https://agentdeals.dev/vendor/betterstack
- Stripe SDK changelog — https://raw.githubusercontent.com/stripe/stripe-node/master/CHANGELOG.md ; API versioning — https://docs.stripe.com/api/versioning
- Stripe Managed Payments / Lemon Squeezy / Paddle — https://dodopayments.com/blogs/stripe-managed-payments-fees-explained ; https://alexcloudstar.com/blog/merchant-of-record-indie-saas-2026/ ; https://fungies.io/lemon-squeezy-stripe-acquisition-saas-founders-2026/ ; https://techcrunch.com/?p=2815886
