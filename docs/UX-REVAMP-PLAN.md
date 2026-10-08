# UX revamp plan: the second interface of Salon Pay Records

**Status:** plan only, written 2026-10-08. Nothing in the app changes until a ticket below is implemented.
**Implementer:** each ticket is written so that Opus 5.5 can pick it up alone, in order, without re-reading the research.
**Inputs:** the before-screenshots in `docs/ux-audit/2026-10-08-before/`, the evidence memo `research/11-ui-ux-patterns-and-evidence.md` (rules R1-R30), research 06 §5-6 (user voices, 19 rules) and research 09 §7 (click budget).
**Does not change:** the pay engine, the rules table, the data model except the three small additions named in tickets UX-30, UX-46 and UX-49, the exports, the PDF binder content, the PIN security model, the offline queue.

---

## 0. How to use this document

1. Work the phases in order (P0 → P6). P0 is the foundation; every later ticket assumes it.
2. A ticket has: **Goal**, **Why** (which R-rules and audit findings it answers), **Spec**, **Files**, **Done when** (acceptance criteria), **Tests**, **Size** (S ≤ 2 h, M ≤ 1 day, L 1-3 days), **Depends on**.
3. Every new string gets an `en` and a `vi` key in `app/src/lib/i18n/messages.ts` (Appendix A lists them). Vietnamese wording follows `research/glossary-en-vi.json` and research 06 §6 (short noun phrases, salon vocabulary: vào ca, ra ca, phiếu, bao lương, ăn chia, tip thẻ, tip mặt).
4. Keep `pnpm check`, `pnpm test` and `pnpm e2e` green in every ticket; when a selector changes, update `app/e2e/smoke.spec.ts` in the same ticket.
5. After each phase, run the screenshot script from UX-09 and commit the images to `docs/ux-audit/<date>-after/` so the before/after is on record.
6. The "do not" list for the whole revamp: no modal confirmation except delete, unpair and reopen (R12); no dropdown for five or fewer options (R20); no emoji or Unicode symbols as icons (R2); no text under 14 px on screen except 12 px tab labels and print (R5); no colour outside the tokens in §3 (R9); no change to `app/src/lib/pay/**`, `app/src/lib/rules/**`, `app/src/lib/server/payrollExport.ts`.

---

## 1. What the audit found

Screens were captured from the demo salon at 390×844 (phone, 2×), 1024×768 (tablet) and the kiosk at 1024×768, in English and Vietnamese. Files are in `docs/ux-audit/2026-10-08-before/`.

### 1.1 Cross-cutting problems

| # | Finding | Where it shows | Breaks | Fixed by |
|---|---|---|---|---|
| A1 | Icons are emoji and loose Unicode glyphs (📅 💵 👥 📁 ⚙️ ⇪ ⇩ 🖨 ✉ ↻ ↶ ‹ ›); they render differently on iPad, Android and Windows and carry no label in several places | bottom nav, buttons on Today, Pay week, Statement | R2 | UX-02 |
| A2 | Five bottom tabs with 11 px labels; "Audit binder" and "Hồ sơ kiểm tra lao động" wrap to two lines and collide | `phone-today-vi.jpg` | R5, R14, R26 | UX-05 |
| A3 | Rare actions sit in prime positions: Import CSV and Add clock-in by hand are the first two buttons on Today; Sign out and the language toggle take the header of every screen | `phone-today.jpg`, every owner screen | R3, R15 | UX-05, UX-19, UX-26, UX-27 |
| A4 | The primary action is often disabled and drawn as a washed-out teal (white text on 50% teal is 2.14:1), which reads as "loading" or "broken" | `tablet-pay-week-draft.jpg` (Approve), Today add button | R7, R11 | UX-01, UX-03 |
| A5 | Tables overflow on phones: Pay week (16 columns), Technicians (7), Audit (7), Import preview (9); horizontal scroll inside a card is not discoverable and the Edit link of a technician is off-screen | `phone-pay-week-paid.jpg`, `phone-workers.jpg`, `phone-audit.jpg` | R18 | UX-07, UX-35, UX-43, UX-50 |
| A6 | Text under 14 px is common: table cells at 12 px, tab labels 11 px, eyebrow labels 12 px uppercase; uppercase is applied to Vietnamese ("TUẦN NÀY ĐẾN GIỜ") | all | R5, R26 | UX-01 |
| A7 | Tip presets are 36×40 px buttons packed with no gap ("3 5 10 20"); kiosk tiles are 96 px tall with 20 px names; many targets are under 48 px | `tablet-today.jpg`, `kiosk-grid.jpg` | R4 | UX-20, UX-11 |
| A8 | Red is used for four different things: owed by law, the Clock out button, Void/Delete/Unpair links, and error text | `kiosk-actions.jpg`, `phone-settings.jpg` | R6, R8 | UX-01, UX-13 |
| A9 | Status is colour-only in places (owed cells are a pink background with a number; kiosk "in" is a green card) | `tablet-pay-week-draft.jpg`, `kiosk-grid-one-in.jpg` | R6 | UX-11, UX-35 |
| A10 | Empty states are two grey sentences repeated per technician ("Nobody has clocked in yet." / "No tickets for this day yet.") and give no next step; Import is a bare file input | `phone-today.jpg`, `tablet-import.jpg` | R28 | UX-28, UX-49, UX-53 |
| A11 | No pending state on any form button; no skeleton while the week is computed; the only toast is "Added" | all forms | R11, R27 | UX-03, UX-04, UX-54 |
| A12 | Confirmations are inline forms that appear in place with no amount shown (Approve, Mark paid) and reasons are free text everywhere | Pay week, Today | R12, R22 | UX-23, UX-37 |
| A13 | The statement's "How computed" prints variable names (`salesCents: $835.00 · commissionPct: 60%`) to a technician | `tablet-statement.jpg` | R29 | UX-40 |
| A14 | The legal line "This app keeps records and shows arithmetic. It is not legal advice." is in the footer of every screen in 12 px stone-400 (2.52:1) | all | R7 | UX-10 |
| A15 | Placeholders are used as labels in the add-login form; checkboxes are 13 px native boxes | `phone-settings.jpg` | R19, R4 | UX-47 |
| A16 | The date picker is hidden on phones (`hidden sm:block`); the only way to another day is the arrow, one day per tap | `phone-today.jpg` | R3 | UX-19 |
| A17 | Input borders are stone-300 (1.49:1 against white); focus ring is fine (3.74:1) | all inputs | R7 (1.4.11) | UX-01 |
| A18 | The kiosk grid leaves two thirds of the screen empty with five technicians; status text is 14 px grey; no avatar, no elapsed time, no ticket count unless enabled, prompt in one language | `kiosk-grid.jpg` | R24 | UX-11 |
| A19 | Settings is one 4,700 px page mixing salon profile, rules, tablets and logins | `phone-settings.jpg` | R15 | UX-47 |
| A20 | The owner has no screen that answers "what needs me today"; the week card is the closest, and it is below two secondary buttons | `phone-today.jpg` | §3 dashboards in memo 11 | UX-29 |

### 1.2 Screen by screen

| Screen | Works | Does not | Ticket |
|---|---|---|---|
| Login / Signup / Pair | Short, labelled, large fields | Tagline competes with the heading; no show-password; pair page cannot be reached from a phone header | UX-51 |
| Today (phone) | Three-tap ticket builder exists; week card; per-technician cards | Builder is 1,100 px tall and sits above the log; cards are long tables; secondary buttons on top; date picker missing | UX-19, UX-20, UX-24 |
| Today (tablet) | Two columns; builder pinned | Builder column is 360 px with 36 px tip buttons; left column is a wall of tables; OS keyboard covers the builder when typing a price | UX-21, UX-22 |
| Pay runs list | Status chips, owed highlighted | Owed cell is colour plus a number only; duplicate link and Open button; no "current week" framing | UX-34 |
| Pay week | Totals, flags, export buttons, one-click mark paid | 16 columns; flags as tall pill stacks inside the name cell; disabled Approve; Details is a raw checkbox; no "what blocks approval" list | UX-35, UX-36, UX-37 |
| Statement | Complete content, bilingual, print, share | Variable names in "How computed"; toolbar of 6 buttons; language as two buttons; no sticky share on phone | UX-40 |
| Technicians | Clear pay basis wording | 7-column table; Edit off-screen on phone; no avatar, no PIN state | UX-43 |
| Technician form | Only relevant rate fields show | One long form, 12 fields before the pay basis; "Ended on" on creation; PIN is a text field with a hint | UX-44, UX-45 |
| Settings | Everything is there | Everything is there, on one page; placeholder labels; small checkboxes; duplicate paired tablets listed without a warning | UX-47, UX-48 |
| Import | Format sniffing, mapping, preview | Bare file input; no guidance on which export to download; mapping dropdowns every time | UX-49 |
| Audit binder | Export PDF/zip, filters, history | Filter card first, export second; 7-column 12 px table; raw IDs; no presets | UX-50 |
| Kiosk grid | Colour by state; language per technician | Tiles small and few; prompt monolingual; no avatar; status text small | UX-11 |
| Kiosk PIN | Phone layout, 64 px keys, dots, camera preview | Keys could be 72 px; error is text only; back button is a ghost link | UX-12 |
| Kiosk actions | One or two big buttons | Clock out is danger-red; no elapsed time; stale punch note is a paragraph | UX-13 |
| Kiosk done | Big check, time, Undo countdown | No hours today on clock-in, countdown is a number in brackets, Close is a ghost link | UX-14 |

---

## 2. Principles for the new interface

These are the ten sentences the implementer should be able to recite. Each maps to the evidence memo.

1. **One screen, one job, one filled button.** The primary action is in the bottom third on phones and sticky when the page is long; everything else is outlined or text (R3).
2. **Tap, don't type.** Chips, tiles, keypads and presets before text fields; typing is the fallback for the unusual ticket (R20, R21, research 06 rule 15).
3. **The number that matters comes first, with its verdict.** "$1,904.25 owed by law" with an icon and a label, upper-left, 32 px; supporting numbers smaller; three to seven numbers per screen (R17).
4. **Colour tells status, never alone.** Every status is colour + icon + word; red belongs to "owed by law" and to the confirm step of destructive actions, nothing else (R6, R8).
5. **Big enough for a thumb at arm's length.** 48 px targets, 56 px primaries, 64-72 px on the kiosk, 8 px gaps, 16 px text (R4, R5).
6. **Everything is undoable; almost nothing asks "are you sure".** Act, then offer Undo for 8 s; the exceptions are approve, mark paid, reopen, delete and unpair, which use an inline two-press button that states the amount (R12).
7. **Both languages are first-class, and Vietnamese sets the layout limits.** Labels are measured in Vietnamese at 390 px; no uppercase; line-height 1.3 in buttons; the kiosk prompt is bilingual (R26).
8. **Familiar beats clever.** Square's tile grid and tip presets, Homebase's PIN flow, iOS passcode dots, the phone's share sheet; the owner's muscle memory from the current app is kept where it exists (R16, R30).
9. **Show the state of the world.** Who is in, what is pending, what was sent, what is offline, always visible without a tap (R11, memo 11 §1).
10. **Fast feels fast.** Pressed state under 100 ms, pending state after 300 ms that stays until the response, no layout jumps, optimistic append only for tickets (R11, R27).

## 3. Design system

Tailwind v4 stays. Tokens live in `app/src/app.css` under `@theme`; components use only token names. Contrast ratios below were computed with the WCAG formula on 2026-10-08.

