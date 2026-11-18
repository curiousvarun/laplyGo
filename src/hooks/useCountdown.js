import { useCallback, useEffect, useRef, useState } from 'react'
import {
  COUNTDOWN_MAX_MS,
  COUNTDOWN_MIN_MS,
  DEFAULT_PRESET_ID,
  STORAGE_KEYS,
} from '../constants.js'
import { createId } from '../utils/id.js'
import { formatDateKey } from '../utils/timeFormatters.js'
import { readStorage, writeStorage } from '../utils/storage.js'

const CLOCK_REANCHOR_GAP_MS = 1500
const ACTION_GUARD_MS = 140

function perfNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function clampDuration(value, fallback) {
  const number = Math.round(safeNumber(value, fallback))
  return Math.min(COUNTDOWN_MAX_MS, Math.max(COUNTDOWN_MIN_MS, number))
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

function createIdleState(presetId, durationMs) {
  return {
    v: 1,
    presetId,
    status: 'idle',
    durationMs,
    remainingMs: durationMs,
    current: null,
    sessionId: null,
    sessionStartedAt: null,
    completedAtEpoch: null,
    completion: null,
  }
}

export function buildCountdownCompletion({
  sessionId,
  preset,
  startTime,
  endTime,
  durationMs,
}) {
  const isBreak = preset.id === 'break'
  const focusEntry = {
    id: `${sessionId}-focus-1`,
    type: 'focus',
    index: 1,
    startTime,
    endTime,
    durationMs,
    cumulativeMs: durationMs,
    splits: [],
  }
  const breakEntry = {
    id: `${sessionId}-break-1`,
    type: 'break',
    index: 1,
    startTime,
    endTime,
    durationMs,
    cumulativeMs: durationMs,
    splits: [],
  }

  const summary = {
    id: sessionId,
    sessionId,
    source: 'countdown',
    mode: 'countdown',
    presetId: preset.id,
    presetLabel: isBreak ? 'Break' : preset.label,
    presetEmoji: isBreak ? '☕' : preset.emoji,
    presetColor: isBreak ? '#f59e0b' : preset.color,
    startTime,
    endTime,
    totalActiveMs: isBreak ? 0 : durationMs,
    totalBreakMs: isBreak ? durationMs : 0,
    intervals: isBreak ? [] : [focusEntry],
    breaks: isBreak ? [breakEntry] : [],
    splits: [],
    longestIntervalMs: isBreak ? 0 : durationMs,
    averageIntervalMs: isBreak ? 0 : durationMs,
  }

  const record = {
    id: focusEntry.id,
    sessionId,
    type: isBreak ? 'break' : 'focus',
    mode: 'countdown',
    subject: summary.presetLabel,
    presetId: summary.presetId,
    presetLabel: summary.presetLabel,
    presetEmoji: summary.presetEmoji,
    presetColor: summary.presetColor,
    startTime,
    endTime,
    durationMs,
    date: formatDateKey(new Date(startTime)),
    intervalIndex: isBreak ? null : 1,
    breakIndex: isBreak ? 1 : null,
    cumulativeMs: durationMs,
    laps: [],
  }

  return { ...summary, records: [record] }
}

function sanitizeCompletion(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!Array.isArray(raw.records) || raw.records.length === 0) return null
  if (typeof raw.sessionId !== 'string' || !raw.sessionId) return null
  return raw
}

