import { useCallback, useState } from 'react'
import { STORAGE_KEYS } from '../constants.js'
import { removeStorage, readStorage, writeStorage } from '../utils/storage.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readUsers() {
  const users = readStorage(STORAGE_KEYS.users, [])
  return Array.isArray(users) ? users.filter((user) => user && user.id && user.email) : []
}

function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  }
}

function readSessionUser() {
  const saved = readStorage(STORAGE_KEYS.auth, null)
  if (!saved || typeof saved.userId !== 'string') return null
  return publicUser(readUsers().find((user) => user.id === saved.userId))
}

async function hashPassword(password) {
  const value = `laply-go-preview::${String(password ?? '')}`

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(value)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  // Non-secure contexts (rare in local preview) still avoid plaintext storage.
  return btoa(unescape(encodeURIComponent(value)))
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Local-first authentication scaffold.
 *
 * Today it uses a local account registry with hashed passwords and a simulated
 * cloud bucket. Swap the reducer for a real provider without touching the UI:
 * the app only cares about `user`, `signIn`, `signUp`, and `signOut`.
 */
export function useAuth() {
  const [user, setUser] = useState(readSessionUser)
  const [status, setStatus] = useState(() =>
    readSessionUser() ? 'ready' : 'signed-out',
  )
  const [error, setError] = useState('')

  const clearError = useCallback(() => setError(''), [])

  const signUp = useCallback(async ({ name, email, password }) => {
    setStatus('working')
    setError('')

    const cleanName = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    const cleanEmail = String(email ?? '').trim().toLowerCase()

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setStatus('signed-out')
      const message = 'Enter a valid email address.'
      setError(message)
      return { ok: false, error: message }
    }
    if (String(password ?? '').length < 6) {
      setStatus('signed-out')
      const message = 'Use at least 6 characters for your password.'
      setError(message)
      return { ok: false, error: message }
    }

    await wait(420)
    const users = readUsers()
    if (users.some((existing) => existing.email === cleanEmail)) {
      setStatus('signed-out')
      const message = 'An account with that email already exists.'
      setError(message)
      return { ok: false, error: message }
    }

    const created = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `user-${Date.now().toString(36)}`,
      email: cleanEmail,
      name: cleanName || cleanEmail.split('@')[0],
      passwordHash: await hashPassword(password),
      createdAt: Date.now(),
    }

    writeStorage(STORAGE_KEYS.users, [...users, created])
    writeStorage(STORAGE_KEYS.auth, { userId: created.id })
    setUser(publicUser(created))
    setStatus('ready')
    return { ok: true, user: publicUser(created) }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    setStatus('working')
    setError('')

    const cleanEmail = String(email ?? '').trim().toLowerCase()
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setStatus('signed-out')
      const message = 'Enter a valid email address.'
      setError(message)
      return { ok: false, error: message }
    }

    await wait(420)
    const users = readUsers()
    const existing = users.find((candidate) => candidate.email === cleanEmail)
    const passwordHash = await hashPassword(password)

    if (!existing || existing.passwordHash !== passwordHash) {
      setStatus('signed-out')
      const message = 'Email or password is incorrect.'
      setError(message)
      return { ok: false, error: message }
    }

    writeStorage(STORAGE_KEYS.auth, { userId: existing.id })
    setUser(publicUser(existing))
    setStatus('ready')
    return { ok: true, user: publicUser(existing) }
  }, [])

  const signOut = useCallback(() => {
    removeStorage(STORAGE_KEYS.auth)
    setUser(null)
    setStatus('signed-out')
    setError('')
  }, [])

  return {
    user,
    status,
    busy: status === 'working',
    error,
    clearError,
    signUp,
    signIn,
    signOut,
  }
}
