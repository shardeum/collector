/**
 * Checks whether the given thing is a Number
 */
export function isNumber(thing: unknown): boolean {
  return typeof thing === 'number' && !Number.isNaN(thing)
}
