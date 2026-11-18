import { FilterX, Search, Tag } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { SelectField } from '../ui/SelectField.jsx'
import { HISTORY_RANGES } from '../../utils/sessions.js'
import { formatDurationShort } from '../../utils/timeFormatters.js'
import { cx } from '../../utils/cx.js'

export function HistoryFilters({
  range,
  onRangeChange,
  preset,
  onPresetChange,
  presetOptions,
  query,
  onQueryChange,
  resultCount,
  focusMs,
  breakMs,
  onClear,
  showClear,
}) {
  const options = [
    { value: 'all', label: 'All activities' },
    ...presetOptions.map((item) => ({
      value: item.value,
      label: `${item.emoji} ${item.label}`,
    })),
  ]

  return (
    <Card className="p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          role="group"
          aria-label="Date range"
          className="flex flex-wrap items-center gap-1.5"
        >
          {HISTORY_RANGES.map((option) => {
            const active = range === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onRangeChange(option.value)}
                className={cx(
                  'min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  active
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block sm:w-56">
            <span className="sr-only">Search history</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search activity, type, date"
              className="min-h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>

          <SelectField
            label="Activity"
            value={preset}
            onChange={onPresetChange}
            options={options}
            icon={Tag}
            hideLabel
            className="sm:w-52"
          />

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-zinc-900 dark:text-white">
                {resultCount}
              </span>{' '}
              {resultCount === 1 ? 'record' : 'records'} ·{' '}
              <span className="font-semibold">{formatDurationShort(focusMs)}</span>{' '}
              focus
              {breakMs > 0 ? ` · ${formatDurationShort(breakMs)} break` : ''}
            </p>

            {showClear && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <FilterX className="size-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
