import { Plus } from 'lucide-react'
import { cx } from '../../utils/cx.js'

export function PresetPicker({ presets, selectedId, onSelect, onAdd, disabled, className }) {
  return (
    <div className={cx('flex w-full justify-center', className)}>
      <div
        role="tablist"
        aria-label="Activity presets"
        aria-disabled={disabled || undefined}
        className="no-scrollbar inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-zinc-200/70 bg-zinc-100/80 p-1.5 backdrop-blur-xs transition-colors dark:border-zinc-800/70 dark:bg-zinc-900/80"
      >
        {presets.map((preset) => {
          const active = preset.id === selectedId

          return (
            <button
              key={preset.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onSelect(preset.id)}
              className={cx(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-45 sm:text-sm',
                active
                  ? 'border-zinc-200/80 bg-white font-semibold text-zinc-950 shadow-xs dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-white'
                  : 'border-transparent font-medium text-zinc-500 hover:bg-white/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white',
              )}
            >
              <span
                className={cx(
                  'size-2 shrink-0 rounded-full transition-transform',
                  active ? 'scale-100' : 'opacity-40 scale-75',
                )}
                style={{ backgroundColor: preset.color }}
                aria-hidden="true"
              />
              <span aria-hidden="true" className="text-sm leading-none">
                {preset.emoji}
              </span>
              <span className="whitespace-nowrap">{preset.label}</span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          aria-label="Create custom activity"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-white/60 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/60 dark:hover:text-white"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span>Custom</span>
        </button>
      </div>
    </div>
  )
}
