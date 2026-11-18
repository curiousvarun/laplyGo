export const APP_NAME = 'LaplyGo'
export const APP_TAGLINE = 'Precision time. A calmer way to focus.'

/**
 * Kept on the original namespace so existing local history, settings, and
 * custom activities continue to load without a migration step.
 */
export const STORAGE_PREFIX = 'study-stopwatch'

export const STORAGE_KEYS = Object.freeze({
  timer: `${STORAGE_PREFIX}.timer.v3`,
  countdown: `${STORAGE_PREFIX}.countdown.v1`,
  legacyTimer: `${STORAGE_PREFIX}.timer.v2`,
  sessions: `${STORAGE_PREFIX}.sessions.v1`,
  settings: `${STORAGE_PREFIX}.settings.v1`,
  presets: `${STORAGE_PREFIX}.presets.v1`,
  auth: `${STORAGE_PREFIX}.auth.v1`,
  users: `${STORAGE_PREFIX}.users.v1`,
  cloud: `${STORAGE_PREFIX}.cloud.v1`,
})

/**
 * Default focus activities. A preset tags every saved session, tints the timer
 * stage, and feeds the analytics breakdown. Plain hex values keep the colors
 * portable to CSS variables, SVG, and canvas exports.
 */
export const BUILTIN_PRESETS = Object.freeze([
  { id: 'studying', label: 'Studying', emoji: '📚', color: '#6366f1' },
  { id: 'coding', label: 'Coding', emoji: '⌨️', color: '#0ea5e9' },
  { id: 'reading', label: 'Reading', emoji: '📖', color: '#8b5cf6' },
  { id: 'writing', label: 'Writing', emoji: '✍️', color: '#f59e0b' },
  { id: 'working', label: 'Working', emoji: '💼', color: '#10b981' },
  {
    id: 'personal-projects',
    label: 'Personal projects',
    emoji: '🌱',
    color: '#f43f5e',
  },
])

/** A break pseudo-activity used by the countdown timer's "take a break" flow. */
export const BREAK_PRESET = Object.freeze({
  id: 'break',
  label: 'Break',
  emoji: '☕',
  color: '#f59e0b',
  custom: false,
})

export const PRESET_COLORS = Object.freeze([
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Slate', value: '#71717a' },
])

export const PRESET_EMOJIS = Object.freeze([
  '📚',
  '⌨️',
  '📖',
  '✍️',
  '💼',
  '🌱',
  '🎯',
  '🧠',
  '🎨',
  '🎸',
  '🧪',
  '🏃',
  '🧘',
  '🍳',
  '☕',
  '⏱️',
])

export const MAX_CUSTOM_PRESETS = 20
export const MAX_PRESET_NAME_LENGTH = 24

export const DEFAULT_SETTINGS = Object.freeze({
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
})

export const DAILY_GOAL_MIN_HOURS = 1
export const DAILY_GOAL_MAX_HOURS = 16
export const DAILY_GOAL_STEP_HOURS = 0.5
export const DAILY_GOAL_PRESETS = Object.freeze([2, 3, 4, 6, 8])

export const TARGET_SESSION_MIN_MINUTES = 5
export const TARGET_SESSION_MAX_MINUTES = 180
export const TARGET_SESSION_PRESETS = Object.freeze([15, 25, 45, 60, 90])
export const REMINDER_MIN_MINUTES = 10
export const REMINDER_MAX_MINUTES = 120
export const REMINDER_PRESETS = Object.freeze([25, 50, 90])

/** Countdown presets are intentionally short and scannable. */
export const COUNTDOWN_PRESETS = Object.freeze([5, 15, 25, 45, 60])
export const COUNTDOWN_MIN_MS = 1000
export const COUNTDOWN_MAX_MS = 24 * 60 * 60 * 1000 - 1000
export const COUNTDOWN_BREAK_MINUTES = 5

export const THEME_OPTIONS = Object.freeze(['light', 'dark', 'system'])

export const VIEWS = Object.freeze([
  'stopwatch',
  'timer',
  'history',
  'analytics',
  'settings',
])

/** Sessions shorter than this are treated as accidental taps. */
export const MIN_SESSION_MS = 1000

/** Splits shorter than this are ignored to avoid double-tap noise. */
export const MIN_LAP_MS = 200

export const DEFAULT_PRESET_ID = 'studying'
