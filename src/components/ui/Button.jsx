import { cx } from '../../utils/cx.js'

const VARIANTS = {
  primary:
    'bg-indigo-600 text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-zinc-950',
  emerald:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-950/10 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950',
  secondary:
    'border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  ghost:
    'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white',
  danger:
    'bg-rose-600 text-white shadow-sm shadow-rose-950/10 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400 dark:text-zinc-950',
  'danger-ghost':
    'text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400',
}

const SIZES = {
  sm: 'min-h-11 rounded-lg px-3 py-2 text-sm',
  md: 'min-h-12 rounded-xl px-4 py-2.5 text-base',
  lg: 'min-h-14 rounded-xl px-6 py-3 text-base sm:text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 font-semibold transition-[background-color,color,box-shadow,transform] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50',
        'active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
