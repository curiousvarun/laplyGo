import { APP_NAME } from '../constants.js'
import { formatDateKey, formatLapClock } from './timeFormatters.js'

const BACKUP_FILE_LIMIT_BYTES = 10 * 1024 * 1024

function download(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return filename
}

export function exportSessionsAsJSON(sessions) {
  const payload = {
    app: APP_NAME,
    schemaVersion: 4,
    exportedAt: new Date().toISOString(),
    sessionCount: sessions.length,
    sessions,
  }

  return download(
    `laplygo-sessions-${formatDateKey()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )
}

function csvCell(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function sessionsToCSV(sessions) {
  const header = [
    'id',
    'session_id',
    'date',
    'type',
    'activity',
    'mode',
    'interval_index',
    'break_index',
    'started_at',
    'ended_at',
    'duration_ms',
    'duration_minutes',
    'laps',
  ]

  const rows = sessions.map((session) => [
    session.id,
    session.sessionId ?? session.id,
    session.date,
    session.type,
    session.presetLabel ?? session.subject,
    session.mode ?? 'stopwatch',
    session.intervalIndex ?? '',
    session.breakIndex ?? '',
    new Date(session.startTime).toISOString(),
    new Date(session.endTime).toISOString(),
    session.durationMs,
    (session.durationMs / 60000).toFixed(2),
    session.laps?.length ?? 0,
  ])

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function exportSessionsAsCSV(sessions) {
  // The BOM helps Excel open UTF-8 activity names correctly.
  const content = `\uFEFF${sessionsToCSV(sessions)}`
  return download(
    `laplygo-sessions-${formatDateKey()}.csv`,
    content,
    'text/csv;charset=utf-8',
  )
}

export function exportLapsAsCSV(session) {
  if (!session?.laps?.length) return null

  const header = ['lap', 'split_ms', 'split', 'total_ms', 'total']
  const rows = session.laps.map((lap) => [
    lap.index,
    lap.splitMs,
    formatLapClock(lap.splitMs),
    lap.totalMs,
    formatLapClock(lap.totalMs),
  ])

  const content = `\uFEFF${[header, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')}`

  return download(
    `laplygo-splits-${session.date}-${session.id.slice(0, 8)}.csv`,
    content,
    'text/csv;charset=utf-8',
  )
}

/** Full portable backup: sessions, preferences, custom activities, account hint. */
export function exportBackup({ sessions, settings, presets, user }) {
  const payload = {
    app: APP_NAME,
    schemaVersion: 4,
    exportedAt: new Date().toISOString(),
    account: user ? { name: user.name, email: user.email } : null,
    sessionCount: sessions.length,
    settings,
    presets,
    sessions,
  }

  return download(
    `laplygo-backup-${formatDateKey()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )
}

/**
 * Reads a user-selected backup. The payload is only parsed here; the app still
 * sanitizes each session and preset before merging, so a malformed file cannot
 * inject arbitrary data into storage.
 */
export async function parseBackupFile(file) {
  if (!file) throw new Error('Choose a backup file first.')
  if (file.size > BACKUP_FILE_LIMIT_BYTES) {
    throw new Error('That backup is larger than 10 MB.')
  }

  let data
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  if (!data || typeof data !== 'object') {
    throw new Error('That backup does not look like a LaplyGo export.')
  }

  const sessions = Array.isArray(data.sessions) ? data.sessions : []
  const presets = Array.isArray(data.presets) ? data.presets : []
  const settings =
    data.settings && typeof data.settings === 'object' ? data.settings : null

  if (sessions.length === 0 && presets.length === 0 && !settings) {
    throw new Error('No sessions, activities, or settings were found in that file.')
  }

  return {
    sessions,
    presets,
    settings,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null,
  }
}
