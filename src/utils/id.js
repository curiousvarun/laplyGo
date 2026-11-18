/**
 * Generates a collision-resistant session id.
 * Falls back to a random base-36 string on browsers without crypto.randomUUID.
 */
export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
