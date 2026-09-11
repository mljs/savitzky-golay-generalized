import type { NumberArray } from 'cheminfo-types';
import { isAnyArray } from 'is-any-array';

import { cachedWeights } from './weights.ts';

export interface SGGOptions {
  /**
   * @default 9
   */
  windowSize?: number;
  /**
   * @default 0
   */
  derivative?: number;
  /**
   * @default 3
   */
  polynomial?: number;
}

/**
 * Apply Savitzky Golay algorithm.
 * @param ys - Array of y values.
 * @param xs - Array of X or deltaX.
 * @param options - Options controlling window size, derivative and polynomial order.
 * @returns Array containing the new ys (same length).
 */
export function sgg(
  ys: NumberArray,
  xs: NumberArray | number,
  options: SGGOptions = {},
): Float64Array {
  const { windowSize = 9, derivative = 0, polynomial = 3 } = options;

  if (windowSize % 2 === 0 || windowSize < 5 || !Number.isInteger(windowSize)) {
    throw new RangeError(
      'Invalid window size (should be odd and at least 5 integer number)',
    );
  }
  if (!isAnyArray(ys)) {
    throw new TypeError('Y values must be an array');
  }
  if (xs === undefined) {
    throw new TypeError('X must be defined');
  }
  if (windowSize > ys.length) {
    throw new RangeError(
      `Window size is higher than the data length ${windowSize}>${ys.length}`,
    );
  }
  if (derivative < 0 || !Number.isInteger(derivative)) {
    throw new RangeError('Derivative should be a positive integer');
  }
  if (polynomial < 1 || !Number.isInteger(polynomial)) {
    throw new RangeError('Polynomial should be a positive integer');
  }
  if (polynomial >= 6) {
    // eslint-disable-next-line no-console
    console.warn(
      'You should not use polynomial grade higher than 5 if you are' +
        ' not sure that your data arises from such a model. Possible polynomial oscillation problems',
    );
  }

  const half = Math.floor(windowSize / 2);
  const np = ys.length;
  const ans = new Float64Array(np);
  const weights = cachedWeights(windowSize, polynomial, derivative);
  let hs = 0;
  let constantH = true;
  if (isAnyArray(xs)) {
    constantH = false;
  } else {
    hs = xs ** derivative;
  }

  //For the borders
  for (let i = 0; i < half; i++) {
    const wg1 = weights[half - i - 1];
    const wg2 = weights[half + i + 1];
    let d1 = 0;
    let d2 = 0;
    for (let l = 0; l < windowSize; l++) {
      d1 += wg1[l] * ys[l];
      d2 += wg2[l] * ys[np - windowSize + l];
    }
    if (constantH) {
      ans[half - i - 1] = d1 / hs;
      ans[np - half + i] = d2 / hs;
    } else {
      hs = getHs(xs as NumberArray, half - i - 1, half, derivative);
      ans[half - i - 1] = d1 / hs;
      hs = getHs(xs as NumberArray, np - half + i, half, derivative);
      ans[np - half + i] = d2 / hs;
    }
  }

  //For the internal points
  const wg = weights[half];
  for (let i = windowSize; i <= np; i++) {
    let d = 0;
    for (let l = 0; l < windowSize; l++) d += wg[l] * ys[l + i - windowSize];
    if (!constantH) {
      hs = getHs(xs as NumberArray, i - half - 1, half, derivative);
    }
    ans[i - half - 1] = d / hs;
  }
  return ans;
}

/**
 * The mean spacing of `h` over the window centred on `center`, raised to
 * `derivative`.
 *
 * The sum of consecutive differences telescopes, so only the two ends of the
 * window are read instead of every point.
 *
 * Orders 1 and 2 are spelled out because `x ** 1` is far slower than `x`.
 * @param h - The x values.
 * @param center - Index the window is centred on.
 * @param half - Half the window size.
 * @param derivative - The order the spacing is raised to.
 * @returns The mean spacing to that power.
 */
function getHs(
  h: NumberArray,
  center: number,
  half: number,
  derivative: number,
): number {
  const first = center - half;
  const lo = Math.max(first, 0);
  const last = h.length - 2;
  const end = center + half - 1;
  const hi = Math.min(end, last);
  const mean = (h[hi + 1] - h[lo]) / (hi - lo + 1);
  if (derivative === 1) return mean;
  if (derivative === 2) return mean * mean;
  return mean ** derivative;
}
