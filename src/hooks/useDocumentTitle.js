import { useEffect, useRef } from 'react'
import { APP_NAME } from '../constants.js'
import { formatClock } from '../utils/timeFormatters.js'

/** Updates the tab title at most once per tick while a timer has time on it. */
export function useDocumentTitle({
  valueMs,
  breakMs = 0,
  status,
  presetLabel,
  countdownStatus,
  countdownRemainingMs,
  countdownLabel,
}) {
  const lastTitleRef = useRef('')

  useEffect(() => {
    let title = `${APP_NAME} — Stopwatch, countdown & focus tracker`

    if (countdownStatus === 'running') {
      title = `${formatClock(countdownRemainingMs)} left • ${countdownLabel || 'Timer'}`
    } else if (countdownStatus === 'paused') {
      title = `${formatClock(countdownRemainingMs)} paused • ${APP_NAME}`
    } else if (countdownStatus === 'complete') {
      title = `Time's up • ${APP_NAME}`
    } else if (status === 'paused') {
      title = `${formatClock(breakMs)} break • ${APP_NAME}`
    } else if (status === 'running') {
      title = `${formatClock(valueMs)} • ${presetLabel || 'Focus'}`
    }

    if (title !== lastTitleRef.current) {
      lastTitleRef.current = title
      document.title = title
    }
  }, [
    valueMs,
    breakMs,
    status,
    presetLabel,
    countdownStatus,
    countdownRemainingMs,
    countdownLabel,
  ])

  useEffect(
    () => () => {
      document.title = `${APP_NAME} — Stopwatch, countdown & focus tracker`
    },
    [],
  )
}
