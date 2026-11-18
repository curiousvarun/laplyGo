import { useState } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import {
  MAX_PRESET_NAME_LENGTH,
  PRESET_COLORS,
  PRESET_EMOJIS,
} from '../../constants.js'
import { readableTextColor } from '../../utils/presets.js'
import { cx } from '../../utils/cx.js'

export function CustomPresetDialog({
  open,
  onClose,
  onAdd,
  onSave,
  activity = null,
}) {
  const isEditing = Boolean(activity)
  const [label, setLabel] = useState(activity?.label ?? '')
  const [emoji, setEmoji] = useState(activity?.emoji ?? PRESET_EMOJIS[0])
  const [color, setColor] = useState(activity?.color ?? PRESET_COLORS[0].value)
  const [error, setError] = useState('')
  const save = onSave ?? onAdd

  const handleSubmit = (event) => {
    event.preventDefault()
    const result = save({ label, emoji, color })

    if (result?.ok) {
      onClose()
    } else {
      setError(
        result?.error ??
          (isEditing ? 'Could not update that activity.' : 'Could not create that activity.'),
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit activity' : 'Create an activity'}
      description={
        isEditing
          ? 'Rename, recolor, or change the icon. Past sessions keep their original snapshot.'
          : 'Give your focus blocks a name, icon, and accent color.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="custom-preset-form">
            {isEditing ? 'Save changes' : 'Create activity'}
          </Button>
        </>
      }
    >
      <form id="custom-preset-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="preset-name"
            className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Activity name
          </label>
          <input
            id="preset-name"
            autoFocus
            value={label}
            maxLength={MAX_PRESET_NAME_LENGTH}
            onChange={(event) => {
              setLabel(event.target.value)
              if (error) setError('')
            }}
            placeholder="e.g. Piano practice"
            className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-base text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Emoji
          </p>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
            {PRESET_EMOJIS.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={`Use ${item}`}
                aria-pressed={emoji === item}
                onClick={() => setEmoji(item)}
                className={cx(
                  'grid aspect-square place-items-center rounded-xl border text-lg transition-colors',
                  emoji === item
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-500/15'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800',
                )}
              >
                <span aria-hidden="true">{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Accent color
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-label={item.name}
                aria-pressed={color === item.value}
                onClick={() => setColor(item.value)}
                className={cx(
                  'grid size-11 place-items-center rounded-full ring-offset-2 ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:ring-offset-zinc-900',
                  color === item.value ? 'ring-2' : 'ring-1 ring-zinc-200 dark:ring-zinc-700',
                )}
                style={{
                  backgroundColor: item.value,
                  ...(color === item.value
                    ? { '--tw-ring-color': item.value }
                    : null),
                }}
              >
                {color === item.value && (
                  <Check
                    className="size-4"
                    style={{ color: readableTextColor(item.value) }}
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Preview
          </p>
          <span
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-3.5 text-sm font-semibold"
            style={{
              backgroundColor: color,
              color: readableTextColor(color),
            }}
          >
            <span aria-hidden="true">{emoji}</span>
            {label.trim() || 'Your activity'}
          </span>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
