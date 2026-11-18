import { CalendarDays } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { Badge } from '../ui/Badge.jsx'
import { formatDurationShort, formatGoal, MS_PER_HOUR } from '../../utils/timeFormatters.js'
import { cx } from '../../utils/cx.js'

export function WeeklyChart({ days, goalHours, weeklyFocusMs, weeklyGoalDays }) {
  const maxHours = Math.max(goalHours, ...days.map((day) => day.hours), 1)
  const scaleMax = maxHours * 1.18
  const goalPercent = Math.min(100, (goalHours / scaleMax) * 100)
  const goalMs = goalHours * MS_PER_HOUR
  const todayKey = days[days.length - 1]?.dateKey

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-zinc-200/70 p-5 sm:flex-row sm:items-start sm:justify-between dark:border-zinc-800">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Last 7 days
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">
            {formatDurationShort(weeklyFocusMs)} focused
          </h2>
          <p className="mt-0.5 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
            Goal {formatGoal(goalHours)} / day
          </p>
        </div>
        <Badge tone={weeklyGoalDays > 0 ? 'study' : 'neutral'} dot>
          {weeklyGoalDays} of 7 goals met
        </Badge>
      </div>

      <div className="p-5">
        <div className="relative h-52 sm:h-60">
          <div aria-hidden="true" className="absolute inset-0">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="absolute inset-x-0 border-t border-zinc-200/60 dark:border-zinc-800/60"
                style={{ bottom: `${percent}%` }}
              />
            ))}

            <div
              className="absolute inset-x-0 z-10 border-t-2 border-dashed border-indigo-400/70"
              style={{ bottom: `${goalPercent}%` }}
            >
              <span className="absolute -top-5 right-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                Goal
              </span>
            </div>
          </div>

          <div className="relative z-20 flex h-full items-end gap-2 sm:gap-3">
            {days.map((day) => {
              const height =
                day.hours === 0
                  ? 5
                  : Math.max(8, Math.min(92, (day.hours / scaleMax) * 100))
              const isToday = day.dateKey === todayKey
              const metGoal = day.focusMs >= goalMs

              return (
                <div
                  key={day.dateKey}
                  className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                  title={`${day.fullLabel}: ${formatDurationShort(day.focusMs)}`}
                >
                  <div className="mb-1.5 text-center text-[10px] font-bold tabular-nums text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 sm:text-[11px] dark:text-zinc-300">
                    {day.focusMs > 0 ? formatDurationShort(day.focusMs) : ''}
                  </div>
                  <div
                    className={cx(
                      'w-full rounded-t-lg transition-all duration-300',
                      metGoal
                        ? 'bg-gradient-to-t from-indigo-600 to-violet-500'
                        : isToday
                          ? 'bg-gradient-to-t from-indigo-500 to-indigo-400'
                          : 'bg-gradient-to-t from-indigo-300/80 to-indigo-200 dark:from-indigo-500/50 dark:to-indigo-400/30',
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span
                    className={cx(
                      'mt-2 text-center text-[11px] font-semibold',
                      isToday
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400',
                    )}
                  >
                    {day.weekday}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/70 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <span>
            Average{' '}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {formatDurationShort(weeklyFocusMs / 7)}
            </span>{' '}
            per day
          </span>
          <span>
            Best day{' '}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {formatDurationShort(Math.max(...days.map((day) => day.focusMs)))}
            </span>
          </span>
        </div>
      </div>
    </Card>
  )
}
