import { sgg } from '..';

describe('Savitzky Golay Generalized–', () => {
  it('simple triangle, check symmetry with x array', () => {
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

  it('simple triangle, check symmetry with x constant', () => {
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

  it('Smoothing test', () => {
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

  it('First derivative test', () => {
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

  it('First derivative test x as vector', () => {
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

  it('Border test', () => {
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
});
