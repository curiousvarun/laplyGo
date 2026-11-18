import { BUILTIN_PRESETS } from '../constants.js'
import {
  MS_PER_HOUR,
  addDays,
  formatDateKey,
  parseDateKey,
} from './timeFormatters.js'
import { getSessionPreset } from './presets.js'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const HEX_COLOR = /^#[0-9a-f]{6}$/i

export const HISTORY_RANGES = Object.freeze([
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
])

const BUILTIN_BY_LABEL = new Map(
  BUILTIN_PRESETS.map((preset) => [preset.label.toLowerCase(), preset]),
)

function sanitizeLaps(raw) {
  if (!Array.isArray(raw)) return []

  return raw
    .map((lap, index) => {
      const splitMs = Number(lap?.splitMs)
      const totalMs = Number(lap?.totalMs)
      if (!Number.isFinite(splitMs) || splitMs <= 0) return null
      if (!Number.isFinite(totalMs) || totalMs <= 0) return null
      return {
        id: typeof lap?.id === 'string' && lap.id ? lap.id : `lap-${index + 1}`,
        index: Number.isFinite(Number(lap?.index)) ? Number(lap.index) : index + 1,
        splitMs: Math.round(splitMs),
        totalMs: Math.round(totalMs),
        atEpoch: Number.isFinite(Number(lap?.atEpoch))
          ? Math.round(Number(lap.atEpoch))
          : undefined,
      }
    })
    .filter(Boolean)
}

export function sanitizeSession(raw) {
  if (!raw || typeof raw !== 'object') return null

  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null
  const durationMs = Number(raw.durationMs)
  const startTime = Number(raw.startTime)
  const endTime = Number(raw.endTime)

  if (!id) return null
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return null

  const isBreak = raw.type === 'break'
  const fallback = getSessionPreset(raw)
  const builtin = BUILTIN_BY_LABEL.get(String(fallback.label).toLowerCase())

  const presetId = isBreak
    ? 'break'
    : typeof raw.presetId === 'string' && raw.presetId
      ? raw.presetId
      : builtin?.id ?? 'general'
  const presetLabel = isBreak
    ? 'Break'
    : typeof raw.presetLabel === 'string' && raw.presetLabel.trim()
      ? raw.presetLabel.trim().slice(0, 40)
      : fallback.label.slice(0, 40)

  const intervalIndex = Number(raw.intervalIndex)
  const breakIndex = Number(raw.breakIndex)
  const cumulativeMs = Number(raw.cumulativeMs)

  return {
    id,
    sessionId:
      typeof raw.sessionId === 'string' && raw.sessionId ? raw.sessionId : id,
    type: isBreak ? 'break' : 'focus',
    mode:
      raw.mode === 'interval'
        ? 'interval'
        : raw.mode === 'countdown'
          ? 'countdown'
          : 'stopwatch',
    subject: presetLabel,
    presetId,
    presetLabel,
    presetEmoji: isBreak
      ? '☕'
      : typeof raw.presetEmoji === 'string' && raw.presetEmoji
        ? raw.presetEmoji.slice(0, 8)
        : fallback.emoji,
    presetColor: isBreak
      ? '#f59e0b'
      : HEX_COLOR.test(raw.presetColor)
        ? raw.presetColor
        : fallback.color,
    startTime,
    endTime,
    durationMs: Math.round(durationMs),
    date: DATE_KEY_PATTERN.test(raw.date)
      ? raw.date
      : formatDateKey(new Date(startTime)),
    intervalIndex: isBreak
      ? null
      : Number.isFinite(intervalIndex) && intervalIndex > 0
        ? Math.round(intervalIndex)
        : null,
    breakIndex: isBreak
      ? Number.isFinite(breakIndex) && breakIndex > 0
        ? Math.round(breakIndex)
        : null
      : null,
    cumulativeMs:
      Number.isFinite(cumulativeMs) && cumulativeMs > 0
        ? Math.round(cumulativeMs)
        : Math.round(durationMs),
    laps: isBreak ? [] : sanitizeLaps(raw.laps),
  }
}

export function sanitizeSessions(raw) {
  if (!Array.isArray(raw)) return []

  const seen = new Set()
  const sessions = []

  for (const value of raw) {
    const session = sanitizeSession(value)
    if (!session || seen.has(session.id)) continue
    seen.add(session.id)
    sessions.push(session)
  }

  return sessions
}

/** Union of local and remote history; ids are authoritative. */
export function mergeSessionLists(localSessions, remoteSessions) {
  const merged = new Map()

  for (const session of [
    ...sanitizeSessions(localSessions),
    ...sanitizeSessions(remoteSessions),
  ]) {
    if (!merged.has(session.id)) merged.set(session.id, session)
  }

  return [...merged.values()].sort((a, b) => a.startTime - b.startTime)
}

/**
 * Sessions are attributed to the local day they started on.
 * This keeps multi-hour late-night sessions on the day the work began.
 */
export function getRangeStartKey(range, now = new Date()) {
  switch (range) {
    case 'today':
      return formatDateKey(now)
    case 'yesterday':
      return formatDateKey(addDays(now, -1))
    case '7d':
      return formatDateKey(addDays(now, -6))
    case '30d':
      return formatDateKey(addDays(now, -29))
    default:
      return null
  }
}

