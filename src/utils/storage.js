/**
 * Thin, defensive wrapper around localStorage.
 * All reads fall back gracefully so private mode / disabled storage never crashes the app.
 */

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStorage(key, fallback) {
  if (!hasWindow()) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  if (!hasWindow()) return false

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStorage(keys) {
  if (!hasWindow()) return

  const list = Array.isArray(keys) ? keys : [keys]
  for (const key of list) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* Nothing useful to do if removal fails. */
    }
  }
}

/** Approximate UTF-16 byte usage for a set of keys, used in Settings. */
export function getStorageBytes(keys) {
  if (!hasWindow()) return 0

  const list = Array.isArray(keys) ? keys : [keys]
  let total = 0

  for (const key of list) {
    try {
      const value = window.localStorage.getItem(key)
      if (value != null) total += (key.length + value.length) * 2
    } catch {
      /* Ignore inaccessible keys. */
    }
  }

  return total
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024) return `${Math.ceil(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
