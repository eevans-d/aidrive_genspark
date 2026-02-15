/**
 * Centralized currency utilities for Mini Market System.
 * All monetary calculations and formatting should use these functions
 * to ensure consistency and avoid floating-point precision issues.
 */

/** Convert a decimal amount to integer cents to avoid floating-point drift */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/** Convert integer cents back to a decimal amount */
export function fromCents(cents: number): number {
  return cents / 100
}

/**
 * Calculate total from line items using integer-cent arithmetic.
 * Returns a decimal amount rounded to 2 decimal places.
 */
export function calcTotal(
  items: { precio_unitario: number; cantidad: number }[],
): number {
  const totalCents = items.reduce(
    (acc, it) => acc + toCents(it.precio_unitario) * it.cantidad,
    0,
  )
  return fromCents(totalCents)
}

/** Format a number as Argentine Peso display string (no $ sign) */
export function money(n: number): string {
  return n.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
