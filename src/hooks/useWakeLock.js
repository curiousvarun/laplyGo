import { useEffect, useRef, useState } from 'react'

/**
 * Keeps the screen awake while a session is running.
 * Re-acquires the lock when the tab returns to the foreground; browsers release
 * wake locks on tab hide by design. Silently degrades where unsupported.
 */
export function useWakeLock(active) {
  const supported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator

  const [isActive, setIsActive] = useState(false)
  const [isDenied, setIsDenied] = useState(false)

  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!supported) return undefined

    let disposed = false

    const request = async () => {
      if (
        disposed ||
        !activeRef.current ||
        document.visibilityState !== 'visible' ||
        sentinelRef.current
      ) {
        return
      }

      try {
        const sentinel = await navigator.wakeLock.request('screen')

        if (disposed) {
          sentinel.release().catch(() => {})
          return
        }

        sentinelRef.current = sentinel
        setIsActive(true)
        setIsDenied(false)

        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null
            setIsActive(false)
          }
        })
      } catch {
        if (!disposed) {
          setIsActive(false)
          setIsDenied(true)
        }
      }
    }

    const release = async () => {
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      setIsActive(false)

      if (sentinel) {
        try {
          await sentinel.release()
        } catch {
          /* The browser may have released it already. */
        }
      }
    }

    if (active) {
      request()
    } else {
      release()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeRef.current) {
        request()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      release()
    }
  }, [active, supported])

  return { supported, isActive, isDenied }
}
