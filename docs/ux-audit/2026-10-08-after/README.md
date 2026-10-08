# After the revamp: screenshots and checks (2026-10-08)

These screenshots show the app after phases P0 to P6 of `docs/UX-REVAMP-PLAN.md`. Compare them with `../2026-10-08-before/`.

## How they were made

1. Build the app and seed a throwaway database with the demo salon: `pnpm build`, then `DATABASE_URL=… pnpm db:seed`.
2. Start the server: `node build`.
3. Run `CHROMIUM_PATH=… node scripts/ux-shots.mjs ../docs/ux-audit/<date>-after`.

The script signs in as the demo owner. On the way it approves the week before last and marks it paid, so the paid week and its statement can be shown. It also pairs a tablet.

## Index

| Screen | Phone (390 px) | Tablet (1180 px) |
|---|---|---|
| Home | `phone-home.jpg`, `phone-home-vi.jpg` | `tablet-home.jpg` |
| Today | `phone-today.jpg`, `phone-today-vi.jpg` | `tablet-today.jpg` |
| Add ticket sheet | `phone-ticket-sheet.jpg` | (panel inside `tablet-today.jpg`) |
| Pay weeks | `phone-pay-list.jpg` | `tablet-pay-list.jpg` |
| Pay week, draft | `phone-pay-week-draft.jpg` | `tablet-pay-week-draft.jpg` |
| Pay week, paid | `phone-pay-week-paid.jpg` | |
| Statement | `phone-statement.jpg` | `tablet-statement.jpg` |
| Send statements | `phone-send.jpg` | |
| Technicians | `phone-workers.jpg`, `phone-worker-new.jpg` | `tablet-workers.jpg` |
| Services | `phone-services.jpg` | |
| Settings | `phone-settings.jpg` | `tablet-settings.jpg` |
| Tablets | `phone-tablets.jpg` | |
| Audit binder | `phone-audit.jpg` | `tablet-audit.jpg` |
| Import | `phone-import.jpg` | `tablet-import.jpg` |
| More | `phone-more.jpg` | |
| Sign in, sign up | `phone-login.jpg`, `phone-signup.jpg` | |
| Tablet clock | | `kiosk-grid.jpg`, `kiosk-grid-portrait.jpg`, `kiosk-pin.jpg`, `kiosk-done.jpg`, `kiosk-actions.jpg` |

The tablet clock switches to each technician's language. Linh's and Mai's screens are therefore in Vietnamese. No camera exists in the test browser, so the confirmation shows the "camera off" note.

## Automated checks

The checks below run with `pnpm e2e` against a seeded server. On 2026-10-08, 32 end-to-end tests passed and 46 unit tests passed. One end-to-end test skipped itself because an earlier test had already changed its starting state, as it is written to do.

- **Accessibility.** axe reports no serious or critical issue on any of these:
  - all 12 owner pages, in English and in Vietnamese;
  - sign-in, sign-up and tablet pairing;
  - the tablet clock board and its PIN pad.
- **Touch targets.** Every control is at least 44 by 44 px at 390 px and at 1180 px wide. Inline text links are exempt, as WCAG 2.5.8 allows.
- **Overflow.** No page scrolls sideways on a phone, in either language. The tablet clock was checked in landscape and in portrait.
- **Keyboard.** A test checks that the overflow menu opens with Enter, moves with the arrow keys, and closes with Escape, returning focus to its button. The sheets are built on a dialog component that keeps focus inside and returns it on close; no test covers that yet.
- **Reduced motion.** With reduced motion on, CSS animations and transitions are cut to nearly zero. Scripted scrolling jumps instead of gliding.
- **Print.** Statements print black on white. The total is boxed, headings stay with their tables, table headers repeat on each page, and no app chrome prints.

Performance is recorded in `perf.md`.

## Not yet done

These need people or devices that the build container does not have:

- **VoiceOver on an iPad.** Walk the tablet clock and Today with VoiceOver and note anything read wrongly (UX-57).
- **Keyboard on real devices.** Walk each owner flow with a physical keyboard on an iPad and on a laptop (UX-57).
- **Pilot salons.** Run the usability test with three salons (UX-58). The script and the form to record results are in `../pilot-notes.md`.
