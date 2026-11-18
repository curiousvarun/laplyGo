import { useMemo } from 'react'
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Coffee,
  Flame,
  Gauge,
  Layers,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { ActivityBreakdown } from '../components/analytics/ActivityBreakdown.jsx'
import { WeeklyChart } from '../components/analytics/WeeklyChart.jsx'
import { MonthlyChart } from '../components/analytics/MonthlyChart.jsx'
import { useNow } from '../hooks/useNow.js'
import { getAnalytics, getPresetBreakdown } from '../utils/sessions.js'
import {
  formatDayCount,
  formatDurationShort,
  formatGoal,
} from '../utils/timeFormatters.js'

function RecordRow({ icon: Icon, label, value, hint }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
        {hint && (
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        )}
      </div>
      <p className="shrink-0 text-sm font-bold tabular-nums">{value}</p>
    </li>
  )
}

export function AnalyticsView({ sessions, dailyGoalHours, onOpenStopwatch }) {
  const nowMs = useNow(60_000)

  const analytics = useMemo(
    () => getAnalytics(sessions, dailyGoalHours, new Date(nowMs)),
    [sessions, dailyGoalHours, nowMs],
  )
  const activities = useMemo(() => getPresetBreakdown(sessions, 6), [sessions])
  const topActivity = activities[0]
  const goalPercent = Math.min(100, Math.round(analytics.todayProgress * 100))

  return (
    <div className="mx-auto w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl lg:text-4xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            A quiet look at the time you have made for what matters.
          </p>
        </div>
        <Badge tone="study" dot>
          {formatDayCount(analytics.currentStreak)} streak
        </Badge>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Your first session will start the story"
          description="Focus for a minute or two and this space will fill with useful patterns — no pressure, no streaks to protect."
          action={<Button onClick={onOpenStopwatch}>Start focusing</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Today"
              value={formatDurationShort(analytics.todayFocusMs)}
              hint={`${analytics.todaySessions} ${
                analytics.todaySessions === 1 ? 'session' : 'sessions'
              } · ${goalPercent}% of goal`}
              icon={CalendarCheck}
              tone="indigo"
            />
            <StatCard
              label="This week"
              value={formatDurationShort(analytics.weeklyFocusMs)}
              hint={`${analytics.weekSessions} sessions · last 7 days`}
              icon={CalendarDays}
              tone="emerald"
            />
            <StatCard
              label="This month"
              value={formatDurationShort(analytics.monthlyFocusMs)}
              hint={`${analytics.monthSessions} sessions · last 30 days`}
              icon={CalendarRange}
              tone="amber"
            />
            <StatCard
              label="Completed sessions"
              value={String(analytics.completedSessions)}
              hint="All time"
              icon={Target}
              tone="rose"
            />
          </div>

          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Target className="size-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-bold">Today's focus goal</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatGoal(dailyGoalHours)} target ·{' '}
                    {analytics.todayGoalMet
                      ? 'complete'
                      : `${formatDurationShort(analytics.todayRemainingMs)} to go`}
                  </p>
                </div>
              </div>
              <p className="text-lg font-extrabold tabular-nums">
                {goalPercent}%
              </p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-[width] duration-500"
                style={{ width: `${Math.max(analytics.todayFocusMs > 0 ? 3 : 0, goalPercent)}%` }}
              />
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] xl:items-start">
            <div className="space-y-4">
              <WeeklyChart
                days={analytics.week}
                goalHours={dailyGoalHours}
                weeklyFocusMs={analytics.weeklyFocusMs}
                weeklyGoalDays={analytics.weeklyGoalDays}
              />
              <MonthlyChart days={analytics.month} goalHours={dailyGoalHours} />
            </div>

            <div className="space-y-4">
              <ActivityBreakdown items={activities} />

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                    <Trophy className="size-[18px]" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold tracking-tight">Personal records</h2>
                  </div>
                </div>

                <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  <RecordRow
                    icon={Gauge}
                    label="Average session"
                    value={formatDurationShort(analytics.averageFocusMs)}
                    hint="Per completed run"
                  />
                  <RecordRow
                    icon={Trophy}
                    label="Longest session"
                    value={formatDurationShort(analytics.longestSessionMs)}
                    hint="One uninterrupted run"
                  />
                  <RecordRow
                    icon={Sparkles}
                    label="Top activity"
                    value={
                      topActivity
                        ? `${topActivity.emoji} ${topActivity.label}`
                        : '—'
                    }
                    hint={
                      topActivity
                        ? `${formatDurationShort(topActivity.focusMs)} focused`
                        : undefined
                    }
                  />
                  <RecordRow
                    icon={Layers}
                    label="Average interval"
                    value={formatDurationShort(
                      analytics.intervalCount > 0
                        ? analytics.totalFocusMs / analytics.intervalCount
                        : 0,
                    )}
                    hint="Across saved focus blocks"
                  />
                  <RecordRow
                    icon={Flame}
                    label="Best streak"
                    value={formatDayCount(analytics.bestStreak)}
                    hint={`${analytics.activeDays} active days`}
                  />
                  <RecordRow
                    icon={Coffee}
                    label="Break time"
                    value={formatDurationShort(analytics.totalBreakMs)}
                    hint="Never counted as focus"
                  />
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
