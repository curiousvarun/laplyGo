import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_PRESET_ID,
  MIN_LAP_MS,
  MIN_SESSION_MS,
  STORAGE_KEYS,
} from '../constants.js'
import { createId } from '../utils/id.js'
import { formatDateKey } from '../utils/timeFormatters.js'
import { padSequence } from '../utils/focusSession.js'
import { readStorage, writeStorage } from '../utils/storage.js'

/** A clock that is monotonic while open, but anchored to wall time for reloads. */
const CLOCK_REANCHOR_GAP_MS = 1500
const ACTION_GUARD_MS = 140
const BREAK_COLOR = '#f59e0b'

function perfNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function createClock(epochNow, perf, baseMs = 0, startedAtEpoch = epochNow) {
  return {
    startedAtEpoch,
    baseMs: Math.max(0, Math.round(baseMs)),
    perfStartedAt: perf,
    anchorEpoch: epochNow,
  }
}

function clockElapsed(clock, perf) {
  if (!clock) return 0
  return Math.max(0, clock.baseMs + Math.max(0, perf - clock.perfStartedAt))
}

function reanchorClock(clock, perf, epochNow) {
  if (!clock) return clock
  const monotonicMs = clockElapsed(clock, perf)
  const wallMs = Math.max(0, epochNow - clock.startedAtEpoch)
  return {
    ...clock,
    baseMs: Math.max(0, Math.round(Math.max(monotonicMs, wallMs))),
    perfStartedAt: perf,
    anchorEpoch: epochNow,
  }
}

function createIdleState(presetId = DEFAULT_PRESET_ID) {
  return {
    v: 3,
    presetId,
    status: 'idle',
    sessionId: null,
    sessionStartedAt: null,
    intervalIndex: 0,
    activeBaseMs: 0,
    current: null,
    splits: [],
    intervals: [],
    breakIndex: 0,
    breakBaseMs: 0,
    break: null,
    breaks: [],
  }
}

function sanitizeSplit(raw, index) {
  const splitMs = Math.round(safeNumber(raw?.splitMs))
  const totalMs = Math.round(safeNumber(raw?.totalMs))
  if (splitMs <= 0 || totalMs <= 0) return null
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createId(),
    index: Number.isFinite(Number(raw?.index)) ? Number(raw.index) : index + 1,
    intervalIndex: Math.max(1, Math.round(safeNumber(raw?.intervalIndex, 1))),
    atEpoch: Math.round(safeNumber(raw?.atEpoch, Date.now())),
    splitMs,
    intervalElapsedMs: Math.max(
      splitMs,
      Math.round(safeNumber(raw?.intervalElapsedMs, splitMs)),
    ),
    totalMs,
  }
}

function sanitizeSplits(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((split, index) => sanitizeSplit(split, index))
    .filter(Boolean)
    .sort((a, b) => a.atEpoch - b.atEpoch)
    .map((split, index) => ({ ...split, index: index + 1 }))
}

function sanitizeInterval(raw) {
  const startTime = Math.round(safeNumber(raw?.startTime))
  const endTime = Math.round(safeNumber(raw?.endTime))
  const durationMs = Math.round(safeNumber(raw?.durationMs))
  if (startTime <= 0 || endTime < startTime || durationMs < 0) return null

  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createId(),
    type: 'focus',
    index: Math.max(1, Math.round(safeNumber(raw?.index, 1))),
    startTime,
    endTime,
    durationMs,
    cumulativeMs: Math.round(safeNumber(raw?.cumulativeMs, durationMs)),
    splits: sanitizeSplits(raw?.splits),
  }
}

function sanitizeBreak(raw) {
  const startTime = Math.round(safeNumber(raw?.startTime))
  const endTime = Math.round(safeNumber(raw?.endTime))
  const durationMs = Math.round(safeNumber(raw?.durationMs))
  if (startTime <= 0 || endTime < startTime || durationMs < 0) return null

  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createId(),
    type: 'break',
    index: Math.max(1, Math.round(safeNumber(raw?.index, 1))),
    startTime,
    endTime,
    durationMs,
    cumulativeMs: Math.round(safeNumber(raw?.cumulativeMs, durationMs)),
    splits: [],
  }
}

function sanitizeList(raw, sanitizer) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(sanitizer)
    .filter(Boolean)
    .sort((a, b) => a.startTime - b.startTime)
}