export function filterSessions(
  sessions,
  { range = 'all', preset = 'all', query = '' } = {},
  now = new Date(),
) {
  const startKey = getRangeStartKey(range, now)
  const needle = String(query ?? '').trim().toLowerCase()

  return sessions.filter((session) => {
    if (preset !== 'all') {
      if (session.type !== 'focus') return false
      if (session.presetId !== preset) return false
    }

    if (needle) {
      const haystack = [
        session.presetLabel,
        session.subject,
        session.type,
        session.mode,
        session.date,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(needle)) return false
    }

    if (!startKey) return true

    if (range === 'today' || range === 'yesterday') {
      return session.date === startKey
    }

    return session.date >= startKey && session.date <= formatDateKey(now)
  })
}

/** Groups sessions by local date, newest day first and newest session first. */
export function groupSessionsByDate(sessions) {
  const groups = new Map()

  for (const session of sessions) {
    if (!groups.has(session.date)) groups.set(session.date, [])
    groups.get(session.date).push(session)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, daySessions]) => {
      const sorted = [...daySessions].sort((a, b) => b.endTime - a.endTime)
      return {
        date,
        sessions: sorted,
        focusMs: sumDuration(sorted, 'focus'),
        breakMs: sumDuration(sorted, 'break'),
      }
    })
}

export function sumDuration(sessions, type) {
  return sessions.reduce(
    (total, session) => (session.type === type ? total + session.durationMs : total),
    0,
  )
}

export function getTodayStats(sessions, dailyGoalHours, now = new Date()) {
  const todayKey = formatDateKey(now)
  const todays = sessions.filter((session) => session.date === todayKey)
  const focusMs = sumDuration(todays, 'focus')
  const breakMs = sumDuration(todays, 'break')
  const goalMs = Math.max(0, Number(dailyGoalHours) || 0) * MS_PER_HOUR

  return {
    dateKey: todayKey,
    focusSessions: todays.filter((session) => session.type === 'focus').length,
    breakSessions: todays.filter((session) => session.type === 'break').length,
    focusMs,
    breakMs,
    goalMs,
    progress: goalMs > 0 ? focusMs / goalMs : 0,
    remainingMs: Math.max(0, goalMs - focusMs),
    goalMet: goalMs > 0 && focusMs >= goalMs,
  }
}

/** Unique activity options present in history, with preset metadata. */
export function getPresetOptions(sessions) {
  const options = new Map()

  for (const session of sessions) {
    if (session.type !== 'focus') continue
    if (options.has(session.presetId)) continue
    const preset = getSessionPreset(session)
    options.set(session.presetId, {
      value: session.presetId,
      label: preset.label,
      emoji: preset.emoji,
      color: preset.color,
    })
  }

  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function getPresetByLabel(sessions, label) {
  return sessions.find(
    (session) =>
      session.type === 'focus' &&
      session.presetLabel?.toLowerCase() === String(label).toLowerCase(),
  )
}

function computeStreaks(focusDayKeys, now) {
  if (focusDayKeys.length === 0) return { current: 0, best: 0 }

  const days = new Set(focusDayKeys)
  let cursor = new Date(now)

  // A streak stays "current" until a full day has been missed.
  if (!days.has(formatDateKey(cursor))) {
    cursor = addDays(cursor, -1)
  }

  let current = 0
  while (days.has(formatDateKey(cursor))) {
    current += 1
    cursor = addDays(cursor, -1)
  }

  let best = 0
  let run = 0
  let previousDate = null

  for (const key of [...focusDayKeys].sort()) {
    const date = parseDateKey(key)
    if (previousDate && formatDateKey(addDays(previousDate, 1)) === key) {
      run += 1
    } else {
      run = 1
    }
    best = Math.max(best, run)
    previousDate = date
  }

  return { current, best }
}

export function getWeeklyData(sessions, now = new Date()) {
  const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
  const days = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = addDays(now, -offset)
    const dateKey = formatDateKey(date)
    const focusMs = sumDuration(
      sessions.filter(
        (session) => session.type === 'focus' && session.date === dateKey,
      ),
      'focus',
    )

    days.push({
      dateKey,
      weekday: weekdayFormatter.format(date),
      fullLabel: new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(date),
      focusMs,
      hours: focusMs / MS_PER_HOUR,
    })
  }

  return days
}

/** Last N days of focus time, used by the monthly rhythm chart. */
export function getMonthlyData(sessions, now = new Date(), count = 30) {
  const days = []

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = addDays(now, -offset)
    const dateKey = formatDateKey(date)
    const focusMs = sumDuration(
      sessions.filter(
        (session) => session.type === 'focus' && session.date === dateKey,
      ),
      'focus',
    )

    days.push({
      dateKey,
      label: new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
      }).format(date),
      focusMs,
      hours: focusMs / MS_PER_HOUR,
    })
  }

  return days
}

