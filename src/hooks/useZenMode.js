import { useCallback, useEffect, useState } from 'react'

/**
 * Distraction-free Zen mode with progressive fullscreen support.
 * Zen always works, even where the Fullscreen API is unavailable or denied.
 */
export function useZenMode() {
  const [zenMode, setZenMode] = useState(false)

  const exitZen = useCallback(() => {
    setZenMode(false)
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  const toggleZen = useCallback(() => {
    if (zenMode) {
      exitZen()
      return
    }

    setZenMode(true)
    document.documentElement.requestFullscreen?.().catch(() => {})
  }, [exitZen, zenMode])

  useEffect(() => {
    if (!zenMode) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setZenMode(false)
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [zenMode])

  return { zenMode, toggleZen, exitZen }
}
