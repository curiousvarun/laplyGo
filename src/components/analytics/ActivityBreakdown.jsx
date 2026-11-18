import { PieChart } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { formatDurationShort } from '../../utils/timeFormatters.js'

export function ActivityBreakdown({ items }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
          <PieChart className="size-[18px]" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight">Time by activity</h2>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
          No data yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.presetId}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
                  <span aria-hidden="true">{item.emoji}</span>
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
                  {formatDurationShort(item.focusMs)} · {Math.round(item.share * 100)}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${Math.max(2, item.share * 100)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