### 3.1 Colour roles

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--color-canvas` | `#fafaf9` (stone-50) | page background | |
| `--color-surface` | `#ffffff` | cards, sheets, kiosk tiles when "out" | |
| `--color-ink` | `#1c1917` (stone-900) | body text, numbers | 17.5:1 on white |
| `--color-ink-muted` | `#57534e` (stone-600) | secondary text, labels | 7.6:1 white, 7.3:1 canvas |
| `--color-ink-hint` | `#78716c` (stone-500) | hints, placeholders; only on white or canvas, never on stone-100 | 4.8:1 white, 4.6:1 canvas |
| `--color-border` | `#d6d3d1` (stone-300) | decorative rules, card edges, table rules | decorative only |
| `--color-border-strong` | `#78716c` (stone-500) | input and outlined-button borders (1.4.11 needs 3:1) | 4.8:1 |
| `--color-brand` | `#0f766e` (teal-700) | primary buttons, active tab, links | 5.5:1 white text on it |
| `--color-brand-strong` | `#115e59` (teal-800) | pressed primary, link hover | 7.6:1 |
| `--color-brand-soft` | `#f0fdfa` (teal-50) | selected chip background, active tab tint | pair with brand-strong text, 7.3:1 |
| `--color-focus` | `#0d9488` (teal-600) | 2 px focus ring, 2 px offset | 3.7:1 |
| `--color-ok` / `--color-ok-soft` / `--color-ok-ink` | `#15803d` / `#dcfce7` / `#166534` | clocked in, paid, success | ok-ink on ok-soft 6.5:1 |
| `--color-warn` / `--color-warn-soft` / `--color-warn-ink` | `#b45309` / `#fef3c7` / `#92400e` | on break, open punch, offline, needs attention | warn-ink on warn-soft 6.4:1 |
| `--color-owed` / `--color-owed-soft` | `#b91c1c` (red-700) / `#fef2f2` (red-50) | "owed by law" numbers, overtime cells, below-minimum flags; never a button | 6.5:1 white, 5.9:1 on soft |
| `--color-danger` | `#dc2626` (red-600) | the confirm step of delete, unpair, reopen, void; white text | 4.8:1 |
| `--color-info` / `--color-info-soft` / `--color-info-ink` | `#1d4ed8` / `#dbeafe` / `#1e40af` | approved status, informational banners | info-ink on info-soft 7.2:1 |
| `--color-neutral-fill` | `#1c1917` (stone-900) | the kiosk's big action button (Clock in, Clock out); white text | 17.5:1 |
| `--color-disabled-bg` / `--color-disabled-ink` | `#e7e5e4` (stone-200) / `#57534e` (stone-600) | disabled buttons keep readable text and a visible shape | about 6:1 |

Rules: status pills are `*-soft` background + `*-ink` text + icon + word. The kiosk "in" tile uses `ok-soft` fill with an `ok-ink` 2 px border and a clock icon; "break" uses `warn-soft`; "out" is white. Avatar backgrounds come from a fixed list of eight muted hues keyed by a hash of the worker id, with white or ink initials chosen for 4.5:1 (UX-03).

### 3.2 Typography

Noto Sans stays (bundled, Vietnamese coverage verified in v1). Add the 600 weight file only if the design needs it; otherwise use 400 and 700.

| Role | Size / line-height | Weight | Where |
|---|---|---|---|
| Key number | 32 px / 1.1, `tabular-nums` | 700 | week card, kiosk clock, statement total |
| H1 | 24 px / 1.25 | 700 | page titles |
| H2 | 20 px / 1.3 | 700 | card titles, technician names on Today |
| Body | 16 px / 1.45 | 400 | everything else; inputs are 16 px (iOS zoom) |
| Secondary | 14 px / 1.4 | 400 | table meta, hints, pills; never for the primary content of a cell |
| Tab label | 12 px / 1.2 | 600 or 700 | bottom tabs only |
| Kiosk name | 28-32 px / 1.2 | 700 | tiles |
| Kiosk status | 18 px / 1.3 | 400 | tiles |
| Kiosk key | 28 px | 600 | PIN digits |
| Print | 11-12 px | | statement and binder PDFs only |

No `uppercase` anywhere (R26). Eyebrow labels are 14 px, weight 700, `ink-muted`, sentence case. Money uses `fmtCents`; cents are never dropped on pay screens.

### 3.3 Spacing, shape, elevation

- 4 px base; spacing steps 4, 8, 12, 16, 24, 32, 48.
- Page gutter 16 px on phones, 24 px on tablets, content max-width 1120 px on desktop.
- Card padding 16 px (phone) / 20 px (tablet); card radius 16 px; button and input radius 12 px; chip radius 999 px; kiosk tiles 20 px.
- Elevation: cards `shadow-sm` + 1 px border; sheets `shadow-xl`; nothing else casts a shadow. Pressed buttons translate 1 px down and darken (brand-strong).
- Gaps inside a card are smaller than gaps between cards (common region).

### 3.4 Touch targets

48×48 px minimum for every interactive element, 56 px tall for primary buttons, 64 px minimum and 72 px preferred for kiosk keys and action buttons, kiosk tiles at least 140 px tall, 8 px minimum between targets (12 px on the kiosk). The visible shape may be smaller than the hit area (use padding, never negative margins). UX-09 adds an automated check.

### 3.5 Iconography

`@lucide/svelte`, 20 px inline with text, 24 px in navigation, stroke 2. Every icon has a visible label except the four universal ones (close, search, home, print) which carry `aria-label`.

| Meaning | Icon | Meaning | Icon |
|---|---|---|---|
| Home | `house` | Clock in | `log-in` |
| Today | `calendar-days` | Clock out | `log-out` |
| Pay | `banknote` | Break | `coffee` |
| More | `menu` (labelled "More") | Undo | `undo-2` |
| Technicians | `users` | Fix time | `pencil` |
| Services | `sparkles` | Void | `ban` |
| Tablets | `tablet` | Owed by law | `circle-alert` |
| Settings | `settings` | Warning | `triangle-alert` |
| Audit binder | `folder-archive` | Success | `check` / `circle-check` |
| Import | `upload` | Offline | `wifi-off` |
| Export, PDF | `download` | Camera | `camera` |
| Print | `printer` | Language | `languages` |
| Share / Send | `share-2` / `message-square` | Sign out | `log-out` (in More only) |
| Add | `plus` | Back | `chevron-left` |
| Approve | `check-check` | Paid | `badge-check` |

### 3.6 Motion and feedback

- Pressed state within 100 ms: background to the pressed token and `scale(0.98)`; held until the response arrives.
- Pending: after 300 ms a 20 px spinner replaces the button icon, the label stays, the button is `aria-busy`; the form is not re-submittable.
- Toast: bottom centre, above the tab bar, 5 s; with an Undo action 8 s and a thin progress line; one toast at a time; never for errors.
- Transitions 150-200 ms ease-out; respect `prefers-reduced-motion` (no scale, no shake, instant toasts).
- Kiosk: optional click sound (Web Audio, 30 ms) on key press and a 300 ms shake on a wrong PIN; a 1 s check-mark draw on success.

### 3.7 Components to build (`app/src/lib/ui/`)

| Component | Props and behaviour |
|---|---|
| `Button` | `variant: primary | secondary | ghost | danger-confirm`, `size: md (48) | lg (56) | xl (72)`, `pending`, `icon`, `iconRight`, full-width option; renders `<button>` or `<a>` |
| `IconButton` | 48 px square, required `label` (visible tooltip on hover, `aria-label` always) |
| `Chip` | selectable pill, 48 px tall, icon optional, `selected`, used for technicians, tips, reasons, filters |
| `SegmentedControl` | native radios in a fieldset, 2-5 options, equal widths, 48 px |
| `StatusPill` | `kind: ok | warn | owed | info | neutral`, icon + text, 32 px tall, never colour-only |
| `Avatar` | initials from `displayName`, hue by hash, sizes 32 / 48 / 64 / 96 |
| `StatTile` | label, value (tabular), optional verdict pill and hint; `lead` variant at 32 px |
| `KeyNumber` | the single lead number with icon, label and colour role |
| `Card`, `CardHeader` | 16 px radius, title, optional action slot |
| `EmptyState` | icon, title, one sentence, primary CTA, secondary link |
| `Banner` | inline alert `kind` as pills, with icon, text and optional action; errors live here |
| `Toaster` + `toast()` store | queue of one, `undo` callback, auto-dismiss |
| `Sheet` | Bits UI Dialog; bottom sheet under 1024 px, centred dialog above; drag handle; focus trap; `title` required |
| `ConfirmButton` | first press shows "Confirm: Approve $6,331.33" for 6 s with a cancel, second press submits; no modal |
| `MoneyInput` | text, `inputmode=decimal`, `$` prefix, parses with `parseDollars`, 16 px, right-aligned |
| `NumberPad` | 3×4 pad, cents-first display ("1111" → `$11.11`), backspace, clear, `onchange(cents)`; 64 px keys |
| `TimeStepper` | HH:MM with ± 15 min buttons and a native `type=time` fallback |
| `DayStrip` | seven day chips for the workweek, Today button, calendar icon that opens the native date input |
| `DataTable` | sticky header, optional pinned first column, numeric columns right-aligned with `tabular-nums`, light zebra, caption, scroll shadow |
| `RowCards` | phone rendering of the same rows as cards; `DataTable` switches to it under 768 px when `cards` is passed |
| `PageHeader` | back link, title, one primary action slot, overflow menu slot |
| `BottomNav`, `SideNav` | four tabs / grouped sidebar, icon + label, active state with `brand-soft` tint and `aria-current` |
| `Steps` | setup checklist with progress and done states |
| `StatusStepper` | Draft → Approved → Paid → Sent, with the current step filled |

### 3.8 Libraries

Add: `@lucide/svelte` (icons), `bits-ui` (Dialog, AlertDialog, Popover, RadioGroup, Switch, Tabs), `@axe-core/playwright` (dev). Check the current versions on npm when installing and pin them. Do not add shadcn-svelte, a CSS framework, a chart library or a state library. Total added client JS must stay under 40 KB gzipped on any route (measure in UX-56).

### 3.9 Accessibility baseline (checked by UX-09 and UX-57)

Text 4.5:1 and non-text 3:1 (§3.1 values); every interactive element 48 px; visible focus ring; `aria-current` on navigation; `aria-live="polite"` on the toaster and the kiosk status line; every icon labelled; every form field with a `<label for>`; errors tied by `aria-describedby`; sheets trap focus and restore it; `prefers-reduced-motion` honoured; `lang` attribute follows the active locale (already done in `app.html`); the page works with the keyboard alone on desktop.

## 4. Information architecture and navigation

### 4.1 Three surfaces, one codebase

| Surface | Device | Posture | Navigation |
|---|---|---|---|
| **Kiosk** `/kiosk` | shared tablet, landscape, arm's length, often damp hands | status board; four screens; returns to the board by itself | none; a small owner-preview link only when an owner session exists |
| **Owner in the pocket** `/app/*` under 1024 px | phone | glance, approve, fix, send | bottom tabs: Home · Today · Pay · More |
| **Front desk and bookkeeper** `/app/*` at 1024 px and up | tablet landscape or laptop | log tickets all day; review the week | left sidebar with the same destinations expanded; Today becomes a three-pane register |

### 4.2 Destinations

