import { useCallback, useEffect, useState } from 'react'
import {
  DAILY_GOAL_MAX_HOURS,
  DAILY_GOAL_MIN_HOURS,
  DEFAULT_SETTINGS,
  REMINDER_MAX_MINUTES,
  REMINDER_MIN_MINUTES,
  STORAGE_KEYS,
  TARGET_SESSION_MAX_MINUTES,
  TARGET_SESSION_MIN_MINUTES,
  THEME_OPTIONS,
} from '../constants.js'
import { readStorage, writeStorage } from '../utils/storage.js'

function clampGoal(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return DEFAULT_SETTINGS.dailyGoalHours
  const rounded = Math.round(number * 2) / 2
  return Math.min(DAILY_GOAL_MAX_HOURS, Math.max(DAILY_GOAL_MIN_HOURS, rounded))
}

function clampWhole(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

function readBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

export function sanitizeSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}

  return {
    dailyGoalHours: clampGoal(source.dailyGoalHours),
    targetSessionMinutes: clampWhole(
      source.targetSessionMinutes ?? source.intervalWorkMinutes,
      TARGET_SESSION_MIN_MINUTES,
      TARGET_SESSION_MAX_MINUTES,
      DEFAULT_SETTINGS.targetSessionMinutes,
    ),
    remindersEnabled: readBoolean(
      source.remindersEnabled,
      DEFAULT_SETTINGS.remindersEnabled,
    ),
    reminderMinutes: clampWhole(
      source.reminderMinutes,
      REMINDER_MIN_MINUTES,
      REMINDER_MAX_MINUTES,
      DEFAULT_SETTINGS.reminderMinutes,
    ),
    theme: THEME_OPTIONS.includes(source.theme)
      ? source.theme
      : DEFAULT_SETTINGS.theme,
    soundEnabled: readBoolean(source.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    notificationsEnabled: readBoolean(
      source.notificationsEnabled,
      DEFAULT_SETTINGS.notificationsEnabled,
    ),
    animationsEnabled: readBoolean(
      source.animationsEnabled,
      DEFAULT_SETTINGS.animationsEnabled,
    ),
    focusWorldEnabled: readBoolean(
      source.focusWorldEnabled,
      DEFAULT_SETTINGS.focusWorldEnabled,
    ),
    reducedMotion: readBoolean(
      source.reducedMotion,
      DEFAULT_SETTINGS.reducedMotion,
    ),
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(() =>
    sanitizeSettings(readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)),
  )

  useEffect(() => {
    writeStorage(STORAGE_KEYS.settings, settings)
  }, [settings])

  const updateSettings = useCallback((patch) => {
    setSettings((previous) => {
      const next = typeof patch === 'function' ? patch(previous) : patch
      return sanitizeSettings({ ...previous, ...next })
    })
  }, [])

  return { settings, updateSettings }
}
