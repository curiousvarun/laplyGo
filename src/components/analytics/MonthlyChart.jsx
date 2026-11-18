import { TrendingUp } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { formatDurationShort, MS_PER_HOUR } from '../../utils/timeFormatters.js'
import { cx } from '../../utils/cx.js'

export function MonthlyChart({ days, goalHours }) {
  const goalMs = goalHours * MS_PER_HOUR
  const maxHours = Math.max(goalHours * 1.15, ...days.map((day) => day.hours), 1)
  const totalMs = days.reduce((total, day) => total + day.focusMs, 0)
  const activeDays = days.filter((day) => day.focusMs > 0).length
  const bestDay = days.reduce(
    (best, day) => (day.focusMs > best.focusMs ? day : best),
    days[0] ?? { focusMs: 0, label: '—' },
  )
  const hasData = activeDays > 0

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-zinc-200/70 p-5 sm:flex-row sm:items-start sm:justify-between dark:border-zinc-800">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            <TrendingUp className="size-3.5" aria-hidden="true" />
            30-day rhythm
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">
            {formatDurationShort(totalMs)} across {activeDays}{' '}
            {activeDays === 1 ? 'day' : 'days'}
          </h2>
        </div>
        <div className="flex gap-2">
          <span className="rounded-xl bg-zinc-100 px-3 py-2 text-right dark:bg-zinc-800">
            <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
              Best day
            </span>
            <span className="block text-sm font-bold tabular-nums">
              {formatDurationShort(bestDay.focusMs)}
            </span>
          </span>
          <span className="rounded-xl bg-zinc-100 px-3 py-2 text-right dark:bg-zinc-800">
            <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
              Goal days
            </span>
            <span className="block text-sm font-bold tabular-nums">
              {days.filter((day) => day.focusMs >= goalMs).length}
            </span>
          </span>
        </div>
      </div>

      <div className="p-5">
        <div
          className="flex h-28 items-end gap-[3px]"
          role="img"
          aria-label={`Focus time for the last 30 days. ${activeDays} active days.`}
        >
          {days.map((day) => {
            const height =
              day.focusMs === 0
                ? 3
                : Math.max(8, Math.min(100, (day.hours / maxHours) * 100))
            const metGoal = day.focusMs >= goalMs
            const active = day.focusMs > 0

            return (
              <div
                key={day.dateKey}
                className="group relative flex h-full min-w-0 flex-1 items-end"
                title={`${day.label}: ${formatDurationShort(day.focusMs)}`}
              >
                <div
                  className={cx(
                    'w-full rounded-sm transition-all duration-300 group-hover:opacity-80',
                    metGoal
                      ? 'bg-indigo-600 dark:bg-indigo-400'
                      : active
                        ? 'bg-indigo-300 dark:bg-indigo-500/55'
                        : 'bg-zinc-200 dark:bg-zinc-800',
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-2 flex justify-between text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
          <span>{days[0]?.label}</span>
          <span>{days[Math.floor(days.length / 2)]?.label}</span>
          <span>{days[days.length - 1]?.label}</span>
        </div>

        {!hasData && (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No data yet.
          </p>
        )}
      </div>
    </Card>
  )
}
