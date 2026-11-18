import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext } from '../../context/toastContext.js'
import { cx } from '../../utils/cx.js'

let nextToastId = 0

const TONES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    ring: 'border-emerald-200 dark:border-emerald-500/25',
  },
  info: {
    icon: Info,
    iconClass: 'text-indigo-600 dark:text-indigo-400',
    ring: 'border-indigo-200 dark:border-indigo-500/25',
  },
  error: {
    icon: AlertTriangle,
    iconClass: 'text-rose-600 dark:text-rose-400',
    ring: 'border-rose-200 dark:border-rose-500/25',
  },
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  const tone = TONES[toast.tone] ?? TONES.success
  const Icon = tone.icon

  return (
    <div
      role="status"
      className={cx(
        'pointer-events-auto flex w-full max-w-md animate-toast-in items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg shadow-zinc-950/10',
        'dark:bg-zinc-900 dark:shadow-black/40',
        tone.ring,
      )}
    >
      <Icon
        className={cx('mt-0.5 size-5 shrink-0', tone.iconClass)}
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 text-[15px] font-medium leading-relaxed text-zinc-800 dark:text-zinc-100">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-m-1 grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message, options = {}) => {
    const { tone = 'success', duration = 4000, replaceKey = null } =
      typeof options === 'string' ? { tone: options } : options

    nextToastId += 1
    const id = nextToastId

    setToasts((previous) => {
      const withoutReplaced = replaceKey
        ? previous.filter((toast) => toast.replaceKey !== replaceKey)
        : previous

      return [
        ...withoutReplaced.slice(-2),
        { id, message, tone, duration, replaceKey },
      ]
    })

    return id
  }, [])

  const value = useMemo(() => ({ notify, dismiss }), [dismiss, notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
