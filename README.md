# Daybook — Personal Productivity Dashboard

Tasks, notes, and habits in one place. Next.js 14 (App Router), Drizzle ORM, Neon Postgres, deployed on Vercel. Single user, no authentication.

## Stack

- **Framework:** Next.js 14, App Router, TypeScript
- **Database:** Neon Postgres (serverless, HTTP driver — no connection pooling config needed)
- **ORM:** Drizzle
- **Styling:** Tailwind CSS
- **Hosting:** Vercel

## 1. Local setup

```bash
npm install
```

Copy the env example and fill in your database URL (see step 2 first if you don't have one yet):

```bash
cp .env.example .env.local
```

## 2. Create the Neon database

1. Go to [neon.tech](https://neon.tech) and create a free account / project.
2. In the project dashboard, open **Connection Details**.
3. Copy the **pooled** connection string (it looks like `postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`).
4. Paste it into `.env.local` as `DATABASE_URL`.

## 3. Create the database tables

This project uses Drizzle Kit to push the schema (`db/schema.ts`) directly to Postgres — no manual SQL needed:

```bash
npm run db:push
```

This creates the `tasks`, `notes`, `habits`, and `habit_logs` tables. You can inspect the schema visually any time with:

```bash
npm run db:studio
```

## 4. Run it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Deploy to Vercel

1. Push this code to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Next.js — no build config changes needed.
4. Before deploying, add the environment variable:
   - **Key:** `DATABASE_URL`
   - **Value:** the same Neon pooled connection string from step 2
   - Apply it to Production, Preview, and Development.
5. Click **Deploy**.

That's it — Vercel builds and serves the app, and every API route talks to Neon over HTTP (the `@neondatabase/serverless` driver works over fetch, so it's compatible with Vercel's serverless/edge functions without needing a persistent TCP pool).

### Running migrations against production

You ran `db:push` locally against the same Neon database Vercel uses, so the schema is already live — there's nothing extra to run on deploy. If you change `db/schema.ts` later, just run `npm run db:push` again from your machine (pointed at the same `DATABASE_URL`) before or after pushing code; Vercel doesn't run migrations automatically.

## Updating an already-deployed database (Habit Grid upgrade)

This update changes the existing `habits` table (adds `color`, `section`, `position`) rather than creating a new one — your existing habits and their history in `habit_logs` carry over untouched. Run the same command as always:

```bash
npm run db:push
```

It'll show an `ALTER TABLE "habits" ADD COLUMN ...` style diff this time instead of `CREATE TABLE`. Confirm it the same way, then push your code and redeploy.

**Note:** the old simple Habits panel (dots + streak) has been fully replaced by the new Habit Grid (days-across-the-top grid with custom emoji/color, Daily/Devotional sections, weekly goals, and an overall score) — there's no toggle between the two, the grid is now the only habit view.

## Habit Grid feature notes

- **Each habit has:** a free-text emoji, a custom hex color (color picker in the Manage modal), a section (`daily` or `devotional`), and a weekly goal (1–7 days).
- **The grid is week-scoped** — it has its own back/forward navigation independent of the Week tab's navigation, since you might want to check last week's habit grid while planning this week's tasks.
- **Score calculation:** for each habit, `min(days completed this week, weekly goal) / weekly goal`, summed across all habits and expressed as a percentage. A habit that exceeds its goal doesn't inflate the score past 100% for that habit.
- **Reordering** is drag-and-drop in the Manage Habits modal; the new order is saved via a `position` field on each habit.
- **Summary cards** at the bottom are color-coded using each habit's own custom color (lightened for the card background, full strength for the progress bar) rather than a fixed palette.

## Updating an already-deployed database (Weather widget)

This adds one new table, `settings` (a simple key/value store used to remember your chosen city). Run the usual:

```bash
npm run db:push
```

Confirm the `CREATE TABLE "settings"` statement the same way as before. Your existing data is untouched.

## Weather widget feature notes

- **No API key needed.** Both the forecast and the city search use [Open-Meteo](https://open-meteo.com), a free, keyless weather API — same approach as the Open Library book search.
- **Location is asked once and saved** to the `settings` table, so it persists across visits and devices (anyone using the live URL sees the same saved city, since there's no per-user accounts in this app).
- **Temperatures are in Celsius.** To switch to Fahrenheit, change the `temperature_unit=fahrenheit` query param in `app/api/weather/forecast/route.ts`'s Open-Meteo URL.
- Click **"Change"** on the widget at any time to search for and switch to a different city.

## Updating an already-deployed database (Calendar view)

This adds one new table, `events` (standalone calendar events — title, date, optional time, optional notes). Run:

```bash
npm run db:push
```

## Calendar view feature notes

- **Month grid** with a small dot marker on any day that has at least one event. Click a day to open the side panel.
- **The side panel shows that day's events** plus that week's tasks (pulled from the Week view's `week_tasks` table, scoped by which week the clicked day falls in) — read-only for tasks here; edit them from the Week tab.
- **Adding an event** is scoped to whichever day is currently selected; time is optional (leave blank for an all-day event).
- Calendar events are intentionally a separate, simpler concept from week tasks — appointments and one-off things rather than a to-do list.

## Updating an already-deployed database (Meal plan, food log, shopping list)

This adds five new tables: `recipes`, `recipe_ingredients`, `meal_slots`, `food_log_entries`, `shopping_list_items`. Run the usual:

```bash
npm run db:push
```

## Meal plan, food log, and shopping list — feature notes

- **Recipe library** (`recipes` + `recipe_ingredients`) is independent of any week — build it once, reuse recipes across as many weeks as you like.
- **Meal plan** lives in the Week tab: a Breakfast/Lunch/Dinner grid for the 7 days of whichever week you're viewing. Each slot links to one recipe; setting a new recipe in an already-filled slot replaces it rather than stacking multiple meals in one slot.
- **Food log** is intentionally separate from the meal plan — it's what you actually ate, not what you planned. It lives on the Dashboard tab, scoped to today. By design, there is no daily calorie total or target shown anywhere in the app; calories are visible per entry/recipe only, so the information is there without the app nudging toward a number.
- **Shopping list** is its own tab. "Pull in this week's meals" reads every recipe planned for the current week and merges ingredients with the same name into one line (combining quantities as text, e.g. "2 cups, 1 lb", rather than attempting unit conversion). Running it twice will add duplicates — there's no de-duplication against what's already on the list, so use it once per shop or manually clear items you've already pulled in.

## Updating an already-deployed database (Daily to-do list)

This adds one new table, `daily_todos`. Run:

```bash
npm run db:push
```

## Daily to-do list feature notes

- Lives in its own **Today** tab — separate from the general Tasks list (Dashboard) and This week's tasks (Week tab).
- **Resets every day by design.** There's no carryover logic and no history view — each day's items are rows scoped to that date, and the app only ever queries today's date, so yesterday's list simply isn't shown once the date changes. The rows aren't deleted (no cleanup job runs), they're just never queried again, which keeps the feature simple but means the table will accumulate old rows over time; that's fine for personal use at this scale.
- Same confetti + pop celebration on completion as the other checklists in the app.

## Gym routine template — feature notes

- **No database changes needed** — this reuses the existing `settings` table (same one Weather uses) to remember which week is the template.
- **Set any week as the template** by clicking "Set as routine template" in the Gym tracker. That week's workout types and exercises (mapped by day-of-week — Monday's plan, Tuesday's plan, etc.) become the standing routine.
- **Every new, completely empty week automatically copies the template in** the first time you open it, with "went" left unchecked — it's a starting point to follow, not a record of something already done.
- **Weeks that already have data are never touched automatically** — the auto-copy only fires on genuinely empty weeks, so it can't accidentally overwrite real workout history.
- **To deliberately replace an already-populated week** with the template (for example, to fix weeks created before you set a template), use "Replace this week with template" — this asks for confirmation first since it permanently deletes that week's existing gym data before copying the template in.
- **You can change the template at any time** by clicking "Set as routine template" on a different week — only one week is ever the template at a time.

## Drag-to-reorder — feature notes

- **No database changes needed** — same `position` columns as before, just a different (and now actually working) way to set them.
- **Rebuilt on Pointer Events instead of native HTML5 drag-and-drop.** The browser's native `draggable` attribute only reliably fires for mouse input — on most mobile browsers it silently does nothing for touch, which is why habit reordering didn't work on phone before. The new `lib/useReorderable.ts` hook uses pointer events (which fire consistently for mouse, touch, and pen) instead, so dragging now works the same way on desktop and mobile.
- **Habits reorder directly on the main Habit Grid** — drag the small grip handle next to a habit's name. Reordering is scoped within its section (Daily or Devotional reorder independently); the Manage Habits modal no longer has its own (broken) drag list, just a note pointing to the grid.
- **Gym exercises reorder within their day** — expand a day in the Gym tracker, drag the grip handle next to any exercise to reposition it within that day's list.
- Both use the same shared hook (`useReorderable`), so the interaction feels identical in both places.

## Updating an already-deployed database (Per-set tracking + rest timer)

This adds two new columns to `gym_exercises`: `rest_seconds` and `sets_completed`. Run:

```bash
npm run db:push
```

## Per-set tracking, rest timer, and mobile layout — feature notes

- **Per-set checkboxes:** if an exercise has "3" in the sets field, three small numbered circles appear underneath. Tap them in order as you finish each set — sets complete sequentially, so tapping circle 2 also marks circle 1 done (you can't skip ahead). Tapping a completed circle un-marks it and everything after it.
- **Rest timer:** tap one of the preset chips (30s, 60s, 90s, 2min) to set an exercise's rest duration — no typing needed. The moment you check off a set that isn't the last one, a countdown starts automatically and shows next to the set circles until it reaches zero. The countdown is computed from a fixed end-time rather than ticked down one second at a time, so it can't drift or freeze even if the tab is backgrounded or the page re-renders mid-countdown.
- **Exercise rows now stack vertically** (name on its own line, then sets/reps/weight/rest, then the set circles) instead of cramming everything into one long horizontal line — this is the fix for the mobile overflow issue, since a single wide row was the cause of content getting cut off on narrow screens.
- `setsCompleted` is stored per exercise per week (it lives on the same `gym_exercises` row as everything else), so it naturally resets to 0 whenever a new week's exercises are created — either by hand or via the routine template — rather than needing separate reset logic.

## Updating an already-deployed database (Calendar colors and multi-day blocks)

This adds two columns to the existing `events` table: `end_date` and `color`. Run:

```bash
npm run db:push
```

## Calendar colors and multi-day blocks — feature notes

- **Event color:** a color picker (hex) when adding an event — shows as a small colored dot on that day in the month grid and next to the event in the day panel. Defaults to the app's standard accent if not changed.
- **Multi-day blocks:** check "Block multiple days" when adding an event, pick an end date, and every day from the start through that end date gets shaded with the chosen color on the month grid — useful for holidays, trips, or anything spanning more than one day.
- **Click any existing event or block to edit it** — title, color, and either the time (regular events) or end date (blocks) are editable inline, right in the day panel. No separate edit screen.
- **Multiple events or blocks can coexist on the same day** — there's no limit; the "Add an event" form clears after each save so you can add as many as you like to one day.
- **Blocks are just events with an end date** — same `events` table, no separate concept to manage. A block shows in the day panel on every day it covers, not just the day it starts.

## Calendar event display — feature notes

- **Desktop:** each day shows up to 2 event titles as small colored pills (matching that event's color), then "+N more" if there are additional events that day. Click the day to see the full list in the side panel.
- **Mobile (narrow screens):** the same days show small colored dots instead of title text — there isn't enough width in a 7-column grid on a phone to keep titles legible, so it falls back to a simpler color cue. Click the day to see full titles in the side panel either way.
- **Multi-day blocks** (holidays etc.) still shade the entire day cell as before; individual event pills layer on top of that shading if a day happens to have both a block and a regular event.
- The breakpoint between mobile and desktop layouts is Tailwind's `sm` (640px) — phones get dots, tablets and up get title pills.

## Updating an already-deployed database (Gym on calendar)

No new tables this time — this reuses the existing `settings` table for the gym pill color (same pattern as the weather city and gym routine template). Run the usual `npm run db:push` only if you haven't already for a prior settings-based feature; if you have, there's nothing new to push.

## Gym on calendar — feature notes

- **Every day with a workout type set** (planned or already done) shows as a pill on the month grid, alongside regular events — using the same 2-pill-then-"+N more" display as events.
- **Gym pills use one fixed color** you choose via the small dumbbell-icon color picker next to the month navigation — distinct from per-event colors, since gym data doesn't carry its own color the way calendar events do.
- **Clicking a gym day** shows the workout type in the side panel, with a small "Done" label if that session is marked as went; clicking through to actually edit exercises still happens in the Week tab's Gym tracker — the calendar is a read view for gym days, not a second place to edit workouts.
- A lightweight `/api/gym/calendar-summary` endpoint backs this — it returns just date, workout type, and went-status for a date range, rather than full exercise detail, since the calendar doesn't need that.

## Project structure

```
app/
  page.tsx                 # main page — tabs between Dashboard and Week view
  layout.tsx                # fonts, metadata
  globals.css
  api/
    tasks/...                 # original single-day tasks panel
    notes/...                 # notes
    habits/...                 # habit streak tracker
    week-tasks/...              # week-scoped checklist (Week view)
    gym/...                       # gym sessions + nested exercises
    gym-exercises/[id]            # single exercise edit/delete
    focus-areas/...              # weekly focus areas + nested goals
    focus-goals/[id]              # single goal toggle/delete
    reflections/                   # one reflection per week, upserted
    books/...                       # currently-reading + Open Library search
components/
  Masthead.tsx, ViewTabs.tsx, TasksPanel.tsx, NotesPanel.tsx
  HabitGrid.tsx              # days-across-top grid, sections, score, summary cards
  HabitsManageModal.tsx        # add/edit/reorder/delete habits with custom fields
  week/
    WeekView.tsx              # container — owns the active weekStart
    WeekNav.tsx                 # back/forward week navigation
    TaskChecklist.tsx            # week-scoped tasks with confetti
    GymTracker.tsx                 # per-day went/type + sets/reps/weight
    WeeklyFocus.tsx                  # multiple focus areas, each with goals
    Reflections.tsx                    # free-text reflection, saves on blur
    CurrentlyReadingWidget.tsx           # Open Library search + reading status
db/
  schema.ts                 # Drizzle table definitions
  index.ts                    # Neon + Drizzle client
lib/
  dates.ts                   # streak calc, week-boundary helpers
  types.ts                     # shared client-side DTOs
  useCelebration.ts               # confetti + Web Audio pop on completion
drizzle.config.ts
```

## Updating an already-deployed database (adding the Week view)

If you deployed before this feature was added, you need to push the new tables to your existing Neon database — your existing tasks/notes/habits data is untouched:

```bash
npm run db:push
```

This adds `week_tasks`, `gym_sessions`, `gym_exercises`, `focus_areas`, `focus_goals`, `reflections`, and `books`. Run it once locally (pointed at the same `DATABASE_URL` your Vercel deployment uses), then push your code changes and redeploy — no separate migration step on Vercel's side.

## Week View feature notes

- **Weeks start on Monday.** Every week-scoped table stores a `week_start` date (always a Monday), and all of that week's data is fetched with a single equality filter on it.
- **Gym sessions are created lazily.** A `gym_sessions` row only gets created the first time you interact with a given day (mark it as "went," type in a workout name); days you never touch simply don't have a row, rather than pre-creating 7 empty rows per week.
- **The reading widget is global, not per-week.** "Currently reading" reflects whatever book has that status right now — it doesn't reset when you change weeks, since you're not expected to read a new book every 7 days.
- **Confetti and the pop sound are self-contained** (`lib/useCelebration.ts`) — no animation library or audio file. The pop is synthesized with the Web Audio API, and confetti is a handful of absolutely-positioned divs animated with the native Web Animations API. Both respect `prefers-reduced-motion` (confetti is skipped; the sound still plays since it isn't motion).
- **Book search calls Open Library's public API** server-side (`/api/books/search`), so no API key or account is needed.

## Design

Current palette and type are set in `tailwind.config.js` (colors: `ink`, `paper`, `accent`, `accentSoft`, `warn`, `line`) and `app/layout.tsx` (the two Google Fonts loaded as `--font-serif` and `--font-sans`). To restyle the whole app, those are the two files to start with — everything else references the named color tokens and font variables rather than hardcoding values, so a palette/font swap there cascades everywhere automatically. A few small per-component defaults (default habit color, confetti particle colors, focus-outline color) duplicate the accent value directly since they're outside Tailwind's class system; search for the old hex value across the repo if you change the accent again, to catch those too.

## Notes on the implementation

- **No auth.** All API routes are open; this is meant for personal/single-user use. If you ever want to share it, the simplest add is Vercel's password-protection on Preview/Production, or a basic middleware check against an env-stored password.
- **Optimistic UI.** Task/habit toggles and creates update the UI immediately and roll back on API failure, so the app feels instant even though every action is a real network request — there's no client-side cache layer (React Query, SWR) to keep this dependency-light. For a bigger app you'd likely want one.
- **Notes save on blur**, not on every keystroke, to avoid a write per character.
