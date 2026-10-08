# Performance after the revamp (UX-56)

Measured on 2026-10-08 with `app/scripts/perf.mjs` against a production build (`pnpm build`, `node build`) and the demo seed. Each page loads cold (cache off) with Chromium's CPU slowed 4x, a 150 ms round trip and 1.6 Mbit/s down. The figures are the median of three runs.

Lighthouse was not available in the build container. The script uses the same signals Lighthouse reads: largest contentful paint from the browser's own observer, and total blocking time as the sum of each long task's time over 50 ms after the first paint. Absolute numbers depend on the machine, so compare runs on the same machine.

## Budget and result

| Page | Largest paint | Blocking time | Script over the wire | Fonts |
|---|---|---|---|---|
| Today, phone | 684 ms | 207 ms | 90 KB | 52 KB |
| Home, phone | 620 ms | 139 ms | 78 KB | 52 KB |
| Tablet clock | 648 ms | 103 ms | 71 KB | 52 KB |
| **Budget** | **under 2,000 ms** | **under 150 ms** | **under 120 KB** | |

Today's blocking time is over budget. The other measures pass on every page.

## Before and after on Today, phone

| Measure | Before P6 | After P6 |
|---|---|---|
| Blocking time | 433 ms | 207 ms (runs: 198, 207, 261) |
| Script over the wire | 125 KB | 90 KB |
| Fonts | 1,224 KB | 52 KB |

## What changed

1. **Fonts.** Two full TrueType files of about 620 KB each loaded on every page. They are now WOFF2 subsets with Latin and Vietnamese only, about 26 KB each, preloaded. The TrueType files stay on the server for the PDF statements and binder.
2. **Overflow menu.** The dropdown component pulled in a positioning library of about 19 KB compressed. The menu is now a small menu button that follows the WAI-ARIA pattern, with arrow keys, Home, End and Escape.
3. **Sheets on Today.** Fix time, Void, Add hours and the phone ticket sheet load on first use. The download starts on the first touch or key press, so the sheet is usually ready when the button is pressed.
4. **Formatters.** Date, time and money formatters were rebuilt on every call. They are now built once per language and time zone.

## Where the rest of Today's time goes

A browser trace shows one task of about 300 ms at 4x, almost all of it script run in microtasks: that is the page hydrating. The largest shared file is the message table for both languages plus the icons, about 92 KB before compression.

Next steps, in order of expected gain:

1. Ship only the reader's language to the browser. This would split the message table per language and save about 40 KB of script to parse on every page.
2. Hydrate collapsed technician cards on demand. This matters only on tablets in landscape, where the cards start open.
3. Re-measure on a real mid-range Android phone. This container's CPU speed is not calibrated against Lighthouse's reference machine.

## Libraries added by the revamp

| Library | Where it loads | Size over the wire |
|---|---|---|
| bits-ui (dialog only) | Pages with a bottom sheet; on Today only after first use | about 11 KB |
| @lucide/svelte | Every page, only the icons in use | a few KB inside the shared chunk |

The total stays under the 40 KB allowance for added libraries.
