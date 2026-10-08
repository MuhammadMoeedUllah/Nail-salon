# 08 — Verification Pass: Export Headers, Vietnamese UI, Prices, Kiosk UX, Payroll Imports

*Verification date: 2026-10-07. This pass re-checks the items tagged [verify], [unverified] or "not found" in `02-incumbent-software-landscape.md` and `03-timeclock-payroll-tools-and-file-formats.md`.*

> **Method.** Vendor help centers (squareup.com, community.squareup.com, support.vagaro.com, fresha.com, glossgenius.elevio.help, support.gusto.com, joinhomebase.com, trestlefinance.com) remain blocked by the sandbox egress proxy, so no vendor page was read directly. Facts come from (a) extended search-engine summaries of the linked vendor page, (b) GitHub code search and raw.githubusercontent.com reads, which *do* work, and which gave verbatim header rows for Square. The shared WebSearch budget ran out before Booksy/Reddit and Square Payroll pricing could be re-queried. Confidence: **High** = verbatim file or vendor page quoted; **Medium** = vendor page summarised by search, labels may differ in the file; **Low** = third-party only or inferred.

---

## 1. Export column headers

### 1.1 Confirmed verbatim (High)

| Claim (prior pass) | Finding | URL | Conf. |
|---|---|---|---|
| Square **Items Detail CSV** has `Itemization Type`, `Commission`, `Employee` | **Confirmed, full header row (35 columns, exports dated July–Aug 2026):** `Date,Time,Time Zone,Category,Item,Qty,Price Point Name,SKU,Modifiers Applied,Gross Sales,Discounts,Net Sales,Tax,Transaction ID,Payment ID,Device Name,Notes,Details,Event Type,Location,Dining Option,Customer ID,Customer Name,Customer Reference ID,Unit,Count,GTIN,Itemization Type,Commission,Employee,Fulfillment Note,Channel,Token,Card Brand,PAN Suffix`. Values seen: `Date` = `2026-07-18`, `Time` = `12:59:30`, `Time Zone` = `Eastern Time (US & Canada)`, money as `$8.00`, `Qty` = `1.0`, `Itemization Type` ∈ {`Physical Good`, `Custom Amount`} (Appointments sellers get `Service`), `Commission` = `$0.00` when no commission rule, `Employee` blank when unassigned. Older 2025 files have 33 columns (no `GTIN`, no `Commission`/`Employee`); a 2024 variant has only 21. **No tip column at item level.** | [sample 2026 CSV](https://github.com/zoetankersley/sunrise_social_club/blob/main/data/raw/items-2026-07-18-2026-07-19.csv) · [2025 sample](https://github.com/socrtwo/Schola/blob/main/samples/items-sample.csv) · [Square product update](https://community.squareup.com/t5/Product-Updates/New-on-Square-Appointments-Additional-Commission-Reporting-Data/ba-p/370315) | High |
| Square **Transactions CSV** carries `Staff Name`, `Tip`, `Gross Sales` | **Confirmed, 55-column header (verbatim dashboard order):** `Date,Time,Time Zone,Gross Sales,Discounts,Service Charges,Net Sales,Gift Card Sales,Tax,Tip,Partial Refunds,Total Collected,Source,Card,Card Entry Methods,Cash,Square Gift Card,Other Tender,Other Tender Type,Tender Note,Fees,Net Total,Transaction ID,Payment ID,Card Brand,PAN Suffix,Device Name,Staff Name,Staff ID,Details,Description,Event Type,Location,Dining Option,Customer ID,Customer Name,Customer Reference ID,Device Nickname,Third Party Fees,Deposit ID,Deposit Date,Deposit Details,Fee Percentage Rate,Fee Fixed Rate,Refund Reason,Discount Name,Transaction Status,Cash App,Order Reference ID,Fulfillment Note,Free Processing Applied,Channel,Unattributed Tips,Table Info,International Fee`. Note `Tender Note` (not `Other Tender Note`), `Card`/`Cash` are *amount* columns, `Source` ∈ {`Point of Sale`, `Virtual Terminal`, …}, `Card Entry Methods` ∈ {`Keyed`, `N/A`, …}, `Transaction Status` = `Complete`. 2018 files were 44 columns, so sniff by name not position. | [jarvis export.py](https://github.com/aditya2kx/jarvis/blob/main/skills/square_api/export.py) · [2025 sample](https://github.com/socrtwo/Schola/blob/main/samples/transactions-sample.csv) · [2018 sample](https://github.com/rwslippey/square_transaction_parser/blob/master/square_example.csv) | High |

### 1.2 Field names confirmed from vendor documentation, file spelling not verified (Medium)

| Export | Finding | URL | Conf. |
|---|---|---|---|
| **Vagaro Employee Sales** | Per-employee *summary* (one row per provider, not per ticket). Fields: `Service Provider`, `Appts`, `Unique Customers`, `Customer Visits`, `Services`, `Services Sales`, `Services Add-Ons`, `Service Add-On Sales`, `Classes`, `Class Sales`, `Class Add-On Sales`, `Products`, `Product Sales`, `Avg Product Qty Sold Per Visit`, `Avg Product Sales Per Visit`, `Memberships`, `Membership Sales`, `Gift Cards`, `Gift Card Sales`, `Packages`, `Package Sales`, `Tips`. Export PDF/Excel. Note the plural **"Services Sales"**. | [Run the Employee Sales Report](https://support.vagaro.com/hc/en-us/articles/360000409134-Run-the-Employee-Sales-Report) | Medium |
| **Vagaro Payroll Report / Payroll History** | Payroll report rows: `Hourly Rate`, `Hours Worked`, `OT Hourly Rate`, `OT Hours Worked`, gross sales, commission earned, final column `Payroll Due` (not "Total Pay"). Payroll History adds `Hourly Pay`, `OT Pay`, `Tips` (Vagaro Payroll only). Excel/PDF; History export web only. A "missed checkout" pop-up warns before the report runs. | [Run a Payroll Report](https://support.vagaro.com/hc/en-us/articles/360018855214-Run-a-Payroll-Report) · [Payroll History](https://support.vagaro.com/hc/en-us/articles/115003990314-Payroll-History-Report) | Medium |
| **Vagaro Transaction List** | On web the first column is a *combined* cell `Checkout Date / Checkout By / Transaction ID`; other columns `Tip`, `Discount`, `Amount Paid` (after tax/discount, incl. tips), `Sales Tax`, payment type. Vagaro abbreviates in other reports (`Qty`, `Disc`, `Amt Paid`, `GC`, `Pkg`, `Mbsp`). Phone version labels the date `Transaction Date`. `Checkout By` ≠ `Sold By`. | [Transaction List Report](https://support.vagaro.com/hc/en-us/articles/204347940-Transaction-List-Report) · [Sales Trends](https://support.vagaro.com/hc/en-us/articles/360000505354-Sales-Trends-Report) | Medium |
| **Vagaro Time Card Report** | Entry date, employee name, role, clock-in/clock-out pair, `Total Hours`, comments; filter "Show Only Missing Entry"; **no break column**. Excel/PDF (web). | [Run the Time Card Report](https://support.vagaro.com/hc/en-us/articles/28615617772315-Run-the-Time-Card-Report) | Medium |
| **Fresha Commission summary** | On-screen columns captured in a 2026-09 sandbox: `Sales qty`, `Items sold`, `Gross sales`, `Refunds`, `Tax`, `Discounts`, `Costs`, `Commission base`, `Commission`, `% Commission`; grouped by team member / location / item; filters Team member, Location, Type, Service category, Item; export CSV / Excel / PDF. Column customisation (`Columns 8 of 25`) needs the Insights add-on. Reports show "Data from N mins ago" (not real-time). | [fresha-research commission.md](https://raw.githubusercontent.com/naingaunglinn/fresha-research/main/module-research/commission.md) · [Fresha glossary](https://www.fresha.com/help-center/knowledge-base/reports/270-reports-and-insights-glossary) | Medium |
| **Fresha Commission activity** | Still **not confirmed**: glossary says "Full list of all sales with commissions payable"; nobody has published the header. Data-connector `Commissions` table has `Commission ID`, `Sale ID`, `Sale item ID` plus links to team member/location/client. Treat as sniff-and-map. | [Data connector tables](https://www.fresha.com/help-center/knowledge-base/reports/101429-data-connector-tables) | Low |
| **Fresha Timesheets** | Timesheet list columns observed: member + location, date, clock in / out, breaks, hours worked, status (`Clocked out`); detail shows *Expected vs actual*; Activity tab logs edits. Pay-run breakdown: "Wages (hourly rate, regular/overtime hours), Commissions (Service, add-ons, Product, Gift card…)". Export header not published. | [fresha-research research-log.md](https://raw.githubusercontent.com/naingaunglinn/fresha-research/main/research-log.md) · [Manage team timesheets](https://www.fresha.com/help-center/knowledge-base/team/585-manage-team-timesheets) | Medium-Low |
| **GlossGenius Commission Earnings** (N/O/P claim) | Claim **corrected**. *Summary-level* report: column **E** service/product price, **I** discounts, **N** tips, **O** commission computed on the *Total Price* basis, **P** commission computed on the *Net Sales* basis (O and P are commission amounts, not raw sales). *Detail-level* report: columns `Date`, `Provider`, `Charge ID`, … with **G** price, **K** discounts, **J** processing fees. Report is emailed; newer article says web download is also available (older article said Commission Earnings was the one report *not* downloadable on web). | [Manual commission calc](https://glossgenius.elevio.help/en/articles/124-commission-earnings-report) · [Detail level](https://glossgenius.elevio.help/en/articles/1111-the-detail-level-commission-earnings-report) · [Summary level](https://glossgenius.elevio.help/en/articles/1110-the-summary-level-commission-earnings-report) | Medium |
| **Mangomint Payroll report** | Columns: `Hours`, `Blocked`, `Hourly Comp`, `Services` (count), `Service Comp`, `Product Comp`, `Tips`, `Pay Adjustments`; optional `Service Sales`, `Product Sales` ("Include sales totals"); "Include detailed view" adds day-by-day rows. Download **PDF or Excel only — no CSV**; Excel may carry extra columns. Payroll sync is to QuickBooks, no Gusto/ADP export found. Archived staff vanish from the report. | [Using the Payroll Report](https://www.mangomint.com/learn/payroll-report/) · [QuickBooks payroll sync](https://www.mangomint.com/learn/setting-up-the-quickbooks-payroll-sync/) | Medium |
| **Boulevard "Staff sales"** | No report of that name. **Staff Service Sales** default columns: service count, service net amount, service sales tax, service discount, service sale amount, net amount per appointment; credited to performer, not cashier. **Staff Retail Sales**: appointment count, retail qty, retail sale amount, retail discount, retail refund. **Order Line Items** and **Commission Line Items** reports export CSV/Excel. | [Staff Service Sales](https://support.boulevard.io/en/articles/16500404-staff-service-sales-report) · [Order Line Items](https://support.boulevard.io/en/articles/15591112-order-line-items-report) · [Commission Line Items](https://support.boulevard.io/en/articles/15591140-commission-line-items-report) | Medium |
| **Zenoti Employee Sales** | v2 report: `Employee Name` (group-by), `Sales (excl. Tax)`…; per-employee `Service Sales`/`Product Sales` live in Employee KPI v2; tips in Tips report v2 / Salon Summary; `Invoice` number in Employee Payroll Details v2. Export to Excel/CSV; >150k rows or >1 year goes by email. | [Employee Sales v2](https://help.zenoti.com/en/reports/employee/sales/employee-sales-report--v2-.html) · [Report features](https://help.zenoti.com/en/reports/report-features.html) | Low-Med |

### 1.3 Not confirmed

| Export | Finding | URL | Conf. |
|---|---|---|---|
| **Square Shifts / timecards CSV** | Path confirmed: Shifts → Time tracking → Timecards → team member → Export → **Export shifts** (per team member). Older label "Export Employee Shifts" under Labor Cost. On-screen fields: total hours, paid hours, breaks, notes, labor cost, declared cash tips, pooled tips. **Header row not published**; a community post reports the `Date` cells export in an unusable format. Labor API `SearchTimecards` is the programmatic route. | [Timecard reporting](https://squareup.com/help/us/en/article/6140-employee-timecard-reporting) · [date format thread](https://community.squareup.com/t5/Using-Square/csv-reports-date-format-problem/m-p/747030) | Low |
| **Booksy Staff Commissions & Tips / Key reports** | Still no column names. Web/tablet Reports → Download; Profile → Stats & Reports → "Get key reports" emails an Excel workbook. Owners/Managers only. | [How do I download reports](https://support.booksy.com/hc/en-us/articles/16487921910290-How-do-I-download-reports-from-Booksy) | Low |
| **Clover Employees export** | No official per-employee CSV documented. Sales Report → filter Employees → Export CSV (Gross Sales, Discounts, Refunds, Net Sales, Tips, Service Charges…); on-device Reporting app has "Employee Sales" (Condensed/Full, print). Community: cannot select multiple employees at once. | [Item Sales report](https://www.clover.com/en-US/help/run-or-request-the-item-sales-report) · [community idea](https://community.clover.com/idea/61724/sales-overview-report-by-employee.html) | Low |
| **Nail-specific POS** | Go POS: "Staff Income" on all tiers, "Payroll" and "Time Keeping" Advanced only, no export documented. Zota: "Pick Date – Select Employee – Print Report", offline print only, online reporting is a monthly add-on; no Excel. Mango: Tech Portal shows payroll on phone; no export documented. NailSoft: none. **Tilavon**: "full data export … in CSV", claims payroll export to QuickBooks/Paychex/ADP/Gusto. **Supaday**: "export CSV files for payroll", per-tech earnings view. Senza: no such product found. | [Go POS](https://fastboy.marketing/store/go-pos) · [Zota](https://zotaservices.com/salon-pos/) · [Tilavon security](https://tilavon.com/security) · [Supaday](https://supaday.app/nail-salon-software) | Low |

---

## 2. Vietnamese UI in nail-specific POS

| Product | Finding | URL | Conf. |
|---|---|---|---|
| Go POS / Fastboy | App Store "Go_POS" lists **Languages: English**; Go POS 3.0 support page lists "Multiple Language" without naming them; GoCheckin (customer app) and Fastboy Client listings include Tiếng Việt in localisations; Fastboy support in EN/VI. **UI language: unverified, likely EN with VI support staff.** | [Go_POS listing](https://apps.apple.com/za/app/go-pos/id1542133694) · [Go POS 3.0](https://support.gocheckin.net/all-topic/go-pos-30) | Low |
| Zota (PayFirst) | Amazon Appstore listing: **English only**; an APK mirror lists "Việt Nam" among 72 languages; Zota's own VI page says "giao diện dễ sử dụng cho người Việt"; Zenoti's buyer guide: "Vietnamese-language support but stop at the register". **Likely bilingual register; unverified.** | [Amazon listing](https://www.amazon.com/PayFirst-Solutions-Zota-POS-ZotaSalon/dp/B08NWFRXQG) · [Zota VI page](https://zotaservices.com/pos-danh-cho-tiem-nails/) | Low |
| Mango POS (Enrich) | "Mango Manage" App Store: English only; help.mangoforsalon.com offers EN and VI; Tilavon's comparison contradicts itself. **Unverified.** | [Mango Manage](https://apps.apple.com/us/app/mango-manage/id1536716643) · [help center](https://help.mangoforsalon.com/en/) | Low |
| NailSoft | App Store: English; sales line "English & Vietnamese"; Vietnamese marketing page describes tech/owner app. **Unverified.** | [NailSoft POS](https://apps.apple.com/us/app/nailsoft-pos/id1482751296) | Low |
| Tilavon | **EN / VI / ES / ZH on every screen** incl. POS checkout, owner dashboard, employee app; vendor claim. | [tilavon.com](https://tilavon.com/) | Medium |
| Supaday | No Vietnamese mentioned anywhere. | [supaday.app](https://supaday.app/nail-salon-software) | Medium (negative) |
| ABTurns | No language info; site structured data shows price `99 USD` (period unstated). | [abturns.com](https://www.abturns.com/) | Low |
| Bilingual technician report | **None confirmed.** SICUS (marketing) claims reports "fully translated into Vietnamese"; Ravo app EN/VI; TranPOS "multi-language". No vendor shows a printed EN+VI tech sheet. Our bilingual statement remains a differentiator. | [SICUS](https://www.sicusmedia.com/vietnamese-salon-software.html) · [Ravo](https://ravopos.com/) · [TranPOS](http://tranpos.com/Home.html) | Low |

---

## 3. List prices, October 2026 (USD/month)

| Product | Finding | URL | Conf. |
|---|---|---|---|
| Homebase | Basic $0 (1 location); Essentials **$30** monthly / $24 annual; Plus **$70** / $56; All-in-One **$120** / $96 per location; payroll add-on ≈ $39 + $6/employee. Prior $20/$48/$80 figures were stale. | [CostBench](https://costbench.com/software/employee-scheduling/homebase/) · [Capterra](https://www.capterra.com/p/153076/Homebase/) | Medium |
| When I Work | Essentials $2.50, Pro $5, Premium $8 per user; time & attendance add-on $1.50 (Essentials) / $2 (Pro, Premium). Verified against pricing page 2026-09-26 by KitFinch. | [kitfinch](https://kitfinch.com/tools/wheniwork) · [workstream](https://www.workstream.us/blog/when-i-work-pricing) | Medium |
| Deputy | Plans renamed: **Lite $5, Core $6.50, Pro $9** per user; **$30 minimum monthly spend** from 2025-09-01; 31-day trial. Free "Starter" plan **not found** on 2026 page. | [deputy.com/pricing](https://www.deputy.com/pricing) | Medium-High |
| Connecteam | Small Business free ≤10 users; Basic $29 annual / $35 monthly; Advanced $49 / $59; Expert $99 / $119, each covering first 30 users per hub; extra seats ≈ $0.80–1.00. | [CostBench](https://costbench.com/software/employee-scheduling/connecteam/) · [ecommerceparadise](https://ecommerceparadise.com/connecteam-pricing/) | Medium |
| QuickBooks Time | Premium **$20 + $10/user**; Elite **$40 + $12/user** (per-user fee rose $2 on 2026-07-01); requires QBO or QB Payroll. | [frontdeskreview](https://frontdeskreview.com/software/workforce-management/quickbooks-time/) · [clockit](https://get.clockit.io/reviews/quickbooks-time) | Medium |
| Buddy Punch | $19 base + Starter $4.99 annual / $5.99 monthly; Pro $6.99 / $7.99; Advanced (a.k.a. Enterprise) ≈ $11–14; no "Premium" tier. Data Retention add-on $2/user. | [CostBench](https://costbench.com/software/time-tracking/buddy-punch/discounts/) · [findstack](https://findstack.com/products/buddy-punch/reviews) | Medium |
| OnTheClock | **$4/employee + $5 base**; payroll add-on $6/employee + $40 base; 30-day trial; free ≤2-employee tier reported by directories but absent from official page. | [ontheclock.com/pricing](https://www.ontheclock.com/pricing) | Medium-High |
| Jibble | Free unlimited; Premium **$4.49** annual / $5.99 monthly; Ultimate **$7.99** / $10.99 (raised from $2.49/$4.99 in 2026); regional pricing. | [Timely](https://www.timely.com/blog/jibble-pricing/) · [Connecteam review](https://connecteam.com/reviews/jibble/) | Medium |
| Clockify | Basic $3.99/$4.99, Standard $5.49/$6.99, Pro $7.99/$9.99, Enterprise $11.99/$14.99 per seat (annual/monthly); kiosk "limited seats" $0.79–$2.39. | [Timely](https://www.timely.com/blog/clockify-pricing/) · [CostBench](https://costbench.com/software/time-tracking/clockify/) | Medium |
| Square Shifts Plus | **$4 per team member/month** (US page), free ≤5 members; Shifts included in Square Plus/Premium POS bundles; legacy Team Plus $35/location. | [squareup.com/us/en/staff/shifts/pricing](https://squareup.com/us/en/staff/shifts/pricing) | High |
| 7shifts | Renamed mid-2025: Comp $0; Essentials $44.99 / $39.99 annual; Pro $89.99 / $79.99; Premium $149.99 / $134.99 per location (+$6/employee payroll). | [Connecteam review](https://connecteam.com/reviews/7shifts/) · [OnTheClock review](https://www.ontheclock.com/blog/7shifts-review) | Medium |
| Sling | Free (≤30 users); Premium $2 / $1.70 annual; Business $4 / $3.40 per user; kiosk on Business. | [turnozo](https://turnozo.com/blog/sling-scheduling-review) | Medium |
| Vagaro | Base **$23.99** (official, "limited time"; $30 list) incl. 1 calendar; **+$10 per additional calendar up to 7, then free**; payroll add-on $34 + $5/employee (third-party, conflicting $40 + $6). | [Vagaro Plans & Pricing](https://support.vagaro.com/hc/en-us/articles/22781768988187-Vagaro-Plans-Pricing-and-Premium-Features) · [pickstack](https://pickstack.ai/pricing/vagaro-pricing/) | Medium-High |
| Fresha | Individual **$19.95**; Team **$14.95 per bookable member**; Enterprise quote; 20% new-client fee (min $6); Team Connect $2.95, Insights $9.95, Data Connector $295/location. Free tier gone (by July 2026). | [fresha.com/pricing](https://www.fresha.com/pricing) · [heybooked](https://heybooked.com/blogs/fresha-pricing) | Medium-High |
| GlossGenius | Standard $24 annual / $28 monthly; Gold $48 / $56; Platinum $148 / $168; **Payroll $40 + $6 per paid team member** (official). | [glossgenius.com/pricing](https://glossgenius.com/pricing) · [Payroll pricing](https://glossgenius.elevio.help/en/articles/356-glossgenius-payroll-features-availability-and-pricing) | Medium-High |
| Mangomint | Essentials $165 (≤10), Standard $245 (≤20), Unlimited $375; extra location $95/$135/$175; Payroll Processing **$50 + $8/worker** (single source). | [pabau](https://pabau.com/blog/mangomint-pricing/) · [pulsesignal](https://getpulsesignal.com/pricing/mangomint) | Medium |
| Booksy | $29.99 first user **+ $20 per additional staff** (G2 shows older $10/staff, unlimited $119.99). | [koalendar](https://koalendar.com/blog/booksy-pricing) · [glossgenius blog](https://glossgenius.com/blog/booksy-price) | Medium |
| Square Appointments | Free $0; **Plus $49**; **Premium $149** per location (the $29/$69 figures are stale). | [koalendar](https://koalendar.com/blog/square-appointments-pricing) · [schedulingkit](https://schedulingkit.com/pricing-guides/square-appointments-pricing) | Medium |
| Gusto | Simple **$49 + $6**; Plus **$80 + $12**; Premium $180 + $22; Contractor-only $35 + $6. Simple base rose from $40 in March 2026. | [gustopricing.com](https://gustopricing.com/) · [casrai](https://casrai.org/guides/gusto-pricing) | Medium |
| ADP RUN | **Not published**; quotes. Commonly reported Essential ≈ $79 + $4/employee (also $49/$59 variants); Roll by ADP $39 + $5. | [tech.co](https://tech.co/hr-software/adp-pricing-guide) · [Gusto on ADP](https://gusto.com/resources/guides/switch-payroll-providers/adp-pricing) | Low |
| Paychex | Essentials "$39 + $5" appears in older material and third-party sites; **not on Paychex's current page** (Request Pricing only). | [Gusto on Paychex](https://gusto.com/resources/guides/switch-payroll-providers/paychex-pricing) | Low |

---

## 4. Kiosk UX facts

| Vendor | PIN | Photo on punch | Auto-logout / offline | Breaks | Forgot to clock out | URL | Conf. |
|---|---|---|---|---|---|---|---|
| **Homebase** | Unique PIN auto-assigned per employee (Team → Roster → Locations & Pins); **length not stated** in docs. | Tablet clock photographs every PIN-in, break and clock-out, attached to time card; **no face match**. | Multiple tablets sync in 1–2 s; **offline mode up to 30 h** (clock in/out, start/end break work; schedules and early-clock-in permissions do not); use one iPad when offline. | Break buttons appear on next PIN-in if breaks configured; missed mandatory breaks must be added/waived at clock-out (Breaks & Compliance setting). | Settings → Schedule Enforcement → "Automatically clock out employees" after **10/15/30/60/90/120 min** past scheduled end; logged on timesheet. | [iPad Time Clock](https://support.joinhomebase.com/hc/en-us/articles/360031009171-Homebase-iPad-Time-Clock) · [Enable auto clock-out](https://support.joinhomebase.com/hc/en-us/articles/115000198292-Enable-auto-clock-out) · [Timeero review](https://timeero.com/reviews/homebase-review) | Medium-High |
| **When I Work** | Terminal login is **employee ID or email**, not a PIN. | **Photo Clock In is iOS Terminal only**; photo at clock-in and clock-out; stored in app, viewable by admin/manager/supervisor; must be enabled per device. | Offline: not documented. | — | **No auto clock-out**; "Attendance notices" flag late/missed punches on dashboard for 7 days. | [Clocking In and Out](https://help.wheniwork.com/articles/clock-in-and-out/) · [Photo Clock In](https://help.wheniwork.com/articles/photo-clock-in-reference/) | Medium |
| **Deputy** | **4-digit PIN** emailed at invite; "Forgot PIN?" sends by SMS/email (iOS Kiosk only); photo-only login allowed but limited to start/stop. | Photo captured at shift start; Face Unlock (touchless) optional, **unavailable offline**. | Legacy iPad Kiosk works offline (PIN + photo queued, uploads on reconnect); **new "Deputy Kiosk – Work Time Clock" app has no offline mode**. | Start/end break from kiosk. | **Auto-closes after 23 h**, sets finish = scheduled finish, warning icon for approving manager. | [Kiosk FAQs](https://help.deputy.com/hc/en-au/articles/4754374426511-Deputy-Kiosk-for-iPad-FAQs) · [Offline mode](https://help.deputy.com/hc/en-au/articles/4754315620751-Using-Deputy-in-offline-mode) · [Forgot to clock off](https://help.deputy.com/hc/en-au/articles/4621422343567-I-forgot-to-clock-on-or-off-for-my-shift-what-should-I-do) | High |
| **Connecteam** | **4-digit Kiosk Code**, auto-generated, cannot be customised; shown in employee app Profile → Settings. | Optional selfie before clock-in (**Expert plan**); admin reviews from profile or day's timesheet. | After each punch the kiosk auto-logs the user out; inactivity auto-logout is an **Advanced-plan** setting. Offline: not documented. | Not documented for kiosk. | Help article "Can I prevent employees from forgetting to clock out" (auto clock-out option). | [Kiosk security](https://help.connecteam.com/en/articles/8635332-kiosk-app-security-how-can-i-make-sure-employees-don-t-log-in-as-each-other) · [Customize PIN](https://help.connecteam.com/en/articles/8333065-can-i-customize-kiosk-pin-codes) · [Forgot to clock out](https://help.connecteam.com/en/articles/8283183-can-i-prevent-employees-from-forgetting-to-clock-out) | Medium-High |
| **Square (POS / Team app)** | **4-digit personal passcode** on shared POS (or team badge); Team app is single-user, not a shared kiosk. | **No photo capture.** | Team app clock-in toggle: Staff → Settings → Clock in/out. | Breaks and job switching from POS/Team app. | "Automatically clock out at end of shift" + after-limit, **Shifts Plus/Premium**, off by default; auto-clocked timecards flagged, employee can confirm or request change. | [Clock in and out](https://squareup.com/help/us/en/article/8395-clock-in-and-out-for-team-members) · [Set up time tracking](https://squareup.com/help/us/en/article/8389-set-up-time-tracking) · [Auto clock-out](https://community.squareup.com/t5/Archived-Articles-Read-Only/New-Auto-clock-out/ba-p/658525) | High |
| **Buddy Punch** | **4-digit PIN** on kiosk; QR code and Face ID (iOS) alternatives. | Webcam photo per punch (Pro tier), Off/Optional/Required per employee; stored in cloud on the time card, admin sees latest image on dashboard, managers need Time View/Approval permission; photos appear in Print only, **not in CSV/XLSX/PDF exports**; **retention period not published** (Data Retention add-on $2/user). | Offline: not documented. | Paid/unpaid break setup article. | Two account-wide rules: punch out after N hours worked (creates pending approval) or N minutes after scheduled shift end (no approval). | [View webcam images](https://docs.buddypunch.com/en/articles/1217564-viewing-webcam-images-or-pictures-of-employees-when-they-punch) · [Auto punch out by hours](https://docs.buddypunch.com/en/articles/3658251-how-to-set-up-automatic-punch-outs-based-on-hours-worked) · [by schedule](https://docs.buddypunch.com/en/articles/5676469-automatic-punch-out-feature-scheduling) | High |

**Design takeaways confirmed:** 4-digit PIN is universal where PINs exist; silent photo attached to the punch (no face match) is the Homebase/Buddy Punch norm; every vendor that auto-clocks-out flags the record for manager review; offline queues are rare and being removed (Deputy) — our IndexedDB queue is a real differentiator.

---

## 5. Payroll imports

| Claim | Finding | URL | Conf. |
|---|---|---|---|
| Gusto Smart Import template columns | Article still offers "Download the CSV template"; Smart Import auto-maps columns; accepted types include .csv/.xls/.xlsx. Column labels in Gusto's payroll grid: `Regular hours`, `Overtime hours`, `Double overtime`; reserved default earning names `Bonus`, `Commission`, `Paycheck Tips`, `Cash Tips`; optional `workweeks` column for weekly regular-rate allocation. **Exact template header strings (e.g. `Legal first name`) could not be re-verified** — no public copy of the template exists on GitHub. | [Run payroll with Smart Import](https://support.gusto.com/article/999914471000000/run-payroll-with-smart-import) · [Custom earnings types](https://support.gusto.com/article/250220135301667/custom-earnings-types-for-admins) | Medium |
| Custom earning types matched by column name | **Supported in principle:** a custom earning becomes its own column in the payroll spreadsheet named after the earning; Gusto's own CLI notes default pay types are "matched by name". Match is on the earning's configured name, which cannot reuse a reserved name. | [Custom earnings types](https://support.gusto.com/article/250220135301667/custom-earnings-types-for-admins) · [gusto-cli payroll.ts](https://github.com/Gusto/gusto-cli/blob/main/src/commands/payroll.ts) | Medium |
| QBO Payroll (US) has no hours CSV import | **Still true in 2026**: every Intuit community answer says enter hours manually or use a third-party Time Activities importer; the CSV timesheet import belongs to QuickBooks **Time** (Manual Time Import, ≤750 rows, feature add-on). | [Intuit thread](https://quickbooks.intuit.com/learn-support/en-us/employees-and-payroll/is-there-a-way-to-import-an-employee-s-hours-to-qbo-intuit/00/216108) · [QB Time import](https://quickbooks.intuit.com/learn-support/en-us/help-article/time-tracking/export-import-time-data-quickbooks-time/L1f77o0jJ_US_en_US) | Medium-High |
| Square Payroll "import timecards" options | **Unchanged**: Run payroll → "Import time and wages" pulls hours, tips, commissions from Square Shifts or a supported third-party app; no CSV. Homebase sync confirmed (Payroll ID required, no retroactive sync, edits don't flow back). Capterra lists Deputy, QuickBooks Time, When I Work as native connections; 7shifts not listed. | [Run payroll](https://squareup.com/help/us/en/article/5855-run-payroll) · [Homebase ↔ Square Payroll](https://support.joinhomebase.com/s/article/Homebase-and-Square-Payroll-Integration-Guide) | Medium |

---

## 6. What to change in `app/src/lib/import/parsers.ts`

1. **`detectFormat`.** `square_items`: keep `itemization type`, add `price point name` + `modifiers applied` for 2024/25 files that lack it. `square_transactions`: add `total collected`, `card entry methods`. `vagaro`: the web export's first header is the combined string `Checkout Date / Checkout By / Transaction ID`, which `norm()` turns into `checkout date checkout by transaction id`, so the exact `h.has('checkout date')` test misses it — use a contains-match and add `service provider`, `services sales`, `payroll due`, `amt paid`, `transaction date`. `fresha`: add `commission base`, `items sold`, `sales qty`. `glossgenius`: add a detail-level signature `provider` + `charge id`. Add summary-shaped `mangomint` (`hourly comp`, `service comp`, `product comp`) and `boulevard` (`service sale amount`, `net gratuity`) buckets.
2. **`guessMapping`.** staff: add `provider`, `service provider`, `sold by`. price: add `services sales`, `service sale amount`, `commission base`. tip: add `net gratuity`, `declared cash tips`; exclude `unattributed tips`. externalId: add `charge id`, `sale id`, `invoice`; for Square prefer `Payment ID`, since `Transaction ID` repeats per item. method: Square Transactions has no tender column — derive from non-zero `Cash` vs `Card` amounts and `Source`. qty: Square `Qty` is a decimal string (`1.0`).
3. **Row rules.** Square Items: treat `Itemization Type` = `Service` as commissionable but keep `Custom Amount` rows (walk-in salons key services as custom amounts); pull tips from the Transactions file by `Transaction ID` and split by service share. Fresha/Vagaro/Mangomint/Boulevard summary files have no date per row — import as a period record, not tickets.
4. **Dates.** Square `YYYY-MM-DD` + `HH:MM:SS` + named zone and Vagaro/GlossGenius `M/D/YYYY` are already handled; Fresha follows workspace locale with no override.

---

## detect_rules

```json
{
  "detect_rules": [
    {
      "format": "square_items",
      "required_headers": ["Date", "Time", "Item", "Qty", "Gross Sales", "Net Sales", "Transaction ID"],
      "optional_headers": ["Time Zone", "Category", "Price Point Name", "SKU", "Modifiers Applied", "Discounts", "Tax", "Payment ID", "Device Name", "Notes", "Details", "Event Type", "Location", "Dining Option", "Customer ID", "Customer Name", "Customer Reference ID", "Unit", "Count", "GTIN", "Itemization Type", "Commission", "Employee", "Fulfillment Note", "Channel", "Token", "Card Brand", "PAN Suffix"],
      "date_format": "YYYY-MM-DD (Date) + HH:MM:SS (Time) + named zone e.g. 'Eastern Time (US & Canada)'",
      "staff_column": "Employee",
      "service_column": "Item",
      "price_column": "Net Sales",
      "tip_column": null,
      "id_column": "Payment ID",
      "notes": "35 columns in 2026 exports, 33 in 2025, 21 in some 2024 files; money as '$8.00'; Itemization Type values Service / Physical Good / Custom Amount; Commission is a dollar amount; no tip at item level, join Transactions CSV on Transaction ID. Source: GitHub sample CSVs dated 2026-07/08 (High)."
    },
    {
      "format": "square_transactions",
      "required_headers": ["Date", "Time", "Gross Sales", "Net Sales", "Tip", "Transaction ID", "Staff Name"],
      "optional_headers": ["Time Zone", "Discounts", "Service Charges", "Gift Card Sales", "Tax", "Partial Refunds", "Total Collected", "Source", "Card", "Card Entry Methods", "Cash", "Square Gift Card", "Other Tender", "Other Tender Type", "Tender Note", "Fees", "Net Total", "Payment ID", "Card Brand", "PAN Suffix", "Device Name", "Staff ID", "Details", "Description", "Event Type", "Location", "Dining Option", "Customer ID", "Customer Name", "Customer Reference ID", "Device Nickname", "Third Party Fees", "Deposit ID", "Deposit Date", "Deposit Details", "Fee Percentage Rate", "Fee Fixed Rate", "Refund Reason", "Discount Name", "Transaction Status", "Cash App", "Order Reference ID", "Fulfillment Note", "Free Processing Applied", "Channel", "Unattributed Tips", "Table Info", "International Fee"],
      "date_format": "YYYY-MM-DD + HH:MM:SS + named zone (2018 files used M/D/YYYY)",
      "staff_column": "Staff Name",
      "service_column": "Description",
      "price_column": "Net Sales",
      "tip_column": "Tip",
      "id_column": "Transaction ID",
      "notes": "55 columns verbatim; Card and Cash are amount columns, derive tender from them; Staff Name is the cashier, not necessarily the technician; Event Type Payment/Refund. Source: GitHub verbatim header + 2025 sample (High)."
    },
    {
      "format": "fresha_commission_summary",
      "required_headers": ["Team member", "Commission"],
      "optional_headers": ["Sales qty", "Items sold", "Gross sales", "Refunds", "Tax", "Discounts", "Costs", "Commission base", "% Commission", "Location", "Item", "Type"],
      "date_format": "none per row (period report); workspace locale, US = MM/DD/YYYY",
      "staff_column": "Team member",
      "service_column": "Item",
      "price_column": "Commission base",
      "tip_column": null,
      "id_column": null,
      "notes": "On-screen columns captured 2026-09 in a sandbox; exports CSV/Excel/PDF; grouping column name depends on 'Group by'. Commission activity (row per sale) header still unconfirmed. (Medium)"
    },
    {
      "format": "vagaro_employee_sales",
      "required_headers": ["Service Provider", "Services Sales"],
      "optional_headers": ["Appts", "Unique Customers", "Customer Visits", "Services", "Services Add-Ons", "Service Add-On Sales", "Classes", "Class Sales", "Class Add-On Sales", "Products", "Product Sales", "Avg Product Qty Sold Per Visit", "Avg Product Sales Per Visit", "Memberships", "Membership Sales", "Gift Cards", "Gift Card Sales", "Packages", "Package Sales", "Tips"],
      "date_format": "none per row (period report)",
      "staff_column": "Service Provider",
      "service_column": null,
      "price_column": "Services Sales",
      "tip_column": "Tips",
      "id_column": null,
      "notes": "Field names from the help article; Excel header spelling may be abbreviated (Vagaro uses Qty, Disc, Amt Paid, GC, Pkg, Mbsp elsewhere). (Medium)"
    },
    {
      "format": "vagaro_transaction_list",
      "required_headers": ["Checkout Date / Checkout By / Transaction ID", "Amount Paid"],
      "optional_headers": ["Transaction Date", "App. Date / Customer", "Tip", "Discount", "Sales Tax", "Payment Type", "Sold By"],
      "date_format": "M/D/YYYY h:mm AM/PM (US locale, observed)",
      "staff_column": "Checkout By",
      "service_column": null,
      "price_column": "Amount Paid",
      "tip_column": "Tip",
      "id_column": "Transaction ID",
      "notes": "First column is a combined cell on web; detectFormat must use a contains-match. Amount Paid includes tips and tax. (Medium)"
    },
    {
      "format": "vagaro_payroll",
      "required_headers": ["Hourly Rate", "Hours Worked", "Payroll Due"],
      "optional_headers": ["OT Hourly Rate", "OT Hours Worked", "Gross Sales", "Commission", "Hourly Pay", "OT Pay", "Tips", "Rent", "Deductions"],
      "date_format": "none per row (pay period)",
      "staff_column": "Employee",
      "service_column": null,
      "price_column": "Gross Sales",
      "tip_column": "Tips",
      "id_column": null,
      "notes": "Tips column only when Vagaro Payroll is active; OT is hourly-only. (Medium)"
    },
    {
      "format": "vagaro_time_card",
      "required_headers": ["Clock In", "Clock Out", "Total Hours"],
      "optional_headers": ["Date", "Employee", "Role", "Comments"],
      "date_format": "M/D/YYYY + h:mm AM/PM",
      "staff_column": "Employee",
      "service_column": null,
      "price_column": null,
      "tip_column": null,
      "id_column": null,
      "notes": "No break column; missing entries flagged. Labels inferred from article prose. (Medium-Low)"
    },
    {
      "format": "glossgenius_commission_detail",
      "required_headers": ["Date", "Provider", "Charge ID"],
      "optional_headers": ["Client", "Service", "Price", "Processing Fee", "Discount", "Tip", "Commission Rate", "Commission"],
      "date_format": "M/D/YYYY",
      "staff_column": "Provider",
      "service_column": "Service",
      "price_column": "Price",
      "tip_column": "Tip",
      "id_column": "Charge ID",
      "notes": "Only Date, Provider, Charge ID confirmed by name; price is column G, processing fee J, discount K. Summary-level file: E price, I discounts, N tips, O commission on Total Price, P commission on Net Sales. Report arrives by email. (Medium)"
    },
    {
      "format": "mangomint_payroll",
      "required_headers": ["Hourly Comp", "Service Comp", "Product Comp"],
      "optional_headers": ["Hours", "Blocked", "Services", "Tips", "Pay Adjustments", "Service Sales", "Product Sales"],
      "date_format": "none per row unless 'Include detailed view'",
      "staff_column": "Staff Member",
      "service_column": null,
      "price_column": "Service Sales",
      "tip_column": "Tips",
      "id_column": null,
      "notes": "Excel/PDF only, no CSV; parse XLSX. (Medium)"
    },
    {
      "format": "boulevard_staff_service_sales",
      "required_headers": ["Staff Name", "Service Sale Amount"],
      "optional_headers": ["Service Count", "Service Net Amount", "Service Sales Tax", "Service Discount", "Net Amount Per Appointment", "Location Name", "Net Gratuity"],
      "date_format": "none per row (period report)",
      "staff_column": "Staff Name",
      "service_column": null,
      "price_column": "Service Sale Amount",
      "tip_column": "Net Gratuity",
      "id_column": null,
      "notes": "Column set is customisable; for per-line data use Order Line Items or Commission Line Items CSV. (Medium)"
    }
  ],
  "not_confirmed": ["square_shifts_export", "fresha_commission_activity", "fresha_timesheets_export", "booksy_staff_commissions_tips", "clover_employee_sales", "zenoti_employee_sales_v2", "go_pos", "zota", "mango_pos", "nailsoft", "tilavon", "supaday"]
}
```
