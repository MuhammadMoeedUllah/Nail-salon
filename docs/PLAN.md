# Product plan: Salon Pay Records

Written 2026-10-07 from the research in `research/`. This is the build spec for the app in `app/`. Where the plan departs from a research recommendation it says so and why.

## 1. What it is, in one paragraph

A lightweight web app for US nail salons with 3-15 technicians. A shared tablet at the front desk takes a 4-digit PIN clock-in with a photo. The owner or front desk logs each ticket (technician, service, price, card tip, cash tip) or imports the day's sales CSV from Vagaro, Square or Fresha. On payday the app turns the week's punches and tickets into the pay record the law asks for: hours by day, commission, a regular rate that includes the commission or day rate, a minimum-wage top-up when the split falls short, the half-time overtime premium over 40 hours, and tips kept on their own lines. The owner approves, records how it was paid (cash, check, payroll), and each technician gets a bilingual statement that lists their own tickets. An audit binder exports everything with the edit trail. The app moves no money.

Price: $49 per salon per month, flat (from `README.md`). Positioning: protection, not cost; the Rhode Island $753,500 settlement is the anchor (research 01, 04).

## 2. What the research changed

| Research finding | Decision |
|---|---|
| Pay is "bao lương or ăn chia, whichever is higher" (01, 06) | `guarantee_or_commission` is a first-class pay basis, alongside hourly, day rate, commission, and day rate plus commission |
| Check-and-cash split is universal and openly discussed (01, 06) | Marking a week paid records cash, check and payroll amounts separately, without judgement; the record keeps the full gross |
| No incumbent blends commission into the overtime regular rate (02) | The engine always computes the blended rate; the payroll export carries the overtime premium as a dollar earnings line, never as "OT hours" for the payroll tool to re-price |
| Technicians keep their own tally and distrust the owner's count (06) | The statement lists the technician's tickets by day; statement and binder come from the same rows |
| Owners fear creating records (README risks) | Records are private to the owner; the binder is an export, not a shared portal; every number shows its arithmetic |
| NY: weekly pay for manual workers, 6-year retention, spread-of-hours, wage bond by headcount (04) | Workweek default is weekly; retention is never-delete; spread-of-hours is computed and flagged for NY; active headcount shown on the technicians page with the bond note |
| Front desk runs an iPad or a cheap Android tablet on consumer Wi-Fi (06) | Kiosk is a web page with 64 px keys, offline queue in localStorage, retry on reconnect |
| 64% of Vietnamese immigrants speak English less than very well (06) | Every screen is bilingual from a one-tap toggle; the kiosk switches to the technician's language when they tap their name |
| Gusto accepts named columns; ADP RUN needs fixed columns; QuickBooks and Square Payroll accept no CSV (03) | Exports: Gusto CSV, ADP RUN paydata CSV, and a generic "hours and earnings" CSV the owner keys in anywhere |
| "ăn chia + 1099" is the named failure mode (06) | Each technician carries a W-2 or 1099 classification with a plain warning when 1099 is combined with a split or a day rate |

## 3. Screens

The interface was rebuilt on 2026-10-08 from `docs/UX-REVAMP-PLAN.md`, phases P0 to P6. Phones get four tabs at the bottom: Home, Today, Pay runs and More. Tablets in landscape get a narrow rail, and laptops a sidebar with the More pages listed. Every status shows a colour, an icon and a word. Red is kept for money owed by law, errors and confirmations that remove something. Every screen works in English and Vietnamese. Screenshots of each one are in `docs/ux-audit/2026-10-08-after/`.