function rehydrateClock(raw, epochNow, perf, fallbackStart) {
  const startedAtEpoch = Math.max(
    0,
    Math.round(safeNumber(raw?.startedAtEpoch, fallbackStart ?? epochNow)),
  )
  const baseMs = Math.max(
    0,
    Math.round(safeNumber(raw?.baseMs, 0)),
    Math.max(0, epochNow - startedAtEpoch),
  )
  return createClock(epochNow, perf, baseMs, startedAtEpoch)
}

function sanitizePersistedState(raw, fallbackPresetId) {
  const presetId =
    typeof raw?.presetId === 'string' && raw.presetId
      ? raw.presetId
      : fallbackPresetId || DEFAULT_PRESET_ID

  if (!raw || typeof raw !== 'object' || raw.v !== 3) {
    return createIdleState(presetId)
  }

  if (!['idle', 'running', 'paused'].includes(raw.status) || raw.status === 'idle') {
    return createIdleState(presetId)
  }

  const epochNow = Date.now()
  const perf = perfNow()
  const intervals = sanitizeList(raw.intervals, sanitizeInterval)
  const breaks = sanitizeList(raw.breaks, sanitizeBreak)
  const activeBaseMs = intervals.reduce(
    (total, interval) => total + interval.durationMs,
    0,
  )
  const breakBaseMs = breaks.reduce((total, item) => total + item.durationMs, 0)
  const sessionId =
    typeof raw.sessionId === 'string' && raw.sessionId
      ? raw.sessionId
      : createId()
  const sessionStartedAt = Math.max(
    1,
    Math.round(
      safeNumber(
        raw.sessionStartedAt,
        intervals[0]?.startTime ?? epochNow,
      ),
    ),
  )

  if (raw.status === 'running') {
    const intervalIndex = Math.max(1, intervals.length + 1)
    return {
      ...createIdleState(presetId),
      status: 'running',
      sessionId,
      sessionStartedAt,
      intervalIndex,
      activeBaseMs,
      current: rehydrateClock(raw.current, epochNow, perf, epochNow),
      splits: sanitizeSplits(raw.splits),
      intervals,
      breakBaseMs,
      breakIndex: breaks.length,
      breaks,
    }
  }

  return {
    ...createIdleState(presetId),
    status: 'paused',
    sessionId,
    sessionStartedAt,
    intervalIndex: intervals.length,
    activeBaseMs,
    splits: sanitizeSplits(raw.splits),
    intervals,
    breakBaseMs,
    breakIndex: breaks.length + 1,
    break: rehydrateClock(raw.break, epochNow, perf, epochNow),
    breaks,
  }
}

function intervalRecord(state, clock, durationMs, endEpoch) {
  const index = Math.max(1, state.intervalIndex || state.intervals.length + 1)
  const intervalSplits = state.splits
    .filter((split) => split.intervalIndex === index)
    .map((split) => ({ ...split }))

  return {
    id: createId(),
    type: 'focus',
    index,
    startTime: clock.startedAtEpoch,
    endTime: Math.max(clock.startedAtEpoch, endEpoch),
    durationMs: Math.max(0, Math.round(durationMs)),
    cumulativeMs: Math.max(0, Math.round(state.activeBaseMs + durationMs)),
    splits: intervalSplits,
  }
}

function breakRecord(state, clock, durationMs, endEpoch) {
  return {
    id: createId(),
    type: 'break',
    index: Math.max(1, state.breakIndex || state.breaks.length + 1),
    startTime: clock.startedAtEpoch,
    endTime: Math.max(clock.startedAtEpoch, endEpoch),
    durationMs: Math.max(0, Math.round(durationMs)),
    cumulativeMs: Math.max(0, Math.round(state.breakBaseMs + durationMs)),
    splits: [],
  }
}

function toSessionRecord(record, { sessionId, preset, type }) {
  const isBreak = type === 'break'

  return {
    id: record.id,
    sessionId,
    type,
    mode: 'stopwatch',
    subject: isBreak ? 'Break' : preset.label,
    presetId: isBreak ? 'break' : preset.id,
    presetLabel: isBreak ? 'Break' : preset.label,
    presetEmoji: isBreak ? '☕' : preset.emoji,
    presetColor: isBreak ? BREAK_COLOR : preset.color,
    startTime: record.startTime,
    endTime: record.endTime,
    durationMs: record.durationMs,
    date: formatDateKey(new Date(record.startTime)),
    intervalIndex: isBreak ? null : record.index,
    breakIndex: isBreak ? record.index : null,
    cumulativeMs: record.cumulativeMs,
    laps: isBreak
      ? []
      : record.splits.map((split) => ({
          id: split.id,
          index: split.index,
          splitMs: split.splitMs,
          totalMs: split.totalMs,
          atEpoch: split.atEpoch,
        })),
  }
}

