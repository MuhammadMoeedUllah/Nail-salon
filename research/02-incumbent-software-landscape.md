# 02 — Incumbent Software Landscape: Nail-Salon Pay, Commission, Timeclock and Payroll Records

*Research date: 2026-10-07. Scope: software currently used by US nail salons, evaluated only on what it does for technician pay, commission, timeclock and payroll records. We are building shared-tablet PIN clock-in + daily ticket log → weekly pay records (FLSA overtime on day-rate-plus-commission, minimum-wage top-up, tips separate, EN/VI statements, audit binder, edit trail, payroll CSV). We are not building booking or POS.*

> **Method and confidence note.** Vendor sites (vagaro.com, squareup.com, fresha.com, booksy.com, glossgenius.com, mangomint.com, zenoti.com, nailsoft.com, zotaservices.com, mangoforsalon.com, fastboy.com, apps.apple.com, play.google.com) and the main review aggregators (Capterra, GetApp, CostBench, Koalendar, SchedulingKit, Pabau) were all blocked by this session's network egress proxy, so no page was read directly. Every fact below comes from search-engine result summaries of the linked page, captured on 2026-10-07. Where two sources disagree on a price, both are shown. Items marked **[verify]** should be confirmed by opening the URL before being quoted externally. Facts that could not be sourced at all are marked **not found**. A follow-up session with the proxy allow-list widened (or the search budget raised) can fill the column-name gaps in Section C.

---

## A. General beauty booking / POS suites

Pricing is per month, US, as reported in 2026 sources. "Timeclock" means staff clock-in/out with stored hours; "Payroll export" means a report intended to feed a payroll provider; "Check vs cash" means a native split of a technician's pay into a payroll (W-2/check) portion and a cash portion, which is a nail-industry practice none of the general suites model.

