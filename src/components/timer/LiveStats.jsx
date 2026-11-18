import {
  BadgeCheck,
  Coffee,
  Gauge,
  Layers3,
  Timer,
  Trophy,
} from 'lucide-react'
import {
  formatDurationShort,
  formatPreciseClock,
} from '../../utils/timeFormatters.js'

const ICONS = {
  focus: Timer,
  break: Coffee,
  sessions: BadgeCheck,
  intervals: Layers3,
  average: Gauge,
  longest: Trophy,
}

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  emerald:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  violet:
    'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300',
  zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
}

function Metric({ icon, tone, label, value, hint, precise }) {
  const Icon = ICONS[icon]

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/75 p-3.5 shadow-xs backdrop-blur-sm transition-colors sm:p-4 dark:border-zinc-800/80 dark:bg-zinc-900/45">
      <div className="flex items-center gap-2">
        <span className={`grid size-7 place-items-center rounded-lg ${TONES[tone]}`}>
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
      </div>
      <p className="mt-2 text-xl font-extrabold tracking-[-0.03em] tabular-nums text-zinc-950 sm:text-[1.35rem] dark:text-white">
        {value}
      </p>
      <p
        className="mt-0.5 truncate text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500"
        title={precise || hint}
      >
        {precise || hint}
      </p>
    </div>
  )
}

export function LiveStats({ stats }) {
  return (
    <section aria-label="Live session statistics">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <Metric
          icon="focus"
          tone="indigo"
          label="Total focus"
          value={formatDurationShort(stats.totalFocusMs)}
          precise={formatPreciseClock(stats.totalFocusMs)}
        />
        <Metric
          icon="break"
          tone="amber"
          label="Total break"
          value={formatDurationShort(stats.totalBreakMs)}
          precise={formatPreciseClock(stats.totalBreakMs)}
        />
        <Metric
          icon="sessions"
          tone="emerald"
          label="Sessions"
          value={String(stats.completedSessions)}
          hint="Completed sessions"
        />
        <Metric
          icon="intervals"
          tone="violet"
          label="Intervals"
          value={String(stats.intervalCount)}
          hint="Focus blocks"
        />
        <Metric
          icon="average"
          tone="cyan"
          label="Average interval"
          value={formatDurationShort(stats.averageIntervalMs)}
          precise={formatPreciseClock(stats.averageIntervalMs)}
        />
        <Metric
          icon="longest"
          tone="zinc"
          label="Longest interval"
          value={formatDurationShort(stats.longestIntervalMs)}
          precise={formatPreciseClock(stats.longestIntervalMs)}
        />
      </div>
    </section>
  )
}
