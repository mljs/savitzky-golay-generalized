/**
 * The Savitzky-Golay weight matrix, and a bounded cache of recent ones.
 *
 * The matrix depends only on the window size, the polynomial order and the
 * derivative, never on the data, so it is a constant across a run of spectra.
 * Building one costs thousands of recursive `gramPoly` calls.
 */

/**
 * How many weight matrices are kept.
 *
 * Two at least: a derivative pair asks for the same window twice, so one slot
 * would always be overwritten before it was read back.
 *
 * Bounds the cache at `KEPT_WEIGHTS * windowSize ** 2 * 8` bytes: 2.5 kB at
 * windowSize 9, 319 kB at windowSize 101.
 */
const KEPT_WEIGHTS = 4;

/** The shape each kept matrix was built for, three numbers per slot. */
const keptShapes = new Int32Array(KEPT_WEIGHTS * 3).fill(-1);

/** The matrices themselves, in the same slots. */
const keptWeights = new Array<Float64Array[] | undefined>(KEPT_WEIGHTS);

/** The slot the next matrix built will land in, oldest first. */
let nextSlot = 0;

/**
 * The weight matrix for a window, built once per shape rather than once per
 * call.
 *
 * Slots are compared on the three numbers, not on a key built from them, so
 * there is no string allocation per call. The caller must not mutate the
 * result.
 * @param windowSize - Number of points in the window.
 * @param polynomial - Polynomial grade.
 * @param derivative - Derivative order.
 * @returns The weight vectors, one per position in the window.
 */
export function cachedWeights(
  windowSize: number,
  polynomial: number,
  derivative: number,
): Float64Array[] {
  for (let slot = 0; slot < KEPT_WEIGHTS; slot++) {
    const at = slot * 3;
    if (
      keptShapes[at] === windowSize &&
      keptShapes[at + 1] === polynomial &&
      keptShapes[at + 2] === derivative
    ) {
      const known = keptWeights[slot];
      if (known !== undefined) return known;
    }
  }

  const built = fullWeights(windowSize, polynomial, derivative);
  const at = nextSlot * 3;
  keptShapes[at] = windowSize;
  keptShapes[at + 1] = polynomial;
  keptShapes[at + 2] = derivative;
  keptWeights[nextSlot] = built;
  nextSlot = (nextSlot + 1) % KEPT_WEIGHTS;
  return built;
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
 * Compute the full weights matrix for every position inside the window.
 * @param m - Number of points.
 * @param n - Polynomial grade.
 * @param s - Derivative.
 * @returns Array of Float64Array weight vectors, one per position in the window.
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
