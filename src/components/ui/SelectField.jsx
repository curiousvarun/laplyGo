import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '../../utils/cx.js'

/**
 * Native select with a custom chevron. Native selects are intentionally used
 * for reliability and accessibility on mobile.
 */
export function SelectField({
  id: idProp,
  label,
  value,
  onChange,
  options,
  icon: Icon,
  hideLabel = false,
  className,
  selectClassName,
}) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={
          hideLabel
            ? 'sr-only'
            : 'mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'
        }
      >
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400"
          />
        )}

        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cx(
            'min-h-12 w-full appearance-none rounded-xl border border-zinc-200 bg-white py-2.5 pl-3 pr-10 text-base text-zinc-900 shadow-sm transition',
            'hover:bg-zinc-50 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
            'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/80',
            Icon && 'pl-10',
            selectClassName,
          )}
        >
          {options.map((option) => {
            const normalized =
              typeof option === 'string'
                ? { value: option, label: option }
                : option

            return (
              <option key={normalized.value} value={normalized.value}>
                {normalized.label}
              </option>
            )
          })}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        />
      </div>
    </div>
  )
}