| Tab / group | Route | Contents |
|---|---|---|
| Home | `/app/home` (new; `/app` redirects here) | week card, who is in now, to-do list, yesterday line, setup checklist on first run |
| Today | `/app/today` | day strip, day summary, technician cards, ticket builder, fixes |
| Pay | `/app/pay`, `/app/pay/[start]`, `/app/pay/[start]/[workerId]`, `/app/pay/[start]/send` (new) | weeks, the week, the statement, the send-all flow |
| More | `/app/more` (new) | Technicians `/app/workers`, Services `/app/services` (new), Tablets `/app/tablets` (new, split from settings), Import `/app/tickets/import`, Audit binder `/app/audit`, Settings `/app/settings` (salon, pay rules, logins), Language, Help and setup guides, About (the legal line, version), Sign out |

Header on phones: page title, optional back link, at most one context action, an overflow menu for the rest. No language toggle and no Sign out in the header. On tablets the sidebar carries the salon name, the destinations with icons and labels, and at the bottom the language switch and the signed-in user.

Back behaviour: the browser back button always works (no state-only screens); the back link in the header goes to the parent destination, not `history.back()`.

Deep links from Home open the exact item with `?focus=<id>`; the target screen scrolls to it and draws the focus ring for 2 s.

### 4.3 Phone shell

```
┌────────────────────────────────┐
│ Lucky Nails & Spa     [ ⋯ ]    │  44-56 px header: title (or salon name on Home), one action, overflow
│                                │
│          page content          │  16 px gutters, bottom padding = tab bar + 16 px
│                                │
│                [ Primary 56px ]│  sticky when the page is long (R3)
├────────────────────────────────┤
│  ⌂ Home   ▦ Today   $ Pay  ≡ More │  64 px + safe-area, icons 24 px, labels 12 px, active = brand tint + bold
└────────────────────────────────┘
```

### 4.4 Tablet shell (≥ 1024 px)

```
┌──────────┬──────────────────────────────────────────────┐
│ ▲ Lucky  │  Page title                      [ Primary ]  │
│          │                                               │
│ ⌂ Home   │                                               │
│ ▦ Today  │                 content                       │
│ $ Pay    │                                               │
│ ─────    │                                               │
│ Technicians · Services · Tablets · Import · Audit · Settings │
│          │                                               │
│ EN | VI  │                                               │
│ Tina ▾   │                                               │
└──────────┴──────────────────────────────────────────────┘
```

Sidebar 232 px, collapsible to icons-with-labels-below at 1024-1279 px.

---

## 5. Screen specifications

Each spec states the job, the primary action, the layout per surface, the states, the click budget and the tickets. Wireframes are schematic; sizes in §3 apply.

### 5.1 Home (new): "what needs me"

**Job:** answer, in one glance, "how much do I owe this week, who is in, and what must I fix or send".
**Primary action:** Review this week.

```
┌──────────────────────────────────┐
│ Chào chị Tina · Thu, Oct 8   [⋯] │  greeting in the owner's language
├──────────────────────────────────┤
│ THIS WEEK  Sep 28 – Oct 4        │
│ $1,904.25                        │  key number 32 px, owed colour
│ ⚠ Owed by law this week          │  icon + label (R6)
│ Gross $6,402.75 · 303 h · 5 techs│  secondary 14-16 px
│ [ Review and approve        › ]  │  primary 56 px
├──────────────────────────────────┤
│ NOW · 3 in · 1 on break           │
│ (L) Linh 9:06   (M) Mai 9:30     │  avatars 48 px with time
│ (H) Hoa ❚❚ break 1:10            │
├──────────────────────────────────┤
│ TO DO                            │
│ ⚠ 1 clock-out missing · Tue    › │  warn pill + sentence + chevron, 56 px rows
│ ⚠ 2 tickets without hours      › │
│ ✉ 5 statements not sent        › │
│ $ Pay week of Sep 21 by Mon Oct 5 │  NY: within 7 days of week end
├──────────────────────────────────┤
│ YESTERDAY  $835 sales · 40:30 h  │
└──────────────────────────────────┘
```

- When there is nothing to do, the TO DO block says "Nothing to fix. Tuần này ổn." with a check icon; it never disappears, so the owner learns to look there.
- First run (no technicians): the week card is replaced by the four-step setup checklist (UX-31).
- Tablet: week card and NOW on the left (one third), TO DO and YESTERDAY on the right.
- Click budget: approve the week from Home = Review (1) + Approve (1) + Confirm (1) = 3.
- States: loading (skeleton for the week card only), empty (setup), error (Banner).
- Tickets: UX-29, UX-30, UX-31, UX-32, UX-33.

### 5.2 Today

**Job:** log tickets and keep the day's hours right.
**Primary action:** Add ticket.

Phone:
```
┌──────────────────────────────────┐
│ ‹  Today · Thu, Oct 8      [📅][⋯]│  calendar icon opens native date input; overflow: Import, Add hours by hand
│ Mon Tue Wed [Thu] Fri Sat Sun    │  DayStrip chips 48 px; days with data show a dot
│ Sales $835 · Tips $138 · Hours 40:30 │ one line of three numbers
├──────────────────────────────────┤
│ (L) Linh   ● In since 9:00   ⌄   │  card header: avatar, name 20 px, status pill, ticket count
│ 10:00 h · $255 sales · $42 tips  │
│ ─ expanded ─────────────────────│
│ 09:00 → …  (−30 m)  [Fix time]   │  punch row: 48 px, Fix opens a sheet
│ 10:47 Manicure         $25  +$4c │  ticket rows: time, service, price, tip badge (c = cash, ▭ = card)
│ 10:58 Gel manicure     $45  +$9▭ │
│  ⋯ per row → Void (reason chips) │
│ [💵 Card tips handed over in cash · $26] │ 48 px secondary
├──────────────────────────────────┤
│ (M) Mai    ● In since 9:30   ›   │ collapsed
│ (K) Kim    ○ Off today       ›   │ collapsed; one short line, not two sentences
│                                  │
│                 [ + Add ticket ] │ sticky 56 px primary → opens the builder sheet
└──────────────────────────────────┘
```

Tablet (≥ 1024 px), the register:
```
┌───────────────┬────────────────────────────────┬────────────────────────┐
│ TECHNICIANS   │ ADD TICKET                     │ LINH · Thu, Oct 8      │
│ (L) Linh ● 7  │ 1 Technician  [Linh] Mai Hoa … │ ● In since 9:00 · 3h   │
│ (M) Mai  ● 8  │ 2 Service                      │ 10:47 Manicure $25 +$4 │
│ (H) Hoa ❚❚ 2  │ [Manicure 25][Pedicure 40][Gel mani 45] │ 10:58 Gel mani $45 +$9 │
│ (K) Kim  ○ 0  │ [Gel pedi 55][Acrylic 60][Fill 45]      │ 13:01 Polish $15 +$2   │
│ (J) Jenny● 4  │ [Dip 50][Polish 15][More…]     │ …                      │
│               │ Price [$ 45.00] [NumberPad]    │ Tips today $42 (card $26 paid out) │
│ Day total     │ 3 Tip  Card [0][3][5][10][20][$]│ [Pay out card tips]    │
│ $835 · 40:30  │        Cash [0][3][5][10][20][$]│ [Fix time] [Add hours] │
│               │ Paid by [Card | Cash]  More ▾  │                        │
│               │ [ Add ticket · $45 + $5 tip ]  │                        │
│               │ ↻ Repeat last (Gel manicure)   │                        │
└───────────────┴────────────────────────────────┴────────────────────────┘
```

- Selecting a technician on the left selects them in the builder and shows their day on the right; the selection is sticky after a save.
- Tiles are 3 columns, 56-64 px tall, name left and price right, the salon's most-used first (UX-46 sort order), "More…" reveals the rest in place.
- Tip chips are 48×56 px with 8 px gaps; `$` chip opens the NumberPad (tablet) or focuses a MoneyInput (phone).
- "Paid by" defaults to the last ticket's value; ticket number and time sit under "More ▾" (progressive disclosure).
- The primary button label states what will be saved: "Add ticket · $45 + $5 tip". Disabled only until a technician and a service exist; the disabled style is the readable grey from §3.1.
- After save: the row appears at once in the right pane (optimistic), the toast says "Added · Gel manicure $45 for Linh" with Undo (8 s); the builder keeps the technician and clears the rest; Repeat last stays available.
- Click budget: tech (0 if sticky, else 1) + service (1) + tip (1) + add (1) = 3-4; Repeat last = 1.
- Fix time sheet: TimeStepper for in and out, break minutes stepper, reason chips ("Forgot to clock out", "Tablet was off", "Wrong tap", "Other…"), Save (primary), Void (danger-confirm two-press). Clock out now is a 48 px secondary on the open punch row and records the reason automatically.
- Tickets: UX-19 to UX-28.

### 5.3 Pay runs

**Job:** find the week that needs attention.
Phone: cards, newest first: "Sep 28 – Oct 4 · Paid ✓ · Gross $6,402.75 · ⚠ Owed by law $1,904.25 · 5 techs" with the status pill and a chevron; the current week's card says "In progress · ends Sun" and shows hours so far. Desktop: `DataTable` with the same columns, numeric right-aligned, owed as `owed` text with the alert icon, one link per row (the whole row is clickable). Ticket: UX-34.

### 5.4 Pay week

**Job:** make the week correct, approve it, pay it, send it.
**Primary action:** depends on status (one at a time): Approve → Mark paid → Send statements.

Phone:
```
┌──────────────────────────────────┐
│ ‹ Pay runs                       │
│ Week Sep 21 – Sep 27             │
│ Draft ─●─ Approved ─○─ Paid ─○─ Sent │  StatusStepper
│ ⚠ Fix first (2)                 ⌄│  Banner, warn: open clock-out (Linh, Tue) ›, tickets without hours (Hoa) ›
│ $6,331.33 gross · 298 h          │
│ ⚠ Owed by law $1,876.83          │  KeyNumber in owed colour
├──────────────────────────────────┤
│ (L) Linh                $1,247.50│  card: avatar, name, total pay 20 px tabular
│ 57 h (17 OT) · gross $1,000.50   │
│ ⚠ Owed by law +$247.50     Why? ⌄│  expands to the receipt: commission, guarantee, regular rate, top-up, OT premium, spread, tips, each as a sentence
│ (M) Mai                 $1,540.15│
│ …                                │
│ [ Approve week · $6,331.33 ]     │  sticky; second press "Confirm approve"
└──────────────────────────────────┘
```

Desktop: Summary view by default (`DataTable`, 8 columns: Technician, Days, Hours (OT), Sales, Gross, Owed by law, Tips, Total pay; flags as one pill "3 notes" with a popover list), a `SegmentedControl` Summary | Full detail | Rules used, sticky header and pinned first column, the sticky action bar at the bottom of the viewport. Exports live in an "Export ▾" menu (Gusto, ADP RUN, CSV); Reopen is in the overflow and uses the danger-confirm button with a reason chip set.

- Mark paid: primary "Mark all paid by check today" (two-press, states the total) and a secondary "Adjust" that opens a Sheet listing each technician with a cash | check | payroll SegmentedControl and amounts pre-filled from the last paid week (R22).
- Send statements: primary once paid; opens `/app/pay/[start]/send` which lists technicians with a Send button each (Web Share, `sms:` fallback, copy), records `statementSentAt`, shows ✓ Sent; a "Send next" flow walks the list.
- Click budget: Approve 2, Mark paid 2, Send all = 1 + one share-sheet pick per technician.
- Tickets: UX-35 to UX-42.

### 5.5 Statement