function sanitizePersistedState(raw, fallbackPresetId, defaultDurationMs) {
  const presetId =
    typeof raw?.presetId === 'string' && raw.presetId
      ? raw.presetId
      : fallbackPresetId || DEFAULT_PRESET_ID
  const durationMs = clampDuration(raw?.durationMs, defaultDurationMs)

  if (!raw || typeof raw !== 'object' || raw.v !== 1) {
    return createIdleState(presetId, durationMs)
  }

  if (!['idle', 'running', 'paused', 'complete'].includes(raw.status)) {
    return createIdleState(presetId, durationMs)
  }

  if (raw.status === 'complete') {
    const completion = sanitizeCompletion(raw.completion)
    if (!completion) return createIdleState(presetId, durationMs)
    return {
      ...createIdleState(presetId, durationMs),
      status: 'complete',
      sessionId: completion.sessionId,
      sessionStartedAt: Math.round(safeNumber(raw.sessionStartedAt, completion.startTime)),
      completedAtEpoch: Math.round(safeNumber(raw.completedAtEpoch, completion.endTime)),
      remainingMs: 0,
      completion,
    }
  }

  if (raw.status === 'running') {
    const epochNow = Date.now()
    const perf = perfNow()
    return {
      ...createIdleState(presetId, durationMs),
      status: 'running',
      sessionId:
        typeof raw.sessionId === 'string' && raw.sessionId ? raw.sessionId : createId(),
      sessionStartedAt: Math.round(
        safeNumber(raw.sessionStartedAt, raw.current?.startedAtEpoch ?? epochNow),
      ),
      current: rehydrateClock(raw.current, epochNow, perf, epochNow),
      remainingMs: durationMs,
    }
  }

  return {
    ...createIdleState(presetId, durationMs),
    status: 'paused',
    sessionId:
      typeof raw.sessionId === 'string' && raw.sessionId ? raw.sessionId : createId(),
    sessionStartedAt: Math.round(
      safeNumber(raw.sessionStartedAt, epochNowSafe(raw)),
    ),
    remainingMs: Math.min(durationMs, Math.max(0, Math.round(safeNumber(raw.remainingMs, durationMs)))),
  }
}

function epochNowSafe(raw) {
  return raw?.current?.startedAtEpoch ?? Date.now()
}

