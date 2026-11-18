import { Share2, Trash2 } from 'lucide-react'
import { TimelineEntry } from '../timer/ActivityTimeline.jsx'
import { sessionToTimelineEntry } from '../../utils/focusSession.js'
import { cx } from '../../utils/cx.js'

export function SessionRow({ session, ordinal = 1, onDelete, onShare }) {
  const entry = sessionToTimelineEntry(session, ordinal)
  const isBreak = session.type === 'break'

  const actions = (
    <>
      <button
        type="button"
        onClick={() => onShare(session)}
        aria-label={`Share ${isBreak ? 'break' : session.presetLabel} record`}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <Share2 className="size-3.5" aria-hidden="true" />
        <span>Share</span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(session)}
        aria-label={`Delete ${isBreak ? 'break' : session.presetLabel} record`}
        className={cx(
          'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors',
          'text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400',
        )}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        <span>Delete</span>
      </button>
    </>
  )

  return <TimelineEntry entry={entry} actions={actions} />
}
