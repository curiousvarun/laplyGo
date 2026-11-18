/**
 * Joins class names while ignoring falsey values.
 * Keeps JSX conditional classes readable without pulling in a dependency.
 */
export function cx(...values) {
  return values.filter(Boolean).join(' ')
}
