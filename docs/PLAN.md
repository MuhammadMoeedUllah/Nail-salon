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

Six screens, as the brief asked, plus sign-in and pairing.

### 3.1 Tablet clock (`/kiosk`)
- Grid of technician names, colour-coded: white = out, green = in, amber = on break. Tapping a name switches the UI to that technician's language.
- PIN pad: four large keys per row, 64 px tall, no keyboard. Wrong PIN shows in red; five failures lock that PIN for five minutes.
- After the PIN: one or two big buttons for the only valid actions (Clock in / Clock out / Start break / End break). A live camera preview sits beside the pad; the photo is taken when the button is pressed, as a side effect, not a step (pattern from Mangomint and Zenoti, research 02).
- Confirmation screen shows the time and today's hours, then returns to the grid after four seconds. Idle screens return after 30 seconds.
- Offline: a failed request queues the punch with the tap time; the header shows "offline" and the queue count; the queue flushes on reconnect and every 20 seconds.
- A forgotten clock-out is never auto-closed. The next clock-in starts a new shift and the old one stays open and flagged for the owner.
- Pairing (`/kiosk/pair`): the owner signs in once on the tablet, names it, and the tablet keeps only a device cookie. The owner session is removed so the tablet cannot reach pay data.

### 3.2 Today (`/app/today`)
- Date strip with previous / next / picker. Four tiles: sales, card tips, cash tips, hours.
- One card per technician: punches as chips (photo thumbnail, in → out, break minutes, source badge if not from the tablet, "Fix time"), then a ticket table.
- Add ticket panel pinned on the right: technician, service with autocomplete and a pre-filled default price, price, card tip, cash tip, payment method, ticket number, time. Two taps plus the tips (research 06 rule 15). The technician stays selected after each save.
- Fix time requires a reason. Void ticket requires a reason. Add clock-in by hand requires a reason. Everything lands in the edit trail.
- Import CSV link.

### 3.3 Import (`/app/tickets/import`)
- Upload a file; the format is sniffed from headers (Square Transactions and Items Detail, Fresha Commission Activity and Payment transactions, Vagaro Transaction List and Employee Sales, GlossGenius Commission Earnings, or a generic mapping).
- Preview: rows found, how many are new, staff names that do not match a technician with a dropdown to map them.
- Rows with an external id are skipped on re-import; rows without one are de-duplicated on date, technician, service and price.

### 3.4 Pay runs (`/app/pay`, `/app/pay/[week]`)
- List of workweeks with status chips (draft, approved, paid), gross wages, and the red number: what the law requires on top of the agreed pay this week.
- Week table: one row per technician with days, hours, overtime hours, sales, commission, base, regular rate, top-up, overtime premium, tips card, tips cash, gross, total. Red cells where overtime or a top-up is owed. Warning chips per row (open punch, tickets without hours, day over 12 hours, possible 7(i), spread of hours).
- Rules used: the minimum wage, overtime threshold and state rules in effect that week, each with its source link and checked-on date.
- Approve freezes every row with its full breakdown and a snapshot of the rules. Reopen needs a reason and creates a new version. Mark as paid records cash / check / payroll amounts per technician and the paid-on date.
- Export: Gusto CSV, ADP RUN CSV, generic CSV.

### 3.5 Statement (`/app/pay/[week]/[technician]`, shared at `/s/[token]`)
- Header: salon, technician, period, version, paid-by.
- Summary: hours, days, sales, commission, base, regular rate, overtime, top-up, gross, tips (card and cash on separate lines), total.
- Hours by day with first in and last out. The technician's tickets by day. Voided tickets are footnoted.
- "How this was computed": every breakdown line with the inputs and the rule cited.
- Print stylesheet; PDF download; copy link (signed token, no login) to text to the technician.
- Language follows the technician's setting with a toggle.

### 3.6 Audit binder (`/app/audit`)
- Date range. Export PDF (cover, salon, technicians with 29 CFR 516.2 fields, hours by day and week, pay by week, edit history) and CSV zip (workers, punches, tickets, pay lines, edits, monthly tip totals per technician).
- Edit history table: when, who, what, before, after, why. Filter by technician and entity.
- Retention line: records are kept at least 3 years federally and 6 years in New York; the app never deletes pay data.

### 3.7 Settings (`/app/settings`)
- Salon: name, license number, address, state, region, time zone, workweek start, default language, photo on punch.
- Rules in effect, read-only, with sources.
- Paired tablets with last-used time and unpair.
- Owner and bookkeeper logins.

### 3.8 Technicians (`/app/workers`)
- List with pay basis, rates, language, active headcount, and the New York wage-bond note.
- Form: name on the tablet, legal name, address, date of birth if under 19, occupation, sex (optional), language, PIN, classification (W-2 or 1099 with warning), pay basis with only the relevant rate fields shown, hired and ended dates, active.

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

## 7. Deployment

- One Node process, one SQLite file, one photo directory. Dockerfile in `app/`.
- Primary: Fly.io, one shared-cpu machine (512 MB is enough without Chromium) in `ewr` for the New York launch, a 10 GB volume mounted at `/data`, auto-stop off so the kiosk never waits for a cold start. Litestream replicates the database to Cloudflare R2. Estimated under $15 a month at 10 salons (research 05).
- Fallback: a Hetzner VPS with Coolify or Kamal; the Dockerfile is the same.
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