### 3.1 Tablet clock (`/kiosk`)
- A status board with one tile per technician. Each tile shows in, on break or out as a colour, an icon and a word. Today's ticket count can be shown as well.
- Tapping a name opens a PIN pad with large keys, in that technician's language. A wrong PIN clears at once with a shake, so the retry is immediate. Five wrong tries lock that PIN for five minutes.
- With "PIN alone clocks in" on, the PIN clocks an absent technician in straight away and offers Undo for a few seconds. Someone already in gets large Break and Clock out buttons.
- A forgotten clock-out from an earlier day is caught at the next PIN. The technician confirms when they left, with the usual closing time offered, and the owner sees the shift flagged.
- Offline, punches queue with the time of the tap and send when the connection returns. The header shows the connection state.
- `/kiosk/setup` explains Add to Home Screen, and Guided Access on iPad or screen pinning on Android. Pairing at `/kiosk/pair` signs in once, names the tablet and keeps only a device cookie.

### 3.2 Home (`/app/home`)
- The week's key number comes first: what the law requires on top of the agreed pay, with a link to the week.
- A to-do list built from the data: open shifts, tickets without hours, weeks to approve or pay, and statements not sent. Each item opens the exact record.
- Who is in right now, with forgotten clock-outs flagged.
- New salons see a setup checklist until it is done or hidden: technicians, tablet, first clock-in, first ticket, first week.

### 3.3 Today (`/app/today`)
- A day strip for the workweek marks days that have records. A date picker reaches other days.
- The day's sales, tips and hours, and this week's owed amount with a link to the pay week.
- One card per technician, collapsed on phones. Each card shows shifts with Clock out now and Fix time, tickets with Void, card tips handed over in cash, and Add hours.
- Add ticket is a panel on tablets and laptops and a bottom sheet on phones. It has technician chips, service buttons in the salon's order, tip presets and card or cash. A standard ticket takes three taps. After saving, a bar offers Undo and Repeat.
- Fixes open sheets with reason chips, so no typing is needed. Clocking out, fixing, voiding and tip payouts show a toast with Undo. Every change lands in the edit trail.

### 3.4 Import (`/app/tickets/import`)
- Drop a CSV file or choose one. Cards explain the export steps for Square, Vagaro, Fresha and other systems.
- The format is detected: Square Items Detail and Transactions, Fresha, Vagaro, GlossGenius, Booksy or any spreadsheet. Period summaries are refused, with the names of exports that work.
- Staff names are matched to technicians. The matches, columns and tip setting are remembered per format, so the next file of the same kind needs no choices unless a new name appears.
- The preview shows cards on phones and a table on larger screens. A sticky bar says "Import N tickets". Rows already imported are skipped, and the result links to the day.

### 3.5 Pay runs (`/app/pay`, `/app/pay/[week]`)
- Weeks show as cards on phones and a table on larger screens, with status, owed by law, total and statements sent.
- A week starts with a stepper: Draft, Approved, Paid, Sent. Problems that block approval come next, each with a link to the day, then the key numbers.
- On phones each technician gets a card with the reasons in plain sentences. Larger screens get a table with summary, full and rules views.
- Approve and Mark paid are two-press buttons that show the amount. "Paid another way" records cash, check or payroll per technician. Reopening needs a reason. The Gusto, ADP RUN and generic CSV exports sit in the options menu.
- Send (`/app/pay/[week]/send`) shares or copies each statement link, with a text-message fallback, and marks it sent.

### 3.6 Statement (`/app/pay/[week]/[technician]`, shared at `/s/[token]`)
- The technician's language comes first, with the other language under each label. `?lang=` switches.
- A total box, the summary table, hours by day, tickets by day, and "How this was computed" written as sentences.
- It prints black on white and downloads as a PDF. The signed share link needs no login.

### 3.7 Audit binder (`/app/audit`)
- The export comes first: this month, last month, this year or chosen dates, as a PDF binder or a CSV zip. A line under it gives the state's record retention period.
- The last 90 days of changes read as sentences, for example "Tina changed Linh's clock-out on Thu, Oct 1: 6:00 PM → 7:30 PM". Filters narrow them by area and by technician. Raw values sit under Details. The PDF and the CSV carry the same sentences.

