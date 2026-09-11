import { expect, test } from 'vitest';

import { sgg } from '../sgg.ts';
import { sggPair } from '../sggPair.ts';

/**
 * A Gaussian sampled on an axis whose spacing triples from end to end, so the
 * window mean gap is never the axis's own.
 * @param points - How many samples.
 * @returns The axis and the trace.
 */
function irregularGaussian(points: number) {
  const xs = new Array(points)
    .fill(0)
    .map((_, index) => index + (index * index) / (points * 4));
  const ys = new Array(points)
    .fill(0)
    .map((_, index) => Math.exp(-((index - points / 2) ** 2) / 18));
  return { xs, ys };
}

test('the pair is what two sgg calls return, to the bit, on an irregular axis', () => {
  const { xs, ys } = irregularGaussian(120);
  const [first, second] = sggPair(ys, xs, { windowSize: 9, polynomial: 3 });

  expect(Array.from(first)).toStrictEqual(
    Array.from(sgg(ys, xs, { windowSize: 9, polynomial: 3, derivative: 1 })),
  );
  expect(Array.from(second)).toStrictEqual(
    Array.from(sgg(ys, xs, { windowSize: 9, polynomial: 3, derivative: 2 })),
  );
});

test('the pair is what two sgg calls return on a constant spacing', () => {
  const { ys } = irregularGaussian(120);
  const [first, second] = sggPair(ys, 0.25, { windowSize: 11, polynomial: 4 });

  expect(Array.from(first)).toStrictEqual(
    Array.from(sgg(ys, 0.25, { windowSize: 11, polynomial: 4, derivative: 1 })),
  );
  expect(Array.from(second)).toStrictEqual(
    Array.from(sgg(ys, 0.25, { windowSize: 11, polynomial: 4, derivative: 2 })),
  );
});

test('orders other than one and two, in the order asked for', () => {
  const { xs, ys } = irregularGaussian(80);
  const [smoothed, third] = sggPair(ys, xs, {
    windowSize: 9,
    polynomial: 5,
    derivatives: [0, 3],
  });

  expect(Array.from(smoothed)).toStrictEqual(
    Array.from(sgg(ys, xs, { windowSize: 9, polynomial: 5, derivative: 0 })),
  );
  expect(Array.from(third)).toStrictEqual(
    Array.from(sgg(ys, xs, { windowSize: 9, polynomial: 5, derivative: 3 })),
  );
});

test('the same order twice gives the same array twice', () => {
  const { xs, ys } = irregularGaussian(60);
  const [first, second] = sggPair(ys, xs, { derivatives: [2, 2] });

  expect(Array.from(first)).toStrictEqual(Array.from(second));
  expect(first).not.toBe(second);
});

test('a Gaussian apex is where the first derivative crosses and the second bottoms', () => {
  const { xs, ys } = irregularGaussian(120);
  const [first, second] = sggPair(ys, xs);

  expect(first).toHaveLength(120);
  expect(second).toHaveLength(120);
  expect(first[60]).toBeCloseTo(0, 2);
  expect(Math.min(...second)).toBe(second[60]);
});

test('it refuses the same arguments sgg refuses', () => {
  const { xs, ys } = irregularGaussian(40);

  expect(() => sggPair(ys, xs, { windowSize: 8 })).toThrow(
    'Invalid window size (should be odd and at least 5 integer number)',
  );
  expect(() => sggPair(ys, xs, { windowSize: 3 })).toThrow(
    'Invalid window size (should be odd and at least 5 integer number)',
  );
  expect(() => sggPair(ys.slice(0, 7), xs.slice(0, 7))).toThrow(
    'Window size is higher than the data length 9>7',
  );
  expect(() => sggPair(ys, xs, { derivatives: [1, -1] })).toThrow(
    'Derivative should be a positive integer',
  );
  expect(() => sggPair(ys, xs, { polynomial: 0 })).toThrow(
    'Polynomial should be a positive integer',
  );
});

test('a trace exactly as long as the window', () => {
  const ys = [0, 0, 1, 4, 9, 4, 1, 0, 0];
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [first, second] = sggPair(ys, xs, { windowSize: 9, polynomial: 3 });

  expect(Array.from(first)).toStrictEqual(
    Array.from(sgg(ys, xs, { windowSize: 9, polynomial: 3, derivative: 1 })),
  );
  expect(Array.from(second)).toStrictEqual(
    Array.from(sgg(ys, xs, { windowSize: 9, polynomial: 3, derivative: 2 })),
  );
});

test('a flat trace has no slope and no curvature', () => {
  const flat = new Array(40).fill(7);
  const [first, second] = sggPair(flat, 1);

  for (const value of first) expect(value).toBeCloseTo(0, 10);
  for (const value of second) expect(value).toBeCloseTo(0, 10);
});
