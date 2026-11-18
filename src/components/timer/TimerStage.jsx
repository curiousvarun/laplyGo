import {
  Coffee,
  Flag,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Square,
} from 'lucide-react'
import {
  formatDurationSpoken,
  formatPreciseClock,
  splitMillisecondClock,
} from '../../utils/timeFormatters.js'
import { cx } from '../../utils/cx.js'

function StatusPill({ timer }) {
  const label = timer.isPaused
    ? 'On break'
    : timer.isRunning
      ? 'Active'
      : 'Ready'

  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide',
        timer.isPaused
          ? 'border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300'
          : timer.isRunning
            ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'border-zinc-200/80 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'size-2 rounded-full',
          timer.isPaused
            ? 'bg-amber-500'
            : timer.isRunning
              ? 'animate-pulse bg-emerald-500'
              : 'bg-zinc-400',
        )}
      />
      {label}
    </span>
  )
}

export function TimerStage({
  timer,
  preset,
  zen = false,
  onToggle,
  onSplit,
  onStop,
  onReset,
  onZen,
}) {
  const { hours, minutes, seconds, milliseconds } = splitMillisecondClock(
    timer.activeMs,
  )

  const primaryLabel = timer.isRunning
    ? 'Pause'
    : timer.isPaused
      ? 'Resume'
      : 'Start'

  const intervalNumber = timer.isRunning
    ? timer.intervalIndex
    : timer.intervals.length

  return (
    <section
      aria-label="Stopwatch"
      className={cx(
        'relative flex w-full flex-col overflow-hidden',
        zen
          ? 'min-h-screen justify-between bg-zinc-950 px-5 py-8 text-zinc-50 sm:px-10 sm:py-12'
          : 'rounded-[2rem] border border-zinc-200/80 bg-white/85 p-5 shadow-xl shadow-zinc-950/[0.04] backdrop-blur-sm sm:p-8 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/55 dark:shadow-black/20',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill timer={timer} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-zinc-50/80 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
            <span aria-hidden="true">{preset.emoji}</span>
            <span>{preset.label}</span>
          </span>
          {timer.hasSession && (
            <span className="hidden items-center rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold tabular-nums text-zinc-600 sm:inline-flex dark:bg-zinc-800 dark:text-zinc-300">
              {timer.isPaused
                ? `${timer.intervals.length} ${timer.intervals.length === 1 ? 'interval' : 'intervals'}`
                : `Interval ${String(intervalNumber).padStart(2, '0')}`}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onZen}
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

      <div className="flex flex-1 flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
        <div
          role="timer"
          aria-atomic="true"
          aria-label={`${formatDurationSpoken(timer.activeMs)} of active focus time`}
          className={cx(
            'mx-auto flex select-none items-baseline justify-center font-extrabold leading-none tracking-[-0.06em] tabular-nums text-zinc-950 dark:text-white',
            zen
              ? 'text-[clamp(3rem,10.5vw,11rem)]'
              : 'text-[clamp(2.55rem,9.2vw,8.6rem)]',
          )}
          style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
        >
          <span>{hours}</span>
          <span className="px-[0.04em] font-light text-zinc-300 dark:text-zinc-700">
            :
          </span>
          <span>{minutes}</span>
          <span className="px-[0.04em] font-light text-zinc-300 dark:text-zinc-700">
            :
          </span>
          <span>{seconds}</span>
          <span
            className={cx(
              'ml-[0.08em] font-bold tabular-nums tracking-[-0.03em]',
              zen
                ? 'text-[0.46em] text-indigo-300'
                : 'text-[0.46em] text-indigo-500 dark:text-indigo-400',
            )}
          >
            .{milliseconds}
          </span>
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
          Total active focus
        </p>

        {timer.isPaused && (
          <div className="mt-7 w-full max-w-md animate-rise rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3.5 dark:border-amber-500/25 dark:bg-amber-500/[0.08]">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                <Coffee className="size-4" aria-hidden="true" />
                Break {String(timer.breakIndex).padStart(2, '0')}
              </span>
              <span className="text-lg font-extrabold tabular-nums tracking-tight text-amber-950 dark:text-amber-100">
                {formatPreciseClock(timer.currentBreakMs)}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-amber-800/70 dark:text-amber-200/60">
              Focus clock frozen at {formatPreciseClock(timer.activeMs)}
            </p>
          </div>
        )}

        {timer.isIdle && (
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <kbd className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Space
            </kbd>
            to start
          </p>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
        <button
          type="button"
          onClick={onReset}
          disabled={!timer.canReset}
          aria-label="Reset session"
          className="order-1 inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-zinc-200/90 bg-white px-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-30 sm:order-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-label={timer.isRunning ? 'Pause and start a break' : timer.isPaused ? 'Resume focus' : 'Start focus session'}
          className={cx(
            'order-3 col-span-2 inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl px-6 text-base font-extrabold text-white shadow-lg transition-[transform,background-color,box-shadow] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:order-none dark:focus-visible:ring-offset-zinc-950',
            timer.isRunning
              ? 'bg-amber-500 shadow-amber-500/25 hover:bg-amber-400 focus-visible:ring-amber-500'
              : timer.isPaused
                ? 'bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-500 focus-visible:ring-emerald-500'
                : 'bg-indigo-600 shadow-indigo-600/25 hover:bg-indigo-500 focus-visible:ring-indigo-500',
          )}
        >
          {timer.isRunning ? (
            <Pause className="size-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="size-5 fill-current" aria-hidden="true" />
          )}
          <span>{primaryLabel}</span>
        </button>

        <button
          type="button"
          onClick={onSplit}
          disabled={!timer.canSplit}
          aria-label="Log a split checkpoint"
          className="order-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cyan-200/90 bg-cyan-50/70 px-3 text-sm font-bold text-cyan-800 transition-colors hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-30 sm:order-none dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/15"
        >
          <Flag className="size-4" aria-hidden="true" />
          <span>Split</span>
        </button>

        <button
          type="button"
          onClick={onStop}
          disabled={!timer.canStop}
          aria-label="Finish and save session"
          className="order-4 col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/60 px-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:pointer-events-none disabled:opacity-30 sm:order-none sm:col-span-4 dark:border-rose-500/25 dark:bg-rose-500/[0.07] dark:text-rose-300 dark:hover:bg-rose-500/10"
        >
          <Square className="size-3.5 fill-current" aria-hidden="true" />
          <span>Finish session</span>
        </button>
      </div>
    </section>
  )
}
