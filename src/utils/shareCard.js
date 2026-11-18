import { APP_NAME } from '../constants.js'

import {
  formatClock,
  formatDateShort,
  formatDurationShort,
  formatTime,
} from './timeFormatters.js'
import { getSessionPreset } from './presets.js'

export function buildShareText(session) {
  if (!session) return ''
  const preset = getSessionPreset(session)
  const label = session.type === 'break' ? 'Break' : preset.label
  const mode = session.type === 'break' ? 'Break' : 'Focus interval'
  const parts = [
    `${preset.emoji} ${label} — ${formatDurationShort(session.durationMs)}`,
    `${formatDateShort(session.date)} · ${formatTime(session.startTime)}`,
  ]

  if (session.laps?.length) {
    parts.push(`${session.laps.length} laps recorded`)
  }

  parts.push(`${mode} · Tracked with ${APP_NAME}`)
  return parts.join('\n')
}

async function copyWithFallback(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* Fall through to the legacy path. */
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

export async function copyShareText(session) {
  return copyWithFallback(buildShareText(session))
}

export function openShareOnX(session) {
  const text = buildShareText(session)
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function drawSpacedText(ctx, text, x, y, spacing = 5) {
  let cursor = x
  for (const char of text) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + spacing
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1200)
}

/**
 * Renders a share-ready 1080×1350 card with the Canvas API.
 * No screenshot library, no external assets, no network round-trip.
 */
export async function downloadSessionCard(session, { name } = {}) {
  if (!session) return null
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready.catch(() => {})
  }

  const preset = getSessionPreset(session)
  const accent = session.type === 'break' ? '#10b981' : preset.color
  const label = session.type === 'break' ? 'Break' : preset.label
  const emoji = session.type === 'break' ? '☕' : preset.emoji

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const background = ctx.createLinearGradient(0, 0, 1080, 1350)
  background.addColorStop(0, accent)
  background.addColorStop(0.55, '#18181b')
  background.addColorStop(1, '#09090b')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, 1080, 1350)

  // Soft glow + rings for depth.
  const glow = ctx.createRadialGradient(820, 240, 0, 820, 240, 620)
  glow.addColorStop(0, `${accent}70`)
  glow.addColorStop(1, `${accent}00`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 1350)

  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 2
  for (const radius of [540, 430, 320]) {
    ctx.beginPath()
    ctx.arc(900, 180, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Brand.
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = '700 30px Inter, system-ui, sans-serif'
  drawSpacedText(ctx, 'LAPLYGO', 84, 108, 7)

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '500 24px Inter, system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(formatDateShort(session.date), 996, 106)
  ctx.textAlign = 'left'

  // Activity badge.
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  roundedRect(ctx, 84, 196, 108, 108, 30)
  ctx.fill()
  ctx.font = '600 56px Inter, "Segoe UI Emoji", sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(emoji, 106, 270)

  ctx.fillStyle = 'rgba(255,255,255,0.68)'
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  drawSpacedText(ctx, session.type === 'break' ? 'BREAK' : 'FOCUS SESSION', 84, 372, 4)

  // Activity name — wrap if long.
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 64px Inter, system-ui, sans-serif'
  let nameText = label
  if (ctx.measureText(nameText).width > 912) {
    nameText = `${nameText.slice(0, 18).trim()}…`
  }
  ctx.fillText(nameText, 84, 458)

  // The hero number.
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 190px Inter, system-ui, sans-serif'
  ctx.fillText(formatClock(session.durationMs), 70, 770)

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '500 30px Inter, system-ui, sans-serif'
  ctx.fillText(
    `${formatDurationShort(session.durationMs)} of ${session.type === 'break' ? 'rest' : 'focused time'}`,
    84,
    828,
  )

  // Detail row.
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(84, 924)
  ctx.lineTo(996, 924)
  ctx.stroke()

  const details = [
    ['STARTED', formatTime(session.startTime)],
    ['TYPE', session.type === 'break' ? 'Break' : 'Focus interval'],
    ['SPLITS', session.laps?.length ? String(session.laps.length) : '—'],
  ]

  details.forEach(([key, value], index) => {
    const x = 84 + index * 304
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '600 20px Inter, system-ui, sans-serif'
    drawSpacedText(ctx, key, x, 1000, 3)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 34px Inter, system-ui, sans-serif'
    ctx.fillText(value, x, 1052)
  })

  // Footer.
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundedRect(ctx, 84, 1150, 912, 104, 30)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = '600 28px Inter, system-ui, sans-serif'
  ctx.fillText(`Tracked with ${APP_NAME}`, 120, 1214)

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '500 22px Inter, system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(name ? `for ${name}` : 'Every second, yours.', 960, 1213)
  ctx.textAlign = 'left'

  const blob = await canvasToBlob(canvas)
  if (!blob) return null

  const filename = `laplygo-${session.type}-${session.date}.png`
  downloadBlob(blob, filename)
  return filename
}
