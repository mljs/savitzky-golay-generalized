import { NumberArray } from 'cheminfo-types';
import { isAnyArray } from 'is-any-array';

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
 * Apply Savitzky Golay algorithm
 * @param [ys] Array of y values
 * @param [xs] Array of X or deltaX
 * @return  Array containing the new ys (same length)
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
  if (typeof xs === 'undefined') {
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
  const weights = fullWeights(windowSize, polynomial, derivative);
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

function getHs(
  h: NumberArray,
  center: number,
  half: number,
  derivative: number,
): number {
  let hs = 0;
  let count = 0;
  for (let i = center - half; i < center + half; i++) {
    if (i >= 0 && i < h.length - 1) {
      hs += h[i + 1] - h[i];
      count++;
    }
  }
  return (hs / count) ** derivative;
}

function gramPoly(i: number, m: number, k: number, s: number): number {
  let Grampoly = 0;
  if (k > 0) {
    Grampoly =
      ((4 * k - 2) / (k * (2 * m - k + 1))) *
        (i * gramPoly(i, m, k - 1, s) + s * gramPoly(i, m, k - 1, s - 1)) -
      (((k - 1) * (2 * m + k)) / (k * (2 * m - k + 1))) *
        gramPoly(i, m, k - 2, s);
  } else if (k === 0 && s === 0) {
    Grampoly = 1;
  } else {
    Grampoly = 0;
  }
  return Grampoly;
}

function genFact(a: number, b: number): number {
  let gf = 1;
  if (a >= b) {
    for (let j = a - b + 1; j <= a; j++) {
      gf *= j;
    }
  }
  return gf;
}

function weight(i: number, t: number, m: number, n: number, s: number): number {
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    sum +=
      (2 * k + 1) *
      (genFact(2 * m, k) / genFact(2 * m + k + 1, k + 1)) *
      gramPoly(i, m, k, 0) *
      gramPoly(t, m, k, s);
  }
  return sum;
}

/**
 * @private
 * @param m  Number of points
 * @param n  Polynomial grade
 * @param s  Derivative
 */
function fullWeights(m: number, n: number, s: number): Float64Array[] {
  const weights = new Array(m);
  const np = Math.floor(m / 2);
  for (let t = -np; t <= np; t++) {
    weights[t + np] = new Float64Array(m);
    for (let j = -np; j <= np; j++) {
      weights[t + np][j + np] = weight(j, t, np, n, s);
    }
  }
  return weights;
}
