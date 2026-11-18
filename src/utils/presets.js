import { BUILTIN_PRESETS, DEFAULT_PRESET_ID } from '../constants.js'

export function getAllPresets(customPresets = []) {
  return [...BUILTIN_PRESETS, ...(Array.isArray(customPresets) ? customPresets : [])]
}

export function getPresetById(id, customPresets = []) {
  const presets = getAllPresets(customPresets)
  return (
    presets.find((preset) => preset.id === id) ??
    presets.find((preset) => preset.id === DEFAULT_PRESET_ID) ??
    BUILTIN_PRESETS[0]
  )
}

export function isBuiltinPreset(id) {
  return BUILTIN_PRESETS.some((preset) => preset.id === id)
}

/** Appends an alpha channel to a #rrggbb color. */
export function withAlpha(hex, alpha) {
  const value = typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#6366f1'
  const clamped = Math.max(0, Math.min(1, Number(alpha)))
  return `${value}${Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')}`
}

function channelLuminance(channel) {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

/** Chooses black or white text for a preset-colored surface. */
export function readableTextColor(hex) {
  const value = typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#6366f1'
  const red = channelLuminance(Number.parseInt(value.slice(1, 3), 16))
  const green = channelLuminance(Number.parseInt(value.slice(3, 5), 16))
  const blue = channelLuminance(Number.parseInt(value.slice(5, 7), 16))
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
  return luminance > 0.52 ? '#09090b' : '#ffffff'
}

/** Session rows saved before presets existed still get a sensible tag. */
export function getSessionPreset(session) {
  const color =
    typeof session?.presetColor === 'string' && /^#[0-9a-f]{6}$/i.test(session.presetColor)
      ? session.presetColor
      : '#6366f1'

  return {
    id: session?.presetId ?? 'general',
    label: session?.presetLabel ?? session?.subject ?? 'Session',
    emoji: session?.presetEmoji ?? '⏱️',
    color,
  }
}
