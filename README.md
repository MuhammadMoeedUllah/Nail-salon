# Product 01: Nail-salon pay records

**Where things are (2026-10-07):**

| Folder | Content |
|---|---|
| [`research/`](research/README.md) | Six sourced memos on the market, incumbents, payroll file formats, wage-hour law, the stack and user voices, plus `rules-seed.json` and an EN/VI glossary |
| [`docs/PLAN.md`](docs/PLAN.md) | The build spec: screens, pay engine, data model, libraries, deployment, and what the research changed |
| [`docs/UX-REVAMP-PLAN.md`](docs/UX-REVAMP-PLAN.md) | The interface revamp plan (2026-10-08): design system, navigation, screen specs and a ticket backlog ready to implement; before-screenshots in `docs/ux-audit/` |
| [`app/`](app/README.md) | The application: SvelteKit 2, SQLite, bilingual, with tests, a demo seed, Dockerfile and Fly config |


**Status:** first product to build. It has the highest market-adjusted score of all 26 domain winners (16.0: a hand score of 14 plus 2.0 from the market scan), one of only three "strengthen" verdicts among 78 picks, and no direct rival in the scan. See `launch/candidates/CANDIDATES.md`, row 1.

**One line:** A shared-tablet clock-in and ticket log that turns a salon's day-rate-plus-commission habit into weekly pay records that hold up to a wage-and-hour audit, in English and Vietnamese.

## Why this one first

