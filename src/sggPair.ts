/**
 * Two derivatives of one spectrum, in a single pass.
 */

import type { NumberArray } from 'cheminfo-types';
import { isAnyArray } from 'is-any-array';

import { meanGap, raise } from './spacing.ts';
import { checkArguments } from './validate.ts';
import { cachedWeights } from './weights.ts';

export interface SGGPairOptions {
  /**
   * @default 9
   */
  windowSize?: number;
  /**
   * The two derivative orders, in the order they are returned.
   * @default [1, 2]
   */
  derivatives?: [number, number];
  /**
   * @default 3
   */
  polynomial?: number;
}

/**
 * Apply the Savitzky Golay algorithm for two derivative orders at once.
 *
 * Each y value is read once and multiplied into both accumulators, and the
 * window spacing is measured once and raised twice, where calling `sgg` twice
 * repeats both. Peak picking wants the first and second derivative of the same
 * trace, which is what the default asks for.
 *
 * Two and not a list: an accumulator per order behind a loop costs more than
 * sharing the reads saves, so a general version measured slower than calling
 * `sgg` repeatedly. Ask for more than two by calling this and `sgg`.
 * @param ys - Array of y values.
 * @param xs - Array of X or deltaX.
 * @param options - Options controlling window size, derivatives and polynomial order.
 * @returns The two derivative arrays, in the order requested.
 */
export function sggPair(
  ys: NumberArray,
  xs: NumberArray | number,
  options: SGGPairOptions = {},
): [Float64Array, Float64Array] {
  const { windowSize = 9, derivatives = [1, 2], polynomial = 3 } = options;
  const [firstOrder, secondOrder] = derivatives;
  checkArguments(ys, xs, windowSize, polynomial, derivatives);

  const half = Math.floor(windowSize / 2);
  const np = ys.length;
  const first = new Float64Array(np);
  const second = new Float64Array(np);
  const firstWeights = cachedWeights(windowSize, polynomial, firstOrder);
  const secondWeights = cachedWeights(windowSize, polynomial, secondOrder);

  const constantH = !isAnyArray(xs);
  const firstConstant = constantH ? raise(xs, firstOrder) : 0;
  const secondConstant = constantH ? raise(xs, secondOrder) : 0;

  for (let i = 0; i < half; i++) {
    const low = half - i - 1;
    const high = np - half + i;
    const lowFirst = firstWeights[low];
    const lowSecond = secondWeights[low];
    const highFirst = firstWeights[half + i + 1];
    const highSecond = secondWeights[half + i + 1];
    let lowFirstSum = 0;
    let lowSecondSum = 0;
    let highFirstSum = 0;
    let highSecondSum = 0;
    for (let l = 0; l < windowSize; l++) {
      const atLow = ys[l];
      const atHigh = ys[np - windowSize + l];
      lowFirstSum += lowFirst[l] * atLow;
      lowSecondSum += lowSecond[l] * atLow;
      highFirstSum += highFirst[l] * atHigh;
      highSecondSum += highSecond[l] * atHigh;
    }
    const lowGap = constantH ? 0 : meanGap(xs, low, half);
    const highGap = constantH ? 0 : meanGap(xs, high, half);
    first[low] =
      lowFirstSum / (constantH ? firstConstant : raise(lowGap, firstOrder));
    second[low] =
      lowSecondSum / (constantH ? secondConstant : raise(lowGap, secondOrder));
    first[high] =
      highFirstSum / (constantH ? firstConstant : raise(highGap, firstOrder));
    second[high] =
      highSecondSum /
      (constantH ? secondConstant : raise(highGap, secondOrder));
  }

  // The loop this exists for: one load of each sample feeds both sums, and one
  // spacing measurement feeds both divisors. The constant-spacing case is a
  // second loop rather than a test inside this one, and the orders are raised
  // inline rather than through a call, because both cost more per point than
  // the sharing saves.
  const firstCentre = firstWeights[half];
  const secondCentre = secondWeights[half];
  if (constantH) {
    for (let i = windowSize; i <= np; i++) {
      const from = i - windowSize;
      let firstSum = 0;
      let secondSum = 0;
      for (let l = 0; l < windowSize; l++) {
        const value = ys[from + l];
        firstSum += firstCentre[l] * value;
        secondSum += secondCentre[l] * value;
      }
      const into = i - half - 1;
      first[into] = firstSum / firstConstant;
      second[into] = secondSum / secondConstant;
    }
  } else {
    const firstIsOne = firstOrder === 1;
    const firstIsTwo = firstOrder === 2;
    const secondIsOne = secondOrder === 1;
    const secondIsTwo = secondOrder === 2;
    for (let i = windowSize; i <= np; i++) {
      const from = i - windowSize;
      let firstSum = 0;
      let secondSum = 0;
      for (let l = 0; l < windowSize; l++) {
        const value = ys[from + l];
        firstSum += firstCentre[l] * value;
        secondSum += secondCentre[l] * value;
      }
      const into = i - half - 1;
      const gap = meanGap(xs, into, half);
      first[into] =
        firstSum /
        (firstIsOne ? gap : firstIsTwo ? gap * gap : gap ** firstOrder);
      second[into] =
        secondSum /
        (secondIsOne ? gap : secondIsTwo ? gap * gap : gap ** secondOrder);
    }
  }
  return [first, second];
}
