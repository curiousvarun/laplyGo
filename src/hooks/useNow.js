import { useEffect, useState } from 'react'

/**
 * A low-frequency clock used for "today" calculations so views refresh at
 * midnight even when the app has been left open. Defaults to one minute.
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