| Suite | Price (2026) | Timeclock | Commission / payroll report | Tip tracking | Payroll export / check-vs-cash | Languages (VI?) | Known payroll/commission complaints |
|---|---|---|---|---|---|---|---|
| **Vagaro** | Solo $25; +$10 per additional user; add-ons: check-in app $10, website $10, QuickBooks sync $20, payroll $20 + $6/employee ([SchedulingKit](https://schedulingkit.com/pricing-guides/vagaro-pricing)) or $34 + $5/employee ([Koalendar](https://koalendar.com/blog/vagaro-pricing)); processing 2.2–3.5%. New plan added Feb 2026 ([CostBench](https://costbench.com/changelog/vagaro-plan-added-2026-02/)) | Yes (time card tracking of employee hours) | Yes: payroll report supports regular hours, hourly rate, commission, overtime hours and tips; reports export PDF/Excel ([Vagaro Learn](https://www.vagaro.com/en-au/learn/6-ways-gusto-and-vagaro-make-payroll-processing-easier)) | Yes (tip report) | Yes: hours submitted to Gusto from payroll report settings ([Gusto](https://gusto.com/product/integrations/vagaro)); no check/cash split | English UI; Vietnamese **not found** | Capterra reviewer: "trying to use Vagaro's payroll software since April 1st… after more than 50 emails and 20 phone calls, it still does not work"; employees borrowed rent money ([Capterra p.13](https://www.capterra.com/p/153752/Vagaro/reviews/?page=13)); payroll "did not process even after it had been submitted" ([SchedulingKit pros/cons](https://schedulingkit.com/pros-and-cons/vagaro-pros-and-cons)) |
| **Fresha** | Historically $19.95 Individual / $14.95 per bookable team member; top plan cut $19.95 → $12.95 in Feb 2026 ([CostBench](https://costbench.com/changelog/fresha-price-decrease-2026-02-3/), [PricingSaaS](https://pricingsaas.com/companies/fresha)); 20% new-client marketplace fee (min $6) + processing ([Pabau](https://pabau.com/blog/fresha-pricing/)) | Yes: timesheets with clock in / breaks / clock out, overtime rates, location restrictions ([Fresha Academy](https://www.fresha.com/help-center/academy/pay-your-team/track-team-working-hours/lessons/100279)) | Yes: Commission Activity (row-by-row) and Commission Summary (by team member) reports, filter by date/member/item type, exportable ([Fresha Academy](https://www.fresha.com/help-center/academy/pay-your-team/track-team-commissions/lessons/100275)); fixed or tiered commission rates ([Fresha KB](https://www.fresha.com/help-center/knowledge-base/team/98-set-up-commissions-for-team-members)) | Yes (in pay runs) | Pay runs combine wages + timesheets + commissions; pay out via Fresha wallet, bank, or "record as manual" ([Complete a pay run](https://www.fresha.com/help-center/knowledge-base/team/300-complete-a-pay-run)); wages module "best designed for team members who earn hourly" ([Set up wages](https://www.fresha.com/help-center/knowledge-base/team/291-set-up-wages-for-team-members)) — i.e. no blended day-rate + commission regular rate | Multi-language app; Vietnamese **not found** | "Charges a lot of extra fees on top of monthly fees"; ~20% duplicate client emails ([Capterra Fresha p.2](https://www.capterra.com/p/142138/Shedul-com/reviews/?page=2)) |
| **Booksy** | $29.99 + tax for 1 user; +$20 per additional staff; processing 2.49% + 10¢; Boost 30% of first visit, min $10 ([Koalendar](https://koalendar.com/blog/booksy-pricing), [Pabau](https://pabau.com/blog/booksy-pricing/)) | **Not found** (no time clock in Booksy's Stats & Reports feature page) | Yes: "Staff Commissions & Tips" and "Staff Performance" reports; "export the full report file" ([Booksy Stats & Reports](https://biz.booksy.com/en-us/features/stats-and-reports)) | Yes (in commissions & tips report) | Downloadable reports only; no payroll run, no check/cash | BooksyBIZ lists Vietnamese alongside English, French, Polish, Portuguese, Spanish ([AlternativeTo](https://alternativeto.net/software/booksy/about)) **[verify]** | Boost fee complaints dominate; no payroll-specific complaint found |
| **GlossGenius** | Standard $24 annual / $28 monthly (2 users); Gold $48 / $56 (up to 9); Platinum $148 / $168 (unlimited); payroll add-on $40 ([Software Advice](https://www.softwareadvice.com/salon-spa/glossgenius-profile/), [Koalendar](https://koalendar.com/blog/gloss-genius-pricing)); price increase April 2026 ([CostBench](https://costbench.com/changelog/glossgenius-price-increase-2026-04/)) | Yes, Gold and above ("time tracking") | Customizable commissions only on Platinum; team goals & analytics | Yes | Built-in payroll add-on $40/mo "handles commissions, tips, and hourly pay" ([GetVMS summary](https://www.getvms.com/cutting-edge-nail-salon-management-software/)); no check/cash | English; Vietnamese **not found** | None specific found; export documentation **not found** |
| **Square Appointments** (+ Shifts / Payroll) | Free / Plus $29 / Premium $69 per location; commission tracking only on Premium ([CostBench](https://costbench.com/software/salon-spa/square-appointments/), [Koalendar](https://koalendar.com/blog/square-appointments-pricing)); Square Shifts free ≤5 team members, Shifts Plus $4 per team member after 30-day trial ([Square Shifts](https://squareup.com/us/en/staff/shifts/features)) | Yes: timecards via Square Team app / POS passcode; Shifts Plus adds clock-in prevention ([Square help 5742](https://squareup.com/help/us/en/article/5742)) | Yes: Team Sales report shows commission per item/service per team member; Shifts Plus adds commissions, tip pooling, labor vs. sales | Yes | Yes: timecards sync to Square Payroll or export to third-party payroll; "automatic tip and commission calculations, all wages are included in exports" ([Square Shifts](https://squareup.com/us/en/staff/shifts/features)); no check/cash | POS app multilingual; Vietnamese **not found** | Community: commission report lacks a tip column, so owners "cannot properly calculate how much to give to the service provider" ([Seller Community](https://sellercommunity.com/t5/Square-UK-Product-Updates/New-on-Square-Appointments-Additional-Commission-Reporting-Data/m-p/371727)); tips on employee sales report don't match paycheck since Feb 2021 ([Square Community](https://community.squareup.com/t5/Payments-Troubleshooting/Reports/m-p/254445)); commission computed $14.84 on $100 net at 20% ([Square Community](https://community.squareup.com/t5/Online-Store/Why-isn-t-square-calculating-commissions-correctly/m-p/260864/highlight/true)); tips calculated on retail + tax, not service ([Seller Community](https://sellercommunity.com/t5/Read-Only-Archive-Square/Feature-Request-Tips-on-services-only-with-Square-Appointments/idi-p/61493/page/3)) |
| **Mangomint** | Essentials $165 (≤10 pros) / Standard $245 (≤20) / Unlimited $375; add-ons Payroll Processing $50, Connect $75, Forms $50 ([PricingSaaS](https://pricingsaas.com/companies/mangomint)) | Yes: 4-digit PIN time clock, paid/unpaid task types for breaks ([Mangomint help](https://www.mangomint.com/learn/help-articles/staff-members/time-clock.md), [PIN setup](https://www.mangomint.com/learn/set-up-the-time-clock-and-assign-pins-to-staff.md)) | Yes: staff compensation with hourly + service/product commission and per-item overrides ([Staff compensation](https://www.mangomint.com/learn/help-articles/staff-members/staff-compensation.md)) | Yes | Full payroll processing incl. "greater of hourly or commission" ([Payroll processing](https://www.mangomint.com/features/payroll-processing.md)); no check/cash | English | Price is the complaint; no report-accuracy complaints found |
| **Boulevard** | Essentials $140 promo ($176 list) / Premier $234 / Prestige $328 per location; processing 2.45% + 15¢ ([CostBench](https://costbench.com/software/salon-spa/boulevard/)) | Yes (time clock listed) | Yes, "payroll, commission, and tip management" ([Capterra](https://www.capterra.com/p/180087/Boulevard/)) | Yes | Boulevard Payroll add-on; no check/cash | English | None found |
| **Zenoti** | Quote only; ~$300–400 single location; employee performance add-on ~$49 ([SchedulingKit](https://schedulingkit.com/pricing-guides/zenoti-pricing), [CostBench](https://costbench.com/software/salon-spa/zenoti/)) | Yes: employee PIN login ([Zenoti help](https://help.zenoti.com/en/appointments/onboard-and-set-up/essentials/configure-pin-login-for-your-employees.html)) | Yes: "Employee Payroll Details v2" report ([Zenoti help](https://help.zenoti.com/en/reports/employee/payroll/employee-payroll-details-v2-report.html)) | Yes, per-technician auto allocation ([Zenoti nail POS](https://www.zenoti.com/salon-management-software/nail-salon-pos)) | Report export; no check/cash | Multi-language (enterprise) | Enterprise complexity |
| **Meevo** | Promo Lite $129 / Essentials $229 / Premier $329 (regular $179 / $299 / $449), annual contracts, Aug 2026 ([Meevo pricing](https://www.meevo.com/pricing), [Software Advice](https://www.softwareadvice.com/retail/meevo-2-profile/)) | Yes | Yes, "handles complex commission structures" | Yes | Report export; no check/cash | English | Contract lock-in |
| **DaySmart Salon** (Salon Iris) | Basic $29 / Deluxe $69 / Deluxe Growth $149 / Premium $199 ([CostBench](https://costbench.com/software/salon-spa/daysmart-salon/)) | Yes | "Payroll & commissions" listed ([GetApp](https://www.getapp.com/retail-consumer-services-software/a/daysmart-salon-1/)) | Yes | Report export; no check/cash | English | Legacy desktop lineage |
| **Phorest** | Quote only; targets 3+ staff ([Capterra](https://capterra.com/p/113530/Phorest-Salon-Software/)) | Yes | "Payroll & commissions" | Yes | Report export | English | Opaque pricing |
| **Rosy** | Standard $29 (1 user) to $99 (21+); Premium $37 to $192; hidden costs ≈ +50% ([CostBench](https://costbench.com/software/salon-spa/rosy-salon/)) | Yes | "Commissions and Time Clock report" ([Rosy support](https://support.rosysalonsoftware.com/reports/commissions-and-time-clock-report)) | Yes | Report | English | — |
| **Timely** | Build $26 / Elevate $39 / Innovate $47 per staff ([CostBench](https://costbench.com/software/salon-spa/timely-salon/)); commission tracking on Innovate ([SchedulingKit](https://schedulingkit.com/pricing-guides/timely-pricing)) | Partial | Commission tracking (top tier) | Yes | Report | English | True cost ~70% above list |
| **Mindbody** | Starter $139 / Accelerate $289 / Ultimate $469 / Ultimate Plus $599 ([Pabau](https://pabau.com/blog/mindbody-pricing/)); Mindbody's own blog says from $99 ([Mindbody](https://www.mindbodyonline.com/business/education/blog/mindbody-pricing-united-states)); Booker plans renamed Feb 2026 ([CostBench](https://costbench.com/changelog/booker-mindbody-plans-renamed-2026-02/)) | Yes (Booker) | Payroll report in higher tiers | Yes | Report | English | "Monthly cost high" ([Capterra](https://www.capterra.com/p/40229/MINDBODY/pricing/)) |
| **Acuity** | Emerging $16 / Growing $27 / Powerhouse $49 annual; 1–36 staff ([SchedulingKit](https://schedulingkit.com/pricing-guides/acuity-scheduling-pricing)) | No | No | No | No | Multi-language booking page | Not a pay tool |
| **Setmore** | Free (4 staff logins) / Pro $12 per user / Team $9 per user ([CostBench](https://costbench.com/software/scheduling/setmore/)) | No | No | No | No | — | Not a pay tool |
| **Schedulicity** | Unlimited $34.99 solo; +$10 per provider up to 6 ($44.99–$84.99); 7+ providers $94.99; processing 2.5% + 15¢ ([Software Advice](https://www.softwareadvice.com/salon/schedulicity-profile/)) | No | No | Tips at checkout | No | English | Vagaro actively markets its payroll report against Schedulicity ([Vagaro Learn](https://www.vagaro.com/learn/7-vagaro-reports-for-schedulicity-users)) |
| **Salonized** | €19 / €35 / €55 per user — EU product ([Capterra](https://www.capterra.com/p/141697/Salonized/pricing/)) | No | Basic financial reports | — | No | Dutch/EU languages | Not US-relevant |
| **StyleSeat** | Free Basic; Premium $35; new-client commission fees ([Goldie vs StyleSeat](https://heygoldie.com/blog/best-styleseat-alternative)) | No | No (solo marketplace) | Yes (solo) | No | English | Hidden fees |
| **Goldie** | Free / Pro $19.99 / Pro Plus $39.99 ([Goldie](https://heygoldie.com/compare/goldie-vs-styleseat)) | No | No | — | No | English | Solo-focused |

**Takeaway for A.** Every general suite computes commission as a percent of a sale and, at best, keeps a separate hourly timesheet. None folds commission into the FLSA regular rate for overtime, none models a day-rate guarantee with a commission override, none does a minimum-wage top-up check, and none prints a bilingual pay statement. Fresha explicitly says its wage module is "best designed for team members who earn hourly." Square's commission export lacks a tip column. Vagaro's integrated payroll has the most severe public failure reports.

---

## B. Nail-salon-specific POS and turn-tracking systems

These are the products that actually sit on the front desk of Vietnamese-owned walk-in salons. They are sold through Vietnamese-language sales agents and payment-processing resellers, so public documentation is thin; pricing is often bundled with a merchant account.

| System | What it does | Price | Turns | Employee / technician reports | Commission, check/cash, payroll | Tips | Hours | Language |
|---|---|---|---|---|---|---|---|---|
| **Fastboy — Go Check In / Go POS** | QR-ticket check-in kiosk + cloud POS; owner app and technician app ([Capterra](https://www.capterra.com/p/1095600/Go-Checkin-POS/)) | Go POS Basic $50 (5 staff) / Standard $99 (15) / Advanced $149 (30); $200 one-time setup, 50% off with active Go Check In; $50/mo discount with Fastboy merchant account ([Fastboy store](https://fastboy.marketing/store/go-pos), [gocheckin.net/pricing](https://gocheckin.net/pricing/)); another listing shows $599 setup + $5–$199 monthly service tiers ([Fastboy store](https://fastboy.marketing/store/go-check-in-pos-us-canada)) | "Turn suggestion" to distribute walk-ins | "Staff income", "store income", "business snapshot", "staff rating", technician mobile app | "Payroll" and "print check" are Advanced-tier features; staff-income report is the de-facto check/cash worksheet **[verify]** | Yes (cash discount program also supported) | "Time keeping" feature listed | Vietnamese-owned vendor; VI sales/support, UI language **[verify]** |
| **NailSoft (Smart POS)** | All-in-one nail POS: bookings, payments, marketing; Owner App with commission and sales reports ([NailSoft](https://nailsoft.com/nailsoft/), [Smart POS](https://nailsoft.com/smart-pos/)) | Not public ("See Pricing"); a "Salon In The Box" hardware bundle at $2,000 is referenced; reseller partner program ([Partner](https://nailsoft.com/partner-program/)) | Turn tracking | Commission and sales reports in Owner App | "Payroll" listed; employee "lock in/out" | Yes | "Lock in/out" = clock in/out | VI-oriented vendor **[verify]** |
| **Zota POS (ZotaSalon, PayFirst Solutions)** | Nail-specific POS tied to Zota payment processing ([Zota salon POS](https://zotaservices.com/salon-pos/), [Google Play](https://play.google.com/store/apps/details?id=com.payfirstsolutions.pos&hl=en_US)) | Via sales agent; bundled with processing ([Zota](https://zota.us/pos/)) | "8 types of turn queue management", reward/subtract turns, locked or flexible turn jumps, turn amount by service | "Print-out for each order, daily clockout reports, online reporting for employees"; payroll reports "printed instantly with a button click" | Payroll "for salary, hourly, piece work, or commission employees"; check/cash split implied by "piece work" + print **[verify]** | Yes | Clock-out report implies clock in/out | EN/VI sales; UI **[verify]** |
| **Mango POS (mangoforsalon.com)** | Nail POS: booking, check-in, check-out, turn management, commission management, reports, Tech Portal ([Mango](https://mangoforsalon.com/client-staff-management/)) | $49/mo base, $149–$249 setup, 3-month minimum; plans $49–$299 ([Mango pricing](https://mangoforsalon.com/price/for-salon/), [Tilavon compare](https://tilavon.com/compare/mango-pos)) | "Dividing turns for technicians" | Tech Portal / Tech app: technician sees "summary of their daily work report and payroll details on their mobile device" ([Tech Portal](https://mangoforsalon.com/tech-portal/)) | "Calculate payroll, share tips"; payroll calculation and processing | Tip sharing | **Not found** | VI vendor (Enrich Co.) ([Enrich](https://enrichco.us/mangoforsalon/)) |
| **Tilavon** | Newer cloud nail POS: appointments, walk-in turn management, commission tracking, inventory, analytics; Helcim interchange-plus processing, no contracts ([G2](https://www.g2.com/products/tilavon/discuss)) | "Transparent pricing", figure **not found** | Walk-in turn management | Commission tracking, business analytics | Commission tracking | Yes | **Not found** | **English, Vietnamese, Spanish, Chinese** — explicitly cites ">50% of US salons Vietnamese-owned" |
| **iNailPOS** (iPad) | Complete iPad POS for nail/hair/barber ([App Store](https://apps.apple.com/us/app/inailpos/id693051128)) | App Store; IAP **[verify]** | Ticket/technician management | "Technician services and payroll reports" | Commission "60/40, custom, rent-booth, hourly wage" | Yes | Hourly wage option implies hours entry | EN |
| **ATSoft Nails 123 + Turns Tracker** | Windows nail POS plus a standalone/add-on app tracking "half and full turns" ([Turns Tracker](https://iphoneaddict.fr/apps/economie-entreprise/turns-tracker.html)) | **Not found** | Half/full turn counting | Technician services & payroll reports; 60/40 commission ([App Store ref](https://apps.apple.com/app/id716796570)) | 60/40 split | — | — | EN |
| **Smart Turn Tracker** (iPad) | Free turn-rotation app with dashboard, "fair turn rotation" ([App Store](https://apps.apple.com/us/app/-/id6758108238)) | Free | Yes | Minimal | No | No | No | EN |
| **NailSolutionPlus** | iPad POS: checkout, save tech tickets, calculate salary, manage turns, expenses ([App Store HK](https://apps.apple.com/hk/app/nailsolutionplus/id1257603698)) | **Not found** | Yes | Tech ticket log; salary calc | Salary calc | — | — | EN/VI **[verify]** |
| **iNails** / **NailsBook** / **TapNail** | Technician-side apps: iNails "cộng phiếu" (add up tickets) for Vietnamese techs abroad ([App Store VN](https://apps.apple.com/vn/app/inails/id1120989444)); NailsBook free daily/weekly/yearly income calc ([App Store](https://apps.apple.com/ml/app/nailsbook/id1118026510)); TapNail staff commission + bookkeeping ([App Store](https://apps.apple.com/app/id955122377)) | Free / low | No | Personal ticket tally | Personal | Personal | No | VI (iNails) |
| **PCNails** | Cloud nail POS with online booking, SMS, turn system ([SaaSBrowser](https://saasbrowser.com/saas/76188/pcnails)) | **Not found** | Yes | **Not found** | — | — | — | — |
| **POSNailStore** | Windows nail POS, clients/employees/appointments ([Capterra](https://www.capterra.com/p/135633/POSNailStore/)) | **Not found** | — | Employee mgmt | — | — | — | — |
| **MTPOS (Microtelecom)** | Nail POS with employee commissions, cash control, multi-location ([Microtelecom](https://www.microtelecom.com/pos/nail-salon)) | **Not found** | — | Commission | Commission | — | — | — |
| **RAVO POS** | "Integrated payments, effortless turn management, and payroll" ([RAVO](https://ravopos.com/pos-system/)) | Bundled with processing | Yes | Payroll | Payroll | — | — | — |
| **Clover nail-salon app** | Clover app with employee report and "daily report showing how much technicians make a day and their tips" ([GetVMS](https://www.getvms.com/cutting-edge-nail-salon-management-software/)); Clover hardware promos ([Clover](https://www.clover.com/pos-solutions/nail-salon)) | Clover plan + app | — | Daily technician report | — | Yes | — | EN |
| **Harbortouch Salon & Spa** | Generic salon POS; $39/mo software, $69/mo with hardware, long contracts ([Merchant Maverick](https://www.merchantmaverick.com/reviews/harbortouch-pos-review/), [TechRadar](https://www.techradar.com/reviews/harbortouch-point-of-sale-pos-review)) | $39–$69 | **No nail turn feature found** | Generic | Generic | Yes | — | EN |
| **Ring My Stylist** | Independent-stylist booking app, not a turn tracker ([App Store](https://apps.apple.com/us/app/ring-my-stylist-booking-app/id1250537446)) | Freemium | No | No | No | — | No | EN |
| **SalonTouch** | Salon/tanning management from $29.99; check-in/out and commission structures ([GetApp](https://www.getapp.sg/software/107121/salontouch)) | $29.99+ | No | Commission | Commission | — | — | EN |
| **Senza, Rekiin, Salon Agent, ePOS Nail, Nailshop POS, Tech Report, Beauty POS, TurnTrak, "Nail Turn"** | **Not found** as distinct products in US search results (Rekiin returns only salon names; "ePOS Nail" resolves to Epos Now's generic nail page ([Epos Now](https://www.eposnow.com/us/systems/retail-pos/nail-salon/)); "Tech Report" is a feature label, not a product) | — | — | — | — | — | — | — |

**Vietnamese-language search.** Queries for "phần mềm tiệm nail", "POS tiệm nail", "chia turn", "app tính lương thợ nail" surfaced (a) the US-market apps above (NailSolutionPlus, iNails, Go Check In) and (b) Vietnam-domestic salon software not used in the US (FPT Shop and MISA roundups, PosApp for iPad) ([FPT Shop](https://fptshop.com.vn/tin-tuc/danh-gia/phan-mem-quan-ly-tiem-nail-173218), [MISA](https://amis.misa.vn/236701/phan-mem-quan-ly-tiem-nails/), [PosApp](https://apps.apple.com/us/app/id1536075905)). The US Vietnamese-owned segment is reached through resellers (Fastboy, Zota, Mango/Enrich, NailSoft partner program, Rich Payment Solutions, Unison Payment) rather than through search, which matters for our go-to-market.

**Takeaway for B.** The nail-specific systems all treat the technician's "end-of-day report" as the primary artifact: tickets by technician, service totals, tips, turns, and a payroll figure, printed on a receipt printer. Zota's "daily clockout report" and Mango's Tech Portal are the closest analogues to our per-technician statement. None advertises overtime math, a regular-rate calculation, a minimum-wage check, an edit trail, or an exportable audit package; "payroll" in their vocabulary means "the split number to write on the check," not a wage-and-hour record.

---

## C. Export formats of the top-5 systems by nail-salon share

**Judgment on market share (evidence-based, not measured).** For walk-in Vietnamese-owned salons: Fastboy Go POS, Zota, Mango and NailSoft (processor-bundled). For appointment-led and younger owners: Vagaro, Square, Fresha, Booksy, GlossGenius. Zenoti's own buyer's guide ranks Vagaro, Square, GlossGenius, Fresha, Mangomint and "Zota POS (nail-specific for high-volume shops)" ([Zenoti guide](https://www.zenoti.com/thecheckin/best-nail-salon-pos-systems)). Mandatory three below plus Booksy and GlossGenius; nail-specific export docs do not exist publicly.

| System | Export location | Format | Documented fields / columns | Gaps for import |
|---|---|---|---|---|
| **Square** | Reports → Team Sales → click team member → Export ("team summary" and "team detail earnings") ([Square Community](https://community.squareup.com/t5/Staff-Payroll/Employee-commission-payroll-report/m-p/679377)); Reports → Item Sales → Export → Detail CSV; Transactions → Export → Items Detail CSV; Timecards → Labor Cost → Export → "Export Employee Shifts" ([Square Community](https://community.squareup.com/t5/Archived-Discussions-Read-Only/How-can-I-export-timecards/m-p/292401)); Custom Reports with add/remove columns ([Square Community](https://community.squareup.com/t5/Online-Store/How-do-I-export-a-report-to-a-CSV-file/m-p/137076)) | CSV | Items Detail CSV adds `Itemization Type` (Item vs Service), `Commission` ($), `Employee` (commission earner) ([Seller Community](https://sellercommunity.com/t5/Square-UK-Product-Updates/New-on-Square-Appointments-Additional-Commission-Reporting-Data/m-p/371727)); standard Square transaction CSV carries Date, Time, Gross Sales, Discounts, Net Sales, Tax, Tip, Transaction ID, Payment ID, Card Brand, Staff Name **[verify column spelling]**; Shifts CSV carries clock-in/out, break, hours, labor cost | **No tip column in commission data** (owner complaint); commission computed per item, not per ticket; cash tips only if keyed at checkout |
| **Vagaro** | Reports → Payroll Report (configurable pay types), Employee Sales, Time Card; all reports export to PDF or Excel ([Vagaro Learn](https://www.vagaro.com/en-au/learn/6-ways-gusto-and-vagaro-make-payroll-processing-easier), [7 reports](https://www.vagaro.com/learn/7-vagaro-reports-for-schedulicity-users)) | XLSX / PDF | Payroll report "supports regular hours, hourly rates, commission, overtime hours, and tips"; Gusto sync pushes hours from the payroll report ([Gusto](https://gusto.com/product/integrations/vagaro)); exact column headers **not retrievable (vagaro.com blocked) [verify]** | Overtime hours are a column, but the OT rate is hourly-only; commission is not blended into the regular rate; no cash/check split |
| **Fresha** | Reports → Team → Commission Activity (row per sale line) and Commission Summary (per member) with export; Reports → Team → Timesheets; Pay runs ([Fresha Academy](https://www.fresha.com/help-center/academy/pay-your-team/track-team-commissions/lessons/100275), [Pay runs](https://www.fresha.com/help-center/knowledge-base/team/101641-enable-pay-runs-and-set-your-pay-period)) | CSV/XLSX export button | Activity rows: date, team member, client, item, item type (service/product/membership), sale value, commission rate, commission amount **[verify exact headers]**; Summary: team member, total sales, total commission; Timesheets: shift date, clock in, clock out, breaks, hours, overtime hours, wage | Pay run can "record as manual"; no per-ticket cash flag; overtime only on the hourly wage |
| **Booksy** | Stats & Reports → Staff Commissions & Tips / Staff Performance → "export the full report file" ([Booksy](https://biz.booksy.com/en-us/features/stats-and-reports)) | XLS/CSV **[verify]** | Per staff: services, revenue, commission, tips **[verify]** | No hours; no time clock at all |
| **GlossGenius** | Team reports / payroll add-on; export documentation **not found** | — | — | Treat as import-by-screenshot or manual until docs are found |
| **Zota / Mango / Go POS (nail-specific)** | Printed end-of-day technician report; Zota "online reporting for employees"; Mango Tech Portal; Go POS "staff income" | Receipt print, in-app; CSV **not documented** | Ticket #, time, service, price, tech, tip, turn count, daily total, commission/payroll figure | No public CSV; plan for photo/OCR of the printed tech report or manual keying from the daily sheet |
| **Zenoti** (reference) | Employee Payroll Details v2 report ([Zenoti help](https://help.zenoti.com/en/reports/employee/payroll/employee-payroll-details-v2-report.html)) | XLSX/CSV | Enterprise-grade columns (hours, service commission, product commission, tips, deductions) **[verify]** | Rare in independent nail salons |

**Import design implication.** Build the importer around three canonical shapes: (1) Square Items Detail CSV (per line item with Employee + Commission), (2) Fresha Commission Activity export (per line item with team member + commission rate), (3) a generic "ticket sheet" (date, ticket, tech, service total, tip, cash/card) that covers Vagaro Employee Sales exports and manual entry from Zota/Mango/Go POS printouts. Confirm headers in a follow-up session once the proxy allows vendor help centers.

---

## D. Gap table: incumbents vs. our feature list

Legend: **Y** yes, **P** partial, **N** no / not found. Evidence is the source linked in A or B.

| Feature (ours) | Vagaro | Square (+Shifts) | Fresha | Booksy | GlossGenius | Mangomint | Zenoti | Zota | Mango POS | Go POS | NailSoft |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Shared-tablet PIN clock-in | P (time card, employee login) | Y (passcode timecards; Shifts Plus clock-in prevention) | Y (clock in/out; PIN not confirmed) | N | P (time tracking, method unknown) | Y (4-digit PIN) | Y (PIN login) | P ("daily clockout reports") | N found | P ("time keeping") | P ("lock in/out") |
| Photo on clock-in | N | N | N | N | N | N | N | N | N | N | N |
| Hours and breaks stored | Y | Y | Y (breaks, paid/unpaid) | N | P | Y (task types) | Y | P | N | P | P |
| Overtime using regular rate that includes commission (day-rate + commission) | N (OT hours column, hourly rate only) | N (hourly OT only) | N ("best for hourly") | N | N | P (greater-of hourly vs commission, not blended OT) | P (enterprise config) | N | N | N | N |
| Minimum-wage top-up check | N | N | N | N | N | N | N | N | N | N | N |
| Tips kept separate from wages in statement | P (tip report) | P (tips missing from commission export) | Y (in pay run) | P (combined report) | P | Y | Y | P (tip on printout) | P ("share tips") | P | P |
| Check vs cash split of technician pay | N | N | N | N | N | N | N | P (payroll "piece work", print per order) | P (Tech Portal payroll detail) | P ("print check", "staff income") | P ("payroll") |
| Bilingual EN/VI pay statement | N | N | N | N (app UI has VI, reports EN) | N | N | N | P (VI vendor; UI language unverified) | P | P | P |
| Audit binder (PDF + CSV, period locked) | N | N | N | N | N | N | P | N | N | N | N |
| Edit trail on tickets/time entries | P (admin logs) | P (timecard edit history) | P | N | N | P | Y (audit reports) | N | N | N | N |
| Payroll CSV export (Gusto/ADP/QuickBooks shape) | Y (Gusto, Excel) | Y (Payroll sync, CSV) | Y (export; pay run) | P (report file) | P (payroll add-on) | Y (built-in) | Y | N (print) | N | N | N |
| Monthly cost for a 6-tech salon | $25 + 5×$10 = $75 (+ payroll $50–64) | $69 + Shifts Plus 7×$4 = $97 | ~$78–$120 + 20% marketplace | $29.99 + 5×$20 = $130 | $56 (Gold) + $40 payroll = $96 | $165 + $50 = $215 | ~$300+ | bundled w/ processing | $49–$299 + setup | $99 (Standard) | not public |

**Reading the table.** The two rows where every incumbent scores N — regular-rate overtime on commission and minimum-wage top-up — are exactly the two violations DOL cites in nail-salon cases: a Manhattan salon paid "on a day rate while working 10 hours per day six days per week" and "failed to keep accurate and complete payroll records," producing $235,920 in back wages ([DOL 2016](https://www.dol.gov/newsroom/releases/whd/whd20160407-0), [HRCare](https://www.hrcare.com/article.aspx/80/2674/)); Massachusetts' Salem Nail Bar decision turns on the same facts ([Mass.gov](https://www.mass.gov/decision/salem-nail-bar-v-fair-labor-div-lb-22-0441-445-final-decision)). The regular rate is "total weekly earnings, including commissions… divided by total hours worked… commission has to be folded in before you multiply," which most payroll systems get wrong ([Salsa](https://www.salsa.dev/blog-post/the-overtime-calculation-most-payroll-systems-get-wrong)). That is the wedge.

---

## E. Pricing anchors

Monthly list prices as reported in 2026 sources; "6-tech" column is our estimate for one salon with an owner plus five technicians, software only, excluding card processing.

| Product | Entry price | Scale rule | Payroll / pay module | Est. 6-tech salon | Source |
|---|---|---|---|---|---|
| Square Appointments + Shifts | $0 | $29 Plus / $69 Premium per location; Shifts Plus $4 per member | Square Payroll separate | $69–$97 | [CostBench](https://costbench.com/software/salon-spa/square-appointments/), [Square](https://squareup.com/us/en/staff/shifts/features) |
| Fresha | $0 core | $12.95–$14.95 per bookable member | included; 20% new-client fee | $78–$90 | [CostBench](https://costbench.com/changelog/fresha-price-decrease-2026-02-3/) |
| Vagaro | $25 | +$10 per user | $20 + $6/emp or $34 + $5/emp | $75 (+$50–64 payroll) | [SchedulingKit](https://schedulingkit.com/pricing-guides/vagaro-pricing), [Koalendar](https://koalendar.com/blog/vagaro-pricing) |
| GlossGenius | $24–$28 | tiers by headcount: $56 Gold (≤9) | $40 add-on | $96 | [Software Advice](https://www.softwareadvice.com/salon-spa/glossgenius-profile/) |
| Booksy | $29.99 | +$20 per staff | none | $130 | [Koalendar](https://koalendar.com/blog/booksy-pricing) |
| Goldie | $0 / $19.99 / $39.99 | per plan | none | $39.99 | [Goldie](https://heygoldie.com/compare/goldie-vs-styleseat) |
| Schedulicity | $34.99 | +$10 per provider | none | $84.99 | [Software Advice](https://www.softwareadvice.com/salon/schedulicity-profile/) |
| Rosy | $29 | by user band; $69 for 5–10 | report only | $69 | [CostBench](https://costbench.com/software/salon-spa/rosy-salon/) |
| DaySmart Salon | $29 | $69 / $149 / $199 tiers | report | $69–$149 | [CostBench](https://costbench.com/software/salon-spa/daysmart-salon/) |
| Timely | $26–$47 per staff | per staff | report | $156–$282 | [CostBench](https://costbench.com/software/salon-spa/timely-salon/) |
| Meevo | $129 promo / $179 list | tiers | included | $129–$229 | [Meevo](https://www.meevo.com/pricing) |
| Mindbody | $99–$139 | tiers to $599 | report | $139–$289 | [Pabau](https://pabau.com/blog/mindbody-pricing/) |
| Boulevard | $140 promo / $176 list | per location to $328 | add-on | $140–$234 | [CostBench](https://costbench.com/software/salon-spa/boulevard/) |
| Mangomint | $165 | $245 / $375 | $50 add-on | $215 | [PricingSaaS](https://pricingsaas.com/companies/mangomint) |
| Zenoti | ~$300 | quote | included | $300–$400 | [SchedulingKit](https://schedulingkit.com/pricing-guides/zenoti-pricing) |
| Go POS (Fastboy) | $50 (5 staff) | $99 (15) / $149 (30) + $200 setup | included (Advanced) | $99 | [Fastboy](https://fastboy.marketing/store/go-pos) |
| Mango POS | $49 | to $299 + $149–$249 setup, 3-mo min | included | $49–$99 | [Mango](https://mangoforsalon.com/price/for-salon/) |
| Zota POS | bundled | with processing via agent | included | opaque | [Zota](https://zotaservices.com/salon-pos/) |
| NailSoft | not public | hardware bundle $2,000 | included | opaque | [NailSoft](https://nailsoft.com/smart-pos/) |
| Simple Salon (AU) | $21.99 | $56.99 (2–3) / $113.99 | report | $113.99 | [Capterra](https://www.capterra.com/p/124998/Simple-Salon/) |
| Harbortouch Salon | $39 | $69 with hardware | none | $39–$69 | [Merchant Maverick](https://www.merchantmaverick.com/reviews/harbortouch-pos-review/) |
| Acuity / Setmore | $16 / $0 | per plan or per user | none | $27–$54 | [SchedulingKit](https://schedulingkit.com/pricing-guides/acuity-scheduling-pricing), [CostBench](https://costbench.com/software/scheduling/setmore/) |

**Positioning a flat $49/salon.** $49 sits at the Mango POS entry price and below Go POS Basic, under the Vagaro-plus-payroll stack ($125–$139 for six people), and at roughly half of GlossGenius Gold + payroll. It is a flat, headcount-independent number in a market where every general suite scales per user ($10–$20 per technician) and every nail-specific vendor hides price behind a processing contract. The honest comparison line is: "the payroll add-on alone costs $40–$64 at Vagaro, GlossGenius or Mangomint, and still does not do overtime on commission."

---

## F. What to copy, what to avoid

Patterns observed across the systems above, chosen for a shared-tablet, bilingual, pay-records product.

**Copy**

1. **4-digit PIN pad as the only staff entry point** (Mangomint, Zenoti, Square passcode). Big keys, no username, instant feedback; add our camera capture on the same screen so the photo is a side effect, not a step.
2. **QR / numbered ticket per client** (Go Check In). A ticket number printed or displayed at check-in becomes the join key between the service log and the pay record; we log tickets, not appointments.
3. **End-of-day technician report on one receipt-width page** (Zota "daily clockout report", Mango Tech Portal, Clover daily report). Order: tickets in time order → service total → tips (cash/card) → turns → hours → pay. Our weekly statement should look like a stack of these.
4. **Technician-facing mirror of the owner's numbers** (Mango Tech app, Zota online employee reporting, Go POS technician app). Letting a tech see the same ticket list on their phone kills the "you shorted me" argument; make it read-only and bilingual.
5. **Half/full turn counting** (ATSoft Turns Tracker, Zota turn amounts by service). Even though we don't assign turns, record the turn weight on each ticket so owners can reconcile against their turn board.
6. **Pay-run as a locked period with a visible status** (Fresha pay runs: open → reviewed → paid, "record as manual"). Our weekly record should lock on approval and show who approved it.
7. **"Greater of hourly or commission" as a named rule** (Mangomint payroll). Expose our rule set in plain words: "day rate $X or Y% of services, whichever is higher, then overtime on the blended regular rate, then minimum-wage check."
8. **Paid/unpaid break task types** (Mangomint time clock). One toggle per break; feeds hours-worked correctly.
9. **Row-per-sale commission activity export** (Fresha Commission Activity). Our CSV should have one row per ticket line with tech, service, amount, commission rate, commission, tip, tender type.
10. **Export button on every report, CSV first** (Square custom reports). Owners already know "Export → CSV"; don't make them learn a new verb.

**Avoid**

11. **Commission report without a tip column** (Square Team Sales). Owners end up reconciling tips by hand; tips must be on the same row, flagged cash vs card.
12. **Per-user pricing** ($10–$20 per technician at Vagaro, Booksy, Timely). Salon headcount fluctuates weekly; flat per-salon pricing removes the incentive to leave techs off the system, which is itself a record-keeping violation.
13. **Payroll bolted onto a booking suite that fails silently** (Vagaro reviews: "it still does not work", payroll "did not process after submitted"). We do not move money; we produce a record and a CSV, and we say so.
14. **Hourly-only wage logic hidden behind a timesheet feature** (Fresha "best designed for team members who earn hourly"). Never let a day-rate or commission tech appear as "$0.00 wages" because they have no hourly rate.
15. **Processor-bundled, agent-quoted pricing with multi-year contracts** (Zota, Harbortouch, NailSoft bundles). Publish the price; no setup fee; cancel any time. This is the single easiest trust win against the nail-specific vendors.
16. **English-only reports in a Vietnamese-speaking shop.** Booksy localizes the app UI but not reports; Tilavon is the only product found that names Vietnamese explicitly. Statement, edit-trail labels and the clock-in screen all need VI strings from day one.
17. **Unlocked, editable history with no trail** (nail-specific POS printouts). Every edit to a ticket or punch needs who/when/old/new, because the printed tech sheet is what the salon is asked to produce in an audit.

---

## Open items for a follow-up session

- Confirm exact export column headers for Square Items Detail CSV, Vagaro Payroll Report XLSX, Fresha Commission Activity CSV, Booksy Staff Commissions & Tips export (vendor help centers were blocked).
- Confirm UI language options (Vietnamese) for Go POS, Zota, Mango, NailSoft, Booksy Biz.
- Obtain a sample Zota "daily clockout report" and Mango Tech Portal screenshot for the statement layout.
- Verify GlossGenius report export options and whether time tracking is PIN-based.
- Verify Square Payroll 2026 base + per-employee fee and Square Appointments language list.

---

## Sources

All accessed 2026-10-07 via search-engine result summaries (direct page reads were blocked by the session proxy).

**General suites — pricing and features**
- https://schedulingkit.com/pricing-guides/vagaro-pricing
- https://koalendar.com/blog/vagaro-pricing
- https://costbench.com/changelog/vagaro-plan-added-2026-02/
- https://www.vagaro.com/en-au/learn/6-ways-gusto-and-vagaro-make-payroll-processing-easier
- https://www.vagaro.com/learn/7-vagaro-reports-for-schedulicity-users
- https://gusto.com/product/integrations/vagaro
- https://www.capterra.com/p/153752/Vagaro/reviews/?page=13
- https://schedulingkit.com/pros-and-cons/vagaro-pros-and-cons
- https://costbench.com/changelog/fresha-price-decrease-2026-02-3/
- https://pricingsaas.com/companies/fresha
- https://pabau.com/blog/fresha-pricing/
- https://www.fresha.com/help-center/academy/pay-your-team/track-team-commissions/lessons/100275
- https://www.fresha.com/help-center/knowledge-base/team/98-set-up-commissions-for-team-members
- https://www.fresha.com/help-center/academy/pay-your-team/track-team-working-hours/lessons/100279
- https://www.fresha.com/help-center/knowledge-base/team/291-set-up-wages-for-team-members
- https://www.fresha.com/help-center/knowledge-base/team/300-complete-a-pay-run
- https://www.fresha.com/help-center/knowledge-base/team/101641-enable-pay-runs-and-set-your-pay-period
- https://www.capterra.com/p/142138/Shedul-com/reviews/?page=2
- https://koalendar.com/blog/booksy-pricing
- https://pabau.com/blog/booksy-pricing/
- https://biz.booksy.com/en-us/features/stats-and-reports
- https://alternativeto.net/software/booksy/about
- https://www.softwareadvice.com/salon-spa/glossgenius-profile/
- https://koalendar.com/blog/gloss-genius-pricing
- https://costbench.com/changelog/glossgenius-price-increase-2026-04/
- https://www.getvms.com/cutting-edge-nail-salon-management-software/
- https://costbench.com/software/salon-spa/square-appointments/
- https://koalendar.com/blog/square-appointments-pricing
- https://squareup.com/us/en/staff/shifts/features
- https://squareup.com/help/us/en/article/5742
- https://sellercommunity.com/t5/Square-UK-Product-Updates/New-on-Square-Appointments-Additional-Commission-Reporting-Data/m-p/371727
- https://community.squareup.com/t5/Staff-Payroll/Employee-commission-payroll-report/m-p/679377
- https://community.squareup.com/t5/Archived-Discussions-Read-Only/How-can-I-export-timecards/m-p/292401
- https://community.squareup.com/t5/Online-Store/How-do-I-export-a-report-to-a-CSV-file/m-p/137076
- https://community.squareup.com/t5/Payments-Troubleshooting/Reports/m-p/254445
- https://community.squareup.com/t5/Online-Store/Why-isn-t-square-calculating-commissions-correctly/m-p/260864/highlight/true
- https://sellercommunity.com/t5/Read-Only-Archive-Square/Feature-Request-Tips-on-services-only-with-Square-Appointments/idi-p/61493/page/3
- https://pricingsaas.com/companies/mangomint
- https://www.mangomint.com/learn/help-articles/staff-members/time-clock.md
- https://www.mangomint.com/learn/set-up-the-time-clock-and-assign-pins-to-staff.md
- https://www.mangomint.com/learn/help-articles/staff-members/staff-compensation.md
- https://www.mangomint.com/features/payroll-processing.md
- https://costbench.com/software/salon-spa/boulevard/
- https://www.capterra.com/p/180087/Boulevard/
- https://schedulingkit.com/pricing-guides/zenoti-pricing
- https://costbench.com/software/salon-spa/zenoti/
- https://help.zenoti.com/en/appointments/onboard-and-set-up/essentials/configure-pin-login-for-your-employees.html
- https://help.zenoti.com/en/reports/employee/payroll/employee-payroll-details-v2-report.html
- https://www.zenoti.com/salon-management-software/nail-salon-pos
- https://www.zenoti.com/thecheckin/best-nail-salon-pos-systems
- https://www.meevo.com/pricing
- https://www.softwareadvice.com/retail/meevo-2-profile/
- https://costbench.com/software/salon-spa/daysmart-salon/
- https://www.getapp.com/retail-consumer-services-software/a/daysmart-salon-1/
- https://capterra.com/p/113530/Phorest-Salon-Software/
- https://costbench.com/software/salon-spa/rosy-salon/
- https://support.rosysalonsoftware.com/reports/commissions-and-time-clock-report
- https://costbench.com/software/salon-spa/timely-salon/
- https://schedulingkit.com/pricing-guides/timely-pricing
- https://pabau.com/blog/mindbody-pricing/
- https://www.mindbodyonline.com/business/education/blog/mindbody-pricing-united-states
- https://costbench.com/changelog/booker-mindbody-plans-renamed-2026-02/
- https://www.capterra.com/p/40229/MINDBODY/pricing/
- https://schedulingkit.com/pricing-guides/acuity-scheduling-pricing
- https://costbench.com/software/scheduling/setmore/
- https://www.softwareadvice.com/salon/schedulicity-profile/
- https://www.capterra.com/p/141697/Salonized/pricing/
- https://heygoldie.com/blog/best-styleseat-alternative
- https://heygoldie.com/compare/goldie-vs-styleseat
- https://www.capterra.com/p/124998/Simple-Salon/
- https://www.merchantmaverick.com/reviews/harbortouch-pos-review/
- https://www.techradar.com/reviews/harbortouch-point-of-sale-pos-review

**Nail-specific systems**
- https://www.capterra.com/p/1095600/Go-Checkin-POS/
- https://fastboy.marketing/store/go-pos
- https://fastboy.marketing/store/go-check-in-pos-us-canada
- https://gocheckin.net/pricing/
- https://en.fastboy.com/go-pos/
- https://nailsoft.com/nailsoft/
- https://nailsoft.com/smart-pos/
- https://nailsoft.com/partner-program/
- https://zotaservices.com/salon-pos/
- https://zota.us/pos/
- https://play.google.com/store/apps/details?id=com.payfirstsolutions.pos&hl=en_US
- https://mangoforsalon.com/price/for-salon/
- https://mangoforsalon.com/tech-portal/
- https://mangoforsalon.com/client-staff-management/
- https://enrichco.us/mangoforsalon/
- https://tilavon.com/compare/mango-pos
- https://www.g2.com/products/tilavon/discuss
- https://apps.apple.com/us/app/inailpos/id693051128
- https://apps.apple.com/app/id716796570
- https://iphoneaddict.fr/apps/economie-entreprise/turns-tracker.html
- https://apps.apple.com/us/app/-/id6758108238
- https://apps.apple.com/hk/app/nailsolutionplus/id1257603698
- https://apps.apple.com/vn/app/inails/id1120989444
- https://apps.apple.com/ml/app/nailsbook/id1118026510
- https://apps.apple.com/app/id955122377
- https://saasbrowser.com/saas/76188/pcnails
- https://www.capterra.com/p/135633/POSNailStore/
- https://www.microtelecom.com/pos/nail-salon
- https://ravopos.com/pos-system/
- https://www.clover.com/pos-solutions/nail-salon
- https://richpaymentsolutions.com/point-of-sale-system-for-nail-salon-tip-payroll/
- https://salonpossystem.com/blog/nail-salon-pos-system-guide.html
- https://kwickos.com/blog/best-all-in-one-pos-system-nail-salon.html
- https://apps.apple.com/us/app/ring-my-stylist-booking-app/id1250537446
- https://www.getapp.sg/software/107121/salontouch
- https://www.eposnow.com/us/systems/retail-pos/nail-salon/
- https://fptshop.com.vn/tin-tuc/danh-gia/phan-mem-quan-ly-tiem-nail-173218
- https://amis.misa.vn/236701/phan-mem-quan-ly-tiem-nails/
- https://apps.apple.com/us/app/id1536075905

**Compliance context**
- https://www.dol.gov/newsroom/releases/whd/whd20160407-0
- https://www.hrcare.com/article.aspx/80/2674/
- https://www.mass.gov/decision/salem-nail-bar-v-fair-labor-div-lb-22-0441-445-final-decision
- https://www.salsa.dev/blog-post/the-overtime-calculation-most-payroll-systems-get-wrong
- https://mirelleinspo.com/trend-reports/nail-salon-commission-splits-benchmarked