| Signal | Evidence | Source |
|---|---|---|
| The violation is the default, not the exception | Connecticut inspected 25 salons and found wage-and-hour violations at 23 | [CT Mirror, 2015](https://ctmirror.org/2015/08/17/nail-salons-are-ubiquitous-and-so-are-labor-violations/) |
| The cause is a missing system | US DOL found a salon paid a flat day rate plus commission "without regard to hours worked" and kept no hours record | [US DOL WHD, 2016](https://www.dol.gov/newsroom/releases/whd/whd20160407-0) |
| Settlements are large and recent | Three Rhode Island salons agreed to pay $753,500 in back wages and damages | [US DOL, 2024](https://www.dol.gov/newsroom/releases/sol/sol20240529) |
| California enforcement continues | A Southern California salon was cited over $1.2M for paying 36 workers piece rate without overtime | [UCLA Labor Center, 2024](https://labor.ucla.edu/wp-content/uploads/2024/04/Nail-Files-California-3.18.2024.pdf) |
| The buyer list is countable | 33,802 nail-salon establishments (NAICS 812113) | [item.com NAICS 812113](https://www.item.com/naics/812113) |
| Incumbents sell something else | Vagaro from $25/mo and Boulevard $175-$375/mo sell booking suites; none is sold as a wage-hour record | market scan, `research/market/market_merged.json` |

The pitch is protection, not cost: one audit costs more than ten years of the subscription.

## Who buys and who uses

- **Buyer:** the salon owner, usually one location with 3-15 technicians. The owner signs, and often a bookkeeper runs payroll.
- **Users:** technicians clock in and out on a shared tablet with a PIN, and the owner or front desk logs tickets.
- **Influencer:** the bookkeeper, who wants a clean weekly export instead of a notebook.

## The job, step by step

1. A technician clocks in on the shared tablet with a 4-digit PIN, and the tablet stores a photo and timestamp.
2. The front desk logs each ticket (technician, service, price, card or cash tip), or imports the day's tickets from the booking system's CSV.
3. On payday the app computes, per technician per workweek: hours, commission earned, tips, the regular rate, the overtime premium owed, and any top-up needed to reach minimum wage.
4. The owner approves, pays through their existing payroll or cash, and records the payment.
5. Each technician gets a pay statement in their language. The owner gets an audit binder: every record field the federal rule asks for, kept for three years.

## MVP scope (4 weeks)

**In**

- Shared-tablet clock-in with a PIN and a photo, plus a phone link for owners. It is a web app (PWA), so nobody installs anything.
- Ticket log: manual entry, plus CSV import from Vagaro, Square and Fresha exports.
- A weekly pay calculator covering:
  - federal overtime after 40 hours;
  - a regular rate that includes commissions;
  - a minimum-wage floor check against the state rate;
  - tips kept separate from wages.
- Pay statements in English and Vietnamese, with Spanish, Korean and Chinese next.
- An audit binder exported as PDF and CSV, mapped to the record fields in [29 CFR Part 516](https://www.ecfr.gov/current/title-29/subtitle-B/chapter-V/subchapter-A/part-516).
- An edit trail: every change to a punch or ticket keeps who, when and why. That trail is what makes the record credible.
- A payroll export as CSV for Gusto, QuickBooks Payroll and ADP RUN.
- An owner dashboard with one number in red: overtime owed this week that has not been paid.

**Out (not in v1)**

- Moving money, payroll tax filing and W-2s: export to the payroll tool the salon already uses.
- Booking, POS and marketing, which the incumbents already sell.
- Legal advice. The product keeps records and shows arithmetic. It does not promise an inspection outcome.

**Optional AI features** (cheap to run, and they help with onboarding):

- Snap a photo of a paper sign-in sheet or ticket book to pre-fill punches and tickets, which the owner then confirms.
- Translate pay statements for languages beyond the five shipped ones.
- A plain-language "why is overtime owed this week" explainer that shows the numbers it used.

## Rules engine (one file per state, each rule with a dated source)

| Rule | v1 | Note |
|---|---|---|
| Federal overtime after 40 hours per workweek | yes | Base rule |
| Regular rate includes commissions | yes | Commission counts toward the regular rate for overtime |
| State minimum wage floor | yes | Kept as a table with an effective date per state |
| Tips belong to the worker and stay outside wages | yes | Shown separately on every statement |
| Retail and service commission exemption, FLSA section 7(i) | flag only | Show when a technician may qualify; never apply it silently |
| California piece-rate rest and nonproductive time pay | v1.1 | Needed before selling in CA |
| New York nail-salon specific rules | v1.1 | Needed before selling in NY |
| State daily-overtime rules (CA and others) | v1.1 | Added with the state files |

Every rule must be checked against the official text before launch in a state. The table lists what to build, not what is settled law.

## Data model

```
Salon(id, name, state, license_no, workweek_start, timezone, languages[])
Worker(id, salon_id, name, address, birth_date_if_minor, occupation, pin_hash, pay_basis{day_rate|hourly|commission|mix}, commission_pct, hourly_rate, language, active)
Punch(id, worker_id, ts_in, ts_out, source{tablet|phone|photo-import}, photo_ref)
Ticket(id, salon_id, worker_id, ts, service, price, tip_card, tip_cash, source{manual|csv|photo-import})
PayRun(id, salon_id, period_start, period_end, status{draft|approved|paid}, paid_on, method)
PayLine(id, payrun_id, worker_id, hours, commission, base, regular_rate, ot_premium, min_wage_topup, tips, deductions, total)
Rule(id, state, key, value, effective_from, source_url, checked_on)
Edit(id, entity, entity_id, field, old, new, by_user, reason, ts)   # append-only
```

Retention: keep everything for at least 3 years, and never hard-delete pay data.

## Screens (6)

1. Tablet clock: names, a PIN pad, and the in/out state.
2. Today: tickets by technician, with add or import.
3. Pay run: a weekly table with red cells where overtime or a minimum-wage top-up is owed, then approve.
4. Statement: one technician-week in their language, printable and shareable by link.
5. Audit binder: pick a date range and export a PDF or CSV.
6. Settings: workers, pay basis, state, languages and billing.

## Stack (lowest dependency)

- One web app (PWA) and one database. Use a managed Postgres or SQLite on a single small host, with nothing native to install.
- PDF generation server-side. Ship the translation strings in the repo, and use AI translation only for extra languages.
- Billing through the marketplace checkout (see `launch/marketplace/PLAN.md`) so this product needs no billing code of its own.
- No booking or POS integrations in v1, only CSV import. This avoids partner approvals entirely.

## Pricing

- $49 per salon per month, flat, up to 15 technicians. This is the business-plan launch price.
- Founding offer: half price for 12 months for the first 10 salons, in exchange for a case study.
- Anchor: the $753,500 Rhode Island settlement, and booking suites from $25/mo that keep no wage-hour record.
- Add-on (approved 2026-10-04): workplace posters and wage notices at a proposed $9 per location per month. See "After the gate" below.

## Go to market

- **List:**
  - state cosmetology board license lists, which are public;
  - start in Brooklyn and Queens. The uploaded state research rates New York "Fast" and names NYC as a salon and barber cluster (`SaaS-Opportunity-Research/states/NY-new-york.md`);
  - then Fairfield County, Connecticut, the I-95 salon and med-spa corridor in the Connecticut state file, then Rhode Island;
  - Illinois after the Illinois rules ship (see "After the gate");
  - add California once the piece-rate rules ship.
- **Channels:**
  - salon supply distributors;
  - Vietnamese-language business and community groups;
  - bookkeepers who serve salons;
  - an "is my salon paying overtime correctly?" calculator page as the lead magnet.
- **Message:**
  - "Clock in, pay commission, and keep the records that prove you paid correctly."
  - Lead with protection, never with blame. The risk note from the pick: owners may fear creating records.

## Four-week build plan

| Week | Ship |
|---|---|
| 1 | Data model, tablet clock, ticket entry, CSV import (Vagaro, Square, Fresha) |
| 2 | Pay calculator, plus unit tests on worked examples (day rate plus commission, 50-hour week, a tip-heavy week) |
| 3 | Statements in English and Vietnamese, audit binder PDF/CSV, edit trail, payroll export |
| 4 | Photo import (AI), billing via the marketplace checkout, onboard 3 pilot salons |

## Gate

Before week 3, run 15 discovery calls. If fewer than 3 owners confirm $49/month, change the price or the buyer before building more. At 5 paying salons, switch on the poster add-on for every account, then start product 02. That is the allergen matrix (`launch/candidates/CANDIDATES.md` row 2) unless the waitlist says otherwise, and it reuses the same log, statement and binder engine.

## After the gate: approved additions (2026-10-04)

These come from the uploaded research (`launch/external/OPPORTUNITY_FIT.md`). Prices for incumbents are as that research recorded them, with its links; our prices are proposals.

| Order | Addition | What it adds | Why | Evidence in the uploaded research |
|---|---|---|---|---|
| 1 | **Workplace posters and wage notices** (J03) | Digital and printed posters, remote e-posters and a minimum-wage calendar, at a proposed $9 per location per month | Every salon is an employer. The state files list Jan 1, 2027 wage changes for CT, NY and RI (marked "verify") | Poster Guard lists $15.95 per remote employee per year and $98.95 a year for its binder service, and shows five mandatory poster changes in September 2026 alone ([posterguard.com](https://www.posterguard.com/), checked Sep 24 2026) |
| 2 | **Salon booking module** (F01, scored 22/25) | Booking, deposits and client texts, priced as one flat bill with pay records. Their plan: Solo $19, Studio $49 flat, 0% commission | Turns product 01 into a "switch from Vagaro and get compliant" offer. Build only if pilot salons ask | Fresha: $14.95 per team member a month plus a 20% commission on marketplace new clients. Vagaro: $30 a month for one calendar plus $10 per extra ([vagaro.com/pro/pricing](https://www.vagaro.com/pro/pricing)). Users report frozen payouts (Sep 2026) |
| 3 | **Restaurant tip and pay records** (D04, same as our food#1) | The same clock, tip and pay-math engine for restaurants and bars | Second industry on the same build | 7shifts $44.99-$149.99 and Homebase $30-$120 per location a month ([Turnozo, Jul 2026](https://turnozo.com/blog/turnozo-vs-homebase-vs-7shifts)) |
| 4 | **Illinois rules** (S5-01) | Illinois leave accruals, Chicago tip-credit phase-out and a biometric-free clock | Second state with a clear legal trigger | Their plan prices it at $39 per location a month against Homebase All-in-One at $120 |

Build rule: each addition starts only after the one before it has paying users, except the poster add-on, which ships as soon as the gate is met.

## Risks

| Risk | Answer |
|---|---|
| Owners avoid creating records that could be used against them | Sell it as protection, show the settlement figures, and keep records private to the owner |
| Getting a rule wrong | Keep one state file with a dated source per rule, flag (never auto-apply) exemptions, and use terms that sell records rather than advice |
| Language barrier in sales | Vietnamese onboarding from day one, and channel partners who already speak to owners |
| Booking suites add a timesheet feature | Our edge is the audit binder and edit trail, which booking tools are not built to defend |