function splitToNode(split) {
  return {
    id: split.id,
    index: split.index,
    title: `Split ${padSequence(split.index)}`,
    durationMs: split.splitMs,
    cumulativeMs: split.totalMs,
    atEpoch: split.atEpoch,
  }
}

function buildLiveTimeline(state, preset, activeMs, currentIntervalMs, currentBreakMs) {
  const entries = state.intervals.map((interval) => ({
    ...interval,
    title: `Focus interval ${padSequence(interval.index)}`,
    presetLabel: preset.label,
    emoji: preset.emoji,
    color: preset.color,
    status: 'completed',
    splits: interval.splits.map(splitToNode),
  }))

  for (const item of state.breaks) {
    entries.push({
      ...item,
      title: `Break ${padSequence(item.index)}`,
      presetLabel: 'Break',
      emoji: '☕',
      color: BREAK_COLOR,
      status: 'completed',
    })
  }

  if (state.status === 'running' && state.current) {
    const index = Math.max(1, state.intervalIndex)
    const liveSplits = state.splits
      .filter((split) => split.intervalIndex === index)
      .map(splitToNode)

    entries.push({
      id: 'live-interval',
      type: 'focus',
      index,
      title: `Focus interval ${padSequence(index)}`,
      presetLabel: preset.label,
      emoji: preset.emoji,
      color: preset.color,
      startTime: state.current.startedAtEpoch,
      endTime: null,
      durationMs: currentIntervalMs,
      cumulativeMs: activeMs,
      status: 'active',
      splits: liveSplits,
    })
  }

  if (state.status === 'paused' && state.break) {
    entries.push({
      id: 'live-break',
      type: 'break',
      index: Math.max(1, state.breakIndex),
      title: `Break ${padSequence(Math.max(1, state.breakIndex))}`,
      presetLabel: 'Break',
      emoji: '☕',
      color: BREAK_COLOR,
      startTime: state.break.startedAtEpoch,
      endTime: null,
      durationMs: currentBreakMs,
      cumulativeMs: state.breakBaseMs + currentBreakMs,
      status: 'active',
      splits: [],
    })
  }

  return entries.sort((a, b) => a.startTime - b.startTime)
}

