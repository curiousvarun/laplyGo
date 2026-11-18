import { cx } from '../../utils/cx.js'

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  emerald:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
}

/**
 * Compact metric tile used by the Today summary and Analytics views.
 * `value` is already formatted; keep values numeric-looking for tabular-nums.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'indigo',
  className,
  valueClassName,
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/[0.02] sm:p-5',
        'dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-black/20',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span
            className={cx(
              'grid size-9 shrink-0 place-items-center rounded-xl',
              TONES[tone] ?? TONES.indigo,
            )}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
        )}
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </p>
      </div>

      <p
        className={cx(
          'mt-3 text-2xl font-bold tracking-tight tabular-nums text-zinc-900 sm:text-[1.7rem] dark:text-white',
          valueClassName,
        )}
      >
        {value}
      </p>

      {hint && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  )
}