### 3.8 Technicians (`/app/workers`)
- One list with an avatar, the pay plan as a sentence, the PIN lock state and an Active switch. The switch saves at once and offers Undo. New York salons see the wage-bond note.
- The form has three cards: name and PIN; how they are paid, with five plan cards and a live sentence; and details for the records.
- Make a PIN creates a PIN that no other technician uses and that is hard to guess. Print PIN card prints a wallet-size card in the technician's language. Leaving with unsaved changes asks first.

### 3.9 Services (`/app/services`)
- This page sets the order of the ticket buttons, with arrows on every screen and drag on larger ones. "Most used first" sorts by the last 30 days and offers Undo.
- Services can be shown or hidden, added, and edited with names in both languages and the usual price.

### 3.10 Tablets (`/app/tablets`)
- Paired tablets show online or last-seen state, with a two-press Unpair. A warning appears when two tablets share a name.
- Pairing steps come with a copyable address and a link to the setup guide.
- The tablet switches live here: photo at clock-in, PIN alone clocks in, ticket counts, sounds and dim after closing.

### 3.11 Settings (`/app/settings`)
- Salon: name, license number, address, state and region, time zone, pay-week start, default language and usual closing time.
- Pay rules: the rules in effect as sentences, each with its source and dates, and the record retention period.
- Logins: owners, managers and bookkeepers, each with a line on what the role can do. Removing a login takes two presses.

### 3.12 Sign in and sign up
- Large fields, a show-password button and "Keep me signed in". That keeps the session for 30 days; otherwise it ends when the browser closes. Errors appear in the reader's language.
- Sign-up leads to Home and its setup checklist.

## 4. Pay engine (`app/src/lib/pay/engine.ts`)

Pure function, integer cents and minutes, no I/O, property-tested.

1. Commission = sales × rate.
2. Base by basis: hourly rate × hours; day rate × days worked; nothing for pure commission; for guarantee-or-commission, the shortfall to the guarantee when commission is lower.
3. Straight time = base + commission. Regular rate = straight time ÷ hours (29 CFR 778.109, 778.112, 778.117, 778.118).
4. If the regular rate is under the applicable minimum wage, add a top-up so that straight time = minimum wage × hours, and the regular rate becomes the minimum wage (29 CFR 778.107).
5. Overtime minutes = hours over 40 per workweek (or daily thresholds where a state has them). Premium = regular rate × 0.5 × overtime hours.
6. New York spread of hours: for days whose span exceeds ten hours, the shortfall between weekly straight-time pay and minimum wage × (hours + one per long day), shown as its own line and flagged. Workers paid well above minimum are owed nothing extra, which matches the Miscellaneous Industries wage order as applied by the state (12 NYCRR 142-2.4).
7. Tips are reported, never counted as wages (29 CFR 531.52). Card tips are owed to the technician; cash tips are already in hand.
8. Section 7(i) is never applied. When a week could qualify it is flagged for a professional to check.

Worked examples from research 04 are unit tests. Flags: OT_OWED, MIN_WAGE_TOPUP, NO_HOURS, TICKETS_WITHOUT_HOURS, OPEN_PUNCH, LONG_DAY, SPREAD_OF_HOURS, SECTION_7I_POSSIBLE, GUARANTEE_APPLIED, DAILY_OT.

## 5. Data model

See `app/src/lib/server/db/schema.ts`. Tables: salons, users, sessions, devices, workers, punches, breaks, services, tickets, import_batches, pay_runs, pay_lines, edits. Money in integer cents, timestamps ISO UTC, local dates in the salon's time zone. `edits` is append-only and is never updated or deleted. Pay lines keep the complete breakdown JSON and the rule snapshot so a statement can be re-derived years later. Nothing is hard-deleted; punches and tickets are voided with a reason.

## 6. Libraries and versions (installed 2026-10-07)

