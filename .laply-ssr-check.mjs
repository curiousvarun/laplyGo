import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'

const store = new Map()
const localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
  key: (index) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
}

const classList = {
  add() {},
  remove() {},
  toggle() {},
  contains() {
    return false
  },
}

globalThis.window = globalThis
globalThis.localStorage = localStorage
globalThis.matchMedia = () => ({
  matches: true,
  addEventListener() {},
  removeEventListener() {},
})
globalThis.document = {
  documentElement: { classList, style: {} },
  body: { style: {}, appendChild() {}, removeChild() {} },
  visibilityState: 'visible',
  fullscreenElement: null,
  querySelector: () => null,
  addEventListener() {},
  removeEventListener() {},
}
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)

const now = Date.now()
const start = now - 2 * 60 * 60_000
const seed = [
  {
    id: 'ssr-1',
    sessionId: 'ssr-run-1',
    type: 'focus',
    mode: 'countdown',
    presetId: 'coding',
    presetLabel: 'Coding',
    presetEmoji: '⌨️',
    presetColor: '#0ea5e9',
    subject: 'Coding',
    startTime: start,
    endTime: start + 25 * 60_000,
    durationMs: 25 * 60_000,
    date: new Date(start).toISOString().slice(0, 10),
    intervalIndex: 1,
    breakIndex: null,
    cumulativeMs: 25 * 60_000,
    laps: [],
  },
  {
    id: 'ssr-2',
    sessionId: 'ssr-run-1',
    type: 'break',
    mode: 'countdown',
    presetId: 'break',
    presetLabel: 'Break',
    presetEmoji: '☕',
    presetColor: '#f59e0b',
    subject: 'Break',
    startTime: start + 25 * 60_000,
    endTime: start + 30 * 60_000,
    durationMs: 5 * 60_000,
    date: new Date(start).toISOString().slice(0, 10),
    intervalIndex: null,
    breakIndex: 1,
    cumulativeMs: 5 * 60_000,
    laps: [],
  },
]
localStorage.setItem('study-stopwatch.sessions.v1', JSON.stringify(seed))
localStorage.setItem(
  'study-stopwatch.settings.v1',
  JSON.stringify({
    dailyGoalHours: 4,
    targetSessionMinutes: 25,
    theme: 'dark',
    soundEnabled: false,
    notificationsEnabled: false,
    animationsEnabled: false,
    focusWorldEnabled: true,
    reducedMotion: true,
  }),
)

const server = await createServer({
  root: 'C:/Users/Varun kaushik/Desktop/StopWatch',
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

try {
  const [{ default: App }, { ToastProvider }, { HistoryView }, { AnalyticsView }, { SettingsView }, { CountdownView }] =
    await Promise.all([
      server.ssrLoadModule('/src/App.jsx'),
      server.ssrLoadModule('/src/components/ui/Toast.jsx'),
      server.ssrLoadModule('/src/views/HistoryView.jsx'),
      server.ssrLoadModule('/src/views/AnalyticsView.jsx'),
      server.ssrLoadModule('/src/views/SettingsView.jsx'),
      server.ssrLoadModule('/src/views/CountdownView.jsx'),
    ])

  const noop = () => {}
  const asyncNoop = async () => ({ ok: true })
  const h = React.createElement

  const appHtml = renderToString(
    h(ToastProvider, null, h(App)),
  )
  const appText = appHtml.replace(/<!--[^>]*-->/g, '').replace(/<[^>]+>/g, '')
  if (!appText.includes('00:00:00.000')) throw new Error('Stopwatch display missing')
  if (!appHtml.includes('Focus World')) throw new Error('Focus World missing')

  const historyHtml = renderToString(
    h(
      ToastProvider,
      null,
      h(HistoryView, {
        sessions: seed,
        onDeleteSession: noop,
        onShareSession: noop,
        onOpenStopwatch: noop,
      }),
    ),
  )
  if (!historyHtml.includes('Coding')) throw new Error('History sessions missing')

  const analyticsHtml = renderToString(
    h(AnalyticsView, {
      sessions: seed,
      dailyGoalHours: 4,
      onOpenStopwatch: noop,
    }),
  )
  if (!analyticsHtml.includes('Analytics')) throw new Error('Analytics heading missing')

  const settingsHtml = renderToString(
    h(
      ToastProvider,
      null,
      h(SettingsView, {
        settings: {
          dailyGoalHours: 4,
          targetSessionMinutes: 25,
          remindersEnabled: false,
          reminderMinutes: 50,
          theme: 'dark',
          soundEnabled: true,
          notificationsEnabled: false,
          animationsEnabled: true,
          focusWorldEnabled: true,
          reducedMotion: false,
        },
        updateSettings: noop,
        sessions: seed,
        customPresets: [],
        onCreateActivity: noop,
        onEditActivity: noop,
        onDeletePreset: noop,
        onImportBackup: noop,
        onClearHistory: noop,
        user: null,
        onOpenAuth: noop,
        cloud: { syncing: false, syncNow: asyncNoop },
      }),
    ),
  )
  for (const label of [
    'Focus goals',
    'Appearance',
    'Focus experience',
    'Activities',
    'Data &amp; privacy',
    'Account &amp; sync',
  ]) {
    if (!settingsHtml.includes(label)) throw new Error(`Settings section missing: ${label}`)
  }

  const countdownHtml = renderToString(
    h(CountdownView, {
      countdown: {
        presetId: 'coding',
        status: 'idle',
        durationMs: 25 * 60_000,
        remainingMs: 25 * 60_000,
        elapsedMs: 0,
        progress: 0,
        isIdle: true,
        isRunning: false,
        isPaused: false,
        isComplete: false,
        isActive: false,
        canReset: false,
        setDuration: noop,
      },
      preset: { id: 'coding', label: 'Coding', emoji: '⌨️', color: '#0ea5e9' },
      presets: [{ id: 'coding', label: 'Coding', emoji: '⌨️', color: '#0ea5e9' }],
      sessions: seed,
      zenMode: false,
      onToggleZen: noop,
      onSelectPreset: noop,
      onOpenCustomPreset: noop,
      onToggle: noop,
      onReset: noop,
      onSetDuration: noop,
      focusWorldEnabled: true,
      animationsEnabled: false,
      reducedMotion: true,
    }),
  )
  if (!countdownHtml.includes('Choose a window for deep focus')) {
    throw new Error('Countdown setup missing')
  }
  if (!countdownHtml.includes('00') || !countdownHtml.includes('25')) {
    throw new Error('Countdown custom duration missing')
  }

  console.log('SSR render checks passed.')
} finally {
  await server.close()
}
