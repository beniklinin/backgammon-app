# 🎲 Backgammon

A modern, open-source backgammon web app — a real rules engine, a difficulty-tiered
AI opponent, real-time online rooms with chat, ELO rating, a leaderboard, profiles
with achievements, a game replay viewer, pass-and-play, animated UI, full
Hebrew/English (RTL-aware) i18n, and light/dark theming. Built with Next.js 14,
TypeScript, Tailwind, and Supabase.

> 🎮 **Play it now:** [backgammon-app-nine.vercel.app](https://backgammon-app-nine.vercel.app)
>
> Screenshot not checked in yet, see **Known issues**.

## Features

- ♟️ **Real backgammon rules**: standard starting position, bar entry, hitting,
  the official "use the maximum number of dice possible" forced-move rule, bear-off
  with the overage rule, and gammon/backgammon win detection — fully unit tested.
- 🤖 **AI opponent** with three difficulty levels (Easy / Medium / Hard), the hardest
  tier weighing blot exposure by actual dice-shot probability.
- 👥 **Local pass-and-play** for two people on one device.
- 🌐 **Real-time online rooms** (`/play/[code]`) — create a room, share the code or
  link, and play live over Supabase Realtime (Presence for seats/spectators,
  Broadcast for move sync). Supports spectators, in-room chat, guest play, and
  reconnects (state re-syncs from whichever peer still has it).
- 🏆 **ELO-style rating** computed client-side on game end (each player writes only
  their own `profiles` row, enforced by RLS — no backend function needed), plus an
  **all-time / weekly / monthly leaderboard**.
- 👤 **Profiles** with a photo (Supabase Storage), stats, win rate, recent-game
  history, and **9 achievement badges** (streaks, gammon/backgammon wins, rating
  milestones, games played).
- 🎬 **Game replay viewer** (`/replay/[id]`) — step or auto-play through any stored
  online match move-by-move on the real board.
- 🕗 **Move history**, live **pip count**, hit count, turn count, and a game clock.
- 🎨 A cohesive animated design system: sticky glass navbar with a working mobile
  menu, animated dice, checker pop-in, legal-move highlighting, confirm/win modals.
- 🌗 **Light & dark mode**, persisted per device.
- 🇮🇱 **Hebrew (full RTL) & English**, persisted per device, auto-detected from the
  browser on first visit.
- 📱 Responsive across mobile, tablet, and desktop.
- 📦 PWA-ready: manifest, service worker, installable icon.
- 🔌 **Supabase-ready**: auth, chat, profiles, games, and storage are defined in
  `supabase/schema.sql`; the client code checks for configuration before using
  it, so the app still runs fully (AI + pass-and-play) with zero setup — see
  **Environment variables**.

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
`supabase/schema.sql` once. It's idempotent (safe to re-run — re-run it after
pulling if you set this project up before the `moves`/`avatar_url` columns or the
`avatars` storage bucket existed).

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
  play/                the game menu (AI / pass-and-play / online)
  play/[code]/         online room: realtime board, chat, seats, rematch
  leaderboard/         all-time / weekly / monthly rankings
  profile/             your own profile (avatar upload, stats, achievements)
  profile/[username]/  a public profile page
  replay/[id]/         step/auto-play viewer for a stored online game
  login/, signup/      Supabase auth
components/           UI components (Board, DiceRoller, Navbar, Modal, Chat,
                        Avatar, ProfileView, ...)
lib/
  backgammon/          engine.ts (rules), ai.ts (opponent), pip.ts (stats),
                        elo.ts (rating), achievements.ts (badges),
                        online.ts (useOnlineRoom — Realtime sync hook)
  i18n/                dictionaries + provider (English/Hebrew, RTL-aware)
  theme/               light/dark theme provider
  auth/                Supabase auth provider
  supabase/            client + generated-style types
supabase/schema.sql  Postgres schema, RLS policies, triggers, the leaderboard
                        view, and the `avatars` storage bucket — run once
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

## Online rooms & rating (how it works)

`lib/backgammon/online.ts` (`useOnlineRoom`) syncs a room over one Supabase
Realtime channel per code — no server function or dedicated backend:

- **Presence** tracks who's in the room; the two earliest joiners (by a
  per-tab-persisted join time, so a refresh doesn't bump you to spectator) are
  seated White/Black, everyone else is a spectator.
- **Broadcast** carries the game state: whichever seat has an authoritative copy
  answers `request-state` (asked by anyone who just joined or reconnected) with a
  full snapshot, and every move/roll/reset re-broadcasts one. This keeps clients
  in sync without a shared server process.
- **Rating**: once both seats are filled by signed-in players, their starting
  ratings are frozen; on game end each client updates *only its own*
  `profiles.rating`/`wins`/`losses` (RLS: `auth.uid() = id`), and whichever seat
  is authenticated inserts the one `games` row (with the full move list, for
  replay). A guest can always play — the match just isn't rated, and isn't saved.
- **Achievements** (`lib/backgammon/achievements.ts`) are derived from that same
  `games` history client-side, so no extra tables were needed.

## Deploying

The app builds as a standard Next.js app (`output: "standalone"`), so it deploys
cleanly to [Vercel](https://vercel.com/):

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Import it in Vercel, or run `vercel` from this directory.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel project
   settings if you want online features.
4. Deploy.

## Roadmap

Now built: online real-time rooms with spectating, chat, ELO rating, an all-time
/ weekly / monthly leaderboard, profiles with photo upload and achievements, and
a replay viewer. Deliberately not built yet:

- **Friends, invites-by-link-with-notification, and a players' inbox.** Today an
  "invite a friend" is just sharing the room link/code (`/play/[code]`), which
  covers the common case without new tables; a real friends list needs its own
  schema (`friends`, `notifications`) and is the most valuable next addition.
- **Tournaments and a daily challenge** — would build on the existing `games` +
  rating pipeline, but need bracket/challenge state of their own.
- **Spectating past the room itself** — you can watch a room live if you have its
  code, but there's no lobby of "games happening right now" to browse.
- **An AI "coach"** that explains its move choice, and a training/puzzle mode.
- **XP/levels** on top of the existing rating and achievement system.
- A real multi-ply AI search (see Known issues).

## Known issues

- No screenshot is embedded in this README yet — run `npm run dev` and capture
  one whenever convenient.
- The AI's "Hard" difficulty is a stronger single-ply heuristic, not a real
  multi-ply search — it's noticeably better than "Medium" but still beatable.
- Online rooms trust the seated players' clients to compute legal moves (there's
  no server-side referee) — fine for a casual app between two willing players,
  not resistant to a deliberately modified client.
- A disconnected opponent doesn't auto-forfeit; the game just waits (presence
  shows they've left via the shrinking spectator/seat count, but there's no
  timeout).
- Local AI/pass-and-play games aren't rated and don't affect the leaderboard by
  design — only online room matches between two signed-in players are ranked.
