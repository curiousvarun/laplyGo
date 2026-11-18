import { useState } from 'react'
import {
  Check,
  Coffee,
  Copy,
  History,
  RotateCcw,
  Sparkles,
  Sprout,
  Trophy,
} from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { ActivityTimeline } from './ActivityTimeline.jsx'
import { useToast } from '../../hooks/useToast.js'
import {
  buildSessionShareText,
  padSequence,
  sessionTimelineEntries,
} from '../../utils/focusSession.js'
import { getFocusWorld } from '../../utils/focusWorld.js'
import {
  formatDurationShort,
  formatPreciseClock,
  formatTime,
} from '../../utils/timeFormatters.js'

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* Fall back to the selection path. */
    }
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand('copy')
    area.remove()
    return copied
  } catch {
    return false
  }
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-lg font-extrabold tabular-nums tracking-tight text-white sm:text-xl">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-white/40">{hint}</p>}
    </div>
  )
}

function toTimelineEntries(session) {
  const isCountdown = session.source === 'countdown'

  return sessionTimelineEntries(session).map((item) => {
    const isBreak = item.type === 'break'
    return {
      ...item,
      title: isBreak
        ? `Break ${padSequence(item.index)}`
        : isCountdown
          ? 'Focus session'
          : `Focus interval ${padSequence(item.index)}`,
      presetLabel: isBreak ? 'Break' : session.presetLabel,
      emoji: isBreak ? '☕' : session.presetEmoji,
      color: isBreak ? '#f59e0b' : session.presetColor,
      status: 'completed',
      splits: (item.splits ?? []).map((split) => ({
        ...split,
        title: `Split ${padSequence(split.index)}`,
        durationMs: split.splitMs,
        cumulativeMs: split.totalMs,
        atEpoch: split.atEpoch ?? item.endTime,
      })),
    }
  })
}

function getCelebration(session) {
  const minutes = session.totalActiveMs / 60_000
  if (session.totalActiveMs === 0) {
    return 'Rest is part of the rhythm.'
  }
  if (minutes < 5) return 'You showed up. That\u2019s what matters.'
  if (minutes < 30) return 'A quiet win, fully counted.'
  if (minutes < 90) return 'That\u2019s a real block of deep work.'
  return 'You made a generous amount of space for what matters.'
}

export function SessionSummaryModal({
  session,
  open,
  onClose,
  onStartNew,
  onTakeBreak,
  onViewHistory,
  sessions = [],
  focusWorldEnabled = true,
}) {
  const { notify } = useToast()
  const [copied, setCopied] = useState(false)

  if (!session) return null

  const entries = toTimelineEntries(session)
  const intervals = session.intervals ?? []
  const isCountdown = session.source === 'countdown'
  const isBreakSession = isCountdown && session.totalActiveMs === 0
  const primaryMs = isBreakSession ? session.totalBreakMs : session.totalActiveMs
  const world = getFocusWorld(sessions)
  const addedFocusMs = session.totalActiveMs
  const addedMinutes = Math.round(addedFocusMs / 60_000)

  const handleCopy = async () => {
    const copiedOk = await copyText(buildSessionShareText(session))
    if (copiedOk) {
      setCopied(true)
      notify('Session summary copied to your clipboard.', 'success')
      window.setTimeout(() => setCopied(false), 2000)
    } else {
      notify('Could not copy automatically.', 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Session complete"
      description={
        isCountdown
          ? 'The countdown has finished — your focus time is saved automatically.'
          : 'Every focused interval and every break, saved exactly as it happened.'
      }
      size="xl"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={onViewHistory}>
            <History className="size-4" aria-hidden="true" />
            View full history
          </Button>
          <Button variant="secondary" onClick={onTakeBreak}>
            <Coffee className="size-4" aria-hidden="true" />
            Take a break
          </Button>
          <Button onClick={onStartNew}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Start another
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b0b10] p-5 text-white shadow-xl shadow-zinc-950/25 sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-indigo-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full bg-emerald-500/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-20 size-56 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-8 size-32 rounded-full border border-white/10"
          />

          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/80">
                <Sparkles className="size-3" aria-hidden="true" />
                {isCountdown ? 'Countdown complete' : 'Saved to history'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-white/50">
                  {formatTime(session.startTime)} → {formatTime(session.endTime)}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy session summary"
                  className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  {copied ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-xl">
                <span aria-hidden="true">{session.presetEmoji}</span>
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {session.presetLabel}
                </p>
                <h3 className="text-xl font-extrabold tracking-tight">
                  {getCelebration(session)}
                </h3>
              </div>
            </div>

            <p className="mt-5 text-[clamp(2rem,8vw,4.1rem)] font-extrabold leading-none tracking-[-0.055em] tabular-nums">
              {formatPreciseClock(primaryMs)}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              {isBreakSession ? 'Break completed' : 'Total active focus'}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat
                label={isBreakSession ? 'Focus time added' : 'Break time'}
                value={
                  isBreakSession
                    ? formatPreciseClock(0)
                    : formatPreciseClock(session.totalBreakMs)
                }
                hint={isBreakSession ? 'Breaks never count as focus' : 'Never added to focus'}
              />
              <Stat
                label="Intervals"
                value={String(intervals.length)}
                hint="Completed focus blocks"
              />
              <Stat
                label="Longest streak"
                value={formatPreciseClock(session.longestIntervalMs ?? 0)}
                hint="Uninterrupted"
              />
              <Stat
                label="Average interval"
                value={formatPreciseClock(session.averageIntervalMs ?? 0)}
                hint="Per focus block"
              />
              <Stat
                label="Splits logged"
                value={String(session.splits?.length ?? 0)}
                hint="In-session checkpoints"
              />
              <Stat
                label="Finished at"
                value={formatTime(session.endTime)}
                hint={`Started ${formatTime(session.startTime)}`}
              />
            </div>
          </div>
        </div>

        {focusWorldEnabled && (
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-white/70 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Sprout className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    {addedFocusMs > 0
                      ? `+${addedMinutes || '<1'} focus ${
                          addedMinutes === 1 ? 'minute' : 'minutes'
                        } to your Focus World`
                      : 'Your Focus World is waiting for the next session'}
                  </p>
                  <p className="text-xs text-emerald-900/65 dark:text-emerald-200/60">
                    {world.level.name}
                    {world.next
                      ? ` · ${world.minutesToNext} min to ${world.next.name}`
                      : ' · fully grown'}
                  </p>
                </div>
              </div>
              <Trophy className="size-5 shrink-0 text-emerald-500/60" aria-hidden="true" />
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-200/60 dark:bg-emerald-950/40">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.max(3, world.progress * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-emerald-900/60 dark:text-emerald-200/50">
              Grown by {world.completedSessions}{' '}
              {world.completedSessions === 1 ? 'session' : 'sessions'} ·{' '}
              {formatDurationShort(world.totalFocusMs)} total. Nothing wilts if you rest.
            </p>
          </div>
        )}

        <ActivityTimeline
          entries={entries}
          title="This session, chronologically"
          subtitle="Focus and breaks stay separate — breaks are never counted as active time."
          empty="No intervals were logged in this run."
        />
      </div>
    </Modal>
  )
}