**Job:** let the technician check their own tally and understand the arithmetic; let the CPA read it.
- Bilingual by default: every label prints as "Tổng lương · Gross wages"; a toggle offers VI only, EN only. One document serves both readers and one print.
- "How this was computed" becomes sentences: "Ăn chia 60% × doanh thu $835.00 = $501.00 (29 CFR 778.117)". No variable names.
- Total pay is the key number at the top of the summary; tips on their own lines under it; paid-by line last.
- Phone: sticky bottom bar with Send (primary), PDF, Print; language toggle in the header overflow.
- Shared page `/s/[token]`: same layout, no app chrome, a 56 px "Save PDF" and the two-language toggle.
- Ticket: UX-40.

### 5.6 Technicians, Services, Tablets, Settings, Import, Audit (under More)

- **Technicians:** rows with avatar, name, pay basis in words ("Bao lương $900/tuần hoặc ăn chia 60%"), language, PIN set ✓, Active switch; the whole row opens the form; a filter chip Active | All. **Form:** three steps on one page with a progress line: 1 Name and PIN (display name, legal name, language, PIN with "Generate" and a one-time reveal), 2 How paid (five radio cards with one-line explanations, inline rate fields), 3 Details (address, birth date if under 19, occupation, hired on, tax status with the warning as a Banner, ended on only when editing). Save is sticky; leaving with changes shows an inline "Keep editing / Discard" bar, not a modal.
- **Services (new):** list of tiles with EN and VI names, price, show/hide, drag or ± to reorder; "Sort by most used (last 30 days)" button.
- **Tablets (new):** paired devices with last seen, Unpair as danger-confirm, "Pair this tablet" instructions and the lockdown guide link (`/kiosk/setup`).
- **Settings:** Salon (name, license, address, state and region, time zone, workweek start, default language, photo on punch, auto clock-in, show ticket count), Pay rules (read-only table with sources), Logins (list plus an add form with real labels).
- **Import:** a drop zone first, then four vendor cards (Square, Fresha, Vagaro, GlossGenius) each with the three steps to export the right file; on upload the format banner says what was detected; staff-name mapping remembered per format; the preview card's primary is "Import 42 tickets"; result links to the day.
- **Audit binder:** export card first (presets This month, Last month, This year, Custom; PDF and CSV zip as two buttons); below it the history as sentences ("Tina changed Linh's clock-out 19:30 → 19:00 · Forgot to clock out") with filter chips by type and technician; IDs behind a "details" disclosure.
- Tickets: UX-43 to UX-50.

### 5.7 Kiosk

**Job:** a technician punches in under five seconds, from across the counter, and everyone can see who is in.

Board:
```
┌ Lucky Nails & Spa        9:06 AM · Thứ Năm, 8 tháng 10       ● online   EN | VI ┐
│ Tap your name · Bấm vào tên của bạn                                              │
│ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌─────────┐ │
│ │ (L)  Linh          │ │ (M)  Mai           │ │ (H)  Hoa           │ │ (K) Kim │ │
│ │ ● In since 9:06    │ │ ○ Not clocked in   │ │ ❚❚ Break since 1:10│ │ ○       │ │
│ │ 2h 10m · 3 tickets │ │                    │ │ 4h 02m · 5 tickets │ │         │ │
│ └────────────────────┘ └────────────────────┘ └────────────────────┘ └─────────┘ │
│ ┌────────────────────┐                                                           │
│ │ (J)  Jenny         │        tiles auto-fit: min 220 px wide, min 140 px tall,  │
│ │ ○ Not clocked in   │        grid fills the height; 3 in · 1 break · 2 out      │
│ └────────────────────┘                                                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

PIN:
```
┌ ‹ Back (64 px)                                                   EN | VI ┐
│   (L) Linh · Nhập mã PIN / Enter your PIN                               │
│        ●  ●  ○  ○   (24 px dots)                  ┌────────────────┐    │
│       [ 1 ] [ 2 ] [ 3 ]                           │  camera 4:3    │    │
│       [ 4 ] [ 5 ] [ 6 ]      72 px keys, 12 px gaps│                │    │
│       [ 7 ] [ 8 ] [ 9 ]                           └────────────────┘    │
│       [ ⌫ ] [ 0 ] [ ✕ ]                           Look at the camera    │
│   Wrong PIN → shake, dots red, "Sai PIN. Thử lại." under the dots       │
└─────────────────────────────────────────────────────────────────────────┘
```

Action (only when a decision exists): name and status line with elapsed time; one `neutral-fill` button 88 px tall ("Ra ca · Clock out") and one outlined 64 px ("Bắt đầu nghỉ"); a forgotten clock-out shows a Banner: "You did not clock out on Tue. Did you leave at 7:30 PM?" with [Yes, 7:30 PM] [Another time → owner] (records a flagged punch for the owner to confirm).

Done: 96 px check drawn over 1 s, "Đã vào ca lúc 9:06 · Clocked in at 9:06", today's hours on clock-out, Undo as a 64 px button with a countdown ring, auto-return after 8 s (4 s without Undo).

Always: offline Banner at the top (icon, text, queued count); 30 s idle returns to the board with a small countdown ring in the corner during the last 10 s; optional dim after closing time; no OS keyboard anywhere; `/kiosk/setup` holds the Guided Access and screen-pinning steps.

Click budget: clock in = tap name + 4 digits (5); clock out = 5 + 1.
Tickets: UX-11 to UX-18.

### 5.8 Login, signup, pair

Keep the layout; 56 px fields and button; show-password toggle; "Keep me signed in" (30-day session) since owners complained about Fresha logging them out; the tagline moves below the form; the kiosk link shows only on a paired device. Ticket: UX-51.

## 6. Ticket backlog

Sizes: S ≤ 2 h, M ≤ 1 day, L 1-3 days. "Files" lists the main ones; create new files under `app/src/lib/ui/` for components and keep routes where they are unless a ticket says otherwise. Every ticket ends with `pnpm check && pnpm test && pnpm e2e` green.

### P0 Foundation (do first, in this order)

**UX-01 Design tokens and base styles** · M
- Goal: one place that defines every colour, radius, shadow and type size; remove the three global defects (uppercase, tiny text, weak borders).
- Why: R5, R7, R9, R26; audit A4, A6, A14, A17.
- Spec: replace the `@theme` block in `app/src/app.css` with the tokens of §3.1-3.3 (keep `--font-sans`); rewrite the `@utility` classes (`btn*`, `input`, `label`, `card`, `badge`, `cell-owed`, `.table`) on top of the tokens with 48 px minimum heights, 16 px input text, `border-strong` on inputs and outlined buttons, the readable disabled style, `tabular-nums` on `.num`; add utilities `eyebrow` (14 px, 700, muted, no uppercase), `vi-safe` (line-height 1.3, no uppercase), `focus-ring`; delete every `uppercase`, `text-xs`, `text-[11px]`, `text-stone-400` usage in routes (grep them) and replace with the new roles; set `font-variant-numeric: tabular-nums` on `body` for digits.
- Files: `app/src/app.css`, every `+page.svelte` and component (search-and-replace pass), `app/src/app.html` (`theme-color` stays teal-700).
- Done when: `grep -rn "uppercase\|text-xs\|text-\[11px\]\|stone-400" app/src/routes app/src/lib/components` returns nothing; axe reports no contrast violations on `/login`, `/app/today`, `/app/pay`; all inputs compute to 16 px.
- Tests: `pnpm e2e` green; UX-09's axe scan once it exists.
- Depends on: nothing.

**UX-02 One icon set** · S
- Goal: replace emoji and glyphs with labelled Lucide icons.
- Why: R2; A1.
- Spec: `pnpm add @lucide/svelte`; create `app/src/lib/ui/Icon.svelte` wrapping the named icons of §3.5 by key (`<Icon name="log-in" size={20} />`), so later swaps happen in one file; replace every emoji and arrow glyph in routes and components; every icon-only control gets a visible label or `aria-label` (only close, search, home, print may be icon-only).
- Files: `app/src/lib/ui/Icon.svelte`, routes.
- Done when: `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}⇪⇩↻↶‹›✓✕]" app/src/routes app/src/lib` returns nothing except inside strings that are spoken text (none expected).
- Depends on: UX-01.

**UX-03 Base components** · L
- Goal: the component set of §3.7 except Sheet, ConfirmButton, DataTable, RowCards, NumberPad, DayStrip, Steps, StatusStepper (later tickets).
- Why: R1, R4, R6, R11; A4, A7, A11.
- Spec: `Button` (variants, sizes, `pending` with spinner after 300 ms via a small `setTimeout`, `aria-busy`, works inside `use:enhance` by reading the submitter), `IconButton`, `Chip`, `SegmentedControl` (fieldset + radios), `StatusPill`, `Avatar` (initials: first letter of the first and last word of `displayName`; eight hues; contrast-checked text), `StatTile`, `KeyNumber`, `Card`/`CardHeader`, `EmptyState`, `Banner`, `PageHeader`. Each component gets a short story page at `/app/dev/ui` (dev-only route guarded by `import.meta.env.DEV`) showing every variant for screenshots.
- Files: `app/src/lib/ui/*.svelte`, `app/src/routes/app/dev/ui/+page.svelte`.
- Done when: the dev page renders every component; every interactive component measures ≥ 48 px; Button shows pending within the e2e by submitting a slow action (add a 600 ms `setTimeout` in a dev-only action).
- Depends on: UX-01, UX-02.

**UX-04 Toast and Undo** · M
- Goal: one feedback channel for confirmations, with Undo where the server supports it.
- Why: R12, R13; A11, A12.
- Spec: `app/src/lib/ui/toast.svelte.ts` store (`toast({ text, undo?: () => Promise<void>, duration })`, queue of one), `Toaster.svelte` mounted in `app/+layout.svelte` and `kiosk/+page.svelte`, `aria-live="polite"`, bottom centre above the nav, progress line; wire: add ticket (undo = void with reason "undo"), void ticket (undo = unvoid: add a server action `unvoidTicket` that clears `voidedAt` and records the edit), pay out tips (undo exists), fix punch (undo = restore previous values from the edit record: add action `revertPunch`), clock out now (undo = reopen punch: action `reopenPunch`). Each undo writes an edit-trail row with reason "undo".
- Files: store, Toaster, `app/src/routes/app/today/+page.server.ts` (new actions), `app/src/lib/server/punches.ts`.
- Done when: each of the five actions shows a toast and Undo reverses it within 8 s in the e2e; the audit page shows the undo rows.
- Depends on: UX-03.

**UX-05 Navigation shell** · M
- Goal: four labelled tabs on phones, a sidebar on tablets, a quiet header.
- Why: R14, R15; A2, A3.
- Spec: `BottomNav` (Home, Today, Pay, More; 64 px + safe area; icons 24 px; labels 12 px bold; `aria-current="page"`), `SideNav` at ≥ 1024 px (232 px; salon name; destinations; More-group items listed under a divider; language switch and user at the bottom), `PageHeader` used by every page (title, back link, one action slot, overflow slot); remove the language toggle and Sign out from the header; create `/app/more/+page.svelte` listing Technicians, Services, Tablets, Import, Audit binder, Settings, Language (two large radio cards), Help and guides, About (legal line, version), Sign out (danger-confirm); `/app/+page.server.ts` redirects to `/app/home` once UX-29 exists (until then to `/app/today`).
- Files: `app/src/routes/app/+layout.svelte`, `app/src/lib/ui/BottomNav.svelte`, `SideNav.svelte`, `PageHeader.svelte`, `app/src/routes/app/more/+page.svelte`, i18n keys `nav_home`, `nav_more`, `more_*`.
- Done when: at 390 px the tab labels in Vietnamese fit on one line each; the header shows at most one action; Sign out works from More; e2e updated.
- Depends on: UX-03.