| Need | Choice | Why |
|---|---|---|
| Framework | SvelteKit 2.70 + Svelte 5, Vite 7, adapter-node 5 | Server-rendered pages with form actions, small client bundles for cheap tablets. Research 05 recommends SvelteKit 3.0.1; it shipped on 2026-10-01 and the PWA plugin and most adapters still peer on Kit 2, so Kit 2 is the lower-risk choice today. Upgrade when the ecosystem catches up |
| Database | SQLite via better-sqlite3 13 with Drizzle ORM 0.45, WAL mode, migrations run at boot | One file, no server, trivially backed up. Litestream to object storage in production |
| Auth | Own sessions: argon2id (@node-rs/argon2) for passwords and PINs, hashed random tokens for sessions and devices, HMAC-signed statement links | Three roles only (owner, bookkeeper, device). Better Auth (research 05) was weighed and rejected as more surface than the product needs |
| Validation | zod 4 | Form parsing |
| CSV | papaparse 5 | Import sniffing and export |
| PDF | pdfmake 0.3 with Noto Sans embedded | Vietnamese diacritics, tables, page numbers, no Chromium on the server. Research 05 prefers Playwright; it costs a 1 GB machine and is the fallback if layouts outgrow pdfmake |
| Zip | fflate | CSV binder |
| i18n | Own typed dictionary (EN, VI) with Intl for dates and money | About 200 strings; a compiler step was not worth it. Paraglide is the upgrade path at five languages |
| CSS | Tailwind 4 | Utility classes, print stylesheet |
| PWA | @vite-pwa/sveltekit | Installable kiosk, cached shell |
| Tests | Vitest 5, fast-check 4, Playwright 1.63 | Engine examples and invariants, end-to-end smoke |
| Interface parts (added 2026-10-08) | bits-ui 2.19 (bottom sheets only), @lucide/svelte 1.47 (icons) | Accessible dialogs without writing focus handling by hand; icons are imported one by one so only the ones used ship. The overflow menu is hand-written to avoid a positioning library |
| Accessibility tests (added 2026-10-08) | @axe-core/playwright 4.13 | axe on every page in both languages, inside the end-to-end run |

## 7. Deployment

- One Node process, one SQLite file, one photo directory. Dockerfile in `app/`.
- Primary: Fly.io, one shared-cpu machine (512 MB is enough without Chromium) in `ewr` for the New York launch, a 10 GB volume mounted at `/data`, auto-stop off so the kiosk never waits for a cold start. Litestream replicates the database to Cloudflare R2. Estimated under $15 a month at 10 salons (research 05).
- Fallback: a Hetzner VPS with Coolify or Kamal; the Dockerfile is the same.
- Not Vercel: its serverless functions have no persistent disk, so the SQLite file and photos cannot live there. Moving to Vercel would mean adapter-vercel, a hosted database such as Turso and external photo storage (see `app/README.md`).
- Email for sign-in help and statement links: Resend free tier. SMS deferred until a pilot asks.
- Billing: Stripe Checkout plus the Customer Portal, or the storefront's merchant of record; the app itself needs no billing code at pilot stage.
- Environment: `DATABASE_URL`, `PHOTO_DIR`, `ORIGIN`, `APP_SECRET`, `ALLOW_SIGNUP`.
- Backups: Litestream continuous plus a nightly `VACUUM INTO` copy. Photo retention policy: 180 days, then deleted by a scheduled job, to stay clear of biometric statutes; the punch row keeps the timestamp.

## 8. Build order

| Step | Content | State |
|---|---|---|
| 1 | Schema, migrations, auth, i18n, time helpers | done |
| 2 | Pay engine with worked examples and property tests | done |
| 3 | Kiosk: PIN, camera, offline queue, pairing | done |
| 4 | Today: punches, tickets, fixes with reasons | done |
| 5 | Technicians CRUD | done |
| 6 | Pay runs, approve, mark paid, statement, share link, exports | done |
| 7 | CSV import (Square, Fresha, Vagaro, GlossGenius, generic) | done |
| 8 | Audit binder PDF and CSV zip, edit history | done |
| 9 | Settings, devices, users | done |
| 10 | Dockerfile, Fly config, README, smoke tests | done |

## 8a. Click budget after the UX pass (research 09)

