import SG from '..';

describe('Savitzky–Golay', () => {
  it('Smoothing test', () => {
    let options = {
      windowSize: 15,
      derivative: 0,
      polynomial: 3,
    };

    let noiseLevel = 0.01;
    let data = new Array(200);
    for (let i = 0; i < data.length; i++) {
      data[i] =
        Math.sin((i * Math.PI * 2) / data.length) +
        (Math.random() - 0.5) * noiseLevel;
    }
    let ans = SG(data, (Math.PI * 2) / data.length, options);
    for (
      let j = Math.round(options.windowSize / 2);
      j < ans.length - Math.round(options.windowSize / 2);
      j++
    ) {
      expect(ans[j]).toBeCloseTo(data[j], -Math.log10(noiseLevel) - 1);
    }
  });

  it('First derivative test', () => {
    let options = {
      windowSize: 47,
      derivative: 1,
      polynomial: 3,
    };

    let noiseLevel = 0.1;
    let data = new Array(200);
    for (let i = 0; i < data.length; i++) {
      data[i] =
        Math.sin((i * Math.PI * 2) / data.length) +
        (Math.random() - 0.5) * noiseLevel;
    }
    let ans = SG(data, (Math.PI * 2) / data.length, options);

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
    let options = {
      windowSize: 47,
      derivative: 1,
      polynomial: 3,
    };

    let noiseLevel = 0.1;
    let data = new Array(200);
    let x = new Array(200);
    for (let i = 0; i < data.length; i++) {
      data[i] =
        Math.sin((i * Math.PI * 2) / data.length) +
        (Math.random() - 0.5) * noiseLevel;
      x[i] = (i * Math.PI * 2) / data.length;
    }

    let ans = SG(data, (Math.PI * 2) / data.length, options);
    let ans2 = SG(data, x, options);

    for (
      let j = Math.round(options.windowSize / 2);
      j < data.length - Math.round(options.windowSize / 2);
      j++
    ) {
      expect(ans[j]).toBeCloseTo(ans2[j], 10);
    }
  });

  it('Border test', () => {
    let options = {
      windowSize: 9,
      derivative: 1,
      polynomial: 3,
    };

    let data = new Array(20);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.pow(i, 3) - 4 * Math.pow(i, 2) + 5 * i;
    }
    let ans = SG(data, 1, options);
    for (let j = 0; j < data.length; j++) {
      expect(ans[j]).toBeCloseTo(3 * Math.pow(j, 2) - 8 * j + 5, 6);
    }
  });
});
