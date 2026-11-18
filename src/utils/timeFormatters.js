export const MS_PER_SECOND = 1000
export const MS_PER_MINUTE = 60 * MS_PER_SECOND
export const MS_PER_HOUR = 60 * MS_PER_MINUTE

const pad = (value, length = 2) => String(value).padStart(length, '0')

/** Coerces anything into a non-negative, finite millisecond value. */
export function toSafeMs(value) {
  const ms = Number(value)
  return Number.isFinite(ms) && ms > 0 ? ms : 0
}

/**
 * Formats elapsed milliseconds as a fixed HH:MM:SS clock.
 * Hours expand beyond two digits if a timer is left running for days.
 */
export function formatClock(ms) {
  const totalSeconds = Math.floor(toSafeMs(ms) / MS_PER_SECOND)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/** Split, zero-padded clock segments for large display typography. */
export function splitClock(ms) {
  const totalSeconds = Math.floor(toSafeMs(ms) / MS_PER_SECOND)
  return {
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
  }
}

/** Clock segments plus hundredths for compact legacies and exports. */
export function splitPreciseClock(ms) {
  const value = toSafeMs(ms)
  const totalSeconds = Math.floor(value / MS_PER_SECOND)
  return {
    ...splitClock(value),
    centiseconds: pad(Math.floor((value % MS_PER_SECOND) / 10)),
    totalSeconds,
  }
}

/**
 * Exact millisecond clock segments for the hero timer.
 * Always renders three fractional digits — never rounds up into the next ms.
 */
export function splitMillisecondClock(ms) {
  const value = Math.floor(toSafeMs(ms))
  const totalSeconds = Math.floor(value / MS_PER_SECOND)
  return {
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
    milliseconds: pad(value % MS_PER_SECOND, 3),
    totalSeconds,
  }
}

/** "00:01:25.678" — the strict HH:MM:SS.MMM display format. */
export function formatPreciseClock(ms) {
  const { hours, minutes, seconds, milliseconds } = splitMillisecondClock(ms)
  return `${hours}:${minutes}:${seconds}.${milliseconds}`
}

/** "00:01:24.360" — used for intervals, breaks, and split checkpoints. */
export function formatLapClock(ms) {
  return formatPreciseClock(ms)
}

/**
 * Human-friendly compact duration for cards and lists: "45s", "18m", "2h 15m".
 * Zero renders as "0m" rather than "0s" so empty stats read naturally.
 */
export function formatDurationShort(ms) {
  const totalSeconds = Math.floor(toSafeMs(ms) / MS_PER_SECOND)

  if (totalSeconds < 60) {
    return totalSeconds === 0 ? '0m' : `${totalSeconds}s`
  }

  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

/** Exact duration for screen readers, e.g. "1 hour, 24 minutes, 10 seconds". */
export function formatDurationSpoken(ms) {
  const totalSeconds = Math.floor(toSafeMs(ms) / MS_PER_SECOND)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []

  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`)
  }

  return parts.join(', ')
}

/** Local YYYY-MM-DD key. Deliberately not UTC — a focus day is a local day. */
export function formatDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return formatDateKey(new Date())
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(key) {
  if (typeof key !== 'string') return new Date()
  const [year, month, day] = key.split('-').map(Number)
  if (!year || !month || !day) return new Date()
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export function addDays(value, amount) {
  const date = value instanceof Date ? new Date(value) : parseDateKey(value)
  date.setDate(date.getDate() + amount)
  return date
}

export function isSameDateKey(a, b) {
  return formatDateKey(a) === formatDateKey(b)
}

/** "Today", "Yesterday", or a friendly weekday date. */
export function formatDateHeading(key) {
  const today = new Date()
  if (key === formatDateKey(today)) return 'Today'
  if (key === formatDateKey(addDays(today, -1))) return 'Yesterday'

  const date = parseDateKey(key)
  const isCurrentYear = date.getFullYear() === today.getFullYear()

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(isCurrentYear ? {} : { year: 'numeric' }),
  }).format(date)
}

/** "Nov 17" / "Nov 17, 2025" for compact labels. */
export function formatDateShort(key) {
  const date = parseDateKey(key)
  const isCurrentYear = date.getFullYear() === new Date().getFullYear()

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(isCurrentYear ? {} : { year: 'numeric' }),
  }).format(date)
}

/** Local time of day, e.g. "9:41 AM". */
export function formatTime(timestamp) {
  const date = new Date(Number(timestamp))
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/** Formats a goal expressed in hours: 4 → "4h", 4.5 → "4h 30m". */
export function formatGoal(goalHours) {
  return formatDurationShort(Number(goalHours) * MS_PER_HOUR)
}

/** "1 day" / "3 days". */
export function formatDayCount(count) {
  return `${count} ${count === 1 ? 'day' : 'days'}`
}