| Flow | Before | Now | How |
|---|---|---|---|
| Technician clocks in | tap name, 4 digits, tap Clock in (6) | tap name, 4 digits (5), Undo for 8 s | PIN alone clocks in when the technician is out; the only remaining decision (out or break) still gets a button |
| Technician clocks out | 6 | 6 | Clock out is the primary button; break is secondary |
| Add a standard ticket | pick technician, type service, type price, type tip, add (5 plus typing) | tap technician, tap service, tap tip, add (4, no typing); Repeat last (1) | Chips and tiles pre-fill the price; quick tip buttons 3, 5, 10, 20; payment, ticket number and time are folded away |
| Weekly pay | open week, Approve, Mark as paid, confirm (4) | open week from the home card, Approve, Mark all paid by check today (3) | Adjust opens the cash/check/payroll split only when the default is wrong |
| Send a statement | Copy link, open Messages, paste (3+) | Share or Send by text (1) | Web Share API on phones; sms: fallback |
| Card tips paid in cash | not possible | one tap per technician per day | Moves the amount to "already paid", keeps it in taxable tips |
| Forgot to clock out | fix time with a reason (3) | Clock out now (1) | Reason is recorded automatically |

## 8b. Pilot questions answered by research 10

1. Turn board: optional, on by default, ticket count only; never money or tips on the shared screen. Turn rules (half turns, request versus walk-in) are not encoded; ask each pilot which regime they run.
2. Cadence: weekly, Monday to Sunday by default; New York Labor Law 191 requires weekly pay for manual workers, so the biweekly option is removed from the UI.
3. Card tips: counted as owed by default; a per-day "handed over in cash" action moves them to "already paid" and the Gusto export maps them to Cash tips.

## 8c. Rule changes from research 07

Applied to `app/src/lib/rules/rules.json`: 2027 minimum wages for CT, NJ, VA, WA and CA with 2026 rows closed; New York frozen at $17.00 and $16.00; New York tip credit recorded as not allowed since 2020-12-31; New York call-in pay recorded as informational. Spread of hours keeps the weekly-offset formula. Split-shift detection (12 NYCRR 142-2.17) is a v1.1 item.

## 9. Out of scope for v1

Booking, POS, payments, payroll tax filing, W-2s, SMS, native apps, turn assignment, multi-location. California piece-rate rest pay (Labor Code 226.2) is flagged in the rules table but not computed; sell in California only after it ships.

## 10. Open questions for the pilot salons (original list; see 8b for the research answers)

1. Do owners want the tablet to show today's ticket count per technician (a turn board), or does that invite disputes at the front desk?
2. Weekly or biweekly: the research says weekly by custom and biweekly on Gusto or ADP. Default is weekly; the setting exists.
3. Should card tips paid out in cash the same day be recorded as already paid, so the week's "total to pay" excludes them? The field exists on the pay line; the default counts card tips as owed.

## 11. Interface revamp (shipped 2026-10-08)

`docs/UX-REVAMP-PLAN.md` replaced §3 of this document for the user interface. Its research is in `research/11-ui-ux-patterns-and-evidence.md`. The pay engine, data model, rules and exports in §4-§7 kept their behaviour. Two schema additions came with it: salon settings for the tablet and the closing time, and remembered import matches.

| Phase | What it covers | Commit |
|---|---|---|
| P0 | Design tokens, component kit, navigation, Home | `4f5bf35` |
| P1 | Tablet clock | `ffbcaea` |
| P2 | Today and ticket entry | `a8cab2f` |
| P3 | Home to-dos and deep links (finished with P4) | `4f5bf35`, `a49439a` |
| P4 | Pay weeks, statements, sending | `a49439a` |
| P5 | Technicians, services, settings, tablets, import, audit, sign-in | `c279522` |
| P6 | Performance, print, accessibility and visual checks | `a1135d4` |

Still open: Today's blocking time is over budget (`docs/ux-audit/2026-10-08-after/perf.md`). VoiceOver and real-device keyboard checks, and the pilot test with three salons (`docs/ux-audit/pilot-notes.md`), also remain.
