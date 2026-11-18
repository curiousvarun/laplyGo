import { Brain, Check, Coffee, Flag, Radio } from 'lucide-react'
import { formatPreciseClock, formatTime } from '../../utils/timeFormatters.js'
import { cx } from '../../utils/cx.js'

function StatusTag({ status }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <Radio className="size-2.5 animate-pulse" aria-hidden="true" />
        Active
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      <Check className="size-2.5" aria-hidden="true" />
      Completed
    </span>
  )
}

function SplitNode({ split }) {
  return (
    <li className="relative pl-7">
      <span
        aria-hidden="true"
        className="absolute left-[0.46rem] top-4 size-2 rounded-full border-2 border-white bg-cyan-500 dark:border-zinc-900"
      />
      <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 px-3 py-2.5 dark:border-cyan-500/15 dark:bg-cyan-500/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-200">
            <Flag className="size-3" aria-hidden="true" />
            {split.title || `Split ${String(split.index).padStart(2, '0')}`}
          </span>
          <span className="text-xs font-extrabold tabular-nums text-cyan-900 dark:text-cyan-100">
            {formatPreciseClock(split.durationMs)}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums text-cyan-800/70 dark:text-cyan-200/60">
          <span>Cumulative {formatPreciseClock(split.cumulativeMs)}</span>
          <span>{formatTime(split.atEpoch)}</span>
        </div>
      </div>
    </li>
  )
}

function Entry({ entry, actions }) {
  const isBreak = entry.type === 'break'
  const accent = isBreak ? '#f59e0b' : entry.color || '#6366f1'
  const Icon = isBreak ? Coffee : Brain
  const splits = Array.isArray(entry.splits) ? entry.splits : []

  return (
    <li className="relative pl-8">
      <span
        aria-hidden="true"
        className="absolute left-0 top-3 grid size-[1.15rem] place-items-center rounded-full border-2 border-white shadow-sm dark:border-zinc-950"
        style={{ backgroundColor: accent }}
      >
        <span className="size-1.5 rounded-full bg-white/90" />
      </span>

      <div
        className={cx(
          'rounded-2xl border border-zinc-200/80 bg-white/85 p-3.5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/65',
          entry.status === 'active' && 'ring-2 ring-emerald-500/20',
        )}
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em]"
                style={{ backgroundColor: `${accent}18`, color: accent }}
              >
                <Icon className="size-3" aria-hidden="true" />
                {isBreak ? 'Break' : 'Focus'}
              </span>
              <p className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                {entry.title}
              </p>
              <StatusTag status={entry.status} />
            </div>
            <p className="mt-1 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
              {formatTime(entry.startTime)} →{' '}
              {entry.endTime ? formatTime(entry.endTime) : 'now'}
              <span className="mx-1.5">·</span>
              {isBreak ? 'Break time' : entry.presetLabel}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-extrabold tabular-nums tracking-tight text-zinc-950 dark:text-white">
              {formatPreciseClock(entry.durationMs)}
            </p>
            <p className="mt-0.5 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
              {isBreak ? 'Break total' : 'Cumulative'}{' '}
              {formatPreciseClock(entry.cumulativeMs)}
            </p>
          </div>
        </div>

        {splits.length > 0 && (
          <ol className="relative mt-3 space-y-2 border-t border-dashed border-zinc-200 pt-3 before:absolute before:bottom-4 before:left-[0.71rem] before:top-3 before:w-px before:bg-cyan-200 dark:border-zinc-800 dark:before:bg-cyan-900">
            {splits.map((split) => (
              <SplitNode key={split.id} split={split} />
            ))}
          </ol>
        )}

        {actions && (
          <div className="mt-3 flex items-center justify-end gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800/80">
            {actions}
          </div>
        )}
      </div>
    </li>
  )
}

export function TimelineEntry({ entry, actions }) {
  return <Entry entry={entry} actions={actions} />
}

export function ActivityTimeline({ entries, title, subtitle, empty, className }) {
  return (
    <section
      aria-label={title || 'Session timeline'}
      className={cx(
        'rounded-[1.75rem] border border-zinc-200/80 bg-white/70 p-4 backdrop-blur-sm sm:p-5 dark:border-zinc-800/80 dark:bg-zinc-900/40',
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold tracking-[-0.02em] text-zinc-950 dark:text-white">
            {title || 'Session timeline'}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {entries.length > 0 && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {entries.length} {entries.length === 1 ? 'node' : 'nodes'}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {empty || 'Your intervals, breaks, and splits will appear here.'}
        </div>
      ) : (
        <ol className="relative mt-4 space-y-3 before:absolute before:bottom-4 before:left-[0.56rem] before:top-4 before:w-px before:bg-gradient-to-b before:from-indigo-200 before:via-zinc-200 before:to-transparent dark:before:from-indigo-900 dark:before:via-zinc-800">
          {entries.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
    </section>
  )
}
