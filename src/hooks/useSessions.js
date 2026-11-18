import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEYS } from '../constants.js'
import { mergeSessionLists, sanitizeSession, sanitizeSessions } from '../utils/sessions.js'
import { readStorage, writeStorage } from '../utils/storage.js'

export function useSessions() {
  const [sessions, setSessions] = useState(() =>
    sanitizeSessions(readStorage(STORAGE_KEYS.sessions, [])),
  )

  const sessionsRef = useRef(sessions)

  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.sessions, sessions)
  }, [sessions])

  /** Returns false when the session was already saved (id collision / double finish). */
  const addSession = useCallback((session) => {
    if (!session || typeof session.id !== 'string') return false
    if (sessionsRef.current.some((existing) => existing.id === session.id)) {
      return false
    }

    const clean = sanitizeSession(session)
    if (!clean) return false

    const next = [...sessionsRef.current, clean]
    sessionsRef.current = next
    setSessions(next)
    return true
  }, [])

  /** Atomically adds a completed run: intervals, breaks, and split checkpoints. */
  const addSessions = useCallback((incoming) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return 0

    const existingIds = new Set(sessionsRef.current.map((session) => session.id))
    const next = [...sessionsRef.current]
    let added = 0

    for (const value of incoming) {
      if (!value || typeof value.id !== 'string' || existingIds.has(value.id)) {
        continue
      }
      const clean = sanitizeSession(value)
      if (!clean) continue
      existingIds.add(clean.id)
      next.push(clean)
      added += 1
    }

    if (added > 0) {
      sessionsRef.current = next
      setSessions(next)
    }
    return added
  }, [])

  const deleteSession = useCallback((id) => {
    setSessions((previous) => {
      const next = previous.filter((session) => session.id !== id)
      sessionsRef.current = next
      return next
    })
  }, [])

  const clearSessions = useCallback(() => {
    sessionsRef.current = []
    setSessions([])
  }, [])

  /** Union of local and cloud history. Returns the number of new sessions. */
  const mergeSessions = useCallback((remoteSessions) => {
    if (!Array.isArray(remoteSessions) || remoteSessions.length === 0) return 0

    const merged = mergeSessionLists(sessionsRef.current, remoteSessions)
    const added = merged.length - sessionsRef.current.length
    if (added > 0) {
      sessionsRef.current = merged
      setSessions(merged)
    }
    return added
  }, [])

  return {
    sessions,
    addSession,
    addSessions,
    deleteSession,
    clearSessions,
    mergeSessions,
  }
}
