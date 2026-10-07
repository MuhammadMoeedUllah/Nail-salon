# 03 — Timeclock / Scheduling / Payroll Tools and the File Formats We Must Produce or Consume

Research date: 2026-10-07. Scope: tools a small US nail salon could use today, and the exact import/export CSV shapes our app must emit (to payroll) or parse (from booking/POS).

> **Verification status.** Sections 2 and 3 (payroll import formats, POS export formats) are built from vendor help-center pages surfaced in this session and are the load-bearing part of this document. Sections 1, 5 and 6 (timeclock app pricing and kiosk UX) could **not** be re-verified live in this session: the shared web-search budget was exhausted and every vendor domain (joinhomebase.com, wheniwork.com, deputy.com, connecteam.com, clockify.me, jibble.io, buddypunch.com, ontheclock.com, 7shifts.com, getsling.com, hubstaff.com, squareup.com, quickbooks.intuit.com) is blocked by the sandbox egress proxy. Those rows are marked **[unverified — check link]** and reflect the last publicly listed pricing I am aware of (2025). Re-check each pricing page before quoting a number to a customer.

---

## 1. Timeclock / scheduling apps a salon could use today

What matters for us: shared-tablet kiosk with PIN + photo, weekly OT math, whether commission ever enters the OT regular rate, Spanish/Vietnamese UI, and what payroll files they emit.

