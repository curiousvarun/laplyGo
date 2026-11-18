import { useEffect } from 'react'

/** Applies user animation preferences without fighting the OS media query. */
export function useMotionPreferences({ animationsEnabled, reducedMotion }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('no-animations', !animationsEnabled)
    root.classList.toggle('reduced-motion', reducedMotion)
  }, [animationsEnabled, reducedMotion])
}