export function useStopwatch({ initialPresetId = DEFAULT_PRESET_ID, preset }) {
  const [state, setState] = useState(() =>
    sanitizePersistedState(readStorage(STORAGE_KEYS.timer, null), initialPresetId),
  )
  const [clockNow, setClockNow] = useState(() => ({
    epoch: Date.now(),
    perf: perfNow(),
  }))

  const stateRef = useRef(state)
  const presetRef = useRef(preset)
  const lastActionRef = useRef(0)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    presetRef.current = preset
  }, [preset])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.timer, state)
  }, [state])

  const guardAction = useCallback(() => {
    const current = perfNow()
    if (current - lastActionRef.current < ACTION_GUARD_MS) return false
    lastActionRef.current = current
    return true
  }, [])

  const commit = useCallback((next) => {
    stateRef.current = next
    setState(next)
    setClockNow({ epoch: Date.now(), perf: perfNow() })
  }, [])

  /** Mono-racing clock with a wall-time correction for sleep / throttled tabs. */
  const refreshClock = useCallback(() => {
    const nowEpoch = Date.now()
    const perf = perfNow()
    const current = stateRef.current
    let next = current

    if (current.status === 'running' && current.current) {
      const gap = nowEpoch - current.current.anchorEpoch - (perf - current.current.perfStartedAt)
      if (gap > CLOCK_REANCHOR_GAP_MS) {
        next = { ...current, current: reanchorClock(current.current, perf, nowEpoch) }
      }
    } else if (current.status === 'paused' && current.break) {
      const gap = nowEpoch - current.break.anchorEpoch - (perf - current.break.perfStartedAt)
      if (gap > CLOCK_REANCHOR_GAP_MS) {
        next = { ...current, break: reanchorClock(current.break, perf, nowEpoch) }
      }
    }

    if (next !== current) {
      stateRef.current = next
      setState(next)
    }
    setClockNow({ epoch: nowEpoch, perf })
  }, [])

  useEffect(() => {
    if (state.status === 'idle') return undefined

    let frameId = 0
    let cancelled = false

    const frame = () => {
      if (cancelled) return
      refreshClock()
      frameId = window.requestAnimationFrame(frame)
    }

    frameId = window.requestAnimationFrame(frame)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
    }
  }, [state.status, state.sessionId, refreshClock])

  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === 'hidden') return
      refreshClock()
    }

    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    window.addEventListener('pageshow', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
      window.removeEventListener('pageshow', sync)
    }
  }, [refreshClock])

  const start = useCallback(() => {
    const current = stateRef.current
    if (current.status !== 'idle') return { ok: false, reason: 'not-idle' }
    if (!guardAction()) return { ok: false, reason: 'throttled' }

    const epochNow = Date.now()
    const perf = perfNow()
    const next = {
      ...createIdleState(current.presetId),
      status: 'running',
      sessionId: createId(),
      sessionStartedAt: epochNow,
      intervalIndex: 1,
      current: createClock(epochNow, perf),
    }
    commit(next)
    return { ok: true }
  }, [commit, guardAction])

  const pause = useCallback(() => {
    const current = stateRef.current
    if (current.status !== 'running' || !current.current) {
      return { ok: false, reason: 'not-running' }
    }
    if (!guardAction()) return { ok: false, reason: 'throttled' }

    const epochNow = Date.now()
    const perf = perfNow()
    const durationMs = clockElapsed(current.current, perf)
    const interval = intervalRecord(current, current.current, durationMs, epochNow)
    const intervals = [...current.intervals, interval]
    const activeBaseMs = intervals.reduce(
      (total, item) => total + item.durationMs,
      0,
    )

    commit({
      ...current,
      status: 'paused',
      intervalIndex: intervals.length,
      activeBaseMs,
      current: null,
      intervals,
      breakIndex: current.breaks.length + 1,
      break: createClock(epochNow, perf),
    })

    return { ok: true, interval }
  }, [commit, guardAction])

  const resume = useCallback(() => {
    const current = stateRef.current
    if (current.status !== 'paused' || !current.break) {
      return { ok: false, reason: 'not-paused' }
    }
    if (!guardAction()) return { ok: false, reason: 'throttled' }

    const epochNow = Date.now()
    const perf = perfNow()
    const durationMs = clockElapsed(current.break, perf)
    const breakItem = breakRecord(current, current.break, durationMs, epochNow)
    const breaks = [...current.breaks, breakItem]
    const breakBaseMs = breaks.reduce(
      (total, item) => total + item.durationMs,
      0,
    )

    commit({
      ...current,
      status: 'running',
      intervalIndex: current.intervals.length + 1,
      current: createClock(epochNow, perf),
      break: null,
      breakIndex: breaks.length,
      breakBaseMs,
      breaks,
    })

    return { ok: true, break: breakItem }
  }, [commit, guardAction])

  const toggle = useCallback(() => {
    const status = stateRef.current.status
    if (status === 'running') return pause()
    if (status === 'paused') return resume()
    return start()
  }, [pause, resume, start])

  const split = useCallback(() => {
    const current = stateRef.current
    if (current.status !== 'running' || !current.current) {
      return { ok: false, reason: 'not-running' }
    }
    if (!guardAction()) return { ok: false, reason: 'throttled' }

    const perf = perfNow()
    const epochNow = Date.now()
    const intervalMs = clockElapsed(current.current, perf)
    const intervalSplits = current.splits.filter(
      (item) => item.intervalIndex === current.intervalIndex,
    )
    const previous = intervalSplits[intervalSplits.length - 1]
    const splitMs = intervalMs - (previous?.intervalElapsedMs ?? 0)

    if (splitMs < MIN_LAP_MS) {
      return { ok: false, reason: 'too-short' }
    }

    const splitItem = {
      id: createId(),
      index: current.splits.length + 1,
      intervalIndex: current.intervalIndex,
      atEpoch: epochNow,
      splitMs: Math.round(splitMs),
      intervalElapsedMs: Math.round(intervalMs),
      totalMs: Math.round(current.activeBaseMs + intervalMs),
    }

    commit({ ...current, splits: [...current.splits, splitItem] })
    return { ok: true, split: splitItem }
  }, [commit, guardAction])

  const stop = useCallback(() => {
    const current = stateRef.current
    if (current.status === 'idle') return { ok: false, reason: 'idle' }
    if (!guardAction()) return { ok: false, reason: 'throttled' }

    const epochNow = Date.now()
    const perf = perfNow()
    let intervals = [...current.intervals]
    let breaks = [...current.breaks]

    if (current.status === 'running' && current.current) {
      const durationMs = clockElapsed(current.current, perf)
      intervals = [
        ...intervals,
        intervalRecord(current, current.current, durationMs, epochNow),
      ]
    }

    if (current.status === 'paused' && current.break) {
      const durationMs = clockElapsed(current.break, perf)
      breaks = [
        ...breaks,
        breakRecord(current, current.break, durationMs, epochNow),
      ]
    }

    const totalActiveMs = intervals.reduce(
      (total, item) => total + item.durationMs,
      0,
    )
    const totalBreakMs = breaks.reduce(
      (total, item) => total + item.durationMs,
      0,
    )

    if (totalActiveMs < MIN_SESSION_MS) {
      return { ok: false, reason: 'too-short', totalActiveMs }
    }

    const presetSnapshot = presetRef.current
    const completedSession = {
      id: current.sessionId,
      presetId: presetSnapshot.id,
      presetLabel: presetSnapshot.label,
      presetEmoji: presetSnapshot.emoji,
      presetColor: presetSnapshot.color,
      startTime: current.sessionStartedAt ?? intervals[0]?.startTime ?? epochNow,
      endTime: epochNow,
      totalActiveMs,
      totalBreakMs,
      intervals,
      breaks,
      splits: [...current.splits],
      longestIntervalMs: intervals.reduce(
        (longest, item) => Math.max(longest, item.durationMs),
        0,
      ),
      averageIntervalMs: intervals.length
        ? totalActiveMs / intervals.length
        : 0,
    }

    const records = [
      ...intervals.map((interval) =>
        toSessionRecord(interval, {
          sessionId: current.sessionId,
          preset: presetSnapshot,
          type: 'focus',
        }),
      ),
      ...breaks.map((item) =>
        toSessionRecord(item, {
          sessionId: current.sessionId,
          preset: presetSnapshot,
          type: 'break',
        }),
      ),
    ]

    commit(createIdleState(current.presetId))
    return { ok: true, session: completedSession, records }
  }, [commit, guardAction])

  const reset = useCallback(() => {
    if (!guardAction()) return { ok: false, reason: 'throttled' }
    const current = stateRef.current
    commit(createIdleState(current.presetId))
    return { ok: true }
  }, [commit, guardAction])

  const setPreset = useCallback((presetId) => {
    if (typeof presetId !== 'string' || !presetId) return false
    const current = stateRef.current
    if (current.status !== 'idle') return false
    if (current.presetId === presetId) return true
    commit({ ...current, presetId })
    return true
  }, [commit])

  const currentIntervalMs =
    state.status === 'running' && state.current
      ? clockElapsed(state.current, clockNow.perf)
      : 0
  const currentBreakMs =
    state.status === 'paused' && state.break
      ? clockElapsed(state.break, clockNow.perf)
      : 0
  const activeMs = state.activeBaseMs + currentIntervalMs
  const breakMs = state.breakBaseMs + currentBreakMs
  const isRunning = state.status === 'running'
  const isPaused = state.status === 'paused'
  const isIdle = state.status === 'idle'

  const timeline = useMemo(
    () => buildLiveTimeline(state, preset, activeMs, currentIntervalMs, currentBreakMs),
    [state, preset, activeMs, currentIntervalMs, currentBreakMs],
  )

  const liveStats = useMemo(
    () => ({
      activeMs,
      breakMs,
      intervalCount:
        state.intervals.length + (state.status === 'running' ? 1 : 0),
      longestIntervalMs: Math.max(
        currentIntervalMs,
        ...state.intervals.map((interval) => interval.durationMs),
        0,
      ),
    }),
    [activeMs, breakMs, currentIntervalMs, state.intervals, state.status],
  )

  return {
    ...state,
    activeMs,
    breakMs,
    currentIntervalMs,
    currentBreakMs,
    timeline,
    liveStats,
    isRunning,
    isPaused,
    isIdle,
    hasSession: state.status !== 'idle',
    canStart: isIdle,
    canSplit: isRunning,
    canStop: !isIdle,
    canReset: !isIdle || activeMs > 0,
    start,
    pause,
    resume,
    toggle,
    split,
    stop,
    reset,
    setPreset,
  }
}
