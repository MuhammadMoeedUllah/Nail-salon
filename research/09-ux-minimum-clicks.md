# 09 — Minimum-click UX for the kiosk, ticket entry, pay runs, statements and import

Research date: 2026-10-07. Scope: the fewest taps on a shared front-desk tablet (iPad or cheap Android) and the owner's phone. Several vendor help centres block automated fetching; quoted behaviour then comes from the vendor's own page text as indexed in search. Baselines come from `docs/PLAN.md` §3 and research 06 rules 8, 14, 15, 18. Thin evidence is marked **[weak]**; our own reasoning **[inference]**.

---

## 1. Shared-tablet time clocks: how the leaders cut taps

### 1.1 What each product actually asks the worker to do

| Product | Identify | Then | Photo | Taps (approx.) |
|---|---|---|---|---|
| Clockify | Choose profile, 4- or 6-digit PIN | "Click Clock in" ([Clockify](https://clockify.me/help/track-time-and-expenses/clock-in-and-out-via-kiosk)) | none | 1 + 4 + 1 = 6 |
| 7shifts | Punch ID (auto-generated, unique), "select Sign In" | Shift summary, then punch ([7shifts](https://kb.7shifts.com/hc/en-us/articles/21932538945171-7punches-for-Employees-How-to-Punch-In-and-Out-Using-7punches); [Punch IDs](https://kb.7shifts.com/hc/en-us/articles/4417519713043-Punch-IDs-for-Employees)) | Optional: camera on punch screen, photo on every punch ([7shifts](https://kb.7shifts.com/hc/en-us/articles/4417513739539-Buddy-Punch-Prevention)) | 4 + 1 + 1 = 6 |
| Toast POS | 6–8 digit code, tap Timeclock | Job, Clock In, Done ([Toast](https://support.toasttab.com/en/article/Clocking-In-and-Out-for-Shifts-and-Breaks)) | none | 10–12 |
| Square POS | Clock icon, 4-digit passcode | "select Clock In" ([Square](https://squareup.com/help/us/en/article/8395-clock-in-and-out-for-team-members)) | none | 1 + 4 + 1 = 6 |
| Deputy | PIN or opt-in Face Unlock | Tap Start Shift; or look and say "Start shift" (English only) ([Deputy](https://help.deputy.com/hc/en-au/articles/4754361296527-Touchless-clock-in-with-Deputy-Kiosk-for-iPad)) | "tap Start Shift … the iPad takes a photo", no extra step ([Deputy](https://help.deputy.com/hc/en-au/articles/4754348479631-Disable-enable-photo-verification-for-timesheets-on-the-Deputy-Kiosk-Time-Clock-apps)) | 5 (PIN); 1 (face) |
| Homebase | Personal PIN | Clock in / break / out ([Homebase](https://support.joinhomebase.com/hc/en-us/articles/360030670872-The-Homebase-Android-Time-Clock)) | Captured "each time they PIN in"; marketed as non-biometric ([Homebase](https://www.joinhomebase.com/time-clock/biometric-time-clock)) | 5 |
| Buddy Punch | Unique 4-digit PIN "to quickly punch in or out" | Punch button | Optional: "the system will prompt them to take a selfie", an extra step ([docs](https://docs.buddypunch.com/en/articles/3416037-how-to-set-up-use-the-kiosk-pin-punching); [feature](https://buddypunch.com/time-clock-software/features/photo-on-punch/)) | 5–6, +1 selfie |
| Connecteam | Unique 4-digit PIN or face login | Punch | Optional live selfie ([Connecteam](https://connecteam.com/best-time-clock-kiosk-apps/)) | 5 |
| When I Work | Type employee ID or email | Tap Clock In; "Your photo will be taken … to complete your clock-in" (iOS only) ([When I Work](https://help.wheniwork.com/articles/clock-in-and-out/)) | silent on tap | 6+ |
| Jibble | Face recognition; PIN fallback off by default | Confirm; selfie stored ([Jibble](https://www.jibble.io/help/managing-kiosk-settings); [PIN](https://www.jibble.io/help/clocking-in-and-out-with-a-pin)) | yes | 1–2 |

### 1.2 Answers to the four specific questions

**Auto-submit on the 4th digit?** No vendor documents it; every help page above ends with "tap Clock in" after the PIN. The pattern is settled elsewhere: iOS submits a fixed-length 4- or 6-digit passcode on the last digit and shows OK only for custom lengths ([tempertemper](https://www.tempertemper.net/blog/custom-numeric-passcodes-on-iphone); [Apple Community](https://discussions.apple.com/thread/253230794)); pattern libraries recommend auto-validating on the last digit ([uxgoodpatterns](https://uxgoodpatterns.com/example/auto-submit-code/)); one kiosk implementation auto-submits on the fourth digit, clears and reddens the dots on failure, and removes the text field so no keyboard pops up ([gaiser-lager PR](https://github.com/firsttris/gaiser-lager/pull/16)). Our pad already has no Enter key; add the red-dots/clear behaviour.

**Auto-clock-in when only one action is valid?** Nobody does it; even Deputy's touchless path needs "Start shift" spoken. Since a wrong punch in our model becomes a record needing a reasoned edit (PLAN 3.2), the explicit tap buys audit cleanliness for half a second. Recommendation: one full-width button when one action is valid, two when out/break both apply; pilot "auto-punch + 10-second Undo" only if techs complain **[inference]**.

**Undo?** No kiosk documents one. Corrections are manager-side: Square staff "request changes to your timecards" from the Team app ([Square](https://squareup.com/help/us/en/article/8395-clock-in-and-out-for-team-members)); Homebase shows time-card errors in a red "Errors" column ([Homebase](https://joinhomebase.com/blog/inline-employee-time-card-errors)); Workeasy offers "Missed a Punch?" after a clock-in ([Workeasy](https://help.workeasysoftware.com/docs/enable-and-disable-smart-clocking)). NN/g: "Are you sure?" prompts are clicked through reflexively; undo is the better guard for recoverable actions ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/)). An Undo on our confirmation screen is a differentiator and removes an owner-side "Fix time + reason" cycle.

**Photo: silent or preview?** The fast products take the photo as a side effect of the action tap (Deputy, When I Work, Homebase, 7shifts); only Buddy Punch's selfie prompt adds a step. 7shifts shows the live camera while capturing silently: the worker sees it is on but never poses or confirms. Keep PLAN 3.1. Photos "may fail to save" on weak networks ([7shifts](https://kb.7shifts.com/hc/en-us/articles/4417513739539-Buddy-Punch-Prevention)), so the punch must never depend on the upload; Deputy also queues and uploads on reconnect.

### 1.3 Face recognition: recommend against for v1

- Illinois BIPA has "no small-business carve-out" ([Enzuzo](https://www.enzuzo.com/blog/illinois-biometric-act-bipa)). Time-clock settlements are routine: ZK Technology, $800–$2,000 per claimant for finger or face scans ([Dapeer](https://www.dapeer.com/open-settlements/zk-technology-bipa-settlement)); Thermoflex $9M, ~$900 each ([Dapeer](https://www.dapeer.com/open-settlements/thermoflex-bipa-settlement)); Accu-Time $1.5M ([ID Tech](https://idtechwire.com/accu-time-reaches-1-5-million-settlement-in-illinois-bipa-fingerprint-time-clock-case/)). The 2024 amendment caps repeated scans at one violation per person; exposure is lower, not gone.
- Consent must precede the first scan; moving existing staff from PIN to face "triggers a fresh consent obligation for every existing employee" ([CloudApper, vendor blog](https://ukg.cloudapper.ai/time-capture/biometric-privacy-law-ukg-time-clock/)) **[weak]**.
- It is also operationally worse: Deputy's Face Unlock "is unavailable when the kiosk is offline" while PIN works ([Deputy FAQ](https://help.deputy.com/hc/en-au/articles/4754374426511-Deputy-Kiosk-for-iPad-FAQs)); Jibble's PIN fallback is off by default; Buddy Punch's "Face ID" is Apple's on-device Face ID, iPad-only and per logged-in user, the wrong model for a shared tablet ([Buddy Punch](https://buddypunch.com/blog/face-recognition-time-clock-app/)).
- A photo attached to a punch is not a biometric identifier as long as we never run matching on it; Homebase sells exactly that distinction ([Homebase](https://www.joinhomebase.com/time-clock/biometric-time-clock)). Keep photo-on-punch a per-salon setting, store photos only, and say so in the privacy notice.

---

## 2. Fastest ticket entry in salon and quick-service POS

| Pattern | Who does it | What it costs the cashier |
|---|---|---|
| Item tile grid: "Tap an item tile to add it to the cart"; variation tiles add "immediately without opening the item details screen" | Square POS item grid ([Square](https://squareup.com/help/us/en/article/8334-set-up-item-grid)) | 1 tap per line |
| Repeat line: "Repeat" re-adds the selected item, quantity defaults to 1 | Toast ([Toast](https://support.toasttab.com/article/Starting-Sending-an-Order)) | 1 tap |
| Smart tip presets: under $10 → No tip / $1 / $2 / $3; $10+ → No tip / 15 / 20 / 25%; custom allowed; round-up option | Square ([Square tipping](https://squareup.com/help/us/en/article/8631-set-up-and-customize-tipping)) | 1 tap |
| Up to five custom tip values, percentage or set dollar amount | Vagaro ([Vagaro custom tips](https://www.vagaro.com/pro/updates/custom-tips)) | 1 tap |
| Max four tip suggestions, each a percentage or amount with a label | Clover ([Clover docs](https://docs.clover.com/dev/docs/requesting-a-tip)) | 1 tap |
| Preset percentages plus custom on the tip screen; cash tips added later as a pay-run adjustment | Fresha ([Fresha tips](https://www.fresha.com/help-center/knowledge-base/sales/352-set-up-and-manage-tips); [tips to pay run](https://www.fresha.com/help-center/knowledge-base/team/589-add-tips-to-a-pay-run)) | 1 tap |
| Turn tracker: "the technician will click on his or her name, and then choose the service" | Nails 123 manual, typical nail-POS flow ([AtSoft](https://atsoft123.com/Docs/123Manual_E.pdf)) | 2 taps |
| "60-second checkout with preset tip suggestions" | GPOS nail POS ([GPOS](https://www.gposdev.com/)) | — |
| Zota: "Easy for technician to create ticket and payment", 8 turn-queue modes, second-screen turn monitor | Zota POS ([Zota](https://zotaservices.com/salon-pos/)) | undocumented |

Mango, GPOS and Zota publish no screen-level documentation; the nail-POS evidence is marketing plus the Nails 123 manual **[weak]**. The lesson that holds across Square, Toast, Vagaro and Clover: anything chosen more than ten times a day is a tile, not a text field or dropdown. Baymard calls drop-downs "a poor choice for offering fewer than 5 or more than 10 options" ([Baymard](https://baymard.com/research-articles/drop-down-usability)); a CXL test found radio buttons 2.5 s faster than selects (n=354 each) ([Speero/CXL](https://speero.com/post/form-field-usability-revisited-select-menus-vs-radio-buttons-original-research)).

For numbers, GOV.UK moved from `type="number"` to `type="text" inputmode="numeric"` because spinners, zoom and autofill "hurt more users than they helped", while keeping the telephone-style keypad users prefer ([GOV.UK](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/)); prices and tips take `inputmode="decimal"`. Nail tips are whole dollars, not percentages (research 06 rule 1), so Square's under-$10 whole-dollar logic scaled up is the model: $0 / $5 / $10 / $20 / custom, separately for card and cash tip.

---

## 3. Payroll approval flows

| Product | Steps to money | Review screen | Warnings | "Same as last time" |
|---|---|---|---|---|
| Gusto | Run payroll → review hours & earnings → Submit (3) ([Gusto](https://gusto.com/product/how-gusto-works); [Merchant Maverick](https://www.merchantmaverick.com/how-to-use-gusto-payroll/)) | One row per person: hours, OT, commissions, payment method; totals of wages, taxes, debit | "Review summary" and flagged pay changes before the withdrawal figure ([Gusto help](https://support.gusto.com/article/999754831000000/run-a-regular-payroll-for-admins)) | AutoPilot runs a day before the deadline, 24 h to cancel; off if approvals or check payments exist ([Gusto](https://support.gusto.com/article/999755421000000/Use-and-manage-Payroll-on-AutoPilot)) |
| Square Payroll | Start run → payment method → pay period → Import time → Adjustments → Confirm Withdrawal (6) ([Square](https://squareup.com/help/us/en/article/5855-run-payroll)) | Grid: regular, OT, PTO, tips, commission | OT and double-time "in red" with the reason ([Square](https://squareup.com/help/us/en/article/8390-set-your-work-period-and-overtime-rules)) | Automatic payroll finalises at 8 PM PT, cancellable until then ([Square](https://squareup.com/help/us/en/article/6083-set-up-automatic-payroll)) |
| Homebase | Review timecards → "Run Payroll" ([Homebase](https://www.joinhomebase.com/payroll); [mobile](https://www.joinhomebase.com/payroll/mobile)) | Timecards first, payroll second, on phone | Red Errors column: missed break, missed clock-out, no-show ([Homebase](https://joinhomebase.com/blog/inline-employee-time-card-errors)) | — |
| Fresha | Pay team → types → team summary → review → complete (5) ([Fresha](https://www.fresha.com/help-center/knowledge-base/team/100-complete-a-pay-run)) | Per-person totals, adjustments, payment method | — | — |

Our flow (open week → Approve → Mark as paid → confirm) already matches Gusto and beats Square and Fresha. The remaining savings are structural: (1) land the owner on the current week from the home screen; (2) make warnings inline row chips with a reason (Square's red-with-reason) acknowledged in place, not in a modal; (3) pre-fill each technician's payment method and split from the last paid week so Mark as paid is one tap unless something changed (AutoPilot scaled down to a pre-fill, because cash and check payments are exactly what disable Gusto's automation). NN/g reserves modal confirmation for actions that "cannot be undone" ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/)): Approve is reversible with a reason and needs none; Mark as paid records real money and keeps an inline two-press confirm.

---

## 4. Statement delivery

**Web Share API.** Supported in iOS Safari since 12.2 through iOS 26/27, Chrome for Android since 61, Samsung Internet 8+, Firefox for Android 79+, Chrome desktop 128+, Safari desktop 12.1+; not in desktop Firefox, which blocks Baseline ([Can I Use](https://caniuse.com/web-share); [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/features/share/)). On iOS the share sheet's "Copy" takes the `text` value, not the `url` ([Phil Gyford](https://www.gyford.com/phil/writing/2020/04/10/web-share-api/)), so put the link inside the text. Needs HTTPS and a user tap. One Share button reaches Messages, Zalo, Messenger, WhatsApp and email with no clipboard step.

**`sms:` scheme.** Apple documents only `sms:number` and says the URL "must not include any message text" ([Apple](https://developer.apple.com/library/safari/featuredarticles/iPhoneURLScheme_Reference/SMSLinks/SMSLinks.html)); in practice iOS takes `&body=` and Android `?body=`, so guides recommend user-agent detection ([Heymarket](https://www.heymarket.com/blog/sms-url/); [Flutter issue](https://github.com/flutter/flutter/issues/18823); [Seth Larson](https://sethmlarson.dev/sms-urls)). Fallback only, for browsers without `navigator.share`.

**Portals vs links.** Gusto employees see paystubs in the payday email, account or Gusto Wallet only after "a company admin will review your account" ([Gusto](https://support.gusto.com/article/100201315100000/set-up-your-gusto-account-for-employees)); Homebase shows stubs in the app's Earnings/Money tab on payday ([Homebase](https://support.joinhomebase.com/hc/en-us/articles/360062539091-Homebase-Payroll)). Both need an account, a password and English onboarding. The signed no-login link (PLAN 3.5) is lower friction; a home-screen "my statements" page can follow.

**What Vietnamese-speaking workers prefer.** Direct evidence is thin **[weak]**. Zalo has 77–81M monthly users, nearly all in Vietnam ([Infobip](https://www.infobip.com/blog/zalo-business); [Converge](https://useconverge.app/blog/zalo-for-business-vietnam)); overseas users are mainly emigrants keeping family contact ([Prodima](https://prodima.vn/en/what-is-zalo/)), and registering with a US number is a known hurdle ([Expat.com](https://www.expat.com/en/forum/asia/vietnam/939594-using-zalo-app-outside-vietnam.html)). The one US study (37 Vietnamese Americans, three age-banded focus groups) found people willing to receive texts if "simple" and "in both English and Vietnamese", with "different age groups prefer[ring] different texting platforms" ([Ta Park et al., JMIR mHealth 2021](https://mhealth.jmir.org/2021/3/e23058)). Pew puts English proficiency among Vietnamese immigrants at 36% ([Pew](https://www.pewresearch.org/race-and-ethnicity/fact-sheet/asian-americans-vietnamese-in-the-u-s/)). So: SMS is the only channel every tech has; the share sheet lets the owner pick Zalo or Messenger; the body must be bilingual and short.

---

## 5. Mobile navigation for the owner's phone

- Apple: tab bar at the bottom of iPhone screens, few tabs, 49 pt tall, 44 pt targets ([uiuxdesigning](https://uiuxdesigning.com/ios-tab-bar/); [Uxcel](https://app.uxcel.com/courses/mobile-design/ios-app-design-712/minimum-tap-target-size-8996)). The HIG page could not be fetched; the 44 pt figure is secondary **[weak]**.
- Material 3: navigation bar for "three to five destinations of equal importance", icons plus labels at three ([Android Compose docs](https://developer.android.google.cn/develop/ui/compose/components/navigation-bar?hl=ca)); 48×48 dp minimum target, padding included ([Material accessibility](https://m2.material.io/design/usability/accessibility.html); [Android accessibility help](https://support.google.com/accessibility/android/answer/7101858?hl=en)); 80 dp bar container ([spec mirror](https://pkg.go.dev/github.com/zodimo/go-compose/compose/material3/navigationbar)).
- Hoober's 1,333-observation field study: 49% one-handed, 36% cradled, 15% two-handed; 67% of one-handed use is right-thumb ([UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php); [Osmani's caveat on "75%"](https://addyosmani.com/blog/touch-friendly-design/)). Primary action in the bottom third; do not park dangerous actions top-left assuming nobody reaches them.
- Owner dashboards: Toast Now's home is "two bar graphs show sales and labor data for the selected date", one date at a time, calendar icon to "return to today" ([Toast Now](https://support.toasttab.com/en/article/Get-Started-with-the-Toast-Now-App)); Square's widget shows gross sales, net sales, transactions, average sale ([Square](https://squareup.com/help/us/en/article/5618-get-started-with-the-square-dashboard-app)); Homebase shows paid hours, wages, sales, labour % and "team members with status indicators" ([Homebase](https://joinhomebase.com/features/labor-cost); [release notes](https://www.apkmirror.com/?p=6318452)). None shows money owed; that red number is ours.

Decision: three bottom tabs (Today, Pay, More), 56 px bar, 48 px targets, "owed this week" and "who is in now" on Today.

---

## 6. Forms for low-English-proficiency users

- Text-only interfaces "proved unusable for first-time low-literacy users and error-prone even for literate but inexperienced users"; use graphical cues, local language, shallow navigation ([Medhi, Toyama et al.](https://www.researchgate.net/publication/234829313_Designing_mobile_interfaces_for_novice_and_low-literacy_users)). Icon style (hand-drawn vs lifelike) is contested, so test with the pilot salons ([ACM review](https://dl.acm.org/doi/fullHtml/10.1145/3578837.3578842)). Pair every icon with a Vietnamese word (research 06 §6).
- Numeric-first inputs: GOV.UK pattern above; a chip beats typing for anything under ten choices (Baymard).
- Defaults: sticky technician (PLAN 3.2), price from service, payment and tip chips from the last ticket, pay method from the last paid week.
- Avoid modals (NN/g habituation); use inline two-press buttons and Undo.
- Feedback: a toast "would be a bad way to implement an error message" and suits passive confirmation ([NN/g](https://www.nngroup.com/articles/indicators-validations-notifications/)); toasts with an action such as Undo persist until dismissed ([Carbon](https://carbondesignsystem.com/patterns/notification-pattern/)). On the kiosk the person walks away, so a full-screen check with time and hours (as 7shifts and Deputy show after a punch) is right; on owner forms, highlight the new row and show a snackbar with Undo.
- Colour: WCAG 1.4.1 permits red for negatives only with a second cue (minus sign, parentheses, label) and advises against pure red/green pairs ([W3C](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-without-color.html); [Deque](https://www.deque.com/blog/ensuring-negative-numbers-are-available-for-everyone/); [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Use_of_color)). Red "owed" cells must also read "Còn nợ / Owed" with a signed amount.

---

## 7. Prioritised changes for our five flows

Baseline: (a) kiosk 6 taps, (b) add ticket 5–6 interactions plus typing, (c) weekly pay 4 clicks, (d) statement 3+ plus an app switch and paste, (e) import 3.

| # | Flow | Change | Saves | Copies |
|---|---|---|---|---|
| 1 | a | PIN identifies the tech without a name tap: PINs unique per salon, auto-generated, 4 digits; the name grid stays as status board and forgotten-PIN fallback | 1 tap (6→5) | 7shifts, Connecteam, Toast, Square |
| 2 | a | Auto-advance on the 4th digit, red-dot clear on failure, no text field so no keyboard | ~1 s, fewer mis-taps | iOS fixed-length passcode; gaiser-lager |
| 3 | a | One full-width button when one action is valid, two when out/break both apply; pilot auto-punch + Undo | 0–1 tap | Deputy, Homebase |
| 4 | a | "Hoàn tác / Undo" on the confirmation screen (10 s) that deletes the punch and logs "undone at kiosk" | An owner Fix-time cycle (3–4 clicks) per mistake | NN/g; Workeasy |
| 5 | a | Photo on the action tap with live preview, never a prompt; punch succeeds if the upload fails | 1 tap vs selfie prompt | Deputy, 7shifts, When I Work |
| 6 | a | No face recognition in v1; photo-on-punch per salon, "photos only, no matching" in the privacy notice | risk, not taps | BIPA settlements; Homebase |
| 7 | b | Service tile grid of the salon's 8–12 most-used services above the autocomplete; tap adds the service with its default price | ~5 keystrokes + 1 pick → 1 tap | Square item grid, variation tiles |
| 8 | b | Tip chips $0 / $5 / $10 / $20 / custom for card tip and for cash tip; custom opens an `inputmode="decimal"` keypad | 2–3 keystrokes + focus → 1 tap each | Square Smart Tips, Vagaro five custom values, Clover |
| 9 | b | Payment method as two chips (Cash / Card) defaulting to the last ticket's value; no dropdown | 2 taps → 0–1 | Baymard <5 options; Square |
| 10 | b | "Lặp lại / Repeat last" button per technician that clones the previous ticket (service, price, payment) and leaves tips to confirm | 3–4 taps → 1 | Toast Repeat |
| 11 | b | Keypad "Done" submits the ticket; the Add button stays at the bottom of the panel, 56 px tall | 1 tap when typing a custom tip | GOV.UK keypad; thumb zone |
| 12 | b | Net effect: tech (sticky, 0) + service tile (1) + tip chip (1) + Add/Done (1) = 3 interactions, zero typing for a standard ticket | 5–6 → 3 | research 06 rule 15 |
| 13 | c | Home-screen tile "Owed this week $X · approve by Monday" deep-links to the open week | 1 click (4→3) | Toast Now today-first home; Homebase labor card |
| 14 | c | Approve with an inline two-press button (press → "Confirm $X for 6 people") instead of a modal; warnings are row chips acknowledged in place; only an open punch blocks | 1 click; no modal | Square red-with-reason; NN/g |
| 15 | c | "Mark as paid" pre-filled with each technician's method and cash/check split from the last paid week; one tap unless edited | 1 click per technician edited | Gusto AutoPilot, Square automatic payroll, scaled to pre-fill |
| 16 | d | One "Gửi / Send" button using `navigator.share({title, text: message + link})`; bilingual two-line body; fallback `sms:` with UA-specific body separator, then copy | 3+ and an app switch → 2 (Send, pick app) | Web Share API support table; Heymarket |
| 17 | d | "Send all statements" on the paid week that walks through techs one share-sheet at a time, remembering who was sent | n×3 → n×1 | — [inference] |
| 18 | e | Preview is the confirm: when every staff name matches and there is at least one new row, the primary button on the preview reads "Nhập N phiếu / Import N tickets" | 3→2 | Fresha review-step pattern |
| 19 | e | Remember the name mapping per source format so the mapping dropdowns appear only for genuinely new names | 1–3 dropdowns per import | — [inference] |
| 20 | all | Phone: three bottom tabs (Today, Pay, More), 48 px targets, primary actions in the bottom third; tablet: 64 px PIN keys as already specified | reach, not taps | Apple HIG, Material 3, Hoober |

Items 7, 8 and 16 matter most: they turn the two most frequent actions (adding a ticket, sending a statement) from typing into tapping, which is what research 06 §6 asks for on behalf of workers who read English at sight-word level.

---

## Sources (all accessed 2026-10-07)

Time clocks and kiosks
- Clockify, Clock in and out via kiosk: https://clockify.me/help/track-time-and-expenses/clock-in-and-out-via-kiosk
- Clockify, Kiosk clock-in authentication: https://clockify.me/help/track-time-and-expenses/pin
- 7shifts, How to punch in and out: https://kb.7shifts.com/hc/en-us/articles/21932538945171-7punches-for-Employees-How-to-Punch-In-and-Out-Using-7punches
- 7shifts, Punch IDs: https://kb.7shifts.com/hc/en-us/articles/4417519713043-Punch-IDs-for-Employees
- 7shifts, Buddy punch prevention: https://kb.7shifts.com/hc/en-us/articles/4417513739539-Buddy-Punch-Prevention
- Toast, Clock in and out for shifts and breaks: https://support.toasttab.com/en/article/Clocking-In-and-Out-for-Shifts-and-Breaks
- Square, Clock in and out for team members: https://squareup.com/help/us/en/article/8395-clock-in-and-out-for-team-members
- Square, Require passcodes at point of sale: https://squareup.com/help/us/en/article/8357-require-passcodes-at-point-of-sale
- Deputy, Touchless clock in: https://help.deputy.com/hc/en-au/articles/4754361296527-Touchless-clock-in-with-Deputy-Kiosk-for-iPad
- Deputy, Photo verification setting: https://help.deputy.com/hc/en-au/articles/4754348479631-Disable-enable-photo-verification-for-timesheets-on-the-Deputy-Kiosk-Time-Clock-apps
- Deputy, Kiosk for iPad FAQs: https://help.deputy.com/hc/en-au/articles/4754374426511-Deputy-Kiosk-for-iPad-FAQs
- Homebase, Android time clock: https://support.joinhomebase.com/hc/en-us/articles/360030670872-The-Homebase-Android-Time-Clock
- Homebase, Biometric time clock: https://www.joinhomebase.com/time-clock/biometric-time-clock
- Homebase, Inline time card errors: https://joinhomebase.com/blog/inline-employee-time-card-errors
- Buddy Punch, Kiosk PIN punching: https://docs.buddypunch.com/en/articles/3416037-how-to-set-up-use-the-kiosk-pin-punching
- Buddy Punch, Photo on punch: https://buddypunch.com/time-clock-software/features/photo-on-punch/
- Buddy Punch, Face recognition apps: https://buddypunch.com/blog/face-recognition-time-clock-app/
- Connecteam, Best time clock kiosk apps: https://connecteam.com/best-time-clock-kiosk-apps/
- When I Work, Clocking in and out: https://help.wheniwork.com/articles/clock-in-and-out/
- Jibble, Managing kiosk settings: https://www.jibble.io/help/managing-kiosk-settings
- Jibble, Clocking in with a PIN: https://www.jibble.io/help/clocking-in-and-out-with-a-pin
- Workeasy, Smart clocking: https://help.workeasysoftware.com/docs/enable-and-disable-smart-clocking
- tempertemper, Custom numeric passcodes on iPhone: https://www.tempertemper.net/blog/custom-numeric-passcodes-on-iphone
- Apple Community, OK button on passcode: https://discussions.apple.com/thread/253230794
- UX Good Patterns, Auto-submit verification code: https://uxgoodpatterns.com/example/auto-submit-code/
- gaiser-lager, Kiosk PIN without on-screen keyboard: https://github.com/firsttris/gaiser-lager/pull/16

BIPA
- Enzuzo, BIPA 2026 guide: https://www.enzuzo.com/blog/illinois-biometric-act-bipa
- Dapeer, ZK Technology settlement: https://www.dapeer.com/open-settlements/zk-technology-bipa-settlement
- Dapeer, Thermoflex settlement: https://www.dapeer.com/open-settlements/thermoflex-bipa-settlement
- ID Tech, Accu-Time settlement: https://idtechwire.com/accu-time-reaches-1-5-million-settlement-in-illinois-bipa-fingerprint-time-clock-case/
- CloudApper (vendor blog), Biometric privacy laws: https://ukg.cloudapper.ai/time-capture/biometric-privacy-law-ukg-time-clock/

POS and ticket entry
- Square, Set up item grid: https://squareup.com/help/us/en/article/8334-set-up-item-grid
- Square, Set up and customize tipping: https://squareup.com/help/us/en/article/8631-set-up-and-customize-tipping
- Toast, Start and send an order: https://support.toasttab.com/article/Starting-Sending-an-Order
- Vagaro, Enter custom tips: https://www.vagaro.com/pro/updates/custom-tips
- Clover, Requesting a tip: https://docs.clover.com/dev/docs/requesting-a-tip
- Fresha, Set up and manage tips: https://www.fresha.com/help-center/knowledge-base/sales/352-set-up-and-manage-tips
- Fresha, Add tips to a pay run: https://www.fresha.com/help-center/knowledge-base/team/589-add-tips-to-a-pay-run
- AtSoft, Nails 123 manual: https://atsoft123.com/Docs/123Manual_E.pdf
- GPOS: https://www.gposdev.com/
- Zota POS: https://zotaservices.com/salon-pos/
- Baymard, Drop-down usability: https://baymard.com/research-articles/drop-down-usability
- Speero/CXL, Select menus vs radio buttons: https://speero.com/post/form-field-usability-revisited-select-menus-vs-radio-buttons-original-research
- GOV.UK, Why we changed the input type for numbers: https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/

Payroll
- Gusto, How Gusto works: https://gusto.com/product/how-gusto-works
- Gusto, Run a regular payroll: https://support.gusto.com/article/999754831000000/run-a-regular-payroll-for-admins
- Gusto, Payroll on AutoPilot: https://support.gusto.com/article/999755421000000/Use-and-manage-Payroll-on-AutoPilot
- Merchant Maverick, How to run Gusto payroll: https://www.merchantmaverick.com/how-to-use-gusto-payroll/
- Square, Run payroll for W-2 employees: https://squareup.com/help/us/en/article/5855-run-payroll
- Square, Set up automatic payroll: https://squareup.com/help/us/en/article/6083-set-up-automatic-payroll
- Square, Work period and overtime rules: https://squareup.com/help/us/en/article/8390-set-your-work-period-and-overtime-rules
- Homebase, Payroll: https://www.joinhomebase.com/payroll ; Mobile payroll: https://www.joinhomebase.com/payroll/mobile
- Fresha, Complete a pay run: https://www.fresha.com/help-center/knowledge-base/team/100-complete-a-pay-run

Statement delivery
- Can I Use, Web Share API: https://caniuse.com/web-share
- web-features explorer, navigator.share: https://web-platform-dx.github.io/web-features-explorer/features/share/
- Phil Gyford, Weird Web Share API: https://www.gyford.com/phil/writing/2020/04/10/web-share-api/
- Apple, SMS links: https://developer.apple.com/library/safari/featuredarticles/iPhoneURLScheme_Reference/SMSLinks/SMSLinks.html
- Heymarket, SMS URL: https://www.heymarket.com/blog/sms-url/
- Flutter issue 18823, sms scheme iOS vs Android: https://github.com/flutter/flutter/issues/18823
- Seth Larson, SMS URLs: https://sethmlarson.dev/sms-urls
- Gusto, Set up your account (employees): https://support.gusto.com/article/100201315100000/set-up-your-gusto-account-for-employees
- Homebase, Homebase Payroll help: https://support.joinhomebase.com/hc/en-us/articles/360062539091-Homebase-Payroll
- Infobip, Zalo for business: https://www.infobip.com/blog/zalo-business
- Converge, Zalo for business 2026: https://useconverge.app/blog/zalo-for-business-vietnam
- Prodima, What is Zalo: https://prodima.vn/en/what-is-zalo/
- Expat.com, Using Zalo outside Vietnam: https://www.expat.com/en/forum/asia/vietnam/939594-using-zalo-app-outside-vietnam.html
- Ta Park et al., JMIR mHealth 2021;9(3):e23058: https://mhealth.jmir.org/2021/3/e23058
- Pew Research, Vietnamese in the U.S. fact sheet: https://www.pewresearch.org/race-and-ethnicity/fact-sheet/asian-americans-vietnamese-in-the-u-s/

Navigation and dashboards
- Uxcel, iOS minimum tap target: https://app.uxcel.com/courses/mobile-design/ios-app-design-712/minimum-tap-target-size-8996
- uiuxdesigning, iOS tab bar guide: https://uiuxdesigning.com/ios-tab-bar/
- Android developers, Navigation bar (Compose): https://developer.android.google.cn/develop/ui/compose/components/navigation-bar?hl=ca
- Material, Accessibility (48 dp targets): https://m2.material.io/design/usability/accessibility.html
- Android Accessibility Help, Touch target size: https://support.google.com/accessibility/android/answer/7101858?hl=en
- M3 navigation bar spec mirror (80 dp): https://pkg.go.dev/github.com/zodimo/go-compose/compose/material3/navigationbar
- Hoober, How do users really hold mobile devices?: https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php
- Addy Osmani, Modern touch-friendly design: https://addyosmani.com/blog/touch-friendly-design/
- Toast, Get started with Toast Now: https://support.toasttab.com/en/article/Get-Started-with-the-Toast-Now-App
- Square, Square Dashboard app: https://squareup.com/help/us/en/article/5618-get-started-with-the-square-dashboard-app
- Homebase, Labor cost: https://joinhomebase.com/features/labor-cost ; release notes 4.41.1: https://www.apkmirror.com/?p=6318452

Forms, feedback, colour
- Medhi, Toyama et al., Designing mobile interfaces for novice and low-literacy users: https://www.researchgate.net/publication/234829313_Designing_mobile_interfaces_for_novice_and_low-literacy_users
- ACM, Interface design guidelines for low-literate users (review): https://dl.acm.org/doi/fullHtml/10.1145/3578837.3578842
- NN/g, Confirmation dialogs: https://www.nngroup.com/articles/confirmation-dialog/
- NN/g, Indicators, validations, and notifications: https://www.nngroup.com/articles/indicators-validations-notifications/
- Carbon Design System, Notifications: https://carbondesignsystem.com/patterns/notification-pattern/
- W3C, Understanding SC 1.4.1: https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-without-color.html
- Deque, Negative numbers for everyone: https://www.deque.com/blog/ensuring-negative-numbers-are-available-for-everyone/
- MDN, Use of color: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Use_of_color
