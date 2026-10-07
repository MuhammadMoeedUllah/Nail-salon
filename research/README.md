# Research corpus: nail-salon pay records

Collected 2026-10-07 to ground every feature, screen and rule of the app in facts. Six memos plus two machine-readable seeds. Every figure carries a source link; anything that could not be confirmed on the day is tagged **unverified** or **[text not re-verified]** in place.

| File | What it answers | Use in the app |
|---|---|---|
| [01-market-and-current-pay-processes.md](01-market-and-current-pay-processes.md) | How many salons, who owns them, how technicians are paid today (day rate, "bao lương", "ăn chia 6/4", check-and-cash), how hours and tickets are tracked now, enforcement history | Pay bases, weekly cycle, bilingual UI, check/cash recording |
| [02-incumbent-software-landscape.md](02-incumbent-software-landscape.md) | Vagaro, Fresha, Square, Booksy, GlossGenius, Mangomint, Boulevard, Zenoti, and the nail-specific POS systems (Go POS, Mango, Zota, NailSoft, Tilavon): prices, payroll features, exports, gaps | CSV importers, positioning, what UI to copy or avoid |
| [03-timeclock-payroll-tools-and-file-formats.md](03-timeclock-payroll-tools-and-file-formats.md) | Homebase, When I Work, Deputy, Connecteam, Square Shifts; exact import formats of Gusto, ADP RUN, Paychex; export columns of Square, Vagaro, Fresha, GlossGenius | Payroll CSV export columns, kiosk UX rules |
| [04-wage-hour-rules-and-enforcement.md](04-wage-hour-rules-and-enforcement.md) | 29 CFR 516 record fields, 29 CFR 778 regular-rate arithmetic with worked examples, tips, 7(i), deductions, 14-state table, New York nail-salon rules, California piece-rate, enforcement cases 2015-2026 | Pay engine, rules table, audit binder field map |
| [05-tech-stack-and-deployment-options.md](05-tech-stack-and-deployment-options.md) | Framework, database, auth, PDF, i18n, camera, offline, CSV, deployment, billing, with versions as of the day | Stack decisions in `docs/PLAN.md` |
| [06-users-voices-and-ux-findings.md](06-users-voices-and-ux-findings.md) | Owner, technician and bookkeeper voices in English and Vietnamese; daily rhythm of a salon; 19 UX rules | Screen design, wording, defaults |
| [rules-seed.json](rules-seed.json) | 171 rule entries (value, unit, effective dates, source, checked-on, notes) | Source for `app/src/lib/rules/rules.json` |
| [glossary-en-vi.json](glossary-en-vi.json) | 194 UI strings in English and Vietnamese with notes on salon slang | Source for `app/src/lib/i18n/messages.ts` |

## The ten facts the product rests on

1. About 32,000 employer nail salons with roughly 3.8 employees each; the 3-15 technician buyer sits inside that group, not among the 296,000 non-employer filers (memo 01).
2. More than half of the workforce is Vietnamese nationally and over 80 percent in California; 64 percent of Vietnamese immigrants speak English less than "very well" (memos 01, 06).
3. Pay is advertised as "bao lương $150/ngày or ăn chia 6/4": a day or weekly guarantee versus a commission split, whichever is higher. 60/40 is the default split (memos 01, 06).
4. "Check and cash" is openly discussed. The app records the full gross and how it was paid, without judgement (memos 01, 06).
5. Every enforcement case turns on the same facts: a flat day rate or per-service pay, 9.5 to 10 hour shifts, 50 hour weeks, zero overtime, no time records (memos 01, 04).
6. No incumbent, general suite or nail POS, computes overtime on a regular rate that includes commission or does a minimum-wage top-up (memo 02).
7. Gusto's import CSV accepts Regular hours, Overtime hours, Commission, Bonus, Paycheck tips and Cash tips by header name; ADP RUN and Paychex have fixed-column formats; QuickBooks Online Payroll and Square Payroll accept no hours CSV at all (memo 03).
8. Under 29 CFR 778.117 and 778.112, commissions and day rates both go into the regular rate; the rate is topped up to minimum wage first, then half-time is paid on hours over 40 (memo 04).
9. New York: manual workers are paid weekly, records are kept six years, a day spanning more than ten hours earns one extra hour at minimum wage, and salons post a wage bond scaled by headcount (memo 04).
10. Owners run weekly pay on Sunday night from a paper ledger or spreadsheet, on an iPad or cheap Android tablet at the front desk, over consumer Wi-Fi: the kiosk must queue punches offline and the statement must list each technician's own tickets (memo 06).

## Method and limits

Six parallel research sessions used web search with extended mode where results were thin. The sandbox egress proxy blocked full-page fetches on most primary domains (dol.gov, ecfr.gov, UCLA, NAILS, vendor help centers, Vietnamese press), so figures come from search-engine excerpts of the cited pages. Each memo says so and lists what to re-verify. Before launching in a state, every rule in `rules-seed.json` must be checked against the official text.
