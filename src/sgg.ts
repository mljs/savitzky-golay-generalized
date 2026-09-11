/**
 * The Savitzky-Golay filter, for one derivative order.
 */

import type { NumberArray } from 'cheminfo-types';
import { isAnyArray } from 'is-any-array';

import { meanGap, raise } from './spacing.ts';
import { checkArguments } from './validate.ts';
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

  checkArguments(ys, xs, windowSize, polynomial, [derivative]);

  const half = Math.floor(windowSize / 2);
  const np = ys.length;
  const ans = new Float64Array(np);
  const weights = cachedWeights(windowSize, polynomial, derivative);
  let hs = 0;
  let constantH = true;
  if (isAnyArray(xs)) {
    constantH = false;
  } else {
    hs = raise(xs, derivative);
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
      hs = raise(meanGap(xs as NumberArray, half - i - 1, half), derivative);
      ans[half - i - 1] = d1 / hs;
      hs = raise(meanGap(xs as NumberArray, np - half + i, half), derivative);
      ans[np - half + i] = d2 / hs;
    }
  }

  //For the internal points
  const wg = weights[half];
  for (let i = windowSize; i <= np; i++) {
    let d = 0;
    for (let l = 0; l < windowSize; l++) d += wg[l] * ys[l + i - windowSize];
    if (!constantH) {
      hs = raise(meanGap(xs as NumberArray, i - half - 1, half), derivative);
    }
    ans[i - half - 1] = d / hs;
  }
  return ans;
}
