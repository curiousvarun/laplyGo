import { STORAGE_KEYS } from '../constants.js'
import { readStorage, writeStorage } from '../utils/storage.js'

/**
 * Simulated cloud adapter.
 *
 * The public API is intentionally provider-shaped (`pull`, `push`). To connect
 * Supabase, Firebase, or your own API, replace these two functions with real
 * network calls — the rest of the app only depends on the returned shape.
 *
 * The preview implementation keeps a per-account bucket in localStorage so the
 * full sign-in → merge → sync experience works without a backend.
 */

const NETWORK_DELAY_MS = 320

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function readStore() {
  const store = readStorage(STORAGE_KEYS.cloud, {})
  return store && typeof store === 'object' && !Array.isArray(store) ? store : {}
}

function writeStore(store) {
  return writeStorage(STORAGE_KEYS.cloud, store)
}

export async function pullCloud(userId) {
  if (!userId) return null
  await wait(NETWORK_DELAY_MS)

  const bucket = readStore()[userId]
  if (!bucket || typeof bucket !== 'object') return null

  return {
    sessions: Array.isArray(bucket.sessions) ? bucket.sessions : [],
    settings: bucket.settings && typeof bucket.settings === 'object' ? bucket.settings : null,
    presets: Array.isArray(bucket.presets) ? bucket.presets : [],
    updatedAt: Number(bucket.updatedAt) || null,
  }
}

export async function pushCloud(userId, payload) {
  if (!userId) return { ok: false, error: 'No account selected.' }
  await wait(NETWORK_DELAY_MS)

  const store = readStore()
  const updatedAt = Date.now()

  store[userId] = {
    sessions: Array.isArray(payload?.sessions) ? payload.sessions : [],
    settings: payload?.settings ?? null,
    presets: Array.isArray(payload?.presets) ? payload.presets : [],
    updatedAt,
  }

  const written = writeStore(store)
  return written
    ? { ok: true, updatedAt }
    : { ok: false, error: 'Could not write to cloud storage.' }
}

export async function clearCloudHistory(userId) {
  if (!userId) return { ok: false }

  const store = readStore()
  if (!store[userId]) return { ok: true, updatedAt: Date.now() }

  store[userId] = {
    ...store[userId],
    sessions: [],
    updatedAt: Date.now(),
  }

  writeStore(store)
  return { ok: true, updatedAt: Date.now() }
}
