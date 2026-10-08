# 04 — Wage-and-Hour Rules and Enforcement for US Nail Salons

**Purpose.** Reference for the rules engine (one file per state) and the audit binder. Every value is mirrored in `rules-seed.json` with effective date, source URL and checked-on date. Compliance research, not legal advice.

**Checked on:** 2026-10-07.

**Verification method and limits.** Rates, dates and enforcement figures were confirmed on 2026-10-07 through web-search results that surfaced the official pages listed under Sources. The research environment's egress proxy blocked direct retrieval of ecfr.gov, dol.gov, law.cornell.edu, govinfo.gov, federalregister.gov and every state statute host, so **CFR and statute text paraphrased below is from the regulations as in force per prior knowledge and was not re-opened today** — tagged **[text not re-verified]**. Items we could not confirm at all are tagged **unverified**. Both tags are carried into the JSON `notes` field.

**Launch order:** NY (NYC) → CT → RI → IL, NJ, MA, TX, GA, FL → CA (later). PA, VA, NC, WA are included for expansion.

---

## 1. Federal (FLSA)

### 1.1 Recordkeeping — 29 CFR Part 516

**29 CFR 516.2(a)** — records for every non-exempt employee [text not re-verified; https://www.ecfr.gov/current/title-29/section-516.2]:

| # | 516.2(a) item | App field |
|---|---|---|
| (1) | Name in full, and any identifying symbol or number used in place of the name on time, work or payroll records | `employee.legal_name`, `employee.pin_id` |
| (2) | Home address including zip code | `employee.address` |
| (3) | Date of birth if under 19 | `employee.dob` |
| (4) | Sex and occupation | `employee.sex`, `employee.occupation` |
| (5) | Time of day and day of week on which the workweek begins | `salon.workweek_start` |
| (6) | Regular hourly rate for any week in which overtime is due; basis on which wages are paid (e.g., "$120/day plus 50% commission"); amount and nature of each payment excluded from the regular rate | `pay_record.regular_rate`, `employee.pay_basis`, `pay_record.excluded_payments` |
| (7) | **Hours worked each workday and total hours worked each workweek** | `clock.daily_hours[]`, `pay_record.weekly_hours` |
| (8) | Total daily or weekly straight-time earnings, exclusive of overtime premium | `pay_record.straight_time_total` |
| (9) | Total premium pay for overtime hours | `pay_record.ot_premium` |
| (10) | Total additions to or deductions from wages each pay period, with date, amount and nature of each item | `pay_record.additions[]`, `pay_record.deductions[]` |
| (11) | Total wages paid each pay period | `pay_record.gross_paid` |
| (12) | Date of payment and pay period covered | `pay_record.pay_date`, `period_start/end` |

516.2(b) covers retroactive payments; 516.2(c) lets fixed-schedule employers record the schedule and note exceptions — a shared-tablet clock makes actual times the better record.

**Tipped employees (29 CFR 516.28)** [text not re-verified]: a symbol identifying each tipped employee; tips reported weekly or monthly (IRS Form 4070 or equivalent); the hourly tip credit taken; hours and straight-time pay in non-tipped work; hours in tipped work. The 2020/2021 tip rules added that an employer taking no tip credit but running a mandatory tip pool must record each pool recipient and the weekly or monthly tips received.

**Retention** [text not re-verified]:

| Rule | Period | Records |
|---|---|---|
| 29 CFR 516.5 | **3 years** | (a) payroll records (the 516.2 items); (b) certificates, agreements, plans, notices, employment contracts; (c) sales and purchase records (total dollar volume — needed for the 7(i) test) |
| 29 CFR 516.6 | **2 years** | (a) basic employment and earnings records: time cards, service/piece tickets, records of additions and deductions; (b) wage-rate tables and schedules; (c) order, shipping and billing records; (d) wage-differential records |

**App default:** retain everything 6 years for every tenant. New York (Labor Law 195(4); 12 NYCRR 142-2.6) and New Jersey require 6 years, and the daily ticket log is a 516.6 "basic record" that should follow payroll retention.

### 1.2 Regular rate with commissions, day rates and piece rates — 29 CFR Part 778

All citations [text not re-verified; https://www.ecfr.gov/current/title-29/part-778/subpart-B].

- **778.111 (piece rates).** Regular rate = total weekly earnings (piece pay plus any hourly pay for waiting time) ÷ total hours; extra half-time for hours over 40. The regulation's illustration: 50 hours, $491 at piece rates for 46 productive hours plus $8.00/hour for 4 waiting hours = $523; $523 ÷ 50 = $10.46; 10 overtime hours × $5.23 = $52.30 extra.
- **778.112 (day rates and job rates).** When an employee is paid "a flat sum for a day's work ... without regard to the number of hours worked in the day" and receives no other compensation, "his regular rate is determined by totaling all the sums received at such day rates or job rates in the workweek and dividing by the total hours actually worked. He is then entitled to extra half-time pay at this rate for all hours worked in excess of 40." A day rate never satisfies overtime by itself.
- **778.114 (fluctuating workweek).** Fixed salary for fluctuating hours with a clear mutual understanding; salary never below minimum wage for the hours worked; overtime at one-half the regular rate (salary ÷ hours). Since 2020, bonuses and commissions may be paid on top but must be added to the regular rate. Not recommended for salons.
- **778.117 (commissions — general).** Commissions "are payments for hours worked and must be included in the regular rate," whether paid weekly or deferred, and whether the sole pay or paid in addition to a salary, day rate or hourly rate. This is the rule that makes "OT on the day rate only" an underpayment.
- **778.118 (commission paid weekly).** Add commission to other weekly earnings, divide by total hours, pay an extra one-half of that rate for each hour over 40.
- **778.119 (deferred commissions).** When commission is computed monthly or on another cycle, the employer may defer it until known, then apportion it back over the workweeks and pay the additional overtime for each week over 40 hours; a monthly figure is converted by × 12 ÷ 52.
- **778.120 (deferred commissions not identifiable to weeks).** Two permitted methods: (a) **equal amounts per week** — divide the commission by the number of weeks, then for each overtime week divide that share by that week's hours and pay half of the result per overtime hour; (b) **equal amounts per hour** — divide the commission by total hours in the period, and pay one-half of that hourly increase for each overtime hour. Method (b) is simplest for tablet-recorded hours.
- **778.121** (delayed credits and debits — compute on commission actually payable) and **778.122** (section 7(g)(3) "basic rate" option, rarely useful) complete the set.

**Minimum wage first, then overtime.** The regular rate can never fall below the applicable minimum (29 CFR 778.107). When a commission week falls short the app must (1) top up straight-time pay to minimum wage × hours, then (2) compute overtime on the topped-up rate.

#### Worked examples (NYC $17.00 floor shown)

**(a) $120/day × 6 days + $900 commission, 54 hours**

| Step | Computation | Result |
|---|---|---|
| Day-rate earnings | 6 × $120 | $720.00 |
| Commission | given | $900.00 |
| Total straight-time compensation | | $1,620.00 |
| Regular rate (778.112 + 778.118) | $1,620 ÷ 54 | **$30.00/h** |
| Minimum-wage check | $30.00 ≥ $17.00 | pass |
| Half-time premium | 14 OT h × $15.00 | **$210.00** |
| **Total owed** | $1,620 + $210 | **$1,830.00** |

Traps to flag: "day rate plus 1.5× the day-rate hourly" gives $720 + 14 × $6.67 = $813.33, more than $1,000 short. With zero commission, $720 ÷ 54 = $13.33 is below $17.00, so top up to 54 × $17 = $918.00, then pay 14 × $8.50 = $119.00 overtime: $1,037.00.

**(b) 60% commission only, 48 hours (assume $2,000 of services → $1,200)**

| Step | Computation | Result |
|---|---|---|
| Straight-time compensation | 60% × $2,000 | $1,200.00 |
| Regular rate | $1,200 ÷ 48 | **$25.00/h** |
| Minimum-wage check | 48 × $17 = $816 ≤ $1,200 | pass |
| Half-time premium | 8 × $12.50 | **$100.00** |
| **Total owed** | | **$1,300.00** |

Slow-week variant, $700 commission: $700 ÷ 48 = $14.58 < $17.00 → top up to $816.00 (+$116.00); regular rate becomes $17.00; overtime 8 × $8.50 = $68.00; **total $884.00**.

**(c) Hourly $16.00 plus commission — 45 hours, $300 commission**

| Step | Computation | Result |
|---|---|---|
| Hourly straight time | 45 × $16 | $720.00 |
| Commission | | $300.00 |
| Total straight-time compensation | | $1,020.00 |
| Regular rate | $1,020 ÷ 45 | **$22.67/h** |
| Half-time premium | 5 × $11.33 | **$56.67** |
| **Total owed** | | **$1,076.67** |

Paying 1.5 × $16 on the five overtime hours ($40 premium) underpays by $16.67 because the commission was left out (778.117). The $16.00 base is below NYC's $17.00; the combined rate passes, but the app should warn whenever a base hourly rate is below the local minimum.

### 1.3 Minimum-wage floor, tips and tip credit

- **Floor.** Federal minimum wage **$7.25** (since 24 July 2009). Test per workweek: straight-time compensation (excluding tips unless a tip credit is properly taken) ÷ hours ≥ the highest applicable federal, state or local minimum. Wages must be paid "free and clear" (531.35). Part 776 covers coverage; a salon grossing $500,000+ is an enterprise covered, and card processing and imported supplies bring individual employees under coverage regardless.
- **Tip credit (531.50–531.60)** [text not re-verified]. Tipped employee = customarily and regularly more than $30/month in tips. Cash wage **$2.13**, credit up to **$5.12**, only after advance notice (531.59(b)) of the cash wage, the credit amount, that the credit cannot exceed tips received, that all tips are retained except under a valid pool, and that the credit does not apply without this notice.
- **2018 statute and 2020/2021 rules.** FLSA 3(m)(2)(B) (2018): an employer may not keep employees' tips for any purpose, tip credit or not, including through managers or supervisors. The December 2020 rule (85 FR 86756, operative 30 April 2021) and the September 2021 rule (86 FR 52973, effective 23 November 2021) codified this in 531.52 and 531.54: tips are the employee's property; "managers or supervisors" are defined by the duties test in 541.100(a)(2)–(4) (an owner-operator or a front-desk manager who hires, fires and directs work may not share a pool); a manager may keep only tips given directly for service the manager solely provided; employers paying full minimum wage may run "nontraditional" pools including non-tipped staff (a receptionist) but never managers; employers taking a tip credit may pool only among customarily tipped employees. Civil penalties for keeping tips sit in 578.3. The October 2021 "80/20/30" dual-jobs rule was vacated by the Fifth Circuit in August 2024 and removed in December 2024 [history not re-verified].
- **Service charges vs tips (531.55).** A compulsory charge is not a tip even if paid out; it is employer revenue, cannot count toward the tip credit, and when distributed is a wage included in the regular rate. The app keeps tips outside the wage calculation and treats any mandatory charge passed to techs as commission-like wages.
- **Credit-card processing fees.** Federal position (Fact Sheet #15; FOH 30d05): the employer may reduce a charged tip by the proportional processing fee, must pay by the next regular payday, and may not reduce wages below the minimum [not re-verified]. **California** prohibits any deduction (Labor Code 351; confirmed 2026-10-07 via DLSE-citing results), **Massachusetts** prohibits it (c.149 §152A, Attorney General guidance; confirmed 2026-10-07), **Pennsylvania** prohibits it (34 Pa. Code 231.112, 2022 — unverified), and **New York** permits at most the pro-rata share under Labor Law 196-d (a secondary source retrieved 2026-10-07 described NY as prohibiting it — unverified). **App default: never deduct processing fees from tips; per-state opt-in disabled for CA, MA, PA and NY.**

### 1.4 Section 7(i) retail or service commission exemption — 29 CFR 779.410–779.420

[text not re-verified; https://www.ecfr.gov/current/title-29/part-779/subpart-D]. Section 7(i) exempts an employee from overtime only (not minimum wage or records) when all three tests hold:

1. **Retail or service establishment (779.411, 779.24):** 75%+ of annual dollar volume not for resale and "recognised as retail" in the industry. On **19 May 2020** (85 FR 29867) DOL withdrew 779.317 (the 134-industry "no retail concept" list) and 779.320 (the "may be recognised as retail" list, which included beauty and barber shops), so every establishment is now judged under the same 779.316/779.318 criteria. Confirmed 2026-10-07 (Littler, Honigman, FR 2020-10250). No post-2020 WHD guidance names nail salons — **unverified beyond the 2020 rule**; their pre-2020 presence on the "may be retail" list is the best indicator.
2. **Regular rate above 1.5 × federal minimum (779.419):** for every overtime week, compensation ÷ hours must exceed 1.5 × $7.25 = **$10.875**. New York's Miscellaneous Industries Wage Order (142-2.2) incorporates the FLSA section 7 exemptions so 7(i) may be available in NY (run the test against the NY minimum to be safe); CT, RI, NJ, MA and IL have no 7(i) equivalent, so overtime is owed regardless.
3. **More than half of compensation from commissions (779.412–779.418, 779.420)** over a designated representative period of one month to one year; commissions must be bona fide (a flat percentage of the service price qualifies, a disguised hourly or day rate does not, 779.416); tips are not compensation for this test.

Example (a) above is 55.6% commission at a $30 regular rate, so 7(i) *could* apply federally if the establishment and representative-period tests are met; example (c) is 29% commission, so it cannot. The app should compute overtime by default and offer a 7(i) worksheet (commission share, weekly regular-rate check, sales-volume records per 516.5(c)) rather than suppress overtime.

### 1.5 Deductions, uniforms, supplies and kickbacks — 29 CFR 531.35

[text not re-verified]. Wages must be paid "finally and unconditionally or 'free and clear'"; requiring an employee to "kick back" part of the wage is unlawful, and the same applies when the employee must bear costs that are primarily for the employer's benefit: tools of the trade (531.3(d)), required uniforms and cleaning (531.32(c); Fact Sheet #16), shortages, and salon supplies (acrylic, gel, files, gloves, sanitiser). Supply charges or "chair rent" imposed on employees are lawful only to the extent the employee still receives full minimum wage and the full overtime premium that week. New York is stricter: Labor Law 193 permits only enumerated deductions and bars deductions for breakage, spoilage or supplies; Labor Law 198-b criminalises kickbacks; 142-2.5(c) bars any uniform allowance and requires reimbursement of a required uniform by the next payday (2026 maintenance-allowance figures unverified).

### 1.6 Independent-contractor classification (status at 7 October 2026)

- **2024 rule** (89 FR 1638, effective 11 March 2024): six-factor totality test.
- **1 May 2025:** Field Assistance Bulletin 2025-1 told WHD investigators to stop applying the 2024 rule and use Fact Sheet #13 and the 2019 opinion-letter analysis [not re-verified].
- **26–27 February 2026:** NPRM (FR 2026-03962; RIN 1235-AA46) to **rescind the 2024 rule and adopt a 2021-style test** with two core factors — control and opportunity for profit or loss. Comments closed **28 April 2026**. Confirmed 2026-10-07 (dol.gov/agencies/whd/flsa/misclassification/2026rulemaking).
- **Final rule:** not confirmed as of 2026-10-07 — **unverified; check the Federal Register before launch**. For a salon the answer rarely changes: a tech who is scheduled by the salon, paid a percentage of a salon-set price, uses salon supplies and cannot take clients elsewhere is an employee under every version.

| Bona fide booth renter | Employee |
|---|---|
| Written lease, fixed rent paid even in slow weeks | "Rent" is a percentage of receipts or waived when slow |
| Sets own prices, hours and days; own appointment book | Salon sets prices, shifts and assigns walk-ins |
| Collects payment directly; own merchant account; keeps all receipts and tips | Salon rings up sales and pays weekly |
| Buys own products and tools; own licence and insurance | Salon supplies products and directs technique |
| May hire help, work elsewhere, advertise independently | Exclusivity, uniform, salon branding |
| Files Schedule C; 1099 only for amounts the salon owes | W-2 some weeks, 1099 others ("hybrid") |

State tests are stricter: ABC tests in **Massachusetts** (c.149 §148B), **New Jersey** (43:21-19(i)(6)), **Connecticut** and **Illinois** (unemployment), and **California** (Labor Code 2775; the AB 5 manicurist carve-out sunset 1 January 2025 and extension legislation was pending — unverified). New York uses a common-law control test, but its Task Force treated commission-paid techs as employees.

### 1.7 Penalties, liquidated damages and limitation periods

- **Back wages plus an equal amount in liquidated damages** (29 U.S.C. 216(b)); reducible only on proof of good faith and reasonable grounds (29 U.S.C. 260) — weekly written pay records are the main good-faith evidence.
- **Limitations** (29 U.S.C. 255): **2 years**, **3 years if willful**. State periods are longer: NY 6 years (Labor Law 198(3)), NJ 6, IL 3 (10 for some claims), MA 3, RI 3, CT 2 (3 willful).
- **Civil money penalties** (29 CFR 578.3): up to **$2,515** per repeated or willful minimum-wage/overtime violation and **$1,409** per unlawful tip retention at the January 2025 adjustment; the 2026 adjustment was not retrieved — **unverified**. Criminal willful violations: fine up to $10,000 (216(a)). Retaliation (215(a)(3)) brings reinstatement, lost wages, liquidated and punitive damages — the Rhode Island case below is primarily a retaliation case.
- **New York add-ons:** 100% liquidated damages (198(1-a)), 9% interest, WTPA damages of $50/workday for a missing pay notice and $250/workday for a missing or defective pay statement (caps $5,000 each), personal liability of the ten largest owners. The May 2025 state budget amended 198(1-a) so a *first* frequency-of-pay violation (manual worker paid bi-weekly) is remedied by lost interest rather than 100% liquidated damages, with liquidated damages for repeat violations after a prior finding [not re-verified].

---

## 2. State rules table

Minimum-wage values confirmed through 2026-10-07 results surfacing the official announcements in Sources; other columns cite the statute/regulation and are [text not re-verified] unless noted. Daily overtime exists only in California. Tip-credit figures are for 2026.

| State | Min wage 2026 (effective) | Scheduled 2027 | Tip credit for a nail tech | Pay frequency | Pay statement contents (cite) | Retention | Paid sick leave | Premiums / notes |
|---|---|---|---|---|---|---|---|---|
| **NY — NYC, Long Island, Westchester** | **$17.00** (1 Jan 2026; LL 652) | Indexed from 1 Jan 2027 to 3-year average CPI-W Northeast with off-ramps; figure not published on 2026-10-07 — unverified | Permitted under 12 NYCRR 142-2.5(b) for employees who customarily receive tips, in two tiers scaled to the minimum; 2026 tier amounts unverified — **app default: no tip credit** | **Manual workers weekly**, within 7 days (LL 191(1)(a)) | LL 195(3): dates covered; employee name; employer name, address, phone; rate(s) and basis (hourly, shift, day, week, salary, piece, commission); gross; deductions; allowances; net; regular rate, OT rate, regular and OT hours; piece rates and units | **6 years** (LL 195(4); 142-2.6) | 1 h per 30 h: 40 h paid (5–99 employees, or ≤4 with net income > $1M), 56 h paid (100+), 40 h unpaid (≤4 and ≤ $1M) (LL 196-b); NYC ESSTA adds notice rules | OT 40 h at 1.5× regular rate (142-2.2); spread > 10 h or split shift: +1 h at minimum wage (142-2.4); call-in: lesser of 4 h or scheduled shift at minimum wage (142-2.3); no uniform allowance (142-2.5) |
| **NY — rest of state** | **$16.00** (1 Jan 2026) | as above | as above | as above | as above | 6 years | as above | as above |
| **CT** | **$16.94** (1 Jan 2026; PA 19-4 ECI indexing; Gov. Lamont release Sept 2025) | **$17.48** on 1 Jan 2027 — secondary source citing Aug 2026 announcement; unverified | **None** for salon workers; gratuity allowance only for hotel/restaurant service ($6.38 cash) and bartenders ($8.23) (CGS 31-60) | **Weekly** (CGS 31-71b); less frequent only with Labor Commissioner approval (31-71i) | CGS 31-13a: hours worked, straight-time and overtime gross shown separately, itemised deductions, net | 3 years (CGS 31-66; 31-13a) | 1 h per 30 h, 40 h/yr; PA 24-8 covers 11+ employees from 1 Jan 2026, all from 1 Jan 2027 | OT 40 h (31-76c); no spread/call-in for salons |
| **RI** | **$16.00** (1 Jan 2026; RIGL 28-12-3 as amended 2025) | **$17.00** on 1 Jan 2027 (in statute) | Cash wage **$3.89**, credit $12.11 (28-12-5) | **Weekly** (28-14-2); bi-weekly if statutory payroll conditions or DLT approval | 28-14-2.1: hours, rate, gross, itemised deductions, net (post-2022 list unverified) | 3 years (28-12-12) | 1 h per 35 h, 40 h/yr; paid if 18+ employees (28-57) | OT 40 h (28-12-4.1); reporting pay 3 h (28-12-3.2) |
| **NJ** | **$15.92** (1 Jan 2026; NJDOL 1 Oct 2025); seasonal/small (<6) $15.23 | CPI adjustment announced ~1 Oct; secondary source reports $16.48 — unverified | Cash wage **$6.05**, credit $9.87 | At least **twice a month** (34:11-4.2) | 34:11-4.6 / N.J.A.C. 12:56-4.1: gross, net, rate, hours (non-exempt), itemised deductions | **6 years** (34:11-56a20) | 1 h per 30 h, 40 h/yr, all employers (34:11D) | OT 40 h; reporting pay 1 h (12:56-5.5); ABC test |
| **MA** | **$15.00** (since 1 Jan 2023) | None; S.1349 ($16.25 → $20 by 2029) pending | Service rate **$6.75** (tips ≥ $20/mo), credit $8.25; make-up to $15 tested **per shift** (c.151 §7) | **Weekly or bi-weekly** for hourly staff, within 6–7 days (c.149 §148) | c.149 §148: employer name, employee name, pay date, hours, hourly rate, deductions/increases | 3 years (c.151 §15) | 1 h per 30 h, 40 h/yr; paid if 11+ employees (c.149 §148C) | OT 40 h (c.151 §1A); reporting pay 3 h at minimum (454 CMR 27.04); mandatory treble damages (c.149 §150); no CC-fee deduction from tips |
| **IL** | **$15.00** (since 1 Jan 2025); Chicago $17.05 and Cook County $15.40 from 1 Jul 2026 | None statewide | Cash wage **$9.00** (60% rule), credit $6.00 (820 ILCS 105/4(c)) | **Semi-monthly**, within 13 days (820 ILCS 115/3-4) | 820 ILCS 115/10 as amended 1 Jan 2025 (PA 103-0953): hours, rate, overtime, gross, deductions, year-to-date; keep 3 years; copies on request | 3 years (105/8; 115/10); 5 under Equal Pay Act | PLAWA: 1 h per 40 h, 40 h/yr, any purpose (820 ILCS 192) | OT 40 h (105/4a) |
| **TX** | **$7.25** (federal; Lab. Code 62.051) | None | $2.13 / $5.12 (federal) | At least **twice a month** for non-exempt (Lab. Code 61.011) | Lab. Code 61.015: name, rate, gross, deductions, net, hours (hourly) | FLSA 3 years (TWC audits 4) | None; local ordinances preempted (2023) | OT per FLSA |
| **GA** | State $5.15 (34-4-3); **$7.25** applies to FLSA-covered salons | None | $2.13 / $5.12 (federal) | At least **semi-monthly** (34-7-2) | None required | FLSA 3 years | None | OT per FLSA |
| **FL** | **$14.00** (30 Sep 2025) → **$15.00 on 30 Sep 2026** (Const. art. X §24) | CPI-W each 30 Sep from 2027 | Cash wage **$10.98 → $11.98 on 30 Sep 2026**; credit fixed at $3.02 | No state rule | None required (Fla. Stat. 448.110 notice) | FLSA 3 years | None; local preempted | OT per FLSA |
| **CA** | **$16.90** (1 Jan 2026; DIR release 2025-118); many local rates higher | DOF announces by 1 Aug for 1 Jan 2027 (CPI ≤ 3.5%) — figure not retrieved, unverified | **None** (Lab. Code 351) | **Semi-monthly** (Lab. Code 204) | Lab. Code 226(a), nine items (§4) | 3 years (226(a), 1174); keep 4 | 1 h per 30 h; use 40 h/5 days (Lab. Code 246) | **Daily OT** > 8 h 1.5×, > 12 h 2×, 7th day rules (510); split-shift 1 h at minimum (Wage Order 2 §4(C)); meal/rest premium 1 h each (226.7); reporting-time pay; piece-rate rest pay (226.2) |
| **PA** | **$7.25** | None | Cash wage **$2.83**, credit $4.42; tips ≥ $135/mo (2022 rule) | Regular paydays designated in advance (43 P.S. 260.3) | 34 Pa. Code 231.36 — hours, rates, gross, deductions, net (unverified) | 3 years (34 Pa. Code 231.31) | None statewide (Philadelphia, Pittsburgh, Allegheny local) | No CC-fee deduction from tips (231.112 — unverified) |
| **VA** | **$12.77** (1 Jan 2026; Va. Code 40.1-28.10 CPI) | **$13.75 on 1 Jan 2027, $15.00 on 1 Jan 2028** per April 2026 legislation — secondary source, unverified | $2.13 cash (follows FLSA); credit $10.64 | Hourly at least bi-weekly or semi-monthly; salaried monthly (40.1-29(A)) | 40.1-29(C): employer name/address, hours (hourly), rate, gross, deductions | 3 years (unverified) | None (home health only) | OT 40 h (40.1-29.2) |
| **NC** | **$7.25** (95-25.3) | None | $2.13 / $5.12 | Regular paydays, daily to monthly (95-25.6) | 95-25.13: itemised deductions each pay period; written notice of rates and paydays | 3 years (95-25.13) | None | OT 40 h (95-25.4) |
| **WA** | **$17.13** (1 Jan 2026; L&I release 25-27); Seattle and others higher | L&I announces by 30 Sep for 1 Jan 2027 — not retrieved, unverified | **None** (RCW 49.46.020(3)) | At least **monthly** (WAC 296-126-023) | WAC 296-126-040: pay basis, rate, gross, hours, deductions; sick-leave balance monthly (296-128-620) | 3 years (WAC 296-126-050) | 1 h per 40 h, uncapped accrual, 40 h carry-over (RCW 49.46.210) | OT 40 h (RCW 49.46.130) |

**Pay-statement language.** No launch state requires the pay statement itself to be translated. New York requires the **hiring pay notice** (LL 195(1); LS 54 hourly, LS 55 multiple rates, LS 57 commission, LS 59 piece rate) in English **and** the employee's primary language whenever NY DOL publishes a template in that language; templates exist in English, Spanish, Chinese (traditional), Haitian Creole, Korean, Polish, Russian, Italian, Yiddish, **Vietnamese** and Burmese (NY DOL WTPA FAQ; confirmed via 2026-10-07 result). Nepali and Tibetan have no template, so English alone is compliant for those workers. The app's EN/VI statements exceed NY's requirement and satisfy the notice rule for Vietnamese-speaking techs.

---

## 3. New York nail-salon specifics

- **2015 reforms.** After the May 2015 *New York Times* "Unvarnished" series, Governor Cuomo created the multi-agency **Nail Salon Industry Enforcement Task Force** (May 2015). Chapter 80 of the Laws of 2015 (July 2015) created the nail-specialty trainee licence, authorised the Secretary of State to close unlicensed salons, required a workers'-rights posting and authorised wage bonds; the Department of State ventilation rule (19 NYCRR Part 160) followed in October 2016 with a five-year phase-in [legislative detail not re-verified].
- **Wage bond** (19 NYCRR Part 160; enforced by the Department of State from **6 October 2015**; amounts confirmed via 2026-10-07 result citing the Governor's announcement): every appearance-enhancement business offering nail services must hold a wage bond (or approved liability insurance, letter of credit or escrow) sized by full-time-equivalent nail staff — **$25,000** for 2–5 FTE, **$40,000** for 6–10, **$75,000** for 11–25, **$125,000** for 26+. Treatment of salons under 2 FTE is **unverified**. The bond pays wage judgments if the salon defaults; lapse is grounds for licence revocation.
- **Task Force results.** By August 2016: more than 450 investigations opened and **143 salons ordered to pay about $2 million in unpaid wages and damages to 652 workers** (Governor's release; confirmed 2026-10-07). Later cumulative figures — **unverified**; programme page: https://dol.ny.gov/nail-salon-industry.
- **Nail Salon Workers' Bill of Rights.** Mandatory poster summarising minimum wage, overtime, the right to keep tips, free protective equipment and the complaint hotline, published in multiple languages including Vietnamese (full language list unverified). The audit binder should hold a dated photo of the posted notice.
- **Minimum wage:** $17.00 for NYC from 1 Jan 2026; 2027 indexed (table). NY DOL's page showed only 2026 rates on 2026-10-07.
- **Miscellaneous Industries Wage Order (12 NYCRR Part 142)** governs salons (not "hospitality"). From the regulation text surfaced on 2026-10-07: **142-2.3 call-in pay** — an employee who reports by request or permission is paid at least four hours or the scheduled shift, whichever is less, at the basic minimum wage; **142-2.4** — one extra hour at the basic minimum for any day with a spread over 10 hours or a split shift; **142-2.5** — no allowance for required uniforms, purchase cost reimbursed by the next payday, tip allowance only for customarily tipped employees; **142-2.18** — spread of hours is the interval between start and end of the workday including meals and off-duty intervals; 142-2.2 overtime at 1.5× the regular rate after 40 hours; 142-2.6 weekly payroll records (arrival and departure times for split-shift and >10-hour-spread days) kept **6 years**; 142-2.7 a statement with every payment. 2026 tip-allowance and uniform-maintenance dollar figures — **unverified**.
- **NYC Fair Workweek** covers only fast-food chains (30+ locations) and retail employers (20+ employees). **Nail salons are not covered** (confirmed 2026-10-07). NYC's Earned Safe and Sick Time Act and temporary-schedule-change law do apply.
- **Nail Salon Minimum Standards Council Act** — reintroduced each session since 2022 (A9398 of 2022; S1800/A378 of 2023–24; **S7481 (Ramos)/A4420 in 2025–26**, referred to the Labor committees in 2025). It would create a 15-member council of workers, owners and public members to set industry minimum standards. **Not enacted as of 2026-10-07** (status beyond referral unverified).
- **Weekly pay.** LL 191(1)(a): manual workers paid weekly, within seven days of the week's end; only employers with 1,000+ employees may seek bi-weekly authorisation. This fixes the app's weekly pay-record cadence.

---

## 4. California (later phase) — brief

[statute text not re-verified; https://leginfo.legislature.ca.gov]

- **Labor Code 226.2 (piece rate).** Rest/recovery periods and "other nonproductive time" are paid separately: rest/recovery at the higher of the week's average hourly rate (total pay excluding rest pay and OT premium ÷ hours excluding rest time) or the minimum wage; other nonproductive time at least the minimum. The wage statement must itemise rest/recovery hours, rate and gross and (unless an hourly rate is paid for all hours) nonproductive hours, rate and gross. Whether a percentage-of-service plan is "commission" (204.1) or piece rate is contested; budget rest-period pay separately for CA.
- **Daily overtime (510):** 1.5× after 8 hours/day or 40/week and for the first 8 hours on a seventh consecutive day; 2× after 12 hours/day or after 8 on the seventh day. Commission and piece pay divide by all hours; salary divides by 40.
- **Split-shift premium** (Wage Order 2-2001 §4(C)): one hour at minimum wage, offset by pay above the minimum that day.
- **Meal and rest (512, 226.7):** 30-minute meal by the end of the fifth hour; 10-minute paid rest per four hours; one extra hour at the "regular rate of compensation" (including commissions, *Ferra v. Loews*, 2021) per day for each type missed.
- **Wage statement (226(a)):** (1) gross wages; (2) total hours; (3) piece units and rate; (4) all deductions; (5) net; (6) period dates; (7) employee name and last four SSN or ID; (8) employer legal name and address; (9) all hourly rates and hours at each. Penalties $50 first period, $100 thereafter, cap $4,000 (226(e)); records 3 years.
- **Tips:** no tip credit, no card-fee deduction, paid by next regular payday (351). **Pay frequency** semi-monthly (204). **Sick leave** 1 hour per 30, 40 hours usable.

---

## 5. Enforcement actions against nail salons, 2015–2026

| Date | Jurisdiction | Salon(s) | Amount | Violations | Link |
|---|---|---|---|---|---|
| 3 Aug 2015 (announced 17 Aug) | Connecticut DOL | 25 randomly chosen salons; 23 issued stop-work orders (92%) | $47,350 wages recovered initially; $79,000 penalties for payroll under-reporting/cash pay; $21,300 wage-hour penalties | Cash pay without records, pay below the then-$9.15 minimum, no overtime, misclassification | https://ctmirror.org/2015/08/17/nail-salons-are-ubiquitous-and-so-are-labor-violations/ |
| May 2015 – Aug 2016 | New York Task Force | 143 salons ordered to pay; 450+ investigations | ~$2,000,000 to 652 workers | Minimum wage, overtime, records, unlicensed practice | https://www.governor.ny.gov/news/governor-cuomo-directs-nail-salons-repay-2-million-unpaid-wages-and-damages-more-600-employees |
| 24 Aug 2016 | US DOL WHD (NY) | Nail salons in Nassau and Suffolk counties (names not retrieved) | $203,000 back wages, liquidated damages and penalties; 95 workers | Minimum wage, overtime (flat daily/weekly pay), records | https://www.dol.gov/newsroom/releases/whd/whd20160824 |
| Aug 2018 | California Labor Commissioner | Young's Nail Spa, Temecula | $1.2 million; 36 workers | Misclassification, minimum wage, overtime, wage statements, waiting-time penalties | https://www.dir.ca.gov/DIRNews/2018/2018-65.pdf |
| 11 May 2020 | US DOL WHD (adjacent: hair salons) | Salon chain in bankruptcy, 15 states | $1,149,965 back wages | Minimum wage and overtime for commission-paid stylists | https://www.dol.gov/newsroom/releases/whd/whd20200511 |
| Suit Aug 2022 → consent judgment Feb 2024 → announced 29 May 2024 | US DOL (WHD, OSHA, SOL), Rhode Island | New VIP Nail Spa Inc. (Cumberland), VIP Neo Nails Inc. (East Greenwich), VIP Spa & Nails Inc. (North Providence); owner Steven Xingri Cao | **$753,500**: $550,000 to 70 employees ($275,000 back wages + $275,000 liquidated damages) for overtime; remainder for retaliation against a worker fired after an OSHA complaint | Overtime after 40 h, inaccurate records, false statements to investigators, coerced false documents, retaliation; payroll monitor for two years and industry outreach ordered | https://www.dol.gov/newsroom/releases/sol/sol20240529 |
| Feb 2024 | California — UCLA Labor Center / CA Healthy Nail Salon Collaborative | Statewide research informing AB 2444 | No citation: documents sub-minimum wages and widespread misclassification of a largely Vietnamese workforce | — | https://labor.ucla.edu/press-advisory/californias-fast-growing-nail-salon-workforce-faces-low-wages-misclassification-says-new-research-from-ucla-chnsc |
| 2025–2026 | — | **No 2025–2026 nail-salon-specific release was retrieved before the search budget was exhausted — gap, unverified.** Next searches: NY AG settlements, MA AG citations, WHD releases filtered to NAICS 812113 | | | https://www.dol.gov/newsroom/releases?agency=57 |

**Pattern:** flat daily or weekly pay with no hourly records, no overtime after 40 hours, cash pay, falsified time records, retaliation. Each is addressed directly by a PIN clock with daily totals, weekly regular-rate computation and immutable statements.

---

## 6. Rules-engine notes

`jurisdiction` is the two-letter state or `US`; NY entries carry `region` (`NYC_LI_WESTCHESTER`, `REST_OF_STATE`, `ALL`). Keys follow the column names above (`min_wage`, `min_wage_scheduled`, `tipped_cash_wage`, `tip_credit_allowed`, `tip_credit_max`, `ot_weekly_threshold_hours`, `ot_daily_threshold_hours`, `pay_frequency_manual_workers`, `pay_frequency`, `pay_statement_fields`, `pay_notice_languages`, `record_retention_years`, `required_records`, `spread_of_hours`, `call_in_pay`, `reporting_pay`, `paid_sick_accrual`, `cc_fee_deduction_from_tips`, `section_7i_available`, `wage_bond`, `ic_rule_status`, `cmp_*`, and others). Every entry carries `checked_on: "2026-10-07"` and a `notes` field stating whether the value was confirmed from a 2026-10-07 result, is regulation text not re-opened today, or is unverified.

---

## Sources

Official and primary (surfaced via 2026-10-07 searches; direct retrieval blocked in this environment):

1. 29 CFR Part 516 — https://www.ecfr.gov/current/title-29/part-516
2. 29 CFR Part 531 (Subpart D, tips) — https://www.ecfr.gov/current/title-29/part-531
3. 29 CFR Part 778 (Subpart B) — https://www.ecfr.gov/current/title-29/part-778
4. 29 CFR Part 779 (Subpart D, 7(i)) — https://www.ecfr.gov/current/title-29/part-779
5. 85 FR 29867 (19 May 2020), withdrawal of 779.317/779.320 — https://www.govinfo.gov/content/pkg/FR-2020-05-19/pdf/2020-10250.pdf
6. WHD Fact Sheet #15 (tipped employees) — https://www.dol.gov/agencies/whd/fact-sheets/15-tipped-employees-flsa
7. WHD 2026 independent-contractor rulemaking — https://www.dol.gov/agencies/whd/flsa/misclassification/2026rulemaking ; release https://www.dol.gov/newsroom/releases/whd/whd20260226 ; FR 2026-03962 https://www.federalregister.gov/documents/2026/02/27/2026-03962/employee-or-independent-contractor-status-under-the-fair-labor-standards-act-family-and-medical
8. US DOL, Rhode Island nail salons $753,500 (29 May 2024) — https://www.dol.gov/newsroom/releases/sol/sol20240529
9. US DOL WHD, Nassau/Suffolk salons $203K (24 Aug 2016) — https://www.dol.gov/newsroom/releases/whd/whd20160824
10. US DOL WHD, salon chain $1,149,965 (11 May 2020) — https://www.dol.gov/newsroom/releases/whd/whd20200511
11. US DOL, state tipped minimum wages — https://www.dol.gov/agencies/whd/state/minimum-wage/tipped
12. NY DOL Nail Salon Industry — https://dol.ny.gov/nail-salon-industry
13. NY Governor, wage-bond announcement (2015) — https://www.governor.ny.gov/news/governor-cuomo-announces-wage-bond-requirements-nail-salon-owners-and-availability-new-nail
14. NY Governor, Task Force $2M / 652 workers — https://www.governor.ny.gov/news/governor-cuomo-directs-nail-salons-repay-2-million-unpaid-wages-and-damages-more-600-employees
15. NY Assembly Labor Chair Bronson on 2026 rates — https://www.assembly.ny.gov/mem/Harry-B-Bronson/story/116266
16. NY DOL WTPA FAQ (notice languages) — https://dol.ny.gov/system/files/documents/2021/03/wage-theft-prevention-act-frequently-asked-questions.pdf
17. 12 NYCRR Part 142 — https://regulations.justia.com/states/new-york/title-12/chapter-ii/subchapter-b/part-142/subpart-142-2/ ; NY DOL wage-order summary — https://dol.ny.gov/system/files/documents/2023/09/mw-orders-update-9.20.23.pdf
18. NY Senate S7481 (2025) — https://www.nysenate.gov/legislation/bills/2025/S7481 ; A4420 — https://www.nysenate.gov/legislation/bills/2025/A4420
19. NYC DCWP Fair Workweek — https://www.nyc.gov/site/dca/media/Fair-Workweek-Campaign.page
20. CT Governor, $16.94 announcement — https://portal.ct.gov/governor/news/press-releases/2025/09-2025/governor-lamont-announces-minimum-wage-will-increase
21. CT 2015 sweep — https://ctmirror.org/2015/08/17/nail-salons-are-ubiquitous-and-so-are-labor-violations/ ; https://www.nbcconnecticut.com/news/local/nail-salons-shut-down-over-wage-violations/60820/
22. RI Governor, minimum-wage signing — https://governor.ri.gov/press-releases/governor-mckee-signs-legislation-raising-rhode-island-minimum-wage ; RIGL 28-12-3 — https://law.justia.com/codes/rhode-island/title-28/chapter-28-12/section-28-12-3
23. NJDOL 2026 rates — https://www.nj.gov/labor/lwdhome/press/2025/20251223_Year_End.shtml ; NJBIA — https://njbia.org/nj-minimum-wage-to-increase-to-15-92-in-2026-for-most-workers/
24. MA S.1349 (pending) — https://www.billtrack50.com/billdetail/1859777
25. CA DIR release 2025-118 — https://www.dir.ca.gov/DIRNews/2025/2025-118.html ; DLSE tips FAQ — https://dir.ca.gov/dlse/faq_tipsandgratuities.htm ; Young's Nail Spa — https://www.dir.ca.gov/DIRNews/2018/2018-65.pdf
26. UCLA Labor Center (2024) — https://labor.ucla.edu/press-advisory/californias-fast-growing-nail-salon-workforce-faces-low-wages-misclassification-says-new-research-from-ucla-chnsc
27. WA L&I $17.13 — https://www.lni.wa.gov/news-events/article/25-27
28. VA $12.77 and 2027–28 schedule — https://www.axios.com/local/richmond/2026/01/05/virginia-minimum-wage-2026-raise-15-dollar-plan ; https://www.beankinney.com/news-and-insights/blogs/virginias-minimum-wage-rises-to-1375-on-january-1-2027-what-employers-need-to-know/
29. FL Amendment 2 / Fla. Stat. 448.110 — https://www.flsenate.gov/Laws/Statutes/2025/448.110 ; https://en.wikipedia.org/wiki/2020_Florida_Amendment_2
30. IL rates / Chicago — https://onpay.com/insights/minimum-wage-by-state-summary/illinois/

Secondary summaries used where primary pages could not be opened: Littler on the 2020 7(i) rule — https://www.littler.com/news-analysis/asap/dol-revised-section-7i-exemption-regulations-your-company-retail-or-service ; Honigman — https://www.honigman.com/Employers-Wage-and-Hour-Advisor/commissioned-employees-dol-withdraws-no-retail-and ; Nixon Peabody on the 2026 IC NPRM — https://www.nixonpeabody.com/insights/alerts/2026/03/03/dol-proposes-new-independent-contractor-rule ; CardFellow on processing-fee deductions — https://www.cardfellow.com/blog/employers-deduct-credit-card-processing-fees-from-tips ; HiveDesk CT page (2027 figure, unverified) — https://www.hivedesk.com/compliance/united-states/minimum-wage-connecticut ; Workforce.com sick-leave table — https://www.workforce.com/news/paid-sick-leave-laws-by-state ; Patriot Software tipped-wage table — https://www.patriotsoftware.com/blog/payroll/federal-state-tipped-minimum-wage-rates/ ; Clockspot recordkeeping by state — https://www.clockspot.com/articles/recordkeeping-requirements-by-state.
