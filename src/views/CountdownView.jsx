import { useState } from 'react'
import {
  BellRing,
  Coffee,
  Hourglass,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { COUNTDOWN_PRESETS } from '../constants.js'
import { PresetPicker } from '../components/timer/PresetPicker.jsx'
import { FocusWorldCard } from '../components/focus/FocusWorld.jsx'
import { splitClock } from '../utils/timeFormatters.js'
import { cx } from '../utils/cx.js'

const RING_RADIUS = 132
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function splitDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000)
  const pad = (value) => String(value).padStart(2, '0')
  return {
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
  }
}

function durationFromParts(parts) {
  const hours = Number(parts.hours) || 0
  const minutes = Number(parts.minutes) || 0
  const seconds = Number(parts.seconds) || 0
  return (hours * 3600 + minutes * 60 + seconds) * 1000
}

function clampPart(value, max) {
  const digits = String(value).replace(/[^\d]/g, '')
  if (!digits) return ''
  return String(Math.min(max, Number(digits)))
}

function CountdownRing({ countdown, preset, onToggle, onReset, onToggleZen, zen }) {
  const { hours, minutes, seconds } = splitClock(countdown.remainingMs)
  const fraction =
    countdown.durationMs > 0
      ? Math.min(1, Math.max(0, countdown.remainingMs / countdown.durationMs))
      : 0
  const offset = RING_CIRCUMFERENCE * (1 - fraction)
  const isBreak = preset.id === 'break'
  const accent = isBreak ? '#f59e0b' : preset.color
  const primaryLabel = countdown.isRunning
    ? 'Pause'
    : countdown.isPaused
      ? 'Resume'
      : 'Start'

  return (
    <section
      aria-label="Countdown timer"
      className={cx(
        'relative flex w-full flex-col overflow-hidden',
        zen
          ? 'min-h-screen justify-between bg-[#09090b] px-5 py-8 text-zinc-50 sm:px-10 sm:py-12'
          : 'rounded-[2rem] border border-zinc-200/80 bg-white/85 p-5 shadow-xl shadow-zinc-950/[0.04] backdrop-blur-sm sm:p-8 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/55 dark:shadow-black/20',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cx(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide',
              countdown.isRunning
                ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300'
                : countdown.isPaused
                  ? 'border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'border-zinc-200/80 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                'size-2 rounded-full',
                countdown.isRunning
                  ? 'animate-pulse bg-emerald-500'
                  : countdown.isPaused
                    ? 'bg-amber-500'
                    : 'bg-zinc-400',
              )}
            />
            {countdown.isRunning
              ? isBreak
                ? 'On break'
                : 'Countdown active'
              : countdown.isPaused
                ? 'Paused'
                : 'Ready'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-zinc-50/80 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
            {isBreak ? (
              <Coffee className="size-3.5 text-amber-500" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{preset.emoji}</span>
            )}
            {preset.label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleZen()}
          aria-label={zen ? 'Exit full screen' : 'Enter full screen'}
          className={cx(
            'inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            zen
              ? 'border-white/15 bg-white/10 text-white hover:bg-white/15'
              : 'border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white',
          )}
        >
          {zen ? (
            <Minimize2 className="size-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="size-4" aria-hidden="true" />
          )}
          <span>{zen ? 'Exit' : 'Full screen'}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-7 sm:py-10">
        <div className="relative mx-auto w-full max-w-[21rem] sm:max-w-[24rem]">
          <svg
            viewBox="0 0 320 320"
            aria-hidden="true"
            className="w-full -rotate-90 overflow-visible"
          >
            <circle
              cx="160"
              cy="160"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              strokeWidth="10"
            />
            <circle
              cx="160"
              cy="160"
              r={RING_RADIUS}
              fill="none"
              stroke={accent}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              opacity="0.92"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <p
              role="timer"
              aria-live="off"
              aria-label={`${hours} hours ${minutes} minutes ${seconds} seconds remaining`}
              className="flex items-baseline justify-center font-extrabold leading-none tracking-[-0.055em] tabular-nums text-zinc-950 dark:text-white"
              style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
            >
              <span className="text-[clamp(2.4rem,8.2vw,5.7rem)]">{hours}</span>
              <span className="px-[0.03em] text-[clamp(1.7rem,6vw,4rem)] font-light text-zinc-300 dark:text-zinc-700">
                :
              </span>
              <span className="text-[clamp(2.4rem,8.2vw,5.7rem)]">{minutes}</span>
              <span className="px-[0.03em] text-[clamp(1.7rem,6vw,4rem)] font-light text-zinc-300 dark:text-zinc-700">
                :
              </span>
              <span className="text-[clamp(2.4rem,8.2vw,5.7rem)]">{seconds}</span>
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              {isBreak ? 'Break remaining' : 'Focus remaining'}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          {Math.round(countdown.progress * 100)}% complete
          <span className="mx-2 text-zinc-300 dark:text-zinc-700">·</span>
          {countdown.isPaused
            ? 'The countdown is frozen until you resume.'
            : countdown.isRunning
              ? 'Your session will be saved automatically.'
              : 'Ready when you are.'}
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onReset}
          disabled={!countdown.canReset}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </button>

        <button
          type="button"
          onClick={onToggle}
          className={cx(
            'inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl px-6 text-base font-extrabold text-white shadow-lg transition-[transform,background-color,box-shadow] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950',
            countdown.isRunning
              ? 'bg-amber-500 shadow-amber-500/25 hover:bg-amber-400 focus-visible:ring-amber-500'
              : countdown.isPaused
                ? 'bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-500 focus-visible:ring-emerald-500'
                : isBreak
                  ? 'bg-amber-600 shadow-amber-600/25 hover:bg-amber-500 focus-visible:ring-amber-500'
                  : 'bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-500 focus-visible:ring-indigo-500',
          )}
        >
          {countdown.isRunning ? (
            <Pause className="size-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="size-5 fill-current" aria-hidden="true" />
          )}
          {primaryLabel}
        </button>
      </div>
    </section>
  )
}

export function CountdownView({
  countdown,
  preset,
  presets,
  sessions,
  zenMode,
  onToggleZen,
  onSelectPreset,
  onOpenCustomPreset,
  onToggle,
  onReset,
  onSetDuration,
  focusWorldEnabled = true,
  animationsEnabled = true,
  reducedMotion = false,
}) {
  // While the user is editing, keep a draft of the three fields. Otherwise the
  // inputs follow the countdown duration, so settings and quick actions can
  // update the setup screen without remounting it or interrupting typing.
  const [draft, setDraft] = useState(null)
  const parts = draft ?? splitDuration(countdown.durationMs)

  const setPresetMinutes = (minutes) => {
    const ms = minutes * 60 * 1000
    setDraft(null)
    onSetDuration(ms)
  }

  const updatePart = (key, max, value) => {
    const next = { ...parts, [key]: clampPart(value, max) }
    setDraft(next)
    const total = durationFromParts(next)
    if (total >= 1000) onSetDuration(total)
  }

  const normalizeParts = () => {
    if (durationFromParts(parts) < 1000) {
      setDraft(null)
      onSetDuration(60 * 1000)
      return
    }
    setDraft(null)
  }

  const ring = (
    <CountdownRing
      countdown={countdown}
      preset={preset}
      zen={zenMode}
      onToggle={onToggle}
      onReset={onReset}
      onToggleZen={onToggleZen}
    />
  )

  if (zenMode) {
    return (
      <div className="fixed inset-0 z-50 h-dvh w-screen overflow-y-auto bg-[#09090b] text-zinc-50">
        {ring}
      </div>
    )
  }

  const isBreak = preset.id === 'break'
  const totalMs = countdown.durationMs

  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-8">
      <h1 className="sr-only">
        LaplyGo countdown timer with focus presets, custom durations, and break
        tracking
      </h1>

      <PresetPicker
        presets={presets}
        selectedId={preset.id}
        onSelect={onSelectPreset}
        onAdd={onOpenCustomPreset}
        disabled={countdown.isActive || countdown.isComplete}
      />

      {countdown.isIdle ? (
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white/85 p-5 shadow-xl shadow-zinc-950/[0.04] backdrop-blur-sm sm:p-8 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/55 dark:shadow-black/20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                <Hourglass className="size-3.5" aria-hidden="true" />
                Countdown timer
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">
                Choose a window for deep focus.
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-zinc-50/80 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
              {isBreak ? (
                <Coffee className="size-3.5 text-amber-500" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">{preset.emoji}</span>
              )}
              {preset.label}
            </span>
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
            Quick presets
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {COUNTDOWN_PRESETS.map((minutes) => {
              const active = totalMs === minutes * 60 * 1000
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setPresetMinutes(minutes)}
                  aria-pressed={active}
                  className={cx(
                    'min-h-11 rounded-xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    active
                      ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
                  )}
                >
                  {minutes}m
                </button>
              )
            })}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                Custom duration
              </p>
              <div className="mt-2.5 flex items-end gap-2">
                {[
                  { key: 'hours', label: 'Hours', max: 23 },
                  { key: 'minutes', label: 'Minutes', max: 59 },
                  { key: 'seconds', label: 'Seconds', max: 59 },
                ].map((field, index) => (
                  <div key={field.key} className="flex items-end gap-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                        {field.label}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={parts[field.key]}
                        onChange={(event) =>
                          updatePart(field.key, field.max, event.target.value)
                        }
                        onBlur={normalizeParts}
                        placeholder="00"
                        aria-label={field.label}
                        className="h-12 w-[4.5rem] rounded-xl border border-zinc-200 bg-white text-center text-lg font-bold tabular-nums text-zinc-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </label>
                    {index < 2 && (
                      <span className="pb-3 text-lg font-light text-zinc-300 dark:text-zinc-700">
                        :
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Selected window{' '}
                <span className="font-bold tabular-nums text-zinc-900 dark:text-white">
                  {formatPreview(totalMs)}
                </span>
              </p>
              <button
                type="button"
                onClick={onToggle}
                className={cx(
                  'inline-flex h-14 w-full min-w-[13rem] items-center justify-center gap-2.5 rounded-2xl px-6 text-base font-extrabold text-white shadow-lg transition-[transform,background-color,box-shadow] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950',
                  isBreak
                    ? 'bg-amber-600 shadow-amber-600/25 hover:bg-amber-500 focus-visible:ring-amber-500'
                    : 'bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-500 focus-visible:ring-indigo-500',
                )}
              >
                <Play className="size-5 fill-current" aria-hidden="true" />
                Start {isBreak ? 'break' : 'timer'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-indigo-500" aria-hidden="true" />
              Saved automatically when it reaches zero
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BellRing className="size-3.5 text-zinc-400" aria-hidden="true" />
              Optional sound &amp; notification in Settings
            </span>
          </div>
        </section>
      ) : (
        ring
      )}

      <FocusWorldCard
        sessions={sessions}
        liveFocusMs={
          isBreak ? 0 : countdown.isActive ? countdown.elapsedMs : 0
        }
        enabled={focusWorldEnabled}
        animate={animationsEnabled && !reducedMotion}
      />
    </div>
  )
}

function formatPreview(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