export function useCountdown({
  initialPresetId = DEFAULT_PRESET_ID,
  preset,
  defaultDurationMs = 25 * 60 * 1000,
}) {
  const [state, setState] = useState(() =>
    sanitizePersistedState(
      readStorage(STORAGE_KEYS.countdown, null),
      initialPresetId,
      defaultDurationMs,
    ),
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
    writeStorage(STORAGE_KEYS.countdown, state)
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

  const complete = useCallback(
    (current, epochNow) => {
      const completion = buildCountdownCompletion({
        sessionId: current.sessionId ?? createId(),
        preset: presetRef.current,
        startTime: current.sessionStartedAt ?? epochNow,
        endTime: epochNow,
        durationMs: current.durationMs,
      })
      const next = {
        ...current,
        status: 'complete',
        current: null,
        remainingMs: 0,
        completedAtEpoch: epochNow,
        completion,
      }
      commit(next)
      return next
    },
    [commit],
  )

  /** Monotonic display clock corrected against wall time after sleep or reload. */
  const refreshClock = useCallback(() => {
    const nowEpoch = Date.now()
    const perf = perfNow()
    const current = stateRef.current

    if (current.status !== 'running' || !current.current) {
      setClockNow({ epoch: nowEpoch, perf })
      return
    }

    const gap = nowEpoch - current.current.anchorEpoch - (perf - current.current.perfStartedAt)
    const clock =
      gap > CLOCK_REANCHOR_GAP_MS
        ? reanchorClock(current.current, perf, nowEpoch)
        : current.current
    const elapsed = clockElapsed(clock, perf)

    if (elapsed >= current.durationMs) {
      complete(current, nowEpoch)
      return
    }

    if (clock !== current.current) {
      const next = { ...current, current: clock }
      stateRef.current = next
      setState(next)
    }
    setClockNow({ epoch: nowEpoch, perf })
  }, [complete])

  useEffect(() => {
    if (state.status !== 'running') return undefined

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
    if (current.durationMs < COUNTDOWN_MIN_MS) {
      return { ok: false, reason: 'too-short' }
    }

    const epochNow = Date.now()
    const perf = perfNow()
    commit({
      ...createIdleState(current.presetId, current.durationMs),
      status: 'running',
      sessionId: createId(),
      sessionStartedAt: epochNow,
      current: createClock(epochNow, perf),
    })
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
    const elapsed = clockElapsed(current.current, perf)
    if (elapsed >= current.durationMs) {
      complete(current, epochNow)
      return { ok: true, completed: true }
    }

    commit({
      ...current,
      status: 'paused',
      current: null,
      remainingMs: Math.max(0, Math.round(current.durationMs - elapsed)),
    })
    return { ok: true }
  }, [commit, complete, guardAction])

  const resume = useCallback(() => {
    const current = stateRef.current
    if (current.status !== 'paused') return { ok: false, reason: 'not-paused' }
    if (!guardAction()) return { ok: false, reason: 'throttled' }

    const epochNow = Date.now()
    const perf = perfNow()
    const elapsedTarget = Math.max(0, current.durationMs - current.remainingMs)
    commit({
      ...current,
      status: 'running',
      current: createClock(epochNow, perf, elapsedTarget, epochNow - elapsedTarget),
    })
    return { ok: true }
  }, [commit, guardAction])

  const toggle = useCallback(() => {
    const status = stateRef.current.status
    if (status === 'running') return pause()
    if (status === 'paused') return resume()
    if (status === 'idle') return start()
    return { ok: false, reason: 'complete' }
  }, [pause, resume, start])

  const setDuration = useCallback(
    (durationMs) => {
      const current = stateRef.current
      if (current.status !== 'idle') return false
      const nextDuration = clampDuration(durationMs, current.durationMs)
      if (nextDuration === current.durationMs) return true
      commit(createIdleState(current.presetId, nextDuration))
      return true
    },
    [commit],
  )

  const setPreset = useCallback(
    (presetId) => {
      if (typeof presetId !== 'string' || !presetId) return false
      const current = stateRef.current
      if (current.status !== 'idle') return false
      if (current.presetId === presetId) return true
      commit({ ...current, presetId })
      return true
    },
    [commit],
  )

  /** Used by quick actions to preload a break without starting on the user's behalf. */
  const prepare = useCallback(
    ({ presetId, durationMs }) => {
      const current = stateRef.current
      if (current.status === 'running' || current.status === 'paused') {
        return false
      }
      const nextPresetId =
        typeof presetId === 'string' && presetId ? presetId : current.presetId
      const nextDuration = clampDuration(durationMs, current.durationMs)
      commit(createIdleState(nextPresetId, nextDuration))
      return true
    },
    [commit],
  )

  const reset = useCallback(() => {
    if (!guardAction()) return { ok: false, reason: 'throttled' }
    const current = stateRef.current
    commit(createIdleState(current.presetId, current.durationMs))
    return { ok: true }
  }, [commit, guardAction])

  const acknowledgeCompletion = useCallback(() => {
    const current = stateRef.current
    commit(createIdleState(current.presetId, current.durationMs))
  }, [commit])

  const remainingMs =
    state.status === 'running' && state.current
      ? Math.max(0, state.durationMs - clockElapsed(state.current, clockNow.perf))
      : state.remainingMs
  const elapsedMs = Math.max(0, state.durationMs - remainingMs)
  const progress =
    state.durationMs > 0
      ? Math.min(1, Math.max(0, 1 - remainingMs / state.durationMs))
      : 0
  const isRunning = state.status === 'running'
  const isPaused = state.status === 'paused'
  const isIdle = state.status === 'idle'
  const isComplete = state.status === 'complete'

  return {
    ...state,
    remainingMs,
    elapsedMs,
    progress,
    completion: state.completion,
    isRunning,
    isPaused,
    isIdle,
    isComplete,
    isActive: isRunning || isPaused,
    hasSession: isRunning || isPaused || isComplete,
    canStart: isIdle,
    canReset: !isIdle,
    start,
    pause,
    resume,
    toggle,
    setDuration,
    setPreset,
    prepare,
    reset,
    acknowledgeCompletion,
  }
}
