import { useState } from 'react'
import { Copy, Download, Share2 } from 'lucide-react'
import { APP_NAME } from '../../constants.js'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { useToast } from '../../hooks/useToast.js'
import { getSessionPreset } from '../../utils/presets.js'
import {
  copyShareText,
  downloadSessionCard,
  openShareOnX,
} from '../../utils/shareCard.js'
import {
  formatClock,
  formatDateShort,
  formatDurationShort,
  formatTime,
} from '../../utils/timeFormatters.js'

export function ShareSessionDialog({ session, open, onClose, userName }) {
  const { notify } = useToast()
  const [busy, setBusy] = useState(false)

  if (!session) return null

  const preset = getSessionPreset(session)
  const accent = session.type === 'break' ? '#10b981' : preset.color
  const label = session.type === 'break' ? 'Break' : preset.label
  const emoji = session.type === 'break' ? '☕' : preset.emoji

  const handleCopy = async () => {
    const copied = await copyShareText(session)
    if (copied) notify('Session summary copied to your clipboard.', 'success')
    else notify('Could not copy automatically. Try downloading the image.', 'error')
  }

  const handleDownload = async () => {
    setBusy(true)
    try {
      const filename = await downloadSessionCard(session, { name: userName })
      if (filename) notify(`Saved ${filename}`, 'success')
      else notify('Could not render the share card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share this session"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
          <Button variant="secondary" onClick={handleCopy}>
            <Copy className="size-4" aria-hidden="true" />
            Copy text
          </Button>
          <Button variant="secondary" onClick={handleDownload} disabled={busy}>
            <Download className="size-4" aria-hidden="true" />
            {busy ? 'Rendering…' : 'Download image'}
          </Button>
          <Button variant="primary" onClick={() => openShareOnX(session)}>
            <Share2 className="size-4" aria-hidden="true" />
            Share on X
          </Button>
        </>
      }
    >
      <div
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl sm:p-7"
        style={{
          background: `linear-gradient(145deg, ${accent} 0%, #27272a 52%, #09090b 100%)`,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full blur-3xl"
          style={{ backgroundColor: `${accent}55` }}
        />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-white/90">
              {APP_NAME}
            </p>
            <p className="text-xs font-semibold text-white/55">
              {formatDateShort(session.date)}
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span
              className="grid size-14 place-items-center rounded-2xl text-2xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
            >
              <span aria-hidden="true">{emoji}</span>
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                {session.type === 'break' ? 'Break' : 'Focus session'}
              </p>
              <p className="text-xl font-bold leading-tight">{label}</p>
            </div>
          </div>

          <p className="mt-5 text-[clamp(2.25rem,9vw,4.25rem)] font-extrabold leading-none tracking-[-0.055em] tabular-nums">
            {formatClock(session.durationMs)}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {formatDurationShort(session.durationMs)} of{' '}
            {session.type === 'break' ? 'rest' : 'focused time'}
            {session.laps?.length ? ` · ${session.laps.length} lap${session.laps.length === 1 ? '' : 's'}` : ''}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                Started
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatTime(session.startTime)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                Type
              </p>
              <p className="mt-1 text-sm font-semibold">
                {session.type === 'break' ? 'Break' : 'Focus interval'}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                Splits
              </p>
              <p className="mt-1 text-sm font-semibold">
                {session.laps?.length || '—'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-2.5">
            <p className="text-xs font-bold">Tracked with {APP_NAME}</p>
            <p className="text-[11px] text-white/50">
              {userName ? `for ${userName}` : 'Every second, yours.'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
