import { cx } from '../../utils/cx.js'

const TONES = {
  neutral:
    'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
  study:
    'bg-indigo-50 text-indigo-700 ring-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20',
  break:
    'bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  amber:
    'bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  rose:
    'bg-rose-50 text-rose-700 ring-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
  success:
    'bg-emerald-600 text-white ring-emerald-600 dark:bg-emerald-500 dark:text-zinc-950 dark:ring-emerald-500',
}

export function Badge({
  tone = 'neutral',
  dot = false,
  pulse = false,
  className,
  children,
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cx(
            'size-1.5 shrink-0 rounded-full bg-current',
            pulse && 'animate-pulse',
          )}
        />
      )}
      {children}
    </span>
  )
}