export function getAnalytics(sessions, dailyGoalHours, now = new Date()) {
  const focusSessions = sessions.filter((session) => session.type === 'focus')
  const breakSessions = sessions.filter((session) => session.type === 'break')
  // One Start → Stop run can contain several focus intervals and breaks.
  const runTotals = new Map()
  for (const session of focusSessions) {
    const key = session.sessionId || session.id
    runTotals.set(key, (runTotals.get(key) ?? 0) + session.durationMs)
  }

  const completedRuns = runTotals.size
  const totalFocusMs = sumDuration(sessions, 'focus')
  const totalBreakMs = sumDuration(sessions, 'break')
  const focusDayKeys = [...new Set(focusSessions.map((session) => session.date))]
  const streaks = computeStreaks(focusDayKeys, now)
  const week = getWeeklyData(sessions, now)
  const month = getMonthlyData(sessions, now)
  const weeklyFocusMs = week.reduce((total, day) => total + day.focusMs, 0)
  const monthlyFocusMs = month.reduce((total, day) => total + day.focusMs, 0)
  const weeklyGoalMs = Number(dailyGoalHours) * 7 * MS_PER_HOUR
  const todayKey = formatDateKey(now)
  const weekStartKey = formatDateKey(addDays(now, -6))
  const monthStartKey = formatDateKey(addDays(now, -29))
  const todaysFocus = focusSessions.filter((session) => session.date === todayKey)
  const weeklyFocus = focusSessions.filter(
    (session) => session.date >= weekStartKey && session.date <= todayKey,
  )
  const monthlyFocus = focusSessions.filter(
    (session) => session.date >= monthStartKey && session.date <= todayKey,
  )
  const todayFocusMs = todaysFocus.reduce(
    (total, session) => total + session.durationMs,
    0,
  )
  const goalMs = Math.max(0, Number(dailyGoalHours) || 0) * MS_PER_HOUR
  const totalLaps = focusSessions.reduce(
    (total, session) => total + session.laps.length,
    0,
  )
  const longestDayMs = focusDayKeys
    .map((dateKey) =>
      sumDuration(
        focusSessions.filter((session) => session.date === dateKey),
        'focus',
      ),
    )
    .reduce((longest, value) => Math.max(longest, value), 0)
  const longestSessionMs = [...runTotals.values()].reduce(
    (longest, value) => Math.max(longest, value),
    0,
  )

  return {
    totalFocusMs,
    totalBreakMs,
    completedSessions: completedRuns,
    breakSessions: breakSessions.length,
    intervalCount: focusSessions.length,
    averageFocusMs: completedRuns > 0 ? totalFocusMs / completedRuns : 0,
    longestFocusMs: focusSessions.reduce(
      (longest, session) => Math.max(longest, session.durationMs),
      0,
    ),
    longestSessionMs,
    longestDayMs,
    totalLaps,
    activeDays: focusDayKeys.length,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    week,
    month,
    weeklyFocusMs,
    monthlyFocusMs,
    weeklyGoalMs,
    weeklyProgress: weeklyGoalMs > 0 ? weeklyFocusMs / weeklyGoalMs : 0,
    weeklyGoalDays: week.filter(
      (day) => day.focusMs >= Number(dailyGoalHours) * MS_PER_HOUR,
    ).length,
    todayFocusMs,
    todaySessions: new Set(
      todaysFocus.map((session) => session.sessionId || session.id),
    ).size,
    weekSessions: new Set(
      weeklyFocus.map((session) => session.sessionId || session.id),
    ).size,
    monthSessions: new Set(
      monthlyFocus.map((session) => session.sessionId || session.id),
    ).size,
    todayGoalMs: goalMs,
    todayProgress: goalMs > 0 ? todayFocusMs / goalMs : 0,
    todayGoalMet: goalMs > 0 && todayFocusMs >= goalMs,
    todayRemainingMs: Math.max(0, goalMs - todayFocusMs),
  }
}

/** Top activities by focus time, with the tail grouped as "Other". */
export function getPresetBreakdown(sessions, limit = 5) {
  const totals = new Map()

  for (const session of sessions) {
    if (session.type !== 'focus') continue
    const existing = totals.get(session.presetId)
    if (existing) {
      existing.focusMs += session.durationMs
      existing.sessionCount += 1
    } else {
      totals.set(session.presetId, {
        presetId: session.presetId,
        label: session.presetLabel,
        emoji: session.presetEmoji,
        color: session.presetColor,
        focusMs: session.durationMs,
        sessionCount: 1,
      })
    }
  }

  const ranked = [...totals.values()].sort((a, b) => b.focusMs - a.focusMs)
  const totalFocusMs = ranked.reduce((total, item) => total + item.focusMs, 0)
  const top = ranked.slice(0, limit)
  const rest = ranked.slice(limit)

  if (rest.length > 0) {
    top.push({
      presetId: 'other',
      label: 'Other',
      emoji: '•',
      color: '#71717a',
      focusMs: rest.reduce((total, item) => total + item.focusMs, 0),
      sessionCount: rest.reduce((total, item) => total + item.sessionCount, 0),
    })
  }

  return top.map((item) => ({
    ...item,
    share: totalFocusMs > 0 ? item.focusMs / totalFocusMs : 0,
  }))
}
