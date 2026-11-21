# KILO — Gym operations demo

A full Next.js 14 (App Router) demo of a gym operations app for Thane. Four
role views (Member, Beginner, Trainer, Owner) sharing one SQLite database, with
check-in/check-out flows, a QR modal, an 8-week attendance heatmap, a 5-question
nutrition intake that generates macros and a meal outline, a 5-question
beginner intake that generates an equipment- and injury-aware weekly plan,
plus trainer and owner dashboards.

No auth — the demo uses a single hard-coded member (id 1, "Aryan").

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The SQLite file is created and seeded at
`data/kilo.db` on first request.

## Build

```bash
npm run build
npm start
```

## Layout

```
app/
  layout.tsx               Top nav + fonts + globals
  page.tsx                 Redirects to /member
  member/page.tsx          Hero, calendar heatmap, nutrition, workout
  beginner/page.tsx        Onboarding and generated week-1 plan
  trainer/page.tsx         Clients table + alerts
  owner/page.tsx           KPIs, foot traffic, plan mix, trainers
  api/
    checkin         POST   Opens a session row
    checkout        POST   Closes the open session
    attendance      GET    Last 56 days, streak, weekly, open-session state
    nutrition       GET/POST/DELETE  Intake answers + computed plan
    beginner        GET/POST/DELETE  Intake answers + computed plan
    clients         GET    Trainer client list
    owner-stats     GET    KPIs, hourly traffic, plan mix, trainer rows
components/        UI pieces (both server and client)
lib/
  db.ts            better-sqlite3 init + seed
  attendance.ts    Derives heatmap + streak from the sessions table
  nutrition.ts     buildNutritionPlan(answers) and intake question list
  beginner.ts      buildBeginnerPlan(answers) and intake question list
  qr.ts            Deterministic demo QR pattern
```

`app.html` at the repo root is the original single-file preview demo — kept
for quick inspection and link sharing. It is not used by the Next.js app.

## Reset the demo data

```bash
rm -rf data
```

The database and seed data regenerate on next request.
