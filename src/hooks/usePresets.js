import { useCallback, useEffect, useState } from 'react'
import {
  BUILTIN_PRESETS,
  MAX_CUSTOM_PRESETS,
  MAX_PRESET_NAME_LENGTH,
  STORAGE_KEYS,
} from '../constants.js'
import { createId } from '../utils/id.js'
import { getAllPresets } from '../utils/presets.js'
import { readStorage, writeStorage } from '../utils/storage.js'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function sanitizeCustomPresets(raw) {
  if (!Array.isArray(raw)) return []

  const seenIds = new Set()
  const seenLabels = new Set(BUILTIN_PRESETS.map((preset) => preset.label.toLowerCase()))
  const presets = []

  for (const value of raw) {
    if (!value || typeof value !== 'object') continue

    const label = normalizeName(value.label)
    const key = label.toLowerCase()
    if (!label || label.length > MAX_PRESET_NAME_LENGTH) continue
    if (seenLabels.has(key)) continue

    const id =
      typeof value.id === 'string' && value.id.startsWith('custom-')
        ? value.id
        : `custom-${createId()}`
    if (seenIds.has(id)) continue

    seenIds.add(id)
    seenLabels.add(key)
    presets.push({
      id,
      label,
      emoji:
        typeof value.emoji === 'string' && value.emoji.trim()
          ? value.emoji.trim().slice(0, 8)
          : '🎯',
      color: HEX_COLOR.test(value.color) ? value.color : '#6366f1',
      custom: true,
    })

    if (presets.length >= MAX_CUSTOM_PRESETS) break
  }

  return presets
}

export function usePresets() {
  const [customPresets, setCustomPresets] = useState(() =>
    sanitizeCustomPresets(readStorage(STORAGE_KEYS.presets, [])),
  )

  useEffect(() => {
    writeStorage(STORAGE_KEYS.presets, customPresets)
  }, [customPresets])

  const addPreset = useCallback(
    ({ label, emoji, color }) => {
      const name = normalizeName(label)
      if (!name) return { ok: false, error: 'Give your activity a name.' }
      if (name.length > MAX_PRESET_NAME_LENGTH) {
        return {
          ok: false,
          error: `Keep it to ${MAX_PRESET_NAME_LENGTH} characters or fewer.`,
        }
      }

      const allLabels = getAllPresets(customPresets).map((preset) =>
        preset.label.toLowerCase(),
      )
      if (allLabels.includes(name.toLowerCase())) {
        return { ok: false, error: 'That activity name is already in use.' }
      }
      if (customPresets.length >= MAX_CUSTOM_PRESETS) {
        return {
          ok: false,
          error: `You can save up to ${MAX_CUSTOM_PRESETS} custom activities.`,
        }
      }

      const preset = {
        id: `custom-${createId()}`,
        label: name,
        emoji: typeof emoji === 'string' && emoji ? emoji.slice(0, 8) : '🎯',
        color: HEX_COLOR.test(color) ? color : '#6366f1',
        custom: true,
      }

      setCustomPresets((previous) => [...previous, preset])
      return { ok: true, preset }
    },
    [customPresets],
  )

  const editPreset = useCallback(
    (id, { label, emoji, color }) => {
      const current = customPresets.find((preset) => preset.id === id)
      if (!current) {
        return { ok: false, error: 'That custom activity no longer exists.' }
      }

      const name = normalizeName(label)
      if (!name) return { ok: false, error: 'Give your activity a name.' }
      if (name.length > MAX_PRESET_NAME_LENGTH) {
        return {
          ok: false,
          error: `Keep it to ${MAX_PRESET_NAME_LENGTH} characters or fewer.`,
        }
      }

      const otherLabels = getAllPresets(customPresets)
        .filter((preset) => preset.id !== id)
        .map((preset) => preset.label.toLowerCase())
      if (otherLabels.includes(name.toLowerCase())) {
        return { ok: false, error: 'That activity name is already in use.' }
      }

      const preset = {
        ...current,
        label: name,
        emoji: typeof emoji === 'string' && emoji ? emoji.slice(0, 8) : current.emoji,
        color: HEX_COLOR.test(color) ? color : current.color,
      }

      setCustomPresets((previous) =>
        previous.map((item) => (item.id === id ? preset : item)),
      )
      return { ok: true, preset }
    },
    [customPresets],
  )

  const deletePreset = useCallback((id) => {
    setCustomPresets((previous) =>
      previous.filter((preset) => preset.id !== id),
    )
  }, [])

  /** Union of cloud and local custom presets, deduped by id and label. */
  const mergePresets = useCallback(
    (remotePresets) => {
      if (!Array.isArray(remotePresets) || remotePresets.length === 0) return 0

      const seenIds = new Set(customPresets.map((preset) => preset.id))
      const seenLabels = new Set(
        getAllPresets(customPresets).map((preset) => preset.label.toLowerCase()),
      )
      const next = [...customPresets]

      for (const candidate of sanitizeCustomPresets(remotePresets)) {
        if (seenIds.has(candidate.id)) continue
        if (seenLabels.has(candidate.label.toLowerCase())) continue
        if (next.length >= MAX_CUSTOM_PRESETS) break
        next.push(candidate)
        seenIds.add(candidate.id)
        seenLabels.add(candidate.label.toLowerCase())
      }

      const added = next.length - customPresets.length
      if (added > 0) setCustomPresets(next)
      return added
    },
    [customPresets],
  )

  return {
    presets: getAllPresets(customPresets),
    customPresets,
    addPreset,
    editPreset,
    deletePreset,
    mergePresets,
  }
}
