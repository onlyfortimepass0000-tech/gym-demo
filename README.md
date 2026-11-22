# KILO — gym demo

A pitch demo of a gym management app. Four role views over one shared dataset, no login.

| Role | Route | What it shows |
| --- | --- | --- |
| Member (Karan, 5 months in) | `/member` | Check in and out, QR check-in, month calendar of attended and missed days, today's workout with set logging and rest timer, nutrition plan, weight and progress |
| Beginner (Riya, joined today) | `/beginner` | Starts empty. Five questions generate a training plan; five more generate a nutrition plan |
| Trainer (Coach Vikrant, 13 clients) | `/trainer`, `/clients/[id]` | Every client's attendance, adherence, plan, logged sets and weight. Message a client; build their plans |
| Owner | `/owner` | Footfall by hour, revenue, churn risk, trainer performance, renewals, sign-ups to assign |

Everything is connected: check in as Karan in one tab and the trainer and owner dashboards update live in another.

## Run

```bash
npm install
npm run dev
```

## How the data works

- Workout plans come from `lib/workout-engine.ts`. It picks a split from the days per week, assigns training days with recovery gaps, fills each session from an exercise library by movement pattern, equipment, injury limitations and difficulty, then sets sets, reps, rest and RPE from the goal and experience, and trims to the session length.
- Nutrition plans come from `lib/nutrition-engine.ts`. It computes BMR (Mifflin-St Jeor), TDEE, calories and macros from the goal, then builds each meal from a food database with portion maths, respecting diet and allergen choices.
- Run the engine checks with `npx tsx scripts/test-workout.ts` and `npx tsx scripts/test-nutrition.ts`.
- App state (check-ins, logged sets, plans, messages, weigh-ins) is stored in the browser's `localStorage` through `lib/store.ts` and shared by every role view. The other ~96 members are generated from the real clock in `lib/seed.ts`, so the gym always looks active.
- Because state lives in the browser, it is per device. Replacing `lib/store.ts` with API calls to a database is the one change needed for a multi-device version.
- Use **Reset demo** in the top bar to return to the starting data before a pitch.

## Rebrand for a specific gym

Edit `lib/brand.ts` (name, tagline, currency, plan prices) and the trainer and member names in `lib/seed.ts`.

`app.html` is the earlier single-file preview and is not used by the Next.js app.
