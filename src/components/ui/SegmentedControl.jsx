import { cx } from '../../utils/cx.js'

/**
 * Accessible segmented control. Uses aria-pressed buttons (not tabs) because
 * these change a setting rather than navigating between panels.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  size = 'md',
  disabled = false,
  hideIconsOnMobile = false,
  className,
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        'flex w-full items-center gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-1',
        'dark:border-zinc-800 dark:bg-zinc-800/60',
        disabled && 'opacity-60',
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-100 dark:focus-visible:ring-offset-zinc-800',
              size === 'sm'
                ? 'min-h-10 px-2.5 text-sm'
                : 'min-h-11 px-3 text-sm sm:text-base',
              active
                ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 disabled:hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-white dark:disabled:hover:text-zinc-400',
            )}
          >
            {Icon && (
              <Icon
                className={cx(
                  'size-4 shrink-0',
                  hideIconsOnMobile && 'hidden sm:block',
                )}
                aria-hidden="true"
              />
            )}
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
