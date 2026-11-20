# LaplyGo

**Precision time. A calmer way to focus.**

LaplyGo is a millisecond-accurate stopwatch, countdown timer, and focus tracker with a peaceful visual world that grows from the time you actually focus. It is designed for studying, coding, reading, writing, working, personal projects, and any other activity that deserves a little space.

LaplyGo runs entirely in the browser. Sessions, intervals, breaks, splits, countdowns, activities, goals, and preferences stay in `localStorage`, with an optional local-preview account for sync experiments. No backend is required.

![React](https://img.shields.io/badge/React-19-149eca)
![Vite](https://img.shields.io/badge/Vite-8-646cff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)

## Five destinations

| Destination | What it does |
| --- | --- |
| **Stopwatch** | Millisecond stopwatch with focus/break separation, splits, live stats, and a session timeline. |
| **Timer** | Countdown with 5, 15, 25, 45, and 60 minute presets, custom H/M/S, progress ring, and auto-save. |
| **History** | A date-grouped vertical activity feed with search, activity filters, and date ranges. |
| **Analytics** | Today, weekly, and monthly focus time, session counts, averages, records, goals, and charts. |
| **Settings** | Focus goals, appearance, focus experience, activities, data & privacy, and account & sync. |

## What it does

- **Millisecond stopwatch** — an exact `00:00:00.000` display with tabular numerals and no layout jitter at 60fps.
- **Automatic focus / break separation** — Pause closes the active focus interval and starts a separately tracked break; Resume closes the break and starts the next focus interval. Break time is never added to active focus time.
- **Split checkpoints** — log splits during any focus interval; every split keeps its own duration, cumulative active time, and timestamp.
- **Countdown timer** — preset windows, custom hours/minutes/seconds, a live progress ring, an activity tag, pause/resume, and automatic saving when the countdown reaches zero.
- **Completion modal** — both modes end with a personalized summary, duration, activity breakdown, Focus Studio contribution, and quick actions to start another session, take a break, or view history.
- **Focus Studio** — a living midnight studio that evolves across five stages as saved focus time accumulates. No coins, gems, currency, punishment, or loss mechanics. Rest never fades it. It can be turned off in Settings.
- **Default and custom activities** — Studying, Coding, Reading, Writing, Working, and Personal projects are built in. Custom activities support a name, emoji, and color and can be created, renamed, recolored, or removed.
- **Live session intelligence** — active focus, break time, completed sessions, intervals, averages, and the longest uninterrupted interval.
- **Vertical activity timeline** — color-coded nodes for focus intervals, breaks, and splits with duration, cumulative time, start and end timestamps, and status.
- **Refresh-safe timers** — stopwatch and countdown state survive reloads, tab throttling, background tabs, and device sleep.
- **History search and filters** — search activity/type/date text, filter by date range and activity, and review the full feed.
- **Analytics** — today/weekly/monthly focus time, session counts, average duration, longest session, top activity, goal progress, streaks, weekly/monthly charts, and activity breakdowns.
- **Settings that stay useful** — daily goal, target session length, optional reminders, light/dark/system appearance, completion sound, notifications, animations, reduced motion, Focus Studio visibility, activities, data export/import, privacy notes, and account sync.
- **Full-screen Zen mode** — a distraction-free stopwatch or countdown with keyboard control.
- **Local-first and private** — no API keys, analytics scripts, or third-party tracking. Data can be exported as a full backup, history JSON, or CSV.

## Tech stack

- React 19 + Vite 8 (JavaScript only)
- Tailwind CSS 4 via `@tailwindcss/vite`
- `lucide-react` icons
- Plus Jakarta Sans via Google Fonts
- Pure CSS/SVG charts, progress rings, and Focus Studio scenery — no chart library
- Canvas-rendered share cards
- Zero-dependency `localStorage` persistence layer

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint     # ESLint
npm run build    # production build in dist/
npm run preview  # preview the production build
```

## Architecture

```text
src/
├─ App.jsx                  View routing, timer wiring, dialogs, shortcuts, import/export
├─ main.jsx                 React root + ToastProvider
├─ constants.js             Branding, storage keys, activities, settings defaults
├─ index.css                Tailwind import, dark variant, base styles, studio motion
│
├─ hooks/
│  ├─ useStopwatch.js       v3 focus/break engine: rAF display, epoch anchors, persistence
│  ├─ useCountdown.js       v1 countdown engine: pause/resume, wall-clock recovery, completion
│  ├─ useSessions.js        Session CRUD, sanitization, atomic bulk add
│  ├─ useSettings.js        Settings persistence and sanitization
│  ├─ usePresets.js         Built-in + custom activity management and editing
│  ├─ useFocusReminders.js  Optional non-punitive notification check-ins
│  ├─ useMotionPreferences.js  Animation and reduced-motion preferences
│  ├─ useAuth.js            Local preview account state
│  ├─ useCloudSync.js       Pull/merge/push lifecycle
│  ├─ useZenMode.js         Fullscreen + Zen state
│  ├─ useWakeLock.js        Screen Wake Lock lifecycle
│  ├─ useKeyboardShortcuts.js  Space / L / R / S / F / Escape
│  ├─ useDocumentTitle.js   Live tab title for both timer modes
│  └─ useNow.js             Coarse clock for day rollover
│
├─ views/
│  ├─ StopwatchView.jsx     Presets, timer stage, live stats, Focus Studio, timeline
│  ├─ CountdownView.jsx     Countdown setup, custom duration, progress ring, Focus Studio
│  ├─ HistoryView.jsx       Search, filters, and a date-grouped vertical activity feed
│  ├─ AnalyticsView.jsx     Today/week/month metrics, charts, activity split, records
│  └─ SettingsView.jsx      Sections A–F: goals, appearance, experience, activities, data, account
│
├─ components/
│  ├─ timer/                Stage, preset picker, live stats, timeline, completion summary
│  ├─ focus/                Focus Studio scene, stages, and environment switcher
│  ├─ history/              Filter bar and timeline session nodes
│  ├─ analytics/            Weekly/monthly charts and activity breakdown
│  ├─ layout/               Shell, top bar, five-destination navigation
│  ├─ auth/ share/ presets/ Account, share, and custom-activity dialogs
│  ├─ dialogs/              Confirm and clear-history modals
│  └─ ui/                   Button, Card, Modal, Switch, SegmentedControl, etc.
│
└─ utils/
   ├─ focusSession.js       Stats aggregation, timeline mapping, share text
   ├─ focusWorld.js         Legacy garden calculations (kept for older backups)
   ├─ presets.js            Preset lookup and normalization
   ├─ sessions.js           Filtering, grouping, stats, streaks, chart data
   ├─ storage.js            Defensive localStorage wrapper
   ├─ exportData.js         Backup, JSON, and CSV downloads; validated backup reads
   ├─ feedback.js           Synthesized completion chime and browser notifications
   ├─ shareCard.js          Canvas card rendering and share text
   ├─ cloudSync.js          Provider-shaped local preview adapter
   └─ timeFormatters.js     HH:MM:SS.MMM, durations, date keys, labels
```

State is split by concern: each timer owns its live timing, sessions own saved history, settings own preferences, and presets own activities. `App.jsx` wires them together and prevents both timers from running at once.

## How timing works

LaplyGo never accumulates time by counting animation frames. Both engines combine two clocks:

```js
elapsed = baseMs + (performance.now() - perfStartedAt)
```

- `performance.now()` provides a smooth monotonic clock while the page is open.
- `Date.now()` anchors the run to wall time so refreshes and reloads can restore the correct elapsed value.
- `requestAnimationFrame` only repaints the display. A throttled or background tab still shows the correct time when it wakes.
- `visibilitychange`, `focus`, and `pageshow` force an immediate re-sync.
- Sleep or clock drift is corrected by re-anchoring to the larger of the monotonic and wall-clock elapsed values.
- State is written on meaningful transitions, not every frame.

For the stopwatch, pausing folds the current interval into `intervals` and starts a break clock. Resuming folds the break into `breaks` and opens a fresh focus interval. Active time is always derived from the `intervals` list only, so break time can never leak into focus totals.

For the countdown, the elapsed target is persisted as a clock base. Pause freezes the remaining wall-clock value; resume re-anchors it. On reload, the larger of the persisted base and the wall-clock gap is used. When the remaining time reaches zero, one focus record is built, saved automatically, and surfaced in the completion modal.

## Local data

All data lives in `localStorage` under the `study-stopwatch.*` namespace, kept for backward compatibility with earlier versions.

| Key | Contents |
| --- | --- |
| `study-stopwatch.timer.v3` | Stopwatch state machine, current clocks, splits, intervals, breaks |
| `study-stopwatch.countdown.v1` | Countdown preset, duration, remaining clock, completion payload |
| `study-stopwatch.sessions.v1` | Saved focus intervals, countdown sessions, and breaks, grouped by `sessionId` |
| `study-stopwatch.settings.v1` | Goals, target session, reminders, theme, feedback, motion, Focus Studio |
| `study-stopwatch.presets.v1` | Custom activities |
| `study-stopwatch.auth.v1` | Preview account session |
| `study-stopwatch.users.v1` | Preview account directory |
| `study-stopwatch.cloud.v1` | Preview sync buckets |

Reads are defensive: malformed JSON, missing fields, duplicate IDs, unknown legacy activity labels, and disabled storage fall back safely instead of crashing. A completed stopwatch run writes one focus record per interval and one break record per break, all sharing the same `sessionId`. A completed countdown writes one record with the same shared identifier model.

Backup imports are parsed as text, size-limited, and sanitized before merging. Sessions and custom activities merge by id; imported settings are sanitized and replace matching preferences only after confirmation.

## Keyboard shortcuts

Active on Stopwatch and Timer views; ignored while typing in an input, textarea, or select, and while a dialog is open.

| Key | Action |
| --- | --- |
| `Space` | Start, pause, or resume the active view's timer |
| `L` | Log a split checkpoint (Stopwatch) |
| `R` | Reset the active timer (with confirmation when it has data) |
| `S` | Finish and save the stopwatch session |
| `F` | Toggle Zen mode |
| `Escape` | Exit Zen |

## Accessibility and responsiveness

- Both timer displays use `role="timer"` with tabular numerals and a spoken duration/remaining label.
- Countdown progress is also shown as a percentage and a textual status.
- Controls have visible labels and meet a 44px minimum tap target.
- Icon-only controls have accessible names; dialogs are labelled and dismissible with Escape.
- Light and dark themes both use high-contrast surfaces; the theme is applied before first paint.
- Layouts are checked from small phones through wide desktop, with desktop navigation and a five-item mobile tab bar.
- Motion preferences are respected at the OS level and through Settings.
- Screen Wake Lock is requested while either timer has an active session where supported.

## Notes and limitations

- Storage is per browser and per origin. Clearing site data removes history; export a backup first.
- The included account and cloud layer is a local preview, not a real cross-device service. Replace `src/utils/cloudSync.js` to use Supabase, Firebase, or your own API.
- Browser notifications require explicit permission and a secure context (HTTPS or `localhost`).
- Wake Lock requires a secure context and browser support.
- Completion sounds are synthesized after a user gesture; browsers may block audio until the page has been interacted with.
- Data is not encrypted at rest; it is only as private as the browser profile.
