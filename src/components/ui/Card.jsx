import { cx } from '../../utils/cx.js'

export function Card({ as: Component = 'section', className, children, ...props }) {
  return (
    <Component
      className={cx(
        'rounded-2xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-950/[0.03]',
        'dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-black/20',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
