/**
 * The spacing of an x axis over a window, which every derivative divides by.
 */

import type { NumberArray } from 'cheminfo-types';

/**
 * The mean spacing of `h` over the window centred on `center`.
 *
 * The sum of consecutive differences telescopes, so only the two ends of the
 * window are read instead of every point.
 * @param h - The x values.
 * @param center - Index the window is centred on.
 * @param half - Half the window size.
 * @returns The mean spacing.
 */
export function meanGap(h: NumberArray, center: number, half: number): number {
  const lo = Math.max(center - half, 0);
  const hi = Math.min(center + half - 1, h.length - 2);
  return (h[hi + 1] - h[lo]) / (hi - lo + 1);
}

/**
 * A spacing raised to a derivative order.
 *
 * Orders 1 and 2 are spelled out because `x ** 1` is far slower than `x`.
 * @param spacing - The mean spacing.
 * @param derivative - The order.
 * @returns The divisor for that order.
 */
export function raise(spacing: number, derivative: number): number {
  if (derivative === 1) return spacing;
  if (derivative === 2) return spacing * spacing;
  return spacing ** derivative;
}
