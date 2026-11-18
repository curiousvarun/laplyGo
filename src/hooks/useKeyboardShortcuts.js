import { useEffect, useRef } from 'react'

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false

  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox'
  )
}

/**
 * Global power-user shortcuts.
 * Space toggles focus/break, L logs a split, R resets, S finishes, F is Zen.
 * All timer shortcuts pause while a dialog is open or a field is focused.
 */
export function useKeyboardShortcuts({
  enabled = false,
  onToggle,
  onSplit,
  onReset,
  onStop,
  onZen,
  onExitZen,
  zenEnabled = true,
}) {
  const handlersRef = useRef({ onToggle, onSplit, onReset, onStop, onZen, onExitZen })

  useEffect(() => {
    handlersRef.current = { onToggle, onSplit, onReset, onStop, onZen, onExitZen }
  }, [onToggle, onSplit, onReset, onStop, onZen, onExitZen])

  useEffect(() => {
    if (!enabled && !zenEnabled) return undefined

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      if (isTypingTarget(event.target)) return

      const key = event.key.toLowerCase()

      if (key === 'f' && zenEnabled) {
        event.preventDefault()
        if (!event.repeat) handlersRef.current.onZen?.()
        return
      }

      if (key === 'escape') {
        if (!event.repeat) handlersRef.current.onExitZen?.()
        return
      }

      if (!enabled) return

      if (event.code === 'Space' || key === ' ') {
        event.preventDefault()
        if (!event.repeat) handlersRef.current.onToggle?.()
        return
      }

      if (key === 'l') {
        event.preventDefault()
        if (!event.repeat) handlersRef.current.onSplit?.()
        return
      }

      if (key === 'r') {
        event.preventDefault()
        if (!event.repeat) handlersRef.current.onReset?.()
        return
      }

      if (key === 's') {
        event.preventDefault()
        if (!event.repeat) handlersRef.current.onStop?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, zenEnabled])
}