**UX-06 Inputs** · M
- Goal: every field is 16 px, 48 px tall, labelled above, with the right keyboard.
- Why: R5, R19, R21; A15, A17.
- Spec: `MoneyInput` (text, `inputmode="decimal"`, `$` prefix, right-aligned, accepts "45", "45.5", "$1,234.56"; emits dollars string compatible with `parseDollars`), `TimeStepper` (±15 min, native fallback), `DateField` (native date input styled to 48 px with a calendar icon button that calls `showPicker()` where available); a `Field` wrapper (label, hint, error with `aria-describedby`); replace placeholder-only labels (settings add-login form, void reason, ticket builder price) with `Field`.
- Files: `app/src/lib/ui/MoneyInput.svelte`, `TimeStepper.svelte`, `DateField.svelte`, `Field.svelte`; routes that use inputs.
- Done when: iOS Safari does not zoom on focus (manual check on a device or the Playwright WebKit project with a 15 px regression test on computed style); every `<input>` has an associated label (axe `label` rule passes).
- Depends on: UX-03.

**UX-07 Tables that work on phones** · M
- Goal: one table primitive that is a real table on wide screens and cards on narrow ones.
- Why: R17, R18; A5.
- Spec: `DataTable` (columns config with `align: 'num'`, `pin: true` for the first column, sticky `<thead>` inside a height-capped scroll container, caption, scroll shadows, zebra), `RowCards` (renders the same column config as a card per row: title column, then label/value pairs, primary action), switch below 768 px when `cards` is set; numeric cells use `tabular-nums` and right alignment; headers of numeric columns right-aligned.
- Files: `app/src/lib/ui/DataTable.svelte`, `RowCards.svelte`.
- Done when: Pay runs list and Technicians list render through it with no horizontal overflow at 390 px (checked by a Playwright assertion that `document.scrollingElement.scrollWidth === clientWidth`).
- Depends on: UX-03.

**UX-08 Sheet, ConfirmButton, Popover** · M
- Goal: accessible overlays without modals for confirmation.
- Why: R12; A12.
- Spec: `pnpm add bits-ui`; `Sheet` on Bits UI Dialog (bottom sheet under 1024 px with a drag handle, centred dialog above, focus trap, Escape closes, `title` required, body scroll locked); `ConfirmButton` (first press turns the button into "Confirm: {label}" with a 6 s timer and a Cancel beside it; second press submits; danger variant uses `--color-danger`); `Menu` on Bits UI Popover for overflow menus (48 px items with icons and labels).
- Files: `app/src/lib/ui/Sheet.svelte`, `ConfirmButton.svelte`, `Menu.svelte`.
- Done when: keyboard-only use works; axe passes on an open sheet; ConfirmButton submits only on the second press in the e2e.
- Depends on: UX-03.

**UX-09 Screenshot and accessibility harness** · M
- Goal: proof, repeatable in CI, that each phase meets the rules.
- Why: §3.9; the before/after record.
- Spec: `app/e2e/visual.spec.ts` captures `/login`, `/app/home` (when it exists), `/app/today?date=<seeded day>`, `/app/pay`, `/app/pay/<seeded week>`, the statement, `/app/workers`, `/app/workers/new`, `/app/settings`, `/app/tickets/import`, `/app/audit`, `/app/more`, and the four kiosk screens at 390×844 (2×), 820×1180, 1024×768 and 1440×900 in EN and VI into `docs/ux-audit/<date>-after/` as JPEG quality 55; `app/e2e/a11y.spec.ts` runs `@axe-core/playwright` on the same routes and fails on `serious` or `critical`; `app/e2e/targets.spec.ts` asserts every `button, a[href], input, select, [role=button]` that is visible has a bounding box ≥ 44×44 (48 preferred; 44 is the hard floor) except inline links inside paragraphs; add `pnpm e2e:visual`, `pnpm e2e:a11y` scripts.
- Files: `app/e2e/*.spec.ts`, `app/package.json`, `app/playwright.config.ts` (projects for the viewports).
- Done when: the three specs run locally against `pnpm build && pnpm start` and the baseline (pre-revamp) failures are listed in the ticket's commit message.
- Depends on: nothing (can start in parallel with UX-01).

**UX-10 Copy and i18n hygiene** · S
- Goal: the strings the revamp needs, in both languages, and the legal line out of the way.
- Why: R26; A14.
- Spec: add the keys in Appendix A to `messages.ts` with Vietnamese from the glossary; normalise all `vi` strings to NFC (one-time script); move `not_legal_advice` from the layout footer to More › About and keep it in statement and PDF footers; add `vi-safe` to all buttons via the Button component; audit the 40 longest Vietnamese labels at 390 px (list them in the commit message with their widths).
- Files: `app/src/lib/i18n/messages.ts`, `app/src/routes/app/+layout.svelte`, `app/src/routes/app/more/+page.svelte`.
- Done when: `node -e` NFC check passes for every `vi` value; no page except About and the statement shows the legal line.
- Depends on: UX-05.

### P1 Kiosk

**UX-11 Status board** · M
- Goal: tiles that fill the screen and tell the whole room who is in.
- Why: R4, R6, R24; A7, A9, A18.
- Spec: CSS grid `repeat(auto-fit, minmax(220px, 1fr))`, rows stretch to fill `100dvh - header`; tile: `Avatar` 64 px, name 28-32 px, `StatusPill` with icon (`log-in` for in, `coffee` for break, hollow circle for out) and "In since 9:06 · 2h 10m" (elapsed recomputed every minute from `since`), ticket count "3 tickets · 3 phiếu" when enabled; fills `ok-soft`/`warn-soft`/white with 2 px borders in the matching ink colour; header: salon, clock 32 px, date in the salon's default locale, a `StatusPill` for online/offline/queued, EN | VI as a 48 px SegmentedControl; prompt line bilingual: "Tap your name · Bấm vào tên của bạn" (both always shown, order follows the default locale); summary line "3 in · 1 break · 2 out".
- Files: `app/src/routes/kiosk/+page.svelte`, i18n `kiosk_prompt_*`, `kiosk_summary`.
- Done when: at 1024×768 with 5 technicians the tiles are ≥ 200 px tall; with 12 technicians they are ≥ 140 px; the "in" state is visible as icon + word + colour; e2e `main button` selectors still pass.
- Depends on: P0.

**UX-12 PIN screen** · M
- Goal: faster, more forgiving PIN entry.
- Why: R4, R11, R23; audit Kiosk PIN row.
- Spec: keys 72×72 px (64 minimum when height < 700 px), 12 px gaps, digits 28 px, phone layout kept, `⌫` and `✕` as labelled grey keys; `Avatar` 64 px + name 28 px + bilingual prompt; dots 24 px; on a wrong PIN: 300 ms horizontal shake (disabled under reduced motion), dots turn `owed` red for 600 ms then clear, message under the dots, optional error tone; lockout shows a Banner with the minutes remaining; Back is a 64 px outlined button at the bottom-left; the camera preview card keeps its state text as a `StatusPill` ("Camera off · photos not taken"); digits accepted from a physical keyboard too.
- Files: `app/src/routes/kiosk/+page.svelte` (consider splitting into `kiosk/Board.svelte`, `Pin.svelte`, `Actions.svelte`, `Done.svelte` under `app/src/lib/kiosk/`).
- Done when: each key's bounding box ≥ 64 px; the wrong-PIN path shows the message and clears the dots in the e2e; keyboard digits work.
- Depends on: UX-11.