| App | Price (list, per month) | Free tier | Kiosk / shared tablet | Photo on punch | OT calc | Commission in OT regular rate | Languages (employee app) | Payroll exports |
|---|---|---|---|---|---|---|---|---|
| **Homebase** ([pricing](https://www.joinhomebase.com/pricing)) | Basic $0; Essentials ~$20–24.95/location; Plus ~$48–59.95/location; All-in-One ~$80–99.95/location **[unverified]** | Basic: 1 location, up to 20 employees **[unverified]** | Yes — "Time Clock" app on tablet/POS, PIN login | Yes (photo at clock-in, Essentials+) | Daily/weekly OT rules, CA daily OT | No (hourly only) | EN/ES | Gusto, QuickBooks, ADP RUN, Square Payroll, Paychex, Homebase Payroll; CSV. Square: "timecards recorded in Homebase automatically sync to Square" ([Homebase ↔ Square Payroll](https://joinhomebase.my.site.com/s/article/Integrate-with-Square-Payroll)) |
| **When I Work** ([pricing](https://wheniwork.com/pricing)) | Essentials ~$2.50/user; Pro ~$5; Premium ~$8; Time & Attendance add-on ~+$2–3/user **[unverified]** | 14-day trial only | "Time Clock Terminal" app, PIN | Yes (optional photo) | Weekly OT alerts; export only | No | EN/ES | Gusto, ADP RUN, Paychex ([When I Work ↔ Paychex](https://help.wheniwork.com/articles/paychex-integration-computer/)), QuickBooks, Square Payroll, OnPay ([OnPay ↔ When I Work](https://help.onpay.com/hc/en-us/articles/360028346292)); CSV |
| **Deputy** ([pricing](https://www.deputy.com/pricing)) | Scheduling ~$4.50/user; Time & Attendance ~$4.50; Premium ~$6; Starter plan free for ≤100 shifts/mo **[unverified]** | Starter (limited shifts) | "Deputy Kiosk" iPad app, PIN | Yes — face-match photo verification | Weekly/daily OT per pay-rule library | No | EN/ES/+ | ADP RUN ([Deputy for RUN](https://apps.adp.com/apps/187224/deputy-for-run-powered-by-adp)), ADP WFN ([export](https://help.deputy.com/hc/en-au/articles/4797841662863-Exporting-to-ADP)), Paychex Flex ([guide](https://help.deputy.com/hc/en-au/articles/4693604174735-Integrating-with-Paychex-Flex-US)), Gusto, QuickBooks, Square, OnPay ([OnPay ↔ Deputy](https://help.onpay.com/hc/en-us/articles/360038901232-Deputy-integration-for-time-tracking-in-OnPay)) |
| **Connecteam** ([pricing](https://connecteam.com/pricing/)) | Small Business plan free ≤10 users; Basic ~$29, Advanced ~$49, Expert ~$99 per 30 users **[unverified]** | Yes, ≤10 users all features | "Kiosk" app, PIN | Yes (optional) | Weekly OT rules | No | 20+ incl. ES, VI (UI translations) | Gusto, QuickBooks, Paychex, Xero; ADP WFN CSV template ([Connecteam ADP template](https://help.connecteam.com/en/articles/9296467-how-to-use-adp-workforce-now-export-template)) |
| **QuickBooks Time** ([pricing](https://quickbooks.intuit.com/time-tracking/pricing/)) | Premium ~$20 base + $8/user; Elite ~$40 base + $10/user **[unverified]** | Trial only | "Time Kiosk", 4-digit PIN | Yes — photo + facial recognition on Elite | Weekly/daily OT | No | EN/ES | QBO Payroll (native), Gusto ([QB Time ↔ Gusto](https://quickbooks.intuit.com/learn-support/en-us/help-article/manage-integrations/import-export-gusto-quickbooks-time/L3eE5CXsl_US_en_US)); Patriot integration **sunset 1/1/2025** ([Patriot](https://www.patriotsoftware.com/updates/tsheets-integration/)) |
| **Clockify** ([pricing](https://clockify.me/pricing)) | Free; Basic ~$3.99–4.99/seat; Standard ~$5.49–6.99; Pro ~$7.99–9.99 **[unverified]** | Unlimited users, basic tracking | Kiosk mode (PIN) on Standard+ | No photo | OT on Pro+ | No | EN/ES/PT/FR/DE/RU/JA | CSV/Excel; OnPay integration page ([Clockify ↔ OnPay](https://clockify.me/onpay-time-tracking)); timesheet import spec ([import](https://clockify.me/help/getting-started/import-timesheets)) |
| **Jibble** ([pricing](https://www.jibble.io/pricing)) | Free; Premium ~$2.49–3.99/user; Ultimate ~$4.99–7.99 **[unverified]** | Unlimited users | Shared kiosk, PIN | Yes — face recognition / selfie | Weekly/daily OT, multipliers | No | EN/ES/+ | CSV/Excel; QuickBooks, Xero, ADP-style CSV |
| **Buddy Punch** ([pricing](https://buddypunch.com/pricing/)) | Starter ~$4.49/user + ~$19 base; Pro ~$5.99; Premium ~$7.99 **[unverified]** | Trial only | Kiosk w/ PIN | Yes — webcam photo, facial recognition option | Weekly/daily/CA OT | No | EN/ES | Gusto ([guide](https://docs.buddypunch.com/en/articles/2086731-gusto-integration-overview)), Paychex Flex ([guide](https://docs.buddypunch.com/en/articles/4641684-how-to-integrate-with-paychex-flex)), QuickBooks, ADP, Paylocity, Workday; CSV |
| **OnTheClock** ([pricing](https://www.ontheclock.com/pricing.aspx)) | ~$3.50–4/employee, tiered; free for 1–2 employees **[unverified]** | 1–2 employees | Kiosk/"group punch" with PIN | Yes (photo on punch) | Weekly/daily OT | No | EN | Gusto, QuickBooks, ADP, Paychex Flex ([OTC ↔ Paychex Flex](https://www.ontheclock.com/help/payroll-connecting-with-paychex-flex)); CSV |
| **Square Shifts / Team app** ([features](https://squareup.com/us/en/staff/shifts/features)) | Shifts free; Shifts Plus ~$4/team member/mo **[unverified]** | Free timecards for unlimited members | Clock in on Square POS with team passcode; Square Team app ([App Store](https://apps.apple.com/us/app/square-team/id1435368303)) | No photo (passcode only) | 1.5x weekly OT in Square Payroll ([Run Payroll](https://www.square.com/help/us/en/article/5855)) | Commission is **imported as earnings**, not folded into OT rate (see §2) | EN/ES/FR/JA | Square Payroll native; "export timecards from your Shifts dashboard" for others ([Timecards with Square Payroll](https://squareup.com/help/us/en/article/5608-use-timecards-with-square-payroll)); timecard reports ([article 6140](https://squareup.com/help/us/en/article/6140-employee-timecard-reporting)) |
| **7shifts** ([pricing](https://www.7shifts.com/pricing/)) | Comp $0 (1 location, ≤30 employees); Entrée ~$34.99/location; The Works ~$76.99; Gourmet ~$150 **[unverified]** | Yes (Comp) | 7punches tablet app, PIN | Yes (photo at punch) | Weekly/daily OT, restaurant-focused | No (tips yes, commission no) | EN/ES/FR | ADP WFN ([export](https://kb.7shifts.com/hc/en-us/articles/4417520074387-ADP-Workforce-Now-US-Payroll-Export)), Paychex ([export](https://kb.7shifts.com/hc/en-us/articles/4417505170963-Paychex-Payroll-Export)), Gusto, QuickBooks, Square |
| **Sling** ([pricing](https://getsling.com/pricing/)) | Free; Premium ~$1.70–2/user; Business ~$3.40–4/user **[unverified]** | Yes (scheduling only) | Kiosk mode, PIN | Yes (photo, Business) | OT alerts | No | EN/ES | Gusto, ADP, Paychex, QuickBooks via CSV |
| **Hubstaff** ([pricing](https://hubstaff.com/pricing)) | Starter ~$4.99/seat; Grow ~$7.50; Team ~$10; 2-seat min **[unverified]** | Free 1 user | Kiosk (PIN) add-on | Optional screenshots (desktop), not kiosk photo | Weekly OT | No | EN/ES/+ | Gusto, PayPal, Wise, QuickBooks; CSV |

**Commission in the FLSA regular rate — verdict.** None of the thirteen timeclock apps computes an overtime *rate* that blends commission or day-rate into regular hours; they compute OT **hours** (and at most an hourly-rate × 1.5 amount). Square Payroll states overtime is "calculated at 1.5x the hourly wage" ([Square — Run Payroll](https://www.square.com/help/us/en/article/5855)), and Square Shifts' commission import simply adds commission dollars to the pay run ([Square — Use timecards with Square Payroll](https://squareup.com/help/us/en/article/5608-use-timecards-with-square-payroll)). Gusto's upload template likewise takes `Overtime hours` and a separate `Commission` amount, leaving the regular-rate blend to the employer ([Gusto — Run payroll with Smart Import](https://support.gusto.com/article/999914471000000/Run-payroll-with-CSV-upload)). **Our app must compute the blended regular rate itself and push the result as a dollar amount** (an "OT premium"/"Other earnings" line) rather than relying on the payroll tool.

---

## 2. Payroll products — TIME IMPORT formats we must emit

### 2.1 Gusto — "Smart Import" / CSV upload (confirmed columns)

Source: [Gusto Help — Run payroll with Smart Import / CSV upload](https://support.gusto.com/article/999914471000000/Run-payroll-with-CSV-upload) and the older [Upload employees hours and earnings to payroll](https://support.gusto.com/payroll/payroll-settings/CSV-Upload/999913061/Upload-employees-hours-and-earnings-to-payroll.htm).

- Download "the CSV template" under the upload box; Gusto now auto-maps arbitrary column names ("no need to reformat your spreadsheet"). Accepted types include `.csv, .xls, .xlsx, .ods, .numbers, .txt, .xml` and more.
- Template columns documented: **`Legal first name`**, **`Last name`**, **`Regular hours`** (decimals), **`Overtime hours`**, **`Double overtime hours`** (older template header style: `Regular_hours`, `Overtime_hours`, `Double_overtime_hours`), **`Paycheck tips`**, **`Cash tips`**, **`Bonus`**, **`Commission`**.
- Tips semantics: *Paycheck tips* = Gusto pays the tip in this payroll and taxes it; *Cash tips* = already paid, Gusto only withholds taxes on the amount.
- Overtime: optional **`workweeks`** column holding each week's date range ("ISO dates, MM/DD, or written-out date ranges") with that week's hours/earnings — this is how a biweekly payroll keeps weekly OT separate. Our export should always include it.
- Works for regular, off-cycle and bonus payrolls; each earning type appears as its own pay-stub line.
- Custom earning types (e.g., "OT premium on commission") can be created in Gusto ([Custom earnings types](https://support.gusto.com/article/250220135301667/Custom-earnings-types)) and are matched by column name on import.

**Recommended Gusto CSV header for our export:**
`Legal first name,Last name,Regular hours,Overtime hours,Double overtime hours,Commission,Bonus,Paycheck tips,Cash tips,workweeks`

### 2.2 QuickBooks Online Payroll (US) — no native CSV time import

- Intuit community answers from QBO staff: "You're unable to import employee's hours using a CSV file in QuickBooks Online. Instead, you'll want to manually enter it using the weekly timesheet" ([QBO community thread](https://quickbooks.intuit.com/learn-support/en-us/employees-and-payroll/is-there-a-way-to-import-an-employee-s-hours-to-qbo-intuit/00/216108); also [import timesheet as CSV](https://quickbooks.intuit.com/learn-support/en-us/employees-and-payroll/import-timesheet-as-a-csv-file/00/1109314)).
- The documented timesheet CSV import belongs to **QuickBooks Online Advanced / Advanced Payroll (UK/AU)**, not US Core/Premium/Elite Payroll: file is CSV or TSV, one entry per line, minimum "Start/End date/time or Date + Units, and Employee"; template columns `TxnDate, Name, TimeStart, TimeEnd, TimeDescription, Billable, Status, Customer, ServiceItem, HourlyRate, Taxable, Class, Location`; dates `MM/DD/YYYY` ([Intuit AU](https://quickbooks.intuit.com/learn-support/en-au/time-tracking/how-to-import-employee-timesheets/01/966816), [Intuit UK](https://quickbooks.intuit.com/learn-support/en-uk/help-article/time-tracking/importing-timesheets-quickbooks-online-advanced/L5RR0QwSw_GB_en_GB)).
- Closest US approach: (a) third-party importers (Transaction Pro, SaasAnt, Dancing Numbers) that create *Time Activities* via the QBO API with the same `TxnDate/Name/TimeStart/TimeEnd` shape ([Transaction Pro](https://tprosupport.rightworks.com/kb/article/439-import-time-activities-into-quickbooks-online/)); (b) a human-readable "hours & earnings by employee" CSV/PDF the owner keys into Run Payroll. We should ship (b) by default and (a) as an optional "QBO Time Activities CSV" (`TxnDate,Name,TimeStart,TimeEnd,ServiceItem,Class`).
- Commission/tips in QBO Payroll are entered as pay types (Commission, Cash Tips, Paycheck Tips) on the Run Payroll grid; no import.

### 2.3 ADP RUN — "Paydata" import CSV (confirmed columns)

The RUN/Workforce Now paydata CSV layout is documented by several timeclock vendors (ADP itself keeps the spec behind login):

- Columns, in order: **`Co Code`** (3-char company code, position 1, required), **`Batch ID`** (6 digits, position 2, required — Connecteam fills `YYMMDD`), **`File #`** (ADP employee ID, position 3, required), optional `Employee Name`, `Temp Dept`, `Temp Rate`, **`Reg Hours`**, **`O/T Hours`**, **`Hours 3 Code`** + **`Hours 3 Amount`**, `Hours 4 Code/Amount`, `Reg Earnings`, `O/T Earnings`, **`Earnings 3 Code`** + **`Earnings 3 Amount`**, `Earnings 4 Code/Amount`, `Earnings 5 Code/Amount` ([ClickTime — Export Payroll Data to ADP](https://support.clicktime.com/hc/en-us/articles/41018977335565-Export-Payroll-Data-to-ADP); [Connecteam — ADP WFN export template](https://help.connecteam.com/en/articles/9296467-how-to-use-adp-workforce-now-export-template); [Restaurant365 — ADP Alternate Export](https://docs.restaurant365.com/docs/adp-alternate-export); [7shifts — ADP WFN export](https://kb.7shifts.com/hc/en-us/articles/4417520074387-ADP-Workforce-Now-US-Payroll-Export)).
- Codes: `Hours 3 Code` = `D` for double-time, `H` for holiday ([Restaurant365](https://docs.restaurant365.com/docs/adp-alternate-export), [Connecteam](https://help.connecteam.com/en/articles/9296467-how-to-use-adp-workforce-now-export-template)). Tips use an earnings code set up in RUN as type **`T`** ("enter 'T' in the Code field, Short Name e.g. Tips") ([ClickTime](https://support.clicktime.com/hc/en-us/articles/41018977335565-Export-Payroll-Data-to-ADP)). Commission goes in an `Earnings N Code`/`Amount` pair using the salon's RUN earning code (commonly `C`).
- Timesheets.com documents the same structure for RUN specifically ([Timesheets.com — ADP Run](https://support.timesheets.com/knowledge-base/adp-run/)).

**Recommended ADP RUN header:**
`Co Code,Batch ID,File #,Reg Hours,O/T Hours,Hours 3 Code,Hours 3 Amount,Earnings 3 Code,Earnings 3 Amount,Earnings 4 Code,Earnings 4 Amount`
(Earnings 3 = commission, Earnings 4 = paycheck tips; cash tips as a separate code if the client declares them.)

### 2.4 Square Payroll — no CSV; API or native sync only

- "Timecards imported to payroll must have been made in the Square system"; third-party apps that sync are Deputy, Homebase, QuickBooks Time, When I Work ([Square — Use timecards with Square Payroll](https://squareup.com/help/us/en/article/5608-use-timecards-with-square-payroll); [community thread](https://community.squareup.com/t5/Questions-How-To/Square-Payroll-Question-Can-I-import-time-cards-from-a-csv-file/m-p/103351); [developer forum request for CSV tips/shift upload](https://developer.squareup.com/forums/t/would-like-to-upload-shift-info-and-tips-from-a-csv-file-into-square-to-process-payroll/14804)).
- Tip types on the pay-run grid: **"Tips Already Paid (Cash Tips)"** (taxes withheld, nothing paid) and **"Paycheck Tips"** (paid through payroll) ([Square Payroll Tip Importing](https://www.square.com/help/us/en/article/6480-square-payroll-tip-importing)). Cash tips can be declared by the employee at clock-out in the Team app/POS and imported ([Run payroll](https://www.square.com/help/us/en/article/5855)).
- Closest approach for us: write shifts via the **Labor API** (`Shift`/`Timecard` objects) ([Labor API](https://developer.squareup.com/docs/labor-api/how-it-works)) so they appear in "Import time and wages"; otherwise produce a printable grid matching Square's columns (Regular hours, Overtime hours, Double overtime, Paycheck tips, Cash tips, Commission, Additional pay).

### 2.5 Paychex Flex — Standard Payroll Import (SPI) CSV (confirmed columns)

- Feature must be enabled by Paychex ("reach out to Paychex support to enable"); file is `.csv`, **no header row required**, all columns present in fixed order, layout not editable ([Paychex — Standard Payroll Import Overview](https://myapps.paychex.com/pngHelp_static/helpHtml/Standard_Payroll_Import_Overview.htm); [SPI Specification Sheet](https://myapps.paychex.com/pngHelp_static/helpHtml/SPI_Specification_Sheet.htm)).
- Column order (as implemented by Sundial and 7shifts): **`Client ID, Worker ID, Org, Job Number, Pay Component, Rate, Rate Number, Hours, Units, Line Date, Amount, Check Seq Number, Override State, Override Local, Override Local Jurisdiction, Labor Assignment`** ([Sundial — Paychex Flex importing time](https://sundialtimesystems.freshdesk.com/support/solutions/articles/1000329791-paychex-flex-importing-time); [7shifts — Paychex export](https://kb.7shifts.com/hc/en-us/articles/4417505170963-Paychex-Payroll-Export)).
- `Pay Component` is the client's earning name and must be valid for that worker — e.g., `Hourly`, `Overtime`, `Doubletime`, `Bonus`, `Salary`; tips and commission are additional components the Paychex rep configures ([Paychex SPI overview](https://myapps.paychex.com/pngHelp_static/helpHtml/Standard_Payroll_Import_Overview.htm)). Hours lines fill `Hours`; dollar lines (commission, tips, OT premium) fill `Amount`.

### 2.6 Patriot Payroll — no generic CSV time import

- Hours enter via manual grid, Patriot TIME add-on, or (formerly) QuickBooks Time; "Integration with QuickBooks Time will be sunset on 1/1/2025" ([Patriot — TSheets integration](https://www.patriotsoftware.com/updates/tsheets-integration/); [Time & Attendance add-on](https://www.patriotsoftware.com/payroll/add-ons/time-attendance/)). Patriot's import tooling accepts `.xls/.xlsx/.csv` only for employee/contractor setup ([importing 1099 contractors](https://www.patriotsoftware.com/payroll/training/help/importing-1099-contractors-in-payroll/)). **Closest approach:** our generic "Payroll summary CSV" + on-screen key-in.

### 2.7 OnPay — CSV hours/earnings upload (semi-documented)

- Supported in the new pay run ("Upload Hours" tile) and classic pay run; **must be enabled by OnPay support**; each employee needs a unique **"Clock User"** ID in Employee Profile → Job (any format) that the CSV uses as the key; multiple files per run are summed ([OnPay — How to enter hours or earnings with a CSV file](https://help.onpay.com/hc/en-us/articles/25287771497883); [classic pay run](https://help.onpay.com/hc/en-us/articles/360044742371)).
- Exact header names are not in the public article; OnPay maps columns to its pay items (Regular, Overtime, Double overtime, Commission, Tips, Bonus) during the "process files" step. Plan: emit `Clock User,Regular Hours,Overtime Hours,Double Overtime Hours,Commission,Paycheck Tips,Cash Tips` and let the salon map once.

### 2.8 Summary matrix — how each payroll product takes our data

| Payroll | Hours import | Employee key | OT hours | Commission | Paycheck tips | Cash tips |
|---|---|---|---|---|---|---|
| Gusto | CSV/XLSX Smart Import | first + last name | `Overtime hours`, `Double overtime hours` (+`workweeks`) | `Commission` | `Paycheck tips` | `Cash tips` |
| QBO Payroll (US) | None (manual) | — | key in | pay type | pay type | pay type |
| ADP RUN | Paydata CSV | `File #` | `O/T Hours`, `Hours 3 Code`=`D` | `Earnings N Code/Amount` | earnings code type `T` | separate code |
| Square Payroll | Native/API only | Square team member | auto | import from Shifts | "Paycheck Tips" | "Tips Already Paid" |
| Paychex Flex | SPI CSV (no header) | `Worker ID` | `Pay Component`=`Overtime`/`Doubletime` | component + `Amount` | component | component |
| Patriot | None (manual/TIME) | — | key in | key in | key in | key in |
| OnPay | CSV (enable) | `Clock User` | mapped columns | mapped | mapped | mapped |

---

## 3. POS / booking SALES EXPORT formats we must parse

### 3.1 Vagaro

- **Transaction List Report** — Reports → Transactions; "Export PDF" or "Export Excel". Columns documented include combined header cells `Checkout Date / Checkout By / Transaction ID`, `App. Date / Customer`, plus `Tip` ("tip amount given to the employee"), `Discount`, `Amount Paid` (after tax/discount, incl. tips), `Sales Tax`, payment type ([Vagaro — Run the Transaction List Report](https://support.vagaro.com/hc/en-us/articles/204347940-Transaction-List-Report); [Transaction List Summary](https://support.vagaro.com/hc/en-us/articles/18980855937307-Transaction-List-Summary)). Employee ("Checkout By"/service provider) is present per transaction; item lines are nested per transaction, so parse by Transaction ID.
- **Employee Sales / Sales by Service Provider** — count and price of services, classes, products, memberships, packages per employee, plus tips, taxes, fees; "every Vagaro report can … be exported to Excel or CSV" ([Employee Sales Report](https://support.vagaro.com/hc/en-us/articles/360000409134-Employee-Sales-Report); [Vagaro — 7 key reports](https://www.vagaro.com/learn/7-vagaro-reports-for-schedulicity-users)).
- **Payroll Report / Payroll History** — commissions, tips, rent collected, deductions per employee; Excel/PDF ([Run a Payroll Report](https://support.vagaro.com/hc/en-us/articles/360018855214-Run-a-Payroll-Report); [Payroll History](https://support.vagaro.com/hc/en-us/articles/115003990314-Payroll-History-Report)).
- **Time Card Report** (if the salon uses Vagaro's clock) ([Time Card Report](https://support.vagaro.com/hc/en-us/articles/28615617772315-Time-Card-Report)).
- Date format in Excel exports: US `M/D/YYYY h:mm AM/PM` (observed in sample exports; not stated in docs — treat as locale-dependent and sniff).

### 3.2 Square (POS / Appointments)

- Three exports from Transactions: **Transactions CSV**, **Transaction Details CSV**, **Items Detail CSV**; also Reports → Item Sales → Export → Detail CSV ([Square — Print, export, or email reports](https://squareup.com/help/us/en/article/8362-print-export-or-email-your-reports); [community: 3 transaction files](https://community.squareup.com/t5/Online-Store/How-do-I-export-a-report-to-a-CSV-file/m-p/137183)).
- **Transactions CSV — 52 columns, confirmed order:** `Date, Time, Time Zone, Gross Sales, Discounts, Service Charges, Net Sales, Gift Card Sales, Tax, Tip, Partial Refunds, Total Collected, Source, Card, Card Entry Methods, Cash, Square Gift Card, Other Tender, Other Tender Type, Other Tender Note, Fees, Net Total, Transaction ID, Payment ID, Card Brand, PAN Suffix, Device Name, Staff Name, Staff ID, Details, Description, Event Type, Location, Dining Option, Customer ID, Customer Name, Customer Reference ID, Device Nickname, Deposit ID, Deposit Date, Deposit Details, Fee Percentage Rate, Fee Fixed Rate, Refund Reason, Discount Name, Transaction Status, Cash App, Order Reference ID, Fulfillment Note` (+ newer `Channel`, `Unattributed Tips`) ([Trestle — Square Transactions CSV](https://trestlefinance.com/guides/square-transactions-csv-quickbooks); [Trestle — wrong format fix](https://trestlefinance.com/guides/square-csv-export-wrong-format-quickbooks-fix)). `Date` is `YYYY-MM-DD`, `Time` is `HH:MM:SS`, `Time Zone` is a label such as `Pacific Time (US & Canada)`; money columns are strings like `$12.00` (negatives for Fees/refunds).
- **Staff/Tip columns:** `Staff Name`, `Staff ID` and `Tip` exist on the Transactions CSV ("scroll to the right") ([community](https://community.squareup.com/t5/Payments-Troubleshooting/export-sales-report-as-a-excel-or-numbers-file/m-p/761172)). **Tip is per transaction, not per item**; the technician is the staff member who rang the sale, which can differ from the one who performed the service.
- **Items Detail CSV** — one row per line item, linkable to Transactions by `Transaction ID`; Square Appointments added **`Itemization Type`** (Item vs Service), **`Commission`** (dollar amount) and **`Employee`** (commission earner) to this file ([Square Seller Community — commission fields in CSV](https://community.squareup.com/t5/Product-Updates/New-on-Square-Appointments-Additional-Commission-Reporting-Data/ba-p/370315)). This is the file we should prefer for per-tech service revenue; `Items` is column E and `Notes` column Q ([community](https://www.sellercommunity.com/t5/Using-Square/Is-there-way-to-include-transaction-s-Note-column-into/m-p/122245)).
- Team timecard reports (if they clock in on Square) ([article 6140](https://squareup.com/help/us/en/article/6140-employee-timecard-reporting)).

### 3.3 Fresha

- Exports: PDF, CSV or XLSX from any report via Customize → Options ([Fresha — Export reports](https://www.fresha.com/help-center/knowledge-base/reports/191-export-reports)).
- **Payment transactions report** fields: `Payment date, Payment number, Sale date, Sale number, Appointment reference, Client, Location, Team member, Transaction type, Payment method, Amount, Change amount, Gift card code` and payment-time fields ([Payment transactions report](https://www.fresha.com/help-center/knowledge-base/reports/347-payment-transactions-article-1)). Team member is per payment, not per service line.
- For per-tech service lines use **Sales summary / Sales by time period** grouped by team member, and the **Tips summary / Tips detail** and **Commission activity / Commission summary** reports (commission activity = "full list of all sales with commissions payable") ([Reports glossary](https://www.fresha.com/help-center/knowledge-base/reports/270-reports-and-insights-glossary); [Sales summary](https://www.fresha.com/help-center/knowledge-base/reports/338-sales-summary-article-1); [Set up commissions](https://www.fresha.com/help-center/knowledge-base/team/98-set-up-commissions-for-team-members); [Pay runs](https://www.fresha.com/help-center/knowledge-base/team/586-prepare-a-pay-run)). Column names/dates are localised to the workspace (US → `MM/DD/YYYY`); the [Data connector tables](https://www.fresha.com/help-center/knowledge-base/reports/101429-data-connector-tables) page names the underlying fields (e.g., tips collected, tips refunded).
- Appointments list export: Sales → Appointments → date range → Export → CSV ([Goldie — importing from Fresha](https://support.heygoldie.com/en/articles/323672-importing-from-fresha)).

### 3.4 Booksy Biz

- "50+ built-in reports" including **Staff Performance** and **Staff Commissions & Tips**; download from Reports (web/tablet) with the Download button, or Profile → Stats & Reports → "Get key reports" which emails an **Excel** file ([Booksy — How do I download reports](https://support.booksy.com/hc/en-us/articles/16487921910290-How-do-I-download-reports-from-Booksy); [Booksy Stats & Reports](https://biz.booksy.com/en-us/features/stats-and-reports)). Column names are not published; expect XLSX with Staff, Date, Service, Price, Tip, Commission. Build the Booksy parser as a header-sniffing mapper, not a fixed schema.

### 3.5 GlossGenius

- Reports export as CSV; **Sales report** export "displays all sales, including the team member who provided the service, tips, commission, customer details" ([Available Reports](https://glossgenius.elevio.help/en/articles/117-available-reports); [How to generate and download a report](https://glossgenius.elevio.help/en/articles/126-how-to-pull-download-a-report)).
- **Commission Earnings Report**: Tips in **column N**, `Total Price` in **column O**, `Net Sales` in **column P**; tips excluded from commission base; "Itemized" vs "By Team Member" exports ([Commission Earnings Report](https://glossgenius.elevio.help/en/articles/124-commission-earnings-report); [Sales Report Breakdown](https://glossgenius.elevio.help/en/articles/121-sales-report-breakdown)). Transaction Detail report is also CSV. Per-team-member reports must be run one person at a time.

### 3.6 Parser design implications

1. Key every POS row by a vendor transaction ID (`Transaction ID`, `Sale number`, Vagaro Transaction ID) for idempotent re-imports.
2. Technician attribution: Square Items Detail `Employee` > Fresha `Team member` > Vagaro service provider > Square Transactions `Staff Name` (fallback: who rang it up).
3. Tips are transaction-level in Square/Vagaro; split rule (by service revenue share) must be configurable and logged in the audit binder.
4. Dates: Square `YYYY-MM-DD` + `HH:MM:SS` + named time zone; Vagaro/Fresha/GlossGenius US-locale `M/D/YYYY`; always store UTC + salon TZ.

---

## 4. Record retention and pay-statement generators

- **FLSA records**: payroll records, collective agreements, sales/purchase records — 3 years; time cards, wage-rate tables, work schedules — 2 years; employers may use any timekeeping method as long as it is complete and accurate ([DOL Fact Sheet #21](https://www.dol.gov/agencies/whd/fact-sheets/21-flsa-recordkeeping)). Our binder should default to 4 years to also cover IRS employment-tax retention.
- **Pay-stub generators small employers use**: Gusto (statements auto-generated; employee view explained in [View and understand your paystub](https://support.gusto.com/article/260428150612093/view-and-understand-your-paystub-for-us-employees)), QuickBooks Payroll, Square Payroll, OnPay, Patriot (built-in employee portal, [Patriot portal](https://patriotsoftware.com/payroll-portal/technical)); standalone sites (Shopify Pay Stub Generator, FormPros, Check Stub Maker, 123PayStubs) produce PDFs but do **not** compute blended OT or bilingual output — our EN/VI PDF is a differentiator.
- **Fields states commonly require on an itemized statement** (summary; legal memo covers detail): employer legal name/address; employee name and ID/last-4 SSN; pay period start/end and pay date; gross wages; **all hours worked with each applicable rate** (regular, OT, double-time); piece/commission units and rate where applicable; itemized deductions; net pay; accrued sick leave (CA, WA, others). California Labor Code §226 is the strictest template; New York WTPA adds a notice of pay rate; many states (e.g., TX, FL) have no statute but FLSA record rules still apply. Our statement should include every §226 field plus a "regular rate this week" line and the tip total shown separately.

---

## 5. Kiosk PIN clock-in UX — patterns from Homebase, When I Work, Deputy, Square, Connecteam

Marked **[unverified]** where the vendor page could not be re-fetched this session; links point to the authoritative page to confirm.

- **PIN length**: 4-digit PINs are the norm (Square team passcode 4 digits; QuickBooks Time Kiosk 4-digit; Homebase 4-digit; Deputy 4-digit; Connecteam 4-digit) **[unverified]** — see [Square Team app](https://apps.apple.com/us/app/square-team/id1435368303), [QuickBooks Time](https://quickbooks.intuit.com/time-tracking/pricing/), [Homebase pricing/features](https://www.joinhomebase.com/pricing), [Deputy](https://www.deputy.com/pricing), [Connecteam](https://connecteam.com/pricing/). We should use 4 digits with lockout after 5 bad tries.
- **Photo on punch**: Homebase and 7shifts snap a selfie on every clock-in/out; Deputy Kiosk uses face match against an enrolled photo; QuickBooks Time Elite offers facial recognition; Buddy Punch offers webcam photo or facial recognition; Square and Clockify do **not** capture a photo **[unverified]**. A silent front-camera capture after PIN entry (not blocking) is the common pattern.
- **Offline mode**: Homebase and Deputy kiosks queue punches offline and sync later; When I Work terminal requires connectivity **[unverified]**. Build an IndexedDB punch queue.
- **Auto-return / auto-logout**: kiosks return to the PIN pad within ~10–15 s of inactivity and never show another employee's data **[unverified]**.
- **Break buttons**: "Start break / End break" shown on the same screen after punch; paid vs unpaid break types configurable (Homebase, Deputy, 7shifts) **[unverified]**.
- **Forgot-to-clock-out**: Homebase auto-clocks out after a configurable max shift length (e.g., 12 h) and flags the card; Deputy marks the timesheet "unapproved" and requires a manager edit; Square Shifts lets managers edit timecards in Dashboard ([timecard reporting](https://squareup.com/help/us/en/article/6140-employee-timecard-reporting)) **[partly unverified]**.
- **Manager approval of edits**: all five require a manager/admin role to edit a punch; Deputy and Homebase keep an edit history with who/when/why; Square timecard edits are logged **[unverified]**. Our audit binder should store original + edited punch + reason + approver.
- **Cash-tip declaration at clock-out**: Square Shifts can require team members to declare cash tips when clocking out, and the amount flows to payroll ([Square Payroll Tip Importing](https://www.square.com/help/us/en/article/6480-square-payroll-tip-importing)). Worth copying as an optional prompt.
- **Geofence**: mobile apps (Homebase, When I Work, Deputy, Connecteam) geofence personal-phone punches; shared-tablet kiosk mode is pinned to a location instead **[unverified]**. For a salon tablet, pin to the device ID, not GPS.
- **Shared-device enrollment**: the owner signs the tablet into "kiosk/terminal mode" once; employees never see the owner's account (Homebase Time Clock, When I Work Terminal, Deputy Kiosk, Connecteam Kiosk) **[unverified]**.
- **Large-touch layout**: numeric keypad ≥ 64 px targets, name/avatar confirmation after PIN, single big "Clock In"/"Clock Out" button, bilingual labels (we add Vietnamese).
- **Scheduled-shift guardrails**: early clock-in blocked or flagged if more than N minutes before scheduled start (Homebase, Deputy) **[unverified]**; useful later once scheduling exists.
- **Receipts**: on-screen confirmation with timestamp and a "that's not me" undo within 60 s; Deputy and Homebase push a notification to the employee's phone **[unverified]**.

---

## 6. Pricing anchors (list prices; see §1 for verification status)

| Tool | Unit | Entry paid tier | Mid tier | Notes |
|---|---|---|---|---|
| Homebase | per location | ~$20–25 | ~$48–60 | Free Basic plan; payroll add-on ~$39 + $6/employee **[unverified]** |
| When I Work | per user | ~$2.50 | ~$5–8 | Attendance add-on extra **[unverified]** |
| Deputy | per user | ~$4.50 | ~$6 | Free Starter ≤100 shifts/mo **[unverified]** |
| Connecteam | per 30 users | ~$29 | ~$49–99 | Free ≤10 users **[unverified]** |
| QuickBooks Time | base + per user | ~$20 + $8 | ~$40 + $10 | Facial recognition on Elite **[unverified]** |
| Clockify | per seat | ~$3.99 | ~$5.49–7.99 | Free unlimited users **[unverified]** |
| Jibble | per user | ~$2.49 | ~$4.99 | Free unlimited users, face kiosk **[unverified]** |
| Buddy Punch | per user + base | ~$4.49 + $19 | ~$5.99–7.99 | **[unverified]** |
| OnTheClock | per employee | ~$3.50–4 | — | Free 1–2 employees **[unverified]** |
| Square Shifts | per team member | $0 | ~$4 (Plus) | Payroll $35 + $6/person **[unverified]** |
| 7shifts | per location | ~$35 | ~$77–150 | Free Comp plan **[unverified]** |
| Sling | per user | ~$1.70–2 | ~$3.40–4 | Free scheduling **[unverified]** |
| Hubstaff | per seat | ~$4.99 | ~$7.50–10 | 2-seat minimum **[unverified]** |
| Gusto Payroll | base + per person | ~$49 + $6 | ~$80 + $12 | For positioning only **[unverified]** |
| OnPay Payroll | base + per person | ~$40 + $6 | — | CSV hours upload must be enabled ([OnPay](https://help.onpay.com/hc/en-us/articles/25287771497883)) |
| Patriot Payroll | base + per person | ~$17 + $4 (Basic) | ~$37 + $5 (Full) | ([Patriot pricing](https://www.patriotsoftware.com/pricing/)) **[unverified]** |

**Positioning takeaway:** a salon of 6 techs pays roughly $25–60/mo for a kiosk timeclock that still cannot compute day-rate-plus-commission overtime; our app's price anchor should sit in the $30–50/location band and sell the compliance math plus bilingual statements, not the clock.

---

## Sources (accessed 2026-10-07)

1. Gusto — Run payroll with Smart Import / CSV upload: https://support.gusto.com/article/999914471000000/Run-payroll-with-CSV-upload
2. Gusto — Upload employees hours and earnings to payroll (legacy): https://support.gusto.com/payroll/payroll-settings/CSV-Upload/999913061/Upload-employees-hours-and-earnings-to-payroll.htm
3. Gusto — Custom earnings types: https://support.gusto.com/article/250220135301667/Custom-earnings-types
4. Gusto — View and understand your paystub: https://support.gusto.com/article/260428150612093/view-and-understand-your-paystub-for-us-employees
5. Intuit — Is there a way to import hours to QBO Payroll via CSV: https://quickbooks.intuit.com/learn-support/en-us/employees-and-payroll/is-there-a-way-to-import-an-employee-s-hours-to-qbo-intuit/00/216108
6. Intuit — Import timesheet as a CSV file: https://quickbooks.intuit.com/learn-support/en-us/employees-and-payroll/import-timesheet-as-a-csv-file/00/1109314
7. Intuit AU — How to import employee timesheets: https://quickbooks.intuit.com/learn-support/en-au/time-tracking/how-to-import-employee-timesheets/01/966816
8. Intuit UK — Importing timesheets in QBO Advanced Payroll: https://quickbooks.intuit.com/learn-support/en-uk/help-article/time-tracking/importing-timesheets-quickbooks-online-advanced/L5RR0QwSw_GB_en_GB
9. Transaction Pro — Import Time Activities into QBO: https://tprosupport.rightworks.com/kb/article/439-import-time-activities-into-quickbooks-online/
10. ClickTime — Export Payroll Data to ADP: https://support.clicktime.com/hc/en-us/articles/41018977335565-Export-Payroll-Data-to-ADP
11. Connecteam — ADP Workforce Now export template: https://help.connecteam.com/en/articles/9296467-how-to-use-adp-workforce-now-export-template
12. Restaurant365 — ADP Alternate Export: https://docs.restaurant365.com/docs/adp-alternate-export
13. 7shifts — ADP WFN payroll export: https://kb.7shifts.com/hc/en-us/articles/4417520074387-ADP-Workforce-Now-US-Payroll-Export
14. Timesheets.com — ADP Run: https://support.timesheets.com/knowledge-base/adp-run/
15. Deputy — Exporting to ADP: https://help.deputy.com/hc/en-au/articles/4797841662863-Exporting-to-ADP
16. Deputy for RUN Powered by ADP: https://apps.adp.com/apps/187224/deputy-for-run-powered-by-adp
17. Square — Use timecards with Square Payroll: https://squareup.com/help/us/en/article/5608-use-timecards-with-square-payroll
18. Square — Run payroll: https://www.square.com/help/us/en/article/5855
19. Square — Square Payroll tip importing: https://www.square.com/help/us/en/article/6480-square-payroll-tip-importing
20. Square community — Can I import time cards from a CSV: https://community.squareup.com/t5/Questions-How-To/Square-Payroll-Question-Can-I-import-time-cards-from-a-csv-file/m-p/103351
21. Square developer forum — upload shift info and tips from CSV: https://developer.squareup.com/forums/t/would-like-to-upload-shift-info-and-tips-from-a-csv-file-into-square-to-process-payroll/14804
22. Square — Labor API: https://developer.squareup.com/docs/labor-api/how-it-works
23. Square — Team member timecard reporting: https://squareup.com/help/us/en/article/6140-employee-timecard-reporting
24. Square — Print, export, or email reports: https://squareup.com/help/us/en/article/8362-print-export-or-email-your-reports
25. Square community — three transaction CSV files: https://community.squareup.com/t5/Online-Store/How-do-I-export-a-report-to-a-CSV-file/m-p/137183
26. Square community — Staff Name / Staff ID / Tips columns: https://community.squareup.com/t5/Payments-Troubleshooting/export-sales-report-as-a-excel-or-numbers-file/m-p/761172
27. Square Seller Community — Items Detail CSV commission fields: https://community.squareup.com/t5/Product-Updates/New-on-Square-Appointments-Additional-Commission-Reporting-Data/ba-p/370315
28. Seller Community — Items / Notes column positions: https://www.sellercommunity.com/t5/Using-Square/Is-there-way-to-include-transaction-s-Note-column-into/m-p/122245
29. Trestle Finance — Square Transactions CSV columns: https://trestlefinance.com/guides/square-transactions-csv-quickbooks
30. Trestle Finance — Square CSV wrong format fix: https://trestlefinance.com/guides/square-csv-export-wrong-format-quickbooks-fix
31. Square Shifts features: https://squareup.com/us/en/staff/shifts/features
32. Square Team app (App Store): https://apps.apple.com/us/app/square-team/id1435368303
33. Homebase — Integrate with Square Payroll: https://joinhomebase.my.site.com/s/article/Integrate-with-Square-Payroll
34. Paychex — Standard Payroll Import Overview: https://myapps.paychex.com/pngHelp_static/helpHtml/Standard_Payroll_Import_Overview.htm
35. Paychex — SPI Specification Sheet: https://myapps.paychex.com/pngHelp_static/helpHtml/SPI_Specification_Sheet.htm
36. Sundial — Paychex Flex importing time (SPI column order): https://sundialtimesystems.freshdesk.com/support/solutions/articles/1000329791-paychex-flex-importing-time
37. 7shifts — Paychex payroll export: https://kb.7shifts.com/hc/en-us/articles/4417505170963-Paychex-Payroll-Export
38. Buddy Punch — Paychex Flex integration: https://docs.buddypunch.com/en/articles/4641684-how-to-integrate-with-paychex-flex
39. Buddy Punch — Gusto integration: https://docs.buddypunch.com/en/articles/2086731-gusto-integration-overview
40. OnTheClock — Connecting with Paychex Flex: https://www.ontheclock.com/help/payroll-connecting-with-paychex-flex
41. When I Work — Paychex integration: https://help.wheniwork.com/articles/paychex-integration-computer/
42. Deputy — Integrating with Paychex Flex (US): https://help.deputy.com/hc/en-au/articles/4693604174735-Integrating-with-Paychex-Flex-US
43. Patriot — TSheets/QuickBooks Time integration (sunset notice): https://www.patriotsoftware.com/updates/tsheets-integration/
44. Patriot — Time & Attendance add-on: https://www.patriotsoftware.com/payroll/add-ons/time-attendance/
45. Patriot — Importing 1099 contractors (file types): https://www.patriotsoftware.com/payroll/training/help/importing-1099-contractors-in-payroll/
46. Patriot — Pricing: https://www.patriotsoftware.com/pricing/
47. OnPay — How to enter hours or earnings with a CSV file: https://help.onpay.com/hc/en-us/articles/25287771497883
48. OnPay — CSV hours (Classic pay run): https://help.onpay.com/hc/en-us/articles/360044742371
49. OnPay — When I Work import: https://help.onpay.com/hc/en-us/articles/360028346292
50. OnPay — Deputy integration: https://help.onpay.com/hc/en-us/articles/360038901232-Deputy-integration-for-time-tracking-in-OnPay
51. Clockify — OnPay time tracking: https://clockify.me/onpay-time-tracking
52. Clockify — Import timesheets: https://clockify.me/help/getting-started/import-timesheets
53. QuickBooks Time — Import/export with Gusto: https://quickbooks.intuit.com/learn-support/en-us/help-article/manage-integrations/import-export-gusto-quickbooks-time/L3eE5CXsl_US_en_US
54. Vagaro — Run the Transaction List Report: https://support.vagaro.com/hc/en-us/articles/204347940-Transaction-List-Report
55. Vagaro — Transaction List Summary: https://support.vagaro.com/hc/en-us/articles/18980855937307-Transaction-List-Summary
56. Vagaro — Employee Sales Report: https://support.vagaro.com/hc/en-us/articles/360000409134-Employee-Sales-Report
57. Vagaro — Run a Payroll Report: https://support.vagaro.com/hc/en-us/articles/360018855214-Run-a-Payroll-Report
58. Vagaro — Payroll History Report: https://support.vagaro.com/hc/en-us/articles/115003990314-Payroll-History-Report
59. Vagaro — Time Card Report: https://support.vagaro.com/hc/en-us/articles/28615617772315-Time-Card-Report
60. Vagaro — 7 key reports: https://www.vagaro.com/learn/7-vagaro-reports-for-schedulicity-users
61. Fresha — Export reports: https://www.fresha.com/help-center/knowledge-base/reports/191-export-reports
62. Fresha — Payment transactions report: https://www.fresha.com/help-center/knowledge-base/reports/347-payment-transactions-article-1
63. Fresha — Reports and Insights glossary: https://www.fresha.com/help-center/knowledge-base/reports/270-reports-and-insights-glossary
64. Fresha — Sales summary report: https://www.fresha.com/help-center/knowledge-base/reports/338-sales-summary-article-1
65. Fresha — Data connector tables: https://www.fresha.com/help-center/knowledge-base/reports/101429-data-connector-tables
66. Fresha — Set up commissions: https://www.fresha.com/help-center/knowledge-base/team/98-set-up-commissions-for-team-members
67. Fresha — Set up pay runs: https://www.fresha.com/help-center/knowledge-base/team/586-prepare-a-pay-run
68. Goldie — Importing from Fresha (appointments CSV path): https://support.heygoldie.com/en/articles/323672-importing-from-fresha
69. Booksy — How do I download reports: https://support.booksy.com/hc/en-us/articles/16487921910290-How-do-I-download-reports-from-Booksy
70. Booksy — Stats & Reports feature page: https://biz.booksy.com/en-us/features/stats-and-reports
71. GlossGenius — Available Reports: https://glossgenius.elevio.help/en/articles/117-available-reports
72. GlossGenius — Commission Earnings Report: https://glossgenius.elevio.help/en/articles/124-commission-earnings-report
73. GlossGenius — Sales Report Breakdown: https://glossgenius.elevio.help/en/articles/121-sales-report-breakdown
74. GlossGenius — How to generate and download a report: https://glossgenius.elevio.help/en/articles/126-how-to-pull-download-a-report
75. DOL — Fact Sheet #21 FLSA Recordkeeping: https://www.dol.gov/agencies/whd/fact-sheets/21-flsa-recordkeeping
76. Patriot — Employee portal: https://patriotsoftware.com/payroll-portal/technical
77. Vendor pricing pages to re-verify §1/§6: https://www.joinhomebase.com/pricing · https://wheniwork.com/pricing · https://www.deputy.com/pricing · https://connecteam.com/pricing/ · https://quickbooks.intuit.com/time-tracking/pricing/ · https://clockify.me/pricing · https://www.jibble.io/pricing · https://buddypunch.com/pricing/ · https://www.ontheclock.com/pricing.aspx · https://www.7shifts.com/pricing/ · https://getsling.com/pricing/ · https://hubstaff.com/pricing
