import { useEffect, useRef } from 'react'
import { showBrowserNotification } from '../utils/feedback.js'

/**
 * Optional, non-punitive check-ins. A reminder fires only while a focus session
 * is actively running and only when browser notifications are enabled.
 */
export function useFocusReminders({
  enabled,
  minutes,
  status,
  elapsedMs,
  label,
  sessionId,
  notificationsEnabled,
}) {
  const elapsedRef = useRef(0)
  const previousElapsedRef = useRef(0)
  const lastMarkRef = useRef(0)

  useEffect(() => {
    elapsedRef.current = elapsedMs
    if (elapsedMs < previousElapsedRef.current) lastMarkRef.current = 0
    previousElapsedRef.current = elapsedMs
  }, [elapsedMs])

  useEffect(() => {
    lastMarkRef.current = 0
  }, [sessionId])

  useEffect(() => {
    if (
      !enabled ||
      !notificationsEnabled ||
      status !== 'running' ||
      intervalMsIsInvalid(minutes)
    ) {
      return undefined
    }

    const intervalMs = Math.max(1, Number(minutes)) * 60_000

    const checkIn = () => {
      const mark = Math.floor(elapsedRef.current / intervalMs)
      if (mark <= 0 || mark <= lastMarkRef.current) return
      lastMarkRef.current = mark
      showBrowserNotification(
        'A gentle LaplyGo check-in',
        `${mark * Number(minutes)} minutes of ${label || 'focus'}. Breathe, stretch, and continue only if it feels right.`,
      )
    }

    const id = window.setInterval(checkIn, 15_000)
    return () => window.clearInterval(id)
  }, [enabled, notificationsEnabled, status, minutes, label])
}

function intervalMsIsInvalid(minutes) {
  return !Number.isFinite(Number(minutes)) || Number(minutes) <= 0
}
