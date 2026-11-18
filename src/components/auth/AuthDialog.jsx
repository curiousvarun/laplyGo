import { useState } from 'react'
import {
  CheckCircle2,
  Cloud,
  Loader2,
  LogOut,
  RefreshCw,
  UserRound,
} from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { useToast } from '../../hooks/useToast.js'
import { cx } from '../../utils/cx.js'

function initials(value) {
  const parts = String(value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'T'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function formatSyncedAt(timestamp) {
  if (!timestamp) return 'Not synced yet'
  const date = new Date(timestamp)
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 45) return 'Synced just now'
  if (seconds < 3600) return `Synced ${Math.round(seconds / 60)}m ago`
  return `Synced ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

export function AuthDialog({ open, onClose, auth, cloud, sessionCount }) {
  const { notify } = useToast()
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const switchMode = (next) => {
    setMode(next)
    setLocalError('')
    auth.clearError()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    const result =
      mode === 'signin'
        ? await auth.signIn({ email, password })
        : await auth.signUp({ name, email, password })

    if (result.ok) {
      notify(
        mode === 'signin'
          ? `Welcome back, ${result.user.name}.`
          : `Account created. Welcome, ${result.user.name}.`,
        'success',
      )
      onClose()
    }
  }

  const handleSync = async () => {
    const result = await cloud.syncNow()
    if (result.ok) notify('Cloud sync complete.', 'success')
    else notify('Sync failed. Your local data is still safe.', 'error')
  }

  const handleSignOut = () => {
    auth.signOut()
    notify('Signed out. Your local history is still here.', 'info')
    onClose()
  }

  const error = localError || auth.error || cloud.error

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={auth.user ? 'Your LaplyGo account' : 'Sync across devices'}
      footer={
        auth.user ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
            <Button onClick={handleSync} disabled={cloud.syncing}>
              <RefreshCw
                className={cx('size-4', cloud.syncing && 'animate-spin')}
                aria-hidden="true"
              />
              {cloud.syncing ? 'Syncing…' : 'Sync now'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Continue locally
            </Button>
            <Button
              type="submit"
              form="auth-form"
              disabled={auth.busy}
            >
              {auth.busy && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {auth.busy
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
            </Button>
          </>
        )
      }
    >
      {auth.user ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-sm font-extrabold text-white dark:bg-indigo-500 dark:text-zinc-950">
              {initials(auth.user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold">{auth.user.name}</p>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                {auth.user.email}
              </p>
            </div>
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Connected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Sessions
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums">
                {sessionCount}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Cloud status
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold">
                <Cloud className="size-4 text-indigo-500" aria-hidden="true" />
                {cloud.syncing ? 'Syncing…' : 'Up to date'}
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatSyncedAt(cloud.lastSyncedAt)}
          </p>

          {error && (
            <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div>
          <div
            role="tablist"
            aria-label="Account action"
            className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100/80 p-1 dark:bg-zinc-800/60"
          >
            {[
              { id: 'signin', label: 'Sign in' },
              { id: 'signup', label: 'Create account' },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={mode === tab.id}
                onClick={() => switchMode(tab.id)}
                className={cx(
                  'min-h-10 rounded-lg text-sm font-bold transition-colors',
                  mode === tab.id
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form id="auth-form" onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Name
                </label>
                <div className="relative">
                  <UserRound
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-name"
                    autoComplete="name"
                    value={name}
                    maxLength={40}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Alex Chen"
                    className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-base text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-base text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-base text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
          </form>
        </div>
      )}
    </Modal>
  )
}
