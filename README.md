# 🎲 Backgammon

A modern, open-source backgammon web app — a real rules engine, a difficulty-tiered
AI opponent, pass-and-play, animated UI, full Hebrew/English (RTL-aware) i18n, and
light/dark theming. Built with Next.js 14, TypeScript, Tailwind, and Supabase.

> Live demo / screenshot: run it locally (below) and it's ready in seconds — no
> screenshot is checked in yet, see **Known issues**.

## Features

- ♟️ **Real backgammon rules**: standard starting position, bar entry, hitting,
  the official "use the maximum number of dice possible" forced-move rule, bear-off
  with the overage rule, and gammon/backgammon win detection — fully unit tested.
- 🤖 **AI opponent** with three difficulty levels (Easy / Medium / Hard), the hardest
  tier weighing blot exposure by actual dice-shot probability.
- 👥 **Local pass-and-play** for two people on one device.
- 🕗 **Move history**, live **pip count**, hit count, turn count, and a game clock.
- 🎨 A cohesive animated design system: sticky glass navbar with a working mobile
  menu, animated dice, checker pop-in, legal-move highlighting, confirm/win modals.
- 🌗 **Light & dark mode**, persisted per device.
- 🇮🇱 **Hebrew (full RTL) & English**, persisted per device, auto-detected from the
  browser on first visit.
- 📱 Responsive across mobile, tablet, and desktop.
- 📦 PWA-ready: manifest, service worker, installable icon.
- 🔌 **Supabase-ready**: auth, chat, and a leaderboard/profile schema are already
  defined in `supabase/schema.sql` and the client code checks for configuration
  before using it — connect a project and those features turn on with no code
  changes (see **Environment variables** below). Online real-time rooms, profiles,
  leaderboard, and rating are the next milestone — see **Roadmap**.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) with CSS custom-property design tokens
- [Supabase](https://supabase.com/) (Postgres + Auth + Realtime) — optional, for
  online features
- [Vitest](https://vitest.dev/) for unit tests, [Playwright](https://playwright.dev/)
  configured for e2e
- ESLint (`eslint-config-next`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). AI play and pass-and-play work
immediately with no configuration.

## Environment variables

Copy `.env.example` to `.env.local` and fill in your own Supabase project to enable
accounts, chat, and the leaderboard:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project's public anon key |

Without them, `isSupabaseConfigured` is `false` and the app cleanly falls back to
local-only play — nothing crashes, and the UI explains what's missing.

To set up the database: open your Supabase project's SQL editor and run
`supabase/schema.sql` once. It's idempotent (safe to re-run).

## Scripts

```bash
npm run dev         # start the dev server
npm run build        # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run typecheck  # tsc --noEmit
npm run test          # unit tests (Vitest)
npm run test:watch  # unit tests, watch mode
npm run e2e            # Playwright e2e tests
```

## Project structure

```
app/                  Next.js App Router pages
  play/                the game screen (menu, board, AI/pass-and-play)
  login/               Supabase auth
components/           UI components (Board, DiceRoller, Navbar, Modal, Chat, ...)
lib/
  backgammon/          engine.ts (rules), ai.ts (opponent), pip.ts (stats)
  i18n/                dictionaries + provider (English/Hebrew, RTL-aware)
  theme/               light/dark theme provider
  auth/                Supabase auth provider
  supabase/            client + generated-style types
supabase/schema.sql  Postgres schema, RLS policies, triggers, and the
                        leaderboard view — run once against a Supabase project
public/                manifest, service worker, icon
```

## The backgammon engine

`lib/backgammon/engine.ts` is a self-contained, framework-free rules engine:

- 24 points, White moving 24→1 and Black moving 1→24, matching the standard board.
- `getLegalMovesForDie` — single-die legal moves, including bar re-entry and
  bear-off (exact and overage-from-furthest-checker).
- `getLegalFirstMoves` — enforces the official rule that a turn must use as many
  of the dice as legally possible, by searching every move sequence and keeping
  only first moves that lead to a maximal-length sequence.
- `applyMove` / `checkWinner` — immutable state transitions and win/gammon/
  backgammon detection.

`lib/backgammon/ai.ts` plays a full turn against this engine using a greedy
per-move heuristic; `Hard` estimates real shot probability (36-roll enumeration)
instead of a flat blot penalty.

Run `npm run test` to see the engine's own test suite (`engine.test.ts`) — it
covers the starting position, blocked points, hitting, bar re-entry, forced dice
usage, and all three win kinds.

## Deploying

The app builds as a standard Next.js app (`output: "standalone"`), so it deploys
cleanly to [Vercel](https://vercel.com/):

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Import it in Vercel, or run `vercel` from this directory.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel project
   settings if you want online features.
4. Deploy.

## Roadmap

Deliberately not built yet, so nothing here is half-working:

- **Online real-time rooms** (`/play/[code]`) over Supabase Realtime — the
  "create/join room" buttons already exist and build the right URL; the schema
  already has a `games` table for it.
- **Accounts pages**: `/signup`, `/profile` (avatar, stats, game history, badges).
- **Leaderboard page** rendering the `public.leaderboard` view already defined in
  `supabase/schema.sql`.
- **ELO-style rating**, computed client-side on game end (RLS already scopes each
  player to updating their own profile row, so no server function is needed).
- **Achievements/badges** (first win, win streaks, gammon/backgammon wins).
- Friends, invites, and notifications.
- Tournaments and a daily challenge.
- Game replay viewer (move history is already tracked in-session — persisting it
  is the main remaining piece).
- Spectating other players' live games.
- An AI "coach" that explains its move choice, and a training/puzzle mode.
- Seasonal/weekly leaderboards and an XP/level system.

## Known issues

- No screenshot is embedded in this README yet — run `npm run dev` and capture
  one whenever convenient.
- `metadataBase` in `app/layout.tsx` still points at the placeholder
  `https://example.com`; update it to the real deployed domain once you have one.
- The AI's "Hard" difficulty is a stronger single-ply heuristic, not a real
  multi-ply search — it's noticeably better than "Medium" but still beatable.
- Supabase-backed pieces (`Chat`, `AuthProvider`, `login`) are wired up but there
  are no accounts/leaderboard pages yet to exercise them end-to-end (see Roadmap).
