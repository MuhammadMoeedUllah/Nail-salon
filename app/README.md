# Salon Pay Records (app)

Clock in, pay commission, and keep the records that prove you paid correctly. A lightweight web app for US nail salons: shared-tablet PIN clock-in with a photo, daily ticket log or CSV import, weekly pay records with the overtime and minimum-wage arithmetic the law requires, bilingual (English / Vietnamese) statements, and an audit binder. The app moves no money.

The product plan is in [`../docs/PLAN.md`](../docs/PLAN.md); the research it rests on is in [`../research/`](../research/README.md).

## Run it locally

```bash
pnpm install
cp .env.example .env            # set APP_SECRET to a long random string
pnpm db:seed                    # optional demo salon: owner@example.com / password123, PINs 1111-5555
pnpm dev                        # http://localhost:5173
```

Sign in at `/login`, or create the first salon at `/signup` (open while the database has no users, or while `ALLOW_SIGNUP=1`). Pair a tablet at `/kiosk/pair`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | development server |
| `pnpm build` then `pnpm start` | production build, served with adapter-node (migrations run at boot) |
| `pnpm test` | unit tests: pay engine worked examples and invariants, rules lookup, CSV parsers, time helpers, message tables, statement and audit sentences |
| `pnpm check` | svelte-check and TypeScript |
| `pnpm db:generate` | regenerate the Drizzle migration after editing `src/lib/server/db/schema.ts` |
| `pnpm db:seed` | demo salon with two weeks of punches and tickets |
| `pnpm e2e` | Playwright tests against a running, freshly seeded server (`BASE_URL`, default `http://localhost:3123`): flows per screen, axe accessibility, touch targets and screenshots |
| `pnpm e2e:a11y`, `pnpm e2e:visual` | only the accessibility and touch-target checks, or only the screenshots and overflow check |
| `node scripts/perf.mjs` | throttled lab check of largest paint, blocking time and script size on Today, Home and the tablet clock |
| `node scripts/ux-shots.mjs <dir>` | after-screenshots of every screen; it approves and pays a week, so use a throwaway database |

## Environment

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | SQLite file path, default `./data/salon.db` |
| `PHOTO_DIR` | directory for clock-in photos, default `./data/photos` |
| `ORIGIN` | public origin, used for CSRF checks and links |
| `APP_SECRET` | signs statement share links; 32+ random characters |
| `ALLOW_SIGNUP` | `1` lets anyone create a salon; otherwise only the first salon can be created |
| `MIGRATIONS_DIR` | where the Drizzle migrations live, default `./drizzle` |
| `LITESTREAM_REPLICA_URL`, `LITESTREAM_ACCESS_KEY_ID`, `LITESTREAM_SECRET_ACCESS_KEY` | optional continuous backup of the SQLite file (Docker image only) |

## Layout

```
src/lib/pay/engine.ts          pure weekly pay engine (29 CFR 778 arithmetic), tested
src/lib/rules/                 minimum wage and state rules with sources and effective dates
src/lib/import/parsers.ts      CSV sniffing and normalisation for Square, Fresha, Vagaro, GlossGenius, generic
src/lib/i18n/messages.ts       English and Vietnamese strings
src/lib/server/db/schema.ts    SQLite schema (money in cents, append-only edit trail)
src/lib/server/payrun.ts       aggregate punches and tickets into a week, approve, pay
src/lib/server/pdf.ts          statement and audit-binder PDFs (pdfmake, Noto Sans embedded)
src/routes/kiosk               shared-tablet clock: PIN pad, camera, offline queue
src/routes/app                 owner screens: today, pay runs, statements, technicians, audit, settings
src/routes/s/[token]           statement shared by signed link, with PDF
```

## Deploy

The app is one long-running Node server that keeps its SQLite database and clock-in photos on disk. It needs a host that runs a container with a persistent volume.

The `Dockerfile` builds one image with Node 22, the built app, the migrations and Litestream. `fly.toml` runs it on one Fly.io machine with a volume at `/data`, listening on port 8080. It names the Dockerfile under `[build]` on purpose: without that, Fly scans the source, detects SvelteKit and runs its own Node Dockerfile generator, which fails on pnpm and would rewrite the start command.

### Fly.io web launcher

In the Fly dashboard, launch from GitHub with these values:

| Field | Value |
|---|---|
| Working directory | `app` |
| Config path | leave empty |
| Internal port | `8080`, the default |
| Memory | 512MB |
| Region | `ewr`, or `iad` if `ewr` is not listed |
| Database | none; do not add Managed Postgres |

After the first deploy: confirm one machine and one volume named `data`, then add the secret `APP_SECRET` with a random value of at least 32 characters on the app's Secrets page.

### Fly.io command line

Run these from this `app/` folder:

```bash
fly launch --no-deploy --copy-config --name <your-app-name>
fly secrets set APP_SECRET=$(openssl rand -base64 32)
# optional backups: fly secrets set LITESTREAM_REPLICA_URL=s3://bucket/salon LITESTREAM_ACCESS_KEY_ID=... LITESTREAM_SECRET_ACCESS_KEY=...
fly deploy
```

The first deploy creates the `data` volume and exactly one machine. Never scale above one machine: a second one would get its own separate database. The volume starts at 1 GB and grows by itself up to 10 GB.

`ORIGIN` is left unset on Fly on purpose: behind Fly's HTTPS proxy the server uses `https://` plus the request's host, which matches any app name or custom domain. Set `ORIGIN` only when running over plain HTTP, as in local testing.

Any host that runs a container with a persistent directory works the same way (Railway, Render, Hetzner with Coolify or Kamal). Set `PORT` if the host expects a port other than 8080.

### Vercel is not supported as built

- Vercel runs serverless functions, not a long-running server. This app uses `@sveltejs/adapter-node`, so a Vercel build fails with `No Output Directory named "public" found`.
- Vercel functions have a read-only filesystem apart from a temporary `/tmp` that is not shared between instances. The SQLite file and photos would be lost or split between instances.
- If the Vercel project's Root Directory is left empty, Vercel publishes the repository folders as static files and never runs the app.
- Running on Vercel would need `@sveltejs/adapter-vercel`, a hosted database such as Turso (same SQLite schema through Drizzle's libSQL driver), photo storage outside the function, and PDF fonts bundled with the function.

## What it does not do

Booking, point of sale, card processing, payroll tax filing, W-2s. It keeps records and shows arithmetic. It is not legal advice; every rule carries a source and a checked-on date and must be verified against the official text before launch in a state.
