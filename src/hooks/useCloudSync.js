import { useCallback, useEffect, useRef, useState } from 'react'
import { mergeSessionLists } from '../utils/sessions.js'
import { pullCloud, pushCloud } from '../utils/cloudSync.js'

const AUTO_SYNC_DELAY_MS = 900

/**
 * Local-first sync coordinator.
 * Pulls once on sign-in, merges by id, then debounces pushes as data changes.
 */
export function useCloudSync({
  user,
  sessions,
  settings,
  presets,
  mergeSessions,
  mergePresets,
}) {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [error, setError] = useState('')

  const sessionsRef = useRef(sessions)
  const settingsRef = useRef(settings)
  const presetsRef = useRef(presets)
  const mergeSessionsRef = useRef(mergeSessions)
  const mergePresetsRef = useRef(mergePresets)
  const hasPulledRef = useRef(null)

  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    presetsRef.current = presets
  }, [presets])

  useEffect(() => {
    mergeSessionsRef.current = mergeSessions
  }, [mergeSessions])

  useEffect(() => {
    mergePresetsRef.current = mergePresets
  }, [mergePresets])

  // Pull and merge once per signed-in account.
  useEffect(() => {
    const userId = user?.id
    if (!userId) {
      hasPulledRef.current = null
      return undefined
    }
    if (hasPulledRef.current === userId) return undefined

    hasPulledRef.current = userId
    let cancelled = false
    setSyncing(true)
    setError('')

    ;(async () => {
      try {
        const remote = await pullCloud(userId)
        if (cancelled) return
        if (remote) {
          const addedSessions = mergeSessionsRef.current(remote.sessions)
          const addedPresets = mergePresetsRef.current(remote.presets)
          if (addedSessions > 0 || addedPresets > 0) {
            setLastSyncedAt(Date.now())
          }
        }
      } catch {
        if (!cancelled) setError('Could not reach cloud sync.')
      } finally {
        if (!cancelled) setSyncing(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Debounced push whenever local data changes.
  useEffect(() => {
    const userId = user?.id
    if (!userId) return undefined

    const timer = window.setTimeout(async () => {
      setSyncing(true)
      try {
        const result = await pushCloud(userId, {
          sessions,
          settings,
          presets,
        })
        if (result.ok) {
          setLastSyncedAt(result.updatedAt)
          setError('')
        } else {
          setError(result.error ?? 'Sync failed.')
        }
      } catch {
        setError('Could not reach cloud sync.')
      } finally {
        setSyncing(false)
      }
    }, AUTO_SYNC_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [user?.id, sessions, settings, presets])

  const syncNow = useCallback(async () => {
    const userId = user?.id
    if (!userId) return { ok: false }

    setSyncing(true)
    setError('')

    try {
      const remote = await pullCloud(userId)
      let mergedSessions = sessionsRef.current

      if (remote) {
        mergedSessions = mergeSessionLists(sessionsRef.current, remote.sessions)
        mergeSessionsRef.current(remote.sessions)
        mergePresetsRef.current(remote.presets)
      }

      const result = await pushCloud(userId, {
        sessions: mergedSessions,
        settings: settingsRef.current,
        presets: presetsRef.current,
      })

      if (result.ok) {
        setLastSyncedAt(result.updatedAt)
        return { ok: true, updatedAt: result.updatedAt }
      }

      setError(result.error ?? 'Sync failed.')
      return { ok: false, error: result.error }
    } catch {
      setError('Could not reach cloud sync.')
      return { ok: false }
    } finally {
      setSyncing(false)
    }
  }, [user?.id])

  return { syncing, lastSyncedAt, error, syncNow }
}
