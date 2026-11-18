/**
 * Optional, lightweight completion feedback. Audio is synthesized on demand so
 * the app ships no sound assets and never autoplays before a user gesture.
 */
export function playCompletionChime() {
  if (typeof window === 'undefined') return false

  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return false

  try {
    const context = new AudioContext()
    const start = context.currentTime + 0.02
    const notes = [
      { frequency: 523.25, delay: 0 },
      { frequency: 659.25, delay: 0.12 },
      { frequency: 783.99, delay: 0.24 },
    ]

    for (const note of notes) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = note.frequency
      gain.gain.setValueAtTime(0.0001, start + note.delay)
      gain.gain.exponentialRampToValueAtTime(0.12, start + note.delay + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.delay + 0.38)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start + note.delay)
      oscillator.stop(start + note.delay + 0.42)
    }

    window.setTimeout(() => context.close().catch(() => {}), 900)
    return true
  } catch {
    return false
  }
}

export function canUseNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission() {
  if (!canUseNotifications()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function showBrowserNotification(title, body) {
  if (!canUseNotifications() || Notification.permission !== 'granted') return false

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'laplygo-session',
    })
    window.setTimeout(() => notification.close(), 8000)
    return true
  } catch {
    return false
  }
}