**UX-13 Action screen** · M
- Goal: one obvious button, the right colour, and a way out of a forgotten clock-out.
- Why: R3, R8; audit A8.
- Spec: status line with elapsed time ("Đã vào ca lúc 9:06 · 2h 10m"); primary action as `neutral-fill` 88 px with icon and bilingual label ("Ra ca · Clock out"); secondary outlined 64 px; when `staleOpen`: Banner (warn) "Bạn chưa ra ca hôm thứ Ba. Bạn về lúc 7:30 PM? · You did not clock out on Tue. Did you leave at 7:30 PM?" with [Yes, 7:30 PM] (closes the old punch at the salon's usual closing time, flagged `source: kiosk_assist`, reason recorded) and [Another time] (leaves it open and flagged for the owner, then continues to clock in); closing-time default = the latest clock-out seen in the last 14 days for that weekday, else 19:30, editable in Settings (new salon field `closingTimes` JSON, optional, UX-47).
- Files: kiosk components, `app/src/routes/kiosk/api/punch/+server.ts` (new action `close_stale`), `app/src/lib/server/punches.ts`, schema (optional field).
- Done when: no red fill on the action screen; the stale path records a punch with the chosen time and an edit-trail row; e2e covers both buttons.
- Depends on: UX-12.

**UX-14 Done screen** · S
- Goal: a clear, friendly end state with an obvious Undo.
- Why: R11, R12.
- Spec: 96 px check drawn with a 1 s stroke animation (static under reduced motion), time 32 px, today's hours on clock-out and also on clock-in when a previous shift today exists, `Button` xl "Hoàn tác · Undo" with a conic-gradient countdown ring (8 s), `Button` secondary "Đóng · Close", auto-return; optional 100 ms success tone.
- Files: kiosk components.
- Done when: Undo reverses the punch in the e2e; the screen returns to the board by itself.
- Depends on: UX-12.

**UX-15 Offline and error presentation** · S
- Goal: the tablet explains itself when Wi-Fi drops.
- Why: R6, R11, R13.
- Spec: top Banner (warn) "Offline · punches are saved on this tablet and will send when Wi-Fi returns · 2 queued"; the board tiles keep working; the PIN screen says the PIN cannot be checked offline and the punch will be verified later; server errors other than PIN appear as a Banner, never a toast.
- Files: kiosk components, `app/src/lib/kiosk/queue.ts` (expose a store for the count).
- Done when: with the network blocked in Playwright (`context.setOffline(true)`) a punch queues and the banner shows the count; back online it flushes.
- Depends on: UX-11.

**UX-16 Idle and after-hours** · S
- Goal: the board is always ready for the next person and does not glow all night.
- Why: R23, R10.
- Spec: 30 s idle on PIN/Action/Done with a 10 s countdown ring in the corner; a salon setting "Dim kiosk after closing" (uses `closingTimes` from UX-13 or 21:00) switches the board to a dark surface with a single line "Tap to wake · Chạm để bật"; any tap restores.
- Files: kiosk components, settings.
- Done when: the countdown appears at 20 s idle and the board returns at 30 s in the e2e with fake timers.
- Depends on: UX-13.

**UX-17 Kiosk setup guide and fullscreen manifest** · M
- Goal: an owner can lock the tablet to the clock without calling anyone.
- Why: R25.
- Spec: `/kiosk/setup` (reachable from Tablets and from the pair page): steps for iPad (Add to Home Screen, Auto-Lock Never, Guided Access with triple-click, Options to disable the sleep button) and Android (Screen pinning, require PIN, Recents → pin), each step a numbered card with an illustration slot; a second manifest `static/kiosk.webmanifest` (`start_url: /kiosk`, `display: fullscreen`, `display_override: ["fullscreen","standalone"]`, name "Salon clock") linked from the kiosk route's `<svelte:head>`; the board shows "Add to Home Screen" hint once when not in standalone mode (`display-mode` media query).
- Files: `app/src/routes/kiosk/setup/+page.svelte`, `app/static/kiosk.webmanifest`, `app/src/routes/kiosk/+page.svelte`, `app/vite.config.ts` (exclude the second manifest from the PWA plugin or configure `includeManifestIcons`).
- Done when: the setup page renders in both languages; the kiosk route serves the second manifest; the hint disappears in standalone mode.
- Depends on: UX-11.

**UX-18 Kiosk sound, haptics setting and e2e refresh** · S
- Spec: salon setting "Kiosk sounds" (default off); Web Audio click 30 ms at key press, 100 ms tone on success, two short tones on error; `navigator.vibrate(15)` where available (Android); update `app/e2e/smoke.spec.ts` kiosk test and add screenshots to the visual spec.
- Done when: sounds only play after a user gesture; e2e green.
- Depends on: UX-14.

### P2 Today and ticket entry

**UX-19 Today, phone layout** · M
- Goal: the day's log reads top to bottom with the builder one tap away.
- Why: R3, R17, R28; A3, A10, A16.
- Spec: `PageHeader` (title "Today · Thu, Oct 8" or the date; overflow: Import CSV, Add hours by hand; calendar `IconButton` opens `DateField`'s native picker), `DayStrip` (seven chips for the workweek with a dot where the day has data; `Today` chip returns), one-line summary (Sales · Tips · Hours), technician cards collapsed by default showing Avatar, name, `StatusPill`, ticket count and the three numbers; expand shows punches and tickets (UX-23, UX-24); technicians off today show "Off today · Nghỉ" in one line; sticky "+ Add ticket" primary; the week card moves to Home (UX-29) and is replaced here by a one-line link "This week: $1,904.25 owed · open ›".
- Files: `app/src/routes/app/today/+page.svelte` (split into `TodayHeader.svelte`, `TechnicianDay.svelte`, `TicketBuilder.svelte` under `app/src/lib/today/`), `+page.server.ts` (add per-day data flags for the strip: one query for ticket and punch counts per day of the week).
- Done when: at 390 px nothing scrolls horizontally; the first ticket add in the e2e works from the sheet; the day strip reaches any day of the week in one tap.
- Depends on: P0.

**UX-20 Ticket builder** · L
- Goal: three taps, zero typing, for a standard ticket, in a sheet on phones and a pane on tablets.
- Why: R3, R4, R16, R20, R21, R22, R27; A7; research 09 §7 items 7-12.
- Spec: steps labelled 1 Technician, 2 Service, 3 Tip; technician `Chip`s with 32 px avatars (sticky after save); service tiles 3 columns (2 at 390 px), 56-64 px tall, name left, price right, selected state with `brand-soft` and a check icon, first 9 tiles then "More…"; a text field "Other service" with autocomplete over all services; price `MoneyInput` pre-filled, tap to edit; tip presets `$0 $3 $5 $10 $20 $` for card and for cash as 48×56 chips (custom opens `NumberPad` on ≥ 1024 px or focuses `MoneyInput`), choosing a tip sets Paid-by when empty; Paid-by `SegmentedControl` Card | Cash defaulting to the previous ticket; "More ▾" reveals ticket number and time; primary `Button` lg with the computed label "Add ticket · $45 + $5 tip" (disabled grey until technician and service exist); "↻ Repeat last" secondary under it; on submit: optimistic append in the technician's card with a `pending` row style until the action returns, toast with Undo, builder resets service/price/tips, keeps technician and paid-by; Enter/Done on the keypad submits.
- Files: `app/src/lib/today/TicketBuilder.svelte`, `NumberPad.svelte` (UX-22), `+page.server.ts` (return the new ticket id for the undo).
- Done when: the e2e adds a ticket in exactly three clicks after the sheet opens (technician pre-selected), undoes it, repeats last in one click; all chips ≥ 48 px; Vietnamese tile names fit on two lines at 390 px.
- Depends on: UX-19, UX-22.

**UX-21 Tablet register layout** · L
- Goal: a front-desk screen that is never covered by a keyboard.
- Why: memo 11 §3 two-pane; R3.
- Spec: at ≥ 1024 px Today renders three panes (240 px | flexible | 360 px): technician list (Avatar, name, status, ticket count; selected state; day total at the bottom), builder pane (UX-20, always visible, no sheet), selected technician's day (punches with Fix, tickets, tips paid-out button, Add hours); the right pane scrolls independently; at 820-1023 px (iPad portrait) use two panes (list collapses into chips above the builder).
- Files: `app/src/routes/app/today/+page.svelte`, today components.
- Done when: at 1024×768 the builder and the day are visible together without page scroll; adding a ticket updates the right pane within 100 ms (optimistic).
- Depends on: UX-20.

**UX-22 NumberPad** · M
- Goal: money entry without the OS keyboard on tablets.
- Why: R21; research memo §7 cents-first.
- Spec: 3×4 pad (64 px keys), display shows `$0.00` and shifts digits in from the right ("4","5","0","0" → `$45.00`; or cents-first "4500" → `$45.00`), `⌫`, `C`, `Done`; emits cents; used by the builder for price and custom tips, by Mark paid Adjust (UX-38) and by the technician rate fields on tablets; on phones `MoneyInput` is used instead.
- Files: `app/src/lib/ui/NumberPad.svelte`.
- Done when: unit test for the digit-shifting logic (`app/src/lib/ui/numberpad.test.ts`); e2e enters a custom tip through it at 1024 px.
- Depends on: UX-03.

**UX-23 Punch rows and the Fix time sheet** · M
- Goal: fixing a time is three taps with no typing.
- Why: R12, R20, R22; A12.
- Spec: punch row 48 px: photo thumbnail 40 px (opens larger in a Sheet), "09:00 → 19:30 · −30 m · 10:00 h", source pill when not from the tablet, `Fix time` secondary button; open punch rows show "Clock out now" (secondary) which clocks out at the current time with reason "clock_out_now" and a toast with Undo; the Fix sheet: `TimeStepper` in/out, break stepper (0/15/30/45/60 chips + stepper), reason `Chip`s ("Forgot to clock out", "Tablet was off", "Wrong tap", "Other…" → text field), Save (primary), Void (danger ConfirmButton), Cancel; "Add hours by hand" uses the same sheet with a technician chip row at the top.
- Files: `app/src/lib/today/PunchRow.svelte`, `FixPunchSheet.svelte`, `+page.server.ts` (accept reason codes; store the code and the text).
- Done when: the e2e fixes a punch with chips only; the audit page shows the reason text.
- Depends on: UX-06, UX-08.

**UX-24 Ticket rows and Void** · M
- Goal: compact, scannable rows with one safe way to void.
- Why: R12, R17; A5.
- Spec: row 48 px: time (tabular), service, price right-aligned, tip as a small pill "+$5 card" / "+$4 cash", source pill for imports, `⋯` `Menu` → Void (opens a Sheet with reason chips "Duplicate", "Wrong technician", "Wrong price", "Client cancelled", "Other…" and a danger ConfirmButton), voided rows struck through with the reason in `ink-muted`; totals row per technician.
- Files: `app/src/lib/today/TicketRow.svelte`, `VoidSheet.svelte`.
- Done when: voiding takes three taps; undo from the toast restores the row.
- Depends on: UX-04, UX-08.

**UX-25 Card tips handed over in cash** · S
- Spec: per technician card a 48 px secondary "Card tips handed over in cash · $26" that becomes an `ok` pill "Paid out $26 ✓ (undo)" when done; in the day summary a "Pay out all · $86" button when more than one technician has unpaid card tips (new action `payOutAll`).
- Files: today components, `+page.server.ts`.
- Done when: e2e selectors updated (the current test clicks these buttons).
- Depends on: UX-19.

**UX-26 Move "Add clock-in by hand" and UX-27 move Import** · S
- Spec: both leave the Today header; "Add hours" appears inside each technician card's expanded view and in the overflow menu; Import appears in More and in the Today overflow menu.
- Done when: the Today header has one action (date picker) and an overflow.
- Depends on: UX-19.

**UX-28 Today empty states and skeletons** · S
- Spec: a day with no data shows one `EmptyState` ("No tickets yet for Thursday · Add the first one" → opens the builder; secondary "Import from your booking app"); collapsed cards for technicians off today; the week link shows a 1-line skeleton while the week computes if the server streams it (use SvelteKit streamed promises for the week totals so the day renders first).
- Files: `+page.server.ts` (return `week` as a promise), today components.
- Done when: the day renders before the week totals arrive (verify with a 500 ms artificial delay in dev).
- Depends on: UX-19.

### P3 Home

**UX-29 Home screen** · L
- Goal: the owner's first screen answers "what needs me".
- Why: §5.1; A20; memo 11 §3 dashboards.
- Spec: route `/app/home`; server load returns: current week totals (reuse `computeSalonWeek`), statuses (reuse `statusesFor`), to-dos (UX-30), yesterday's sales and hours; blocks as in §5.1 with `KeyNumber`, `Avatar` row, to-do rows (56 px, pill + sentence + chevron, each a link with `?focus=`), yesterday line; greeting "Chào chị/anh {name}" in Vietnamese uses the neutral "Chào {name}"; `/app` redirects here.
- Files: `app/src/routes/app/home/+page.svelte`, `+page.server.ts`, `app/src/routes/app/+page.server.ts`, `app/src/lib/server/todos.ts`.
- Done when: login lands on Home; the three numbers match the pay week; every to-do row deep-links to a screen that highlights the item; Home renders under 300 ms server time on the seeded database (log the timing).
- Depends on: P0, UX-30.

**UX-30 To-do data and schema additions** · M
- Spec: `pay_lines.statement_sent_at` (nullable ISO) and `pay_lines.statement_sent_via` ('share' | 'sms' | 'copy'); `salons.setup_state` JSON (`{ techs: bool, services: bool, tablet: bool, week: bool, dismissedAt }`); migration via drizzle-kit; `todos.ts` computes: open punches older than 14 h, tickets without hours this week (per technician), approved weeks not marked paid, paid weeks with unsent statements, "pay by" date for New York (week end + 7 days, Labor Law §191, surfaced only for `state === 'NY'`), setup steps; each to-do has `kind`, `count`, `href`, `focusId`.
- Files: `app/src/lib/server/db/schema.ts`, `app/drizzle/*` (generated), `app/src/lib/server/todos.ts`, unit tests for `todos.ts` with an in-memory database.
- Done when: migrations run on an existing database without data loss (test against a copy of `data/salon.db`).
- Depends on: nothing beyond P0.

**UX-31 Setup checklist** · M
- Spec: `Steps` component on Home when `setup_state` is incomplete: 1 Add your technicians and PINs (→ `/app/workers/new`), 2 Check services and prices (→ `/app/services`), 3 Pair the front-desk tablet (→ `/app/tablets`), 4 Confirm state and workweek (→ `/app/settings`); each step auto-completes from data; "Hide" dismisses; replaces the welcome card on Technicians.
- Done when: a fresh signup sees the checklist and it disappears after the four conditions hold.
- Depends on: UX-29, UX-46, UX-48.

**UX-32 Home on tablets** · S
- Spec: two columns at ≥ 1024 px (week + now | to-do + yesterday); the sidebar marks Home active.
- Depends on: UX-29.

**UX-33 Deep-link focus** · S
- Spec: `?focus=<id>` handled by Today (punch or ticket), Pay week (technician card) and the Statement; a `focusRing` action scrolls into view and shows the ring for 2 s.
- Files: `app/src/lib/ui/focus.ts`.
- Depends on: UX-29.

### P4 Pay

**UX-34 Pay runs list** · M
- Spec: phone `RowCards`, desktop `DataTable`; current week first with "In progress · ends Sun"; owed shown as `StatusPill` kind owed with the amount ("⚠ $1,904.25 owed"); paid weeks show "Sent 5/5" when statements were sent; whole row is the link.
- Files: `app/src/routes/app/pay/+page.svelte`, `+page.server.ts` (add sent counts).
- Depends on: UX-07, UX-30.

**UX-35 Pay week, phone cards and Fix-first** · L
- Spec: `StatusStepper`; Fix-first Banner listing blocking items (open punches) and warnings (tickets without hours, long days) with deep links; `KeyNumber` for owed and a one-line gross/hours; per-technician cards (Avatar, name, total pay 20 px; hours with OT; gross; owed line with icon and "Why?" disclosure that renders the breakdown as sentences from `result.breakdown`); Approve is disabled only while an open punch exists and the disabled state explains why in a Banner.
- Files: `app/src/routes/app/pay/[start]/+page.svelte` (split into `WeekHeader.svelte`, `TechnicianWeekCard.svelte`, `Breakdown.svelte` under `app/src/lib/pay-ui/`), i18n `breakdown_*` sentence templates.
- Done when: at 390 px no horizontal scroll; the breakdown sentences match the statement's numbers; e2e approves through the new button.
- Depends on: P0, UX-33.

**UX-36 Pay week, desktop table** · M
- Spec: `SegmentedControl` Summary | Full detail | Rules used; Summary = 8 columns via `DataTable` with sticky header and pinned technician column; flags as one pill "3 notes" with a `Menu`/Popover list; Full detail = the current 16 columns in the same primitive; Rules used = the existing rules table.
- Depends on: UX-07, UX-35.

**UX-37 Sticky action bar and confirmations** · M
- Spec: bottom bar (sticky on phones, inside the page on desktop) with the single primary for the status: "Approve week · $6,331.33" (`ConfirmButton`), "Mark all paid by check today · $6,331.33" (`ConfirmButton`) + "Adjust" secondary, "Send statements (5)" primary once paid; Export as a `Menu` (Gusto CSV, ADP RUN CSV, Payroll CSV); Reopen in the overflow with a reason `Chip` set and a danger `ConfirmButton`.
- Done when: approving needs two presses and never a modal; the amount is in the button label.
- Depends on: UX-08, UX-35.

**UX-38 Mark paid Adjust sheet** · M
- Spec: Sheet listing technicians with `SegmentedControl` cash | check | payroll | split, amounts in `MoneyInput`/`NumberPad`, pre-filled from the last paid week per technician (new helper `lastPaidSplit(workerId)`), paid-on `DateField` defaulting to today, total line that must equal the week total (Banner when it does not).
- Files: pay-ui, `+page.server.ts`, `app/src/lib/server/payrun.ts`.
- Depends on: UX-37.

**UX-39 Send statements flow** · M
- Spec: `/app/pay/[start]/send`: list of technicians with language, phone-less (we have no phone numbers: the share sheet carries the link), Send button per row (Web Share with a bilingual two-line text + link; fallback `sms:` then copy), marks `statement_sent_at` and `statement_sent_via` via an action called after the share promise resolves, shows ✓ Sent with the time, "Send next" moves to the next unsent; a "Copy all links" secondary for owners who paste into Zalo on a laptop.
- Files: `app/src/routes/app/pay/[start]/send/+page.svelte`, `+page.server.ts`.
- Done when: the e2e marks a statement as sent through the copy fallback; Home's "statements not sent" count drops.
- Depends on: UX-30, UX-37.

**UX-40 Statement redesign** · L
- Spec: bilingual labels ("Tổng lương · Gross wages") as the default with a three-way `SegmentedControl` VI+EN | VI | EN stored per technician (`workers.locale` stays the default); total pay as `KeyNumber`; "How this was computed" as sentences built from `breakdown` keys with the rule reference in `ink-muted` 14 px (templates in i18n: `bd_commission: "{pct}% × doanh thu {sales} = {result}"`, etc.); tickets by day unchanged; phone sticky bar: Send (primary), PDF, Print; the shared page `/s/[token]` gets the same bar without Send; PDF (`pdf.ts`) gets the same bilingual labels and sentences.
- Files: `app/src/lib/components/Statement.svelte`, `app/src/routes/app/pay/[start]/[workerId]/+page.svelte`, `app/src/routes/s/[token]/+page.svelte`, `app/src/lib/server/pdf.ts`, i18n `bd_*`.
- Done when: no camelCase variable names appear in the rendered statement (`grep` the HTML in the e2e for `Cents:`); the PDF still passes the e2e header check; a Vietnamese-only and an English-only render both exist in the visual set.
- Depends on: P0.

**UX-41 Rules used relocation** · S
- Spec: keep "Rules used" as the third segment on the week (UX-36) and as More › Settings › Pay rules; remove the collapsed card from the phone week.
- Depends on: UX-36.

**UX-42 Pay e2e and screenshots** · S
- Spec: update `smoke.spec.ts` for the new buttons and add the pay screens to the visual spec.
- Depends on: UX-34 to UX-41.

### P5 Technicians, services, tablets, settings, import, audit

**UX-43 Technicians list** · M
- Spec: `RowCards`/`DataTable` with Avatar, name, pay basis sentence, language, PIN ✓/✗ pill, Active `Switch` (Bits UI; immediate save with toast and Undo), whole row opens the form; filter `Chip`s Active | All; headcount and the NY bond note as a Banner (info) only for NY.
- Depends on: UX-07.

**UX-44 Technician form in three steps** · M
- Spec: one page, three `Card`s with a `Steps` header (1 Name and PIN, 2 How paid, 3 Details); pay basis as five radio cards (title, one-line explanation in the salon's words, e.g. "Bao lương: $900/tuần hoặc ăn chia 60%, lấy số cao hơn") with inline `MoneyInput`/percent fields; "Ended on" and "Active" only when editing; tax-status warning as a `Banner`; sticky Save; unsaved-changes inline bar.
- Files: `app/src/lib/components/WorkerForm.svelte`, `app/src/lib/server/workerForm.ts` (unchanged validation).
- Depends on: UX-06.

**UX-45 PIN management** · S
- Spec: "Generate PIN" button (4 random digits, unique in the salon, never 0000/1234/1111), shown once in 32 px with "Write it on the card for {name}", "Print PIN card" (small print view); PIN reset from the list row.
- Files: `WorkerForm.svelte`, `app/src/routes/app/workers/[id]/pin-card/+page.svelte`, server action.
- Depends on: UX-44.

**UX-46 Services page** · M
- Spec: `/app/services`: list with EN name, VI name, price (`MoneyInput`), show/hide `Switch`, reorder with ± buttons (48 px) and drag on desktop; "Sort by most used (30 days)" computes from tickets and writes `sortOrder`; "Add service"; this order drives the builder tiles.
- Files: new route, `app/src/lib/server/services.ts`, schema unchanged (uses `services.sortOrder`, `active`).
- Depends on: UX-07.

**UX-47 Settings split** · M
- Spec: `/app/settings` becomes three cards or three sub-routes (Salon, Pay rules, Logins); add `closingTimes` (optional JSON per weekday) and `kioskSounds`, `kioskDimAfterClose` fields (schema additions, nullable, defaults off); the add-login form uses `Field` labels; roles as a `SegmentedControl`; Delete login as danger `ConfirmButton`.
- Files: settings route, schema, migration.
- Depends on: UX-06, UX-08.

**UX-48 Tablets page** · M
- Spec: `/app/tablets`: device rows (name, paired on, last seen as "2 min ago", Unpair danger `ConfirmButton`), "Pair this tablet" card with the three steps and a link to `/kiosk/setup`; a warning Banner when the same name is paired twice.
- Files: new route (moves the device section out of settings), `+page.server.ts` actions reuse the settings ones.
- Depends on: UX-08, UX-17.

**UX-49 Import redesign** · L
- Spec: drop zone (`dragover` state, click to choose, `accept=.csv`), four vendor cards with the export steps (text from research 08), detected-format Banner (info) with the row count, mapping remembered per `format` in a new table `import_mappings(salon_id, format, staff_map JSON, column_map JSON, tips_are)` so returning imports show no dropdowns unless a new name appears, preview `DataTable` (first 50 rows, cards on phones), primary "Import 42 tickets" in a sticky bar, result card with "Open Sep 30" link; summary-format refusal stays as a Banner (warn) with the two export names that work.
- Files: `app/src/routes/app/tickets/import/+page.svelte`, `+server.ts`, schema + migration, `app/src/lib/import/parsers.ts` unchanged.
- Done when: a second import of the same vendor shows no mapping controls when names match; `parsers.test.ts` still green.
- Depends on: UX-07, UX-08.

**UX-50 Audit binder redesign** · M
- Spec: export `Card` first with preset `Chip`s (This month, Last month, This year, Custom → two `DateField`s) and two buttons (PDF, CSV zip); history as `RowCards` sentences built from entity/action/field/old/new/reason with the actor and a relative time, filter `Chip`s by entity and a technician `SegmentedControl`/select (more than five → native select is allowed); raw IDs behind a "details" disclosure; retention line as `ink-muted` under the export card.
- Files: `app/src/routes/app/audit/+page.svelte`, `+page.server.ts` (sentence building server-side, bilingual).
- Depends on: UX-07.

**UX-51 Login, signup, pair polish** · S
- Spec: 56 px fields and buttons, show-password `IconButton`, "Keep me signed in" checkbox (session 30 days vs 24 h; `auth.ts` already has token sessions), tagline under the form, kiosk link only when `hasDevice`; signup state and region as a `Field` pair; pair page links to `/kiosk/setup` after success.
- Depends on: UX-06.

**UX-52 Settings e2e refresh** · S
- Spec: update the smoke test for the new routes (`/app/tablets`, `/app/services`, settings cards) and add them to the visual spec.
- Depends on: UX-43 to UX-51.

### P6 Polish and proof

**UX-53 Empty states everywhere** · S — every list (today, pay, technicians, services, tablets, audit, import preview) uses `EmptyState` with the job sentence, the first action and a secondary; Vietnamese reviewed.
**UX-54 Pending and loading audit** · S — every `<form>` button is `Button` with `pending`; streamed week totals on Home and Today; no spinner shows for under 300 ms; measure with a 400 ms throttled run.
**UX-55 Print styles** · S — statement and binder print with the new tokens (black text, no fills except the owed line's icon), page breaks before each technician's section, headers repeated.
**UX-56 Performance budget** · S — Lighthouse on `/app/today` and `/kiosk` with mobile throttling: LCP < 2.0 s, TBT < 150 ms, route JS < 120 KB gzipped, added libraries < 40 KB; record numbers in `docs/ux-audit/<date>-after/perf.md`.
**UX-57 Accessibility pass** · M — axe zero serious/critical on every route in both languages; keyboard walk-through of each flow; focus visible; `prefers-reduced-motion` verified; VoiceOver smoke test on an iPad (manual, documented).
**UX-58 Usability test with three salons** · M — run the §8 script with one owner and one technician per salon, in their language; record task times, errors and SUS; file findings in `docs/ux-audit/pilot-notes.md`; open follow-up tickets.
**UX-59 Close-out** · S — regenerate the after-screenshots, update `docs/PLAN.md` §3 to describe the new screens, mark this plan's tickets done with commit hashes in a table at the end of this file.

## 7. Quality gates

### 7.1 Device and browser matrix

| Device | Viewport | Browser | Why |
|---|---|---|---|
| iPhone SE (2nd/3rd gen) | 375×667 | Safari 16+ | smallest phone an owner is likely to carry; the tab bar and the builder must fit |
| iPhone 13-16 | 390×844 | Safari | reference phone |
| Pixel 7 / Galaxy A-series | 412×915 | Chrome | Android owners |
| iPad 9th/10th gen | 820×1180 and 1180×820 | Safari (Home Screen app) | the front-desk tablet |
| iPad mini | 744×1133 / 1133×744 | Safari | smaller salons |
| Cheap Android tablet (8-10 in) | 800×1280 / 1280×800 | Chrome | research 06 §4 |
| Laptop | 1440×900 | Chrome, Edge | bookkeeper |

### 7.2 Checks per phase

1. `pnpm check`, `pnpm test`, `pnpm e2e`, `pnpm e2e:a11y`, `pnpm e2e:visual` green.
2. No horizontal page scroll at 375 px on any route (asserted in the visual spec).
3. Every visible interactive element ≥ 44×44 px with 48 preferred (targets spec).
4. Contrast: axe passes; spot-check the tokens table values against the rendered page in both languages.
5. Vietnamese: the 40 longest labels fit at 375 px; no all-caps; buttons show full tone marks (visual check on the after-screenshots).
6. Kiosk: offline punch queues and flushes; idle returns; Guided Access tested on a real iPad once per phase that touches the kiosk.
7. Print: statement and binder PDFs still pass the `%PDF` and header checks.
8. Performance: UX-56 numbers do not regress by more than 10% in later phases.

### 7.3 Click budget (must hold after the revamp)

| Flow | Now | Target | Where it is measured |
|---|---|---|---|
| Technician clocks in | 5 taps | 5 taps, under 5 s at arm's length | kiosk e2e + pilot stopwatch |
| Technician clocks out | 6 | 6 | same |
| Add a standard ticket (technician sticky) | 4 | 3, no typing | today e2e |
| Repeat last ticket | 1 | 1 | today e2e |
| Fix a forgotten clock-out | 3 + typing | 3 taps, no typing (chips) | today e2e |
| Approve the week from the phone | 3 (from Today) | 3 (from Home), amount visible before confirming | pay e2e |
| Mark the week paid | 1 | 2 (confirm shows the total) | pay e2e |
| Send all statements (5 technicians) | 5 × (open + share) | 1 + 5 share-sheet picks | send e2e (copy fallback) |
| Card tips handed over in cash, whole day | 1 per technician | 1 for all | today e2e |
| Import the day's tickets, returning vendor | 3 + mapping | 2 | import e2e |
| Setup from signup to first clock-in | undefined | ≤ 10 minutes, guided by the checklist | pilot |

---

## 8. Success measures and the pilot script

**Measures:** task completion without help ≥ 90% per task; time-on-task within the targets above; SUS ≥ 80 from five owners and five technicians (one form each, in their language); zero axe serious issues; zero support questions about "where is X" in the first two pilot weeks; after-screenshots approved by the product owner.

**Pilot script (per salon, 25 minutes, in the participant's language, on their own tablet or phone):**
1. Technician: "Clock in." (observe: finds own tile, PIN, reads the confirmation). Then: "You are going on break." Then: "Clock out."
2. Owner on the phone: "Tell me how much the law says you owe on top of the split this week." (Home key number) "Who is working right now?"
3. Front desk on the tablet: "Linh just finished a gel manicure, the client paid by card and tipped five dollars." Then: "Same again for the next client." Then: "That second ticket was a mistake, remove it."
4. Owner: "Linh forgot to clock out on Tuesday; she left at 7:30." (Fix sheet with chips.)
5. Owner: "Approve last week, mark it paid by check, and send Hoa her statement." (Observe the confirm step, the send sheet, the statement in Vietnamese.)
6. Owner: "Find out who changed Linh's hours last week." (Audit sentences.)
7. Five-question debrief: what was confusing, what word was wrong, what would you change, would you use it daily, SUS form.

Record: task success, time, errors, the exact words participants used for each screen (feed them back into the glossary), and anything they tapped that was not tappable.

---

## 9. Open decisions for the product owner

| # | Question | Default in this plan |
|---|---|---|
| D1 | Keep teal as the brand colour or move to a blue? Evidence favours blue for trust but is weak; teal already carries the brand and passes contrast | Keep teal-700 |
| D2 | Home as the landing tab, or Today? | Home; Today is one tap away and front-desk tablets can bookmark `/app/today` |
| D3 | Bilingual statement labels on by default? | Yes (VI · EN), per-technician override |
| D4 | Kiosk sounds default | Off; owners can switch on |
| D5 | Red for "owed by law" (with icon and label) or amber? | Red, because it is the one number the pitch is built on; amber is for things to check |
| D6 | Keep the "Tablet clock" preview link for owners in More? | Yes, under Tablets |
| D7 | Allow the kiosk to close a forgotten shift at a default closing time (UX-13)? | Yes, flagged for the owner, because it removes a daily Fix-time chore |
| D8 | Add phone numbers to technicians so Send can prefill `sms:`? | Not in this revamp; the share sheet covers Messages and Zalo |

---

## Appendix A. New i18n keys (add `en` and `vi` for each)

Navigation and shell: `nav_home`, `nav_more`, `more_title`, `more_services`, `more_tablets`, `more_language`, `more_help`, `more_about`, `about_version`, `greeting` ("Chào {name}").
Home: `home_week_title`, `home_review_week`, `home_now`, `home_in_count` ("{n} in"), `home_break_count`, `home_out_count`, `home_todo`, `home_todo_empty` ("Nothing to fix" / "Không có gì cần sửa"), `todo_open_punch` ("{n} clock-out missing · {day}"), `todo_tickets_no_hours`, `todo_approved_unpaid`, `todo_statements_unsent` ("{n} statements not sent"), `todo_pay_by` ("Pay week of {start} by {date}"), `home_yesterday`, `setup_title`, `setup_step_techs`, `setup_step_services`, `setup_step_tablet`, `setup_step_week`, `setup_hide`.
Today: `day_strip_today`, `off_today` ("Off today" / "Nghỉ"), `add_hours`, `builder_step_tech`, `builder_step_service`, `builder_step_tip`, `builder_other_service`, `builder_more`, `builder_submit` ("Add ticket · {price}{tip}"), `builder_tip_suffix` (" + {tip} tip"), `added_toast` ("Added · {service} {price} for {name}"), `undo`, `pay_out_all` ("Pay out all · {amount}"), `reason_forgot_out`, `reason_tablet_off`, `reason_wrong_tap`, `reason_other`, `void_reason_duplicate`, `void_reason_wrong_tech`, `void_reason_wrong_price`, `void_reason_cancelled`, `empty_day_title`, `empty_day_action`, `empty_day_import`.
Kiosk: `kiosk_prompt_en` ("Tap your name"), `kiosk_prompt_vi` ("Bấm vào tên của bạn"), `kiosk_summary` ("{in} in · {brk} break · {out} out"), `kiosk_in_since_short` ("In since {time}"), `kiosk_elapsed` ("{h}h {m}m"), `kiosk_tickets_short` ("{n} tickets"), `kiosk_camera_off`, `kiosk_stale_question` ("You did not clock out on {day}. Did you leave at {time}?"), `kiosk_stale_yes` ("Yes, {time}"), `kiosk_stale_other` ("Another time"), `kiosk_offline_banner` ("Offline · punches are saved on this tablet · {n} queued"), `kiosk_idle_returning`, `kiosk_dim_wake` ("Tap to wake"), `kiosk_add_home_hint`, `kiosk_setup_title` and the step strings `kiosk_setup_ios_1..5`, `kiosk_setup_android_1..4`.
Pay: `pay_step_draft`, `pay_step_approved`, `pay_step_paid`, `pay_step_sent`, `pay_fix_first` ("Fix first ({n})"), `pay_blocked_open_punch`, `pay_view_summary`, `pay_view_full`, `pay_view_rules`, `pay_notes_count` ("{n} notes"), `pay_why`, `pay_confirm_approve` ("Confirm: approve {amount}"), `pay_confirm_paid` ("Confirm: mark {amount} paid"), `pay_adjust`, `pay_split`, `pay_total_mismatch`, `pay_export`, `pay_send_statements` ("Send statements ({n})"), `send_title`, `send_next`, `send_sent_at` ("Sent {time}"), `send_copy_all`, `sent_count` ("Sent {sent}/{total}"), `week_in_progress` ("In progress · ends {day}").
Breakdown sentences: `bd_commission` ("{pct}% × sales {sales} = {result}"), `bd_hourly_base`, `bd_day_rate_base` ("{days} days × {rate} = {result}"), `bd_guarantee` ("Guarantee {guarantee} is higher than commission {commission}: paid {result}"), `bd_regular_rate` ("{straight} ÷ {hours} h = {rate}/h"), `bd_min_wage_topup` ("Minimum wage {mw}/h × {hours} h − {straight} = {result}"), `bd_overtime_premium` ("{ot} h × ½ × {rate}/h = {result}"), `bd_spread_of_hours` ("{days} days over 10 h: {result}"), `bd_gross_wages`, `bd_tips`.
Statement: `st_lang_both`, `st_lang_vi`, `st_lang_en`, `st_send`, `st_save_pdf`.
Technicians, services, tablets, settings: `pin_generate`, `pin_once` ("Write this PIN on the card for {name}"), `pin_print_card`, `pin_reset`, `pin_set`, `pin_missing`, `basis_help_*` (five one-line explanations), `services_title`, `services_sort_used`, `services_add`, `services_hidden`, `tablets_title`, `tablets_last_seen`, `tablets_pair_steps_1..3`, `tablets_duplicate_warning`, `settings_closing_times`, `settings_kiosk_sounds`, `settings_kiosk_dim`, `logins_role`, `keep_signed_in`, `show_password`.
Import: `import_drop_here`, `import_choose_file`, `import_vendor_steps_square_1..3`, `_fresha_1..3`, `_vagaro_1..3`, `_glossgenius_1..3`, `import_detected` ("Detected {format} · {n} rows"), `import_mapping_saved`, `import_open_day` ("Open {date}").
Audit: `audit_preset_this_month`, `audit_preset_last_month`, `audit_preset_this_year`, `audit_preset_custom`, `audit_sentence_*` (templates per entity and action, e.g. `audit_sentence_punch_update` "{who} changed {name}'s {field} {old} → {new}"), `audit_details`.
Generic: `confirm_prefix` ("Confirm: {label}"), `keep_editing`, `discard_changes`, `pending`, `offline`, `copied`, `nothing_here_yet_action`.

## Appendix B. Screenshot index (before set)

`docs/ux-audit/2026-10-08-before/`: `phone-today.jpg`, `phone-today-vi.jpg`, `phone-pay-week-draft.jpg`, `phone-pay-week-paid.jpg`, `phone-statement.jpg`, `phone-workers.jpg`, `phone-worker-new.jpg`, `phone-settings.jpg`, `phone-audit.jpg`, `tablet-today.jpg`, `tablet-pay-list.jpg`, `tablet-pay-week-draft.jpg`, `tablet-statement.jpg`, `tablet-import.jpg`, `kiosk-grid.jpg`, `kiosk-grid-one-in.jpg`, `kiosk-pin.jpg`, `kiosk-actions.jpg`, `kiosk-done.jpg`. Captured from the demo seed (`pnpm db:seed`), owner `owner@example.com`, technician Linh PIN 1111, on 2026-10-08.

## Appendix C. Ticket log

| Ticket | Commit | Date | Notes |
|---|---|---|---|
| (filled in by the implementer as tickets land) | | | |
