import { MS_PER_MINUTE } from './timeFormatters.js'

export const WORLD_LEVELS = Object.freeze([
  {
    id: 'first-light',
    name: 'First light',
    minMinutes: 0,
    description: 'A quiet patch of soil, ready for the first seed.',
    sky: ['#eef2ff', '#fef3c7'],
    hill: '#d9e7d5',
    soil: '#c8b59b',
    sun: '#f6c453',
  },
  {
    id: 'new-sprout',
    name: 'New sprout',
    minMinutes: 25,
    description: 'Something small and green is reaching for the light.',
    sky: ['#e0f2fe', '#fef9c3'],
    hill: '#c9e4cf',
    soil: '#bea88b',
    sun: '#f4bf45',
  },
  {
    id: 'quiet-garden',
    name: 'Quiet garden',
    minMinutes: 90,
    description: 'A handful of steady sessions have made a little garden.',
    sky: ['#dbeafe', '#fef3c7'],
    hill: '#b9ddc4',
    soil: '#b59b7d',
    sun: '#f0b43c',
  },
  {
    id: 'growing-grove',
    name: 'Growing grove',
    minMinutes: 240,
    description: 'Trees are taking shape. The air feels softer here.',
    sky: ['#c7e5f4', '#fde68a'],
    hill: '#9bcfaa',
    soil: '#a78a6a',
    sun: '#eea93a',
  },
  {
    id: 'wild-bloom',
    name: 'Wild bloom',
    minMinutes: 600,
    description: 'Flowers, shade, and a world that grew from consistency.',
    sky: ['#bbdcf0', '#fbcfe8'],
    hill: '#83c397',
    soil: '#96775a',
    sun: '#e99a37',
  },
  {
    id: 'starlit-forest',
    name: 'Starlit forest',
    minMinutes: 1200,
    description: 'A deep, calm forest under a sky full of quiet stars.',
    sky: ['#1e1b4b', '#4338ca'],
    hill: '#35634e',
    soil: '#5f4a3a',
    sun: '#e2e8f0',
    stars: true,
  },
])

const PLANT_LAYOUT = Object.freeze([
  { x: 52, scale: 0.92, type: 'flower' },
  { x: 104, scale: 1.12, type: 'tree' },
  { x: 156, scale: 0.78, type: 'sprout' },
  { x: 208, scale: 1.24, type: 'tree' },
  { x: 258, scale: 0.86, type: 'flower' },
  { x: 308, scale: 1.05, type: 'sprout' },
  { x: 360, scale: 0.9, type: 'tree' },
  { x: 410, scale: 0.74, type: 'flower' },
  { x: 78, scale: 0.68, type: 'sprout' },
  { x: 332, scale: 0.64, type: 'flower' },
])

function uniqueFocusSessions(sessions) {
  return new Set(
    sessions
      .filter((session) => session.type === 'focus')
      .map((session) => session.sessionId || session.id),
  ).size
}

export function getFocusWorld(sessions, liveFocusMs = 0) {
  const focusSessions = sessions.filter((session) => session.type === 'focus')
  const savedFocusMs = focusSessions.reduce(
    (total, session) => total + session.durationMs,
    0,
  )
  const totalFocusMs = savedFocusMs + Math.max(0, liveFocusMs)
  const totalMinutes = totalFocusMs / MS_PER_MINUTE
  const completedSessions = uniqueFocusSessions(sessions)

  let levelIndex = 0
  for (let index = 0; index < WORLD_LEVELS.length; index += 1) {
    if (totalMinutes >= WORLD_LEVELS[index].minMinutes) levelIndex = index
  }

  const level = WORLD_LEVELS[levelIndex]
  const next = WORLD_LEVELS[levelIndex + 1] ?? null
  const span = next ? next.minMinutes - level.minMinutes : 1
  const progress = next
    ? Math.min(1, Math.max(0, (totalMinutes - level.minMinutes) / span))
    : 1
  const minutesToNext = next
    ? Math.max(0, Math.ceil(next.minMinutes - totalMinutes))
    : 0
  const plantCount = Math.min(
    PLANT_LAYOUT.length,
    Math.max(3, 3 + Math.floor(totalMinutes / 45) + Math.min(3, completedSessions)),
  )

  return {
    totalFocusMs,
    totalMinutes,
    completedSessions,
    level,
    levelIndex,
    next,
    progress,
    minutesToNext,
    plantCount,
    plants: PLANT_LAYOUT.slice(0, plantCount),
  }
}

export function getWorldContribution(sessions, focusMs) {
  const world = getFocusWorld(sessions)
  const addedMinutes = Math.max(0, focusMs) / MS_PER_MINUTE
  return {
    world,
    addedMinutes,
    message:
      addedMinutes < 1
        ? 'A small moment of focus still counts.'
        : `${Math.round(addedMinutes)} focus minutes added to your world.`,
  }
}
