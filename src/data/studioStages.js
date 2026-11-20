import { MS_PER_MINUTE } from '../utils/timeFormatters.js'

/**
 * The five evolution stages of the LaplyGo Living Studio.
 *
 * Thresholds are cumulative focus minutes, so existing saved sessions map
 * straight onto the right stage without any migration or reset.
 */
export const STUDIO_STAGES = Object.freeze([
  {
    id: 'quiet-foundation',
    number: 1,
    name: 'Quiet Foundation',
    minMinutes: 0,
    range: '0–15m',
    description:
      'A blueprint, a bare desk, and a window full of stars. Every studio starts here.',
  },
  {
    id: 'desk-ignited',
    number: 2,
    name: 'Desk Ignited',
    minMinutes: 15,
    range: '15–45m',
    description:
      'The lamp warms the desk and the monitor wakes with your first lines of work.',
  },
  {
    id: 'in-the-zone',
    number: 3,
    name: 'In The Zone',
    minMinutes: 45,
    range: '45m–2h',
    description:
      'Coffee steam, a real keyboard, and ambient light pooling across the wall.',
  },
  {
    id: 'midnight-sanctuary',
    number: 4,
    name: 'Midnight Sanctuary',
    minMinutes: 120,
    range: '2–5h',
    description:
      'Books fill the shelf, a monstera leans into the window, and the horizon begins to glow.',
  },
  {
    id: 'skyline-loft',
    number: 5,
    name: 'The Skyline Loft',
    minMinutes: 300,
    range: '5h+',
    description:
      'The full loft opens: dual screens, string lights, a record player, and a sleeping companion.',
  },
])

/**
 * Environment presets. Locked themes are fully previewable so the Pro upsell
 * stays inviting instead of blocking the experience.
 */
export const STUDIO_THEMES = Object.freeze([
  {
    id: 'midnight-loft',
    name: 'Midnight Loft',
    shortName: 'Midnight',
    locked: false,
    badge: 'Free',
    blurb: 'Walnut, warm lamplight, and a quiet city horizon.',
    sky: ['#070b14', '#0d1730', '#1b2a4a'],
    wall: ['#0b1018', '#080c13'],
    floor: ['#0b0f16', '#070a0f'],
    accent: '#5eead4',
    accentSoft: '#2dd4bf',
    glow: '#fbbf24',
    horizonGlow: '#f59e0b',
    moon: '#f8fafc',
    silhouette: '#060a11',
    skyline: 'city',
    weather: 'stars',
  },
  {
    id: 'tokyo-rain',
    name: 'Tokyo Rain Studio',
    shortName: 'Tokyo',
    locked: true,
    badge: 'Pro',
    blurb: 'Neon reflections and slow rain on the glass.',
    sky: ['#0a0714', '#17102e', '#2b1246'],
    wall: ['#0c0a14', '#08070f'],
    floor: ['#0b0812', '#07060c'],
    accent: '#22d3ee',
    accentSoft: '#06b6d4',
    glow: '#f472b6',
    horizonGlow: '#db2777',
    moon: '#fbcfe8',
    silhouette: '#07050d',
    skyline: 'neon',
    weather: 'rain',
  },
  {
    id: 'himalayan-cabin',
    name: 'Himalayan Glass Cabin',
    shortName: 'Himalaya',
    locked: true,
    badge: 'Pro',
    blurb: 'Aurora light, cedar warmth, and quiet snowfall.',
    sky: ['#061018', '#0a2028', '#12323a'],
    wall: ['#0a1116', '#080d11'],
    floor: ['#0a1013', '#070b0d'],
    accent: '#67e8f9',
    accentSoft: '#22d3ee',
    glow: '#fcd34d',
    horizonGlow: '#2dd4bf',
    moon: '#ecfeff',
    silhouette: '#050a0d',
    skyline: 'mountains',
    weather: 'snow',
  },
])

function focusDurationMs(session) {
  const value = Number(session?.durationMs)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function uniqueFocusSessions(sessions) {
  return new Set(
    sessions
      .filter((session) => session?.type === 'focus')
      .map((session) => session.sessionId || session.id),
  ).size
}

/**
 * Derives the current stage, next unlock, and in-stage progress from the same
 * saved session list the rest of LaplyGo already uses.
 */
export function getStudioProgress(sessions = [], liveFocusMs = 0) {
  const safeSessions = Array.isArray(sessions) ? sessions : []
  const focusSessions = safeSessions.filter((session) => session?.type === 'focus')
  const savedFocusMs = focusSessions.reduce(
    (total, session) => total + focusDurationMs(session),
    0,
  )
  const liveMs = Number.isFinite(Number(liveFocusMs))
    ? Math.max(0, Number(liveFocusMs))
    : 0
  const totalFocusMs = savedFocusMs + liveMs
  const totalMinutes = totalFocusMs / MS_PER_MINUTE
  const completedSessions = uniqueFocusSessions(safeSessions)

  let stageIndex = 0
  for (let index = 0; index < STUDIO_STAGES.length; index += 1) {
    if (totalMinutes >= STUDIO_STAGES[index].minMinutes) stageIndex = index
  }

  const stage = STUDIO_STAGES[stageIndex]
  const nextStage = STUDIO_STAGES[stageIndex + 1] ?? null
  const stageStartMs = stage.minMinutes * MS_PER_MINUTE
  const stageEndMs = nextStage
    ? nextStage.minMinutes * MS_PER_MINUTE
    : stageStartMs + MS_PER_MINUTE
  const progress = nextStage
    ? Math.min(
        1,
        Math.max(0, (totalFocusMs - stageStartMs) / (stageEndMs - stageStartMs)),
      )
    : 1
  const minutesToNext = nextStage
    ? Math.max(0, Math.ceil((stageEndMs - totalFocusMs) / MS_PER_MINUTE))
    : 0

  return {
    totalFocusMs,
    totalMinutes,
    completedSessions,
    stage,
    stageIndex,
    nextStage,
    progress,
    minutesToNext,
    isMaxStage: !nextStage,
  }
}
