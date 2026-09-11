/**
 * The argument checks `sgg` and `sggDerivatives` share.
 */

import type { NumberArray } from 'cheminfo-types';
import { isAnyArray } from 'is-any-array';

/**
 * Throw unless the arguments describe a filter that can be applied.
 * @param ys - Array of y values.
 * @param xs - Array of x values, or a constant spacing.
 * @param windowSize - Number of points in the window.
 * @param polynomial - Polynomial grade.
 * @param derivatives - Every derivative order asked for.
 */
export function checkArguments(
  ys: NumberArray,
  xs: NumberArray | number,
  windowSize: number,
  polynomial: number,
  derivatives: number[],
): void {
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
  for (const derivative of derivatives) {
    if (derivative < 0 || !Number.isInteger(derivative)) {
      throw new RangeError('Derivative should be a positive integer');
    }
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
}
