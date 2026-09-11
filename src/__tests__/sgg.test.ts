import { expect, test } from 'vitest';

import { sgg } from '../sgg.ts';

test('simple triangle, check symmetry with x array', () => {
  const xs = new Array(101).fill(0).map((a, index) => index);
  const ys: number[] = [];
  for (let i = 0; i <= 50; i++) {
    ys.push(i);
  }
  for (let i = 51; i <= 100; i++) {
    ys.push(100 - i);
  }
  const result = sgg(ys, xs, {
    windowSize: 9,
    derivative: 0,
  });
  for (let i = 0; i < 50; i++) {
    expect(result[i]).toBeCloseTo(result[100 - i]);
  }
});

test('simple triangle, check symmetry with x constant', () => {
  const ys: number[] = [];
  for (let i = 0; i <= 50; i++) {
    ys.push(i);
  }
  for (let i = 51; i <= 100; i++) {
    ys.push(100 - i);
  }
  const result = sgg(ys, 1, {
    windowSize: 9,
    derivative: 0,
  });
  for (let i = 0; i < 50; i++) {
    expect(result[i]).toBeCloseTo(result[100 - i]);
  }
});

test('Smoothing test', () => {
  const options = {
    windowSize: 15,
    derivative: 0,
    polynomial: 3,
  };

  const noiseLevel = 0.01;
  const data = new Array(200);
  for (let i = 0; i < data.length; i++) {
    data[i] =
      Math.sin((i * Math.PI * 2) / data.length) +
      (Math.random() - 0.5) * noiseLevel;
  }
  const ans = sgg(data, (Math.PI * 2) / data.length, options);
  for (
    let j = Math.round(options.windowSize / 2);
    j < ans.length - Math.round(options.windowSize / 2);
    j++
  ) {
    expect(ans[j]).toBeCloseTo(data[j], -Math.log10(noiseLevel) - 1);
  }
});

test('First derivative test', () => {
  const options = {
    windowSize: 47,
    derivative: 1,
    polynomial: 3,
  };

  const noiseLevel = 0.1;
  const data = new Array(200);
  for (let i = 0; i < data.length; i++) {
    data[i] =
      Math.sin((i * Math.PI * 2) / data.length) +
      (Math.random() - 0.5) * noiseLevel;
  }
  const ans = sgg(data, (Math.PI * 2) / data.length, options);

  for (
    let j = Math.round(options.windowSize / 2);
    j < data.length - Math.round(options.windowSize / 2);
    j++
  ) {
    expect(ans[j]).toBeCloseTo(
      Math.cos((j * Math.PI * 2) / data.length),
      -Math.log10(noiseLevel) - 1,
    );
  }
});

test('First derivative test x as vector', () => {
  const options = {
    windowSize: 47,
    derivative: 1,
    polynomial: 3,
  };

  const noiseLevel = 0.1;
  const data = new Array(200);
  const x = new Array(200);
  for (let i = 0; i < data.length; i++) {
    data[i] =
      Math.sin((i * Math.PI * 2) / data.length) +
      (Math.random() - 0.5) * noiseLevel;
    x[i] = (i * Math.PI * 2) / data.length;
  }

  const ans = sgg(data, (Math.PI * 2) / data.length, options);
  const ans2 = sgg(data, x, options);

  for (
    let j = Math.round(options.windowSize / 2);
    j < data.length - Math.round(options.windowSize / 2);
    j++
  ) {
    expect(ans[j]).toBeCloseTo(ans2[j], 10);
  }
});

test('Border test', () => {
  const options = {
    windowSize: 9,
    derivative: 1,
    polynomial: 3,
  };

  const data = new Array(20);
  for (let i = 0; i < data.length; i++) {
    data[i] = i ** 3 - 4 * i ** 2 + 5 * i;
  }
  const ans = sgg(data, 1, options);
  for (let j = 0; j < data.length; j++) {
    expect(ans[j]).toBeCloseTo(3 * j ** 2 - 8 * j + 5, 6);
  }
});

test('an irregular x axis divides by the window mean spacing, at every order', () => {
  // The spacing triples across the axis, so a window's mean spacing is not the
  // axis's and the shortcut that reads only the window's two ends has to agree
  // with summing across it.
  const xs = new Array(40)
    .fill(0)
    .map((_, index) => index + (index * index) / 400);
  const ys = new Array(40)
    .fill(0)
    .map((_, index) => Math.exp(-((index - 20) ** 2) / 18));

  for (const derivative of [0, 1, 2, 3]) {
    const result = sgg(ys, xs, { windowSize: 9, polynomial: 3, derivative });

    expect(result).toHaveLength(40);

    for (const value of result) expect(Number.isFinite(value)).toBe(true);
  }

  // A Gaussian's first derivative crosses zero at its apex and its second is
  // most negative there, whatever the axis is spaced like.
  const first = sgg(ys, xs, { windowSize: 9, polynomial: 3, derivative: 1 });
  const second = sgg(ys, xs, { windowSize: 9, polynomial: 3, derivative: 2 });

  expect(first[20]).toBeCloseTo(0, 2);
  expect(second[20]).toBeLessThan(0);
  expect(Math.min(...second)).toBe(second[20]);
});

test('the weight matrix is reused without being shared between shapes', () => {
  const ys = new Array(40)
    .fill(0)
    .map((_, index) => Math.exp(-((index - 20) ** 2) / 18));
  const first = sgg(ys, 1, { windowSize: 9, polynomial: 3, derivative: 1 });
  const other = sgg(ys, 1, { windowSize: 9, polynomial: 3, derivative: 2 });
  const again = sgg(ys, 1, { windowSize: 9, polynomial: 3, derivative: 1 });

  expect(Array.from(again)).toStrictEqual(Array.from(first));
  expect(Array.from(other)).not.toStrictEqual(Array.from(first));
});

test('more window shapes than are kept still answer correctly', () => {
  const ys = new Array(60)
    .fill(0)
    .map((_, index) => Math.exp(-((index - 30) ** 2) / 18));

  // One more shape than the cache holds, asked for twice round, so every slot
  // is evicted and rebuilt at least once.
  const shapes = [
    { windowSize: 5, polynomial: 2, derivative: 0 },
    { windowSize: 7, polynomial: 3, derivative: 1 },
    { windowSize: 9, polynomial: 3, derivative: 1 },
    { windowSize: 9, polynomial: 3, derivative: 2 },
    { windowSize: 11, polynomial: 4, derivative: 2 },
    { windowSize: 13, polynomial: 5, derivative: 3 },
  ];
  const first = shapes.map((shape) => Array.from(sgg(ys, 1, shape)));

  for (let round = 0; round < 3; round++) {
    for (let shape = 0; shape < shapes.length; shape++) {
      expect(Array.from(sgg(ys, 1, shapes[shape]))).toStrictEqual(first[shape]);
    }
  }
});
