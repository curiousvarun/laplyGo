import {
  formatDateKey,
  formatDateShort,
  formatDurationShort,
  formatLapClock,
  formatPreciseClock,
  formatTime,
} from './timeFormatters.js'

export const ACCENT = Object.freeze({
  focus: '#6366f1',
  focusSoft: '#eef2ff',
  break: '#f59e0b',
  breakSoft: '#fffbeb',
  split: '#06b6d4',
  splitSoft: '#ecfeff',
})

export function padSequence(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, '0')
}

/** Every interval saved during one Start → Stop run shares a session id. */
export function getSessionGroupId(session) {
  return session?.sessionId || session?.id || 'session'
}

function intervalTitle(index) {
  return `Focus interval ${padSequence(index)}`
}

function breakTitle(index) {
  return `Break ${padSequence(index)}`
}

function splitTitle(index) {
  return `Split ${padSequence(index)}`
}

export function sessionToTimelineEntry(session, ordinal = 1) {
  const isBreak = session.type === 'break'
  const index = Number(
    isBreak ? session.breakIndex : session.intervalIndex,
  )
  const sequence = Number.isFinite(index) && index > 0 ? index : ordinal

  return {
    id: session.id,
    type: isBreak ? 'break' : 'focus',
    index: sequence,
    title: isBreak
      ? breakTitle(sequence)
      : session.mode === 'countdown'
        ? 'Focus session'
        : intervalTitle(sequence),
    presetLabel: isBreak ? 'Break' : session.presetLabel,
    emoji: isBreak ? '☕' : session.presetEmoji,
    color: isBreak ? ACCENT.break : session.presetColor || ACCENT.focus,
    startTime: session.startTime,
    endTime: session.endTime,
    durationMs: session.durationMs,
    cumulativeMs: Number.isFinite(Number(session.cumulativeMs))
      ? Number(session.cumulativeMs)
      : session.durationMs,
    status: 'completed',
    splits: (Array.isArray(session.laps) ? session.laps : []).map(
      (lap, splitIndex) => ({
        id: lap.id ?? `${session.id}-split-${splitIndex + 1}`,
        index: Number(lap.index) || splitIndex + 1,
        title: splitTitle(Number(lap.index) || splitIndex + 1),
        durationMs: lap.splitMs,
        cumulativeMs: lap.totalMs,
        atEpoch: lap.atEpoch ?? session.endTime,
      }),
    ),
  }
}

/** Old records have no session ids; each legacy row is its own completed run. */
export function buildHistoryTimeline(sessions) {
  const ordinals = new Map()

  return sessions.map((session) => {
    const groupId = getSessionGroupId(session)
    const next = (ordinals.get(groupId) ?? 0) + 1
    ordinals.set(groupId, next)
    return sessionToTimelineEntry(session, next)
  })
}

export function computeFocusStats(sessions, live = null) {
  let historyFocusMs = 0
  let historyBreakMs = 0
  let historyIntervalCount = 0
  let historyLongestMs = 0
  const sessionGroups = new Set()

  for (const session of sessions) {
    if (session.type === 'break') {
      historyBreakMs += session.durationMs
      continue
    }

    historyFocusMs += session.durationMs
    historyIntervalCount += 1
    historyLongestMs = Math.max(historyLongestMs, session.durationMs)
    sessionGroups.add(getSessionGroupId(session))
  }

  const liveFocusMs = live?.activeMs ?? 0
  const liveBreakMs = live?.breakMs ?? 0
  const liveIntervalCount = live?.intervalCount ?? 0
  const intervalCount = historyIntervalCount + liveIntervalCount
  const totalFocusMs = historyFocusMs + liveFocusMs
  const totalBreakMs = historyBreakMs + liveBreakMs
  const longestIntervalMs = Math.max(
    historyLongestMs,
    live?.longestIntervalMs ?? 0,
  )

  return {
    totalFocusMs,
    totalBreakMs,
    completedSessions: sessionGroups.size,
    intervalCount,
    averageIntervalMs: intervalCount > 0 ? totalFocusMs / intervalCount : 0,
    longestIntervalMs,
  }
}

export function sessionTimelineEntries(completedSession) {
  if (!completedSession) return []

  const entries = [
    ...(completedSession.intervals ?? []),
    ...(completedSession.breaks ?? []),
  ]

  return entries
    .map((entry) =>
      entry.type
        ? entry
        : {
            ...entry,
            type: entry.kind === 'break' ? 'break' : 'focus',
          },
    )
    .sort((a, b) => a.startTime - b.startTime)
}

export function buildSessionShareText(session) {
  if (!session) return ''

  const entries = sessionTimelineEntries(session)
  const isBreak = session.mode === 'countdown' && session.totalActiveMs === 0
  const primaryMs = isBreak ? session.totalBreakMs : session.totalActiveMs
  const lines = [
    `LaplyGo — ${session.presetLabel || 'Focus'} session`,
    isBreak
      ? `Break ${formatPreciseClock(primaryMs)} · no focus time added`
      : `Focus ${formatPreciseClock(primaryMs)} · Break ${formatPreciseClock(session.totalBreakMs)}`,
    `${session.intervals?.length ?? 0} intervals · longest ${formatPreciseClock(session.longestIntervalMs ?? 0)}`,
    `${formatDateShort(formatDateKey(new Date(session.startTime)))} · ${formatTime(session.startTime)} → ${formatTime(session.endTime)}`,
    '',
    ...entries.map((entry) => {
      const label =
        entry.type === 'break'
          ? breakTitle(entry.index)
          : intervalTitle(entry.index)
      return `${label}  ${formatLapClock(entry.durationMs)}  (${formatDurationShort(entry.durationMs)})`
    }),
    '',
    'Tracked with LaplyGo',
  ]

  return lines.join('\n')
}
