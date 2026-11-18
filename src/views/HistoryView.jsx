import { useMemo, useState } from 'react'
import { Timer, Trash2 } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog.jsx'
import { HistoryFilters } from '../components/history/HistoryFilters.jsx'
import { SessionRow } from '../components/history/SessionRow.jsx'
import { useNow } from '../hooks/useNow.js'
import {
  filterSessions,
  getPresetOptions,
  groupSessionsByDate,
  sumDuration,
} from '../utils/sessions.js'
import { formatDateHeading, formatDurationShort } from '../utils/timeFormatters.js'

export function HistoryView({
  sessions,
  onDeleteSession,
  onShareSession,
  onOpenStopwatch,
}) {
  const [range, setRange] = useState('7d')
  const [preset, setPreset] = useState('all')
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const nowMs = useNow(60_000)

  const presetOptions = useMemo(() => getPresetOptions(sessions), [sessions])
  const activePreset =
    preset !== 'all' && !presetOptions.some((option) => option.value === preset)
      ? 'all'
      : preset

  const filtered = useMemo(
    () =>
      filterSessions(
        sessions,
        { range, preset: activePreset, query },
        new Date(nowMs),
      ),
    [sessions, range, activePreset, query, nowMs],
  )

  const groups = useMemo(() => groupSessionsByDate(filtered), [filtered])
  const focusMs = sumDuration(filtered, 'focus')
  const breakMs = sumDuration(filtered, 'break')
  const hasFilters = range !== '7d' || activePreset !== 'all' || query.trim() !== ''

  const clearFilters = () => {
    setRange('7d')
    setPreset('all')
    setQuery('')
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    onDeleteSession(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <div className="mx-auto w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl lg:text-4xl">
            History
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            A vertical activity feed of every interval, break, and split.
          </p>
        </div>
        <Button variant="secondary" onClick={onOpenStopwatch}>
          <Timer className="size-4" aria-hidden="true" />
          Open stopwatch
        </Button>
      </div>

      <HistoryFilters
        range={range}
        onRangeChange={setRange}
        preset={activePreset}
        onPresetChange={setPreset}
        presetOptions={presetOptions}
        query={query}
        onQueryChange={setQuery}
        resultCount={filtered.length}
        focusMs={focusMs}
        breakMs={breakMs}
        onClear={clearFilters}
        showClear={hasFilters}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Timer}
          title={
            sessions.length === 0
              ? 'No sessions yet'
              : query.trim()
                ? 'No matching records'
                : 'Nothing in this range'
          }
          action={
            <Button onClick={sessions.length === 0 ? onOpenStopwatch : clearFilters}>
              {sessions.length === 0 ? 'Start a focus session' : 'Clear filters'}
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <Card key={group.date} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-zinc-50/60 px-4 py-3 sm:px-5 dark:border-zinc-800 dark:bg-zinc-800/30">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-bold tracking-tight">
                    {formatDateHeading(group.date)}
                  </h2>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {group.sessions.length}{' '}
                    {group.sessions.length === 1 ? 'node' : 'nodes'}
                  </span>
                </div>
                <p className="text-sm font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                  {formatDurationShort(group.focusMs)} focus
                  {group.breakMs > 0
                    ? ` · ${formatDurationShort(group.breakMs)} break`
                    : ''}
                </p>
              </div>

              <ol className="relative space-y-3 p-4 before:absolute before:bottom-8 before:left-[1.55rem] before:top-8 before:w-px before:bg-gradient-to-b before:from-indigo-200 before:via-zinc-200 before:to-transparent sm:p-5 sm:before:left-[1.82rem] dark:before:from-indigo-900 dark:before:via-zinc-800">
                {group.sessions.map((session, index) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    ordinal={index + 1}
                    onDelete={setPendingDelete}
                    onShare={onShareSession}
                  />
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this session?"
        description="This removes the session from your local history. It cannot be undone."
        confirmLabel="Delete session"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {pendingDelete && (
          <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm dark:bg-zinc-800/60">
            <span className="text-xl" aria-hidden="true">
              {pendingDelete.presetEmoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{pendingDelete.presetLabel}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDurationShort(pendingDelete.durationMs)} on{' '}
                {formatDateHeading(pendingDelete.date)}
              </p>
            </div>
            <Trash2 className="size-4 shrink-0 text-rose-500" aria-hidden="true" />
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
