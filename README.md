# ml-savitzky-golay-generalized

General Least-Squares Smoothing and Differentiation by the Convolution (Savitzky-Golay) Method, after Peter A. Gorry.

Pretty much the same as the savitzky-golay method, but without border problems, and without inventing points.

## Installation

```console
npm i ml-savitzky-golay-generalized
```

This package is ESM-only. CommonJS consumers need Node.js >= 22.12 (or any 24.x
or later), where `require()` of a synchronous ES module works out of the box;
otherwise use `import`.

## Usage

```js
import { sgg } from 'ml-savitzky-golay-generalized';

const result = sgg(ys, deltaX, options);
```

`sgg` returns a `Float64Array` of the same length as `ys`.

When you need two derivative orders of the same data — peak picking wants the
first and the second — `sggPair` computes both in one pass:

```js
import { sggPair } from 'ml-savitzky-golay-generalized';

const [dY, ddY] = sggPair(ys, deltaX, options);
```

## Parameters

### ys

The data to be filtered.

### deltaX | xs

`deltaX` specifies the difference between 2 consecutive points of the independent variable: `deltaX = xs[i + 1] - xs[i]`. Specifying a `deltaX` supposes that all your points are equally spaced on the independent variable.

If your points are not equally spaced, you have to provide your `xs` values explicitly. The algorithm will use the average `deltaX` within each bin of `windowSize` points to approximate the derivatives. This fast approximation only works if the `xs` are almost locally equally spaced.

### options

#### windowSize

The odd number of points used to approximate the regression polynomial. Must be an odd integer of at least 5. Default `9`.

#### derivative

The order of the derivative. `0` (smoothing) by default.

#### polynomial

The order of the regression polynomial. Default `3`.

## sggPair

`sggPair(ys, deltaX | xs, options)` returns `[Float64Array, Float64Array]`, one
array per requested order.

It is measurably faster than calling `sgg` twice: each `ys` value is read once
and multiplied into both accumulators, and the window spacing is measured once
and raised twice. On 40 real mass spectra of 4436 points each, the pair of
derivatives `ml-gsd` asks for went from 33.3 to 17.4 ns per point.

The results are bit-identical to the two separate `sgg` calls they replace.

### options

Takes `windowSize` and `polynomial` exactly as `sgg` does, and `derivatives` in
place of `derivative`.

#### derivatives

The two orders, in the order they are returned. Default `[1, 2]`.

Two and not a list: an accumulator per order behind a loop costs more than
sharing the reads saves, so a general N-derivative version measured _slower_
than calling `sgg` repeatedly. For a third order, call `sgg` for it.

## Examples

### Smoothing

```js
import { sgg } from 'ml-savitzky-golay-generalized';

const noiseLevel = 0.1;
const data = new Array(200);
for (let i = 0; i < data.length; i++) {
  data[i] =
    Math.sin((i * Math.PI * 2) / data.length) +
    (Math.random() - 0.5) * noiseLevel;
}

const answer = sgg(data, (Math.PI * 2) / data.length, {
  windowSize: 15,
  derivative: 0,
  polynomial: 3,
});
console.log(answer); // Float64Array(200), the smoothed signal
```

### First derivative, equally spaced x

```js
import { sgg } from 'ml-savitzky-golay-generalized';

const noiseLevel = 0.1;
const data = new Array(200);
for (let i = 0; i < data.length; i++) {
  data[i] =
    Math.sin((i * Math.PI * 2) / data.length) +
    (Math.random() - 0.5) * noiseLevel;
}

const answer = sgg(data, (Math.PI * 2) / data.length, {
  windowSize: 45,
  derivative: 1,
  polynomial: 3,
});
console.log(answer); // Float64Array(200), starts near 1 (the cosine at 0)
```

### First derivative, x as a vector (it could be non-equally spaced)

```js
import { sgg } from 'ml-savitzky-golay-generalized';

const noiseLevel = 0.1;
const data = new Array(200);
const x = new Array(200);
for (let i = 0; i < data.length; i++) {
  data[i] =
    Math.sin((i * Math.PI * 2) / data.length) +
    (Math.random() - 0.5) * noiseLevel;
  x[i] = (i * Math.PI * 2) / data.length;
}

const options = { windowSize: 47, derivative: 1, polynomial: 3 };
const fromDeltaX = sgg(data, (Math.PI * 2) / data.length, options);
const fromX = sgg(data, x, options);
```

### First and second derivative in one pass

```js
import { sgg, sggPair } from 'ml-savitzky-golay-generalized';

const data = new Array(200);
const x = new Array(200);
for (let i = 0; i < data.length; i++) {
  data[i] = Math.sin((i * Math.PI * 2) / data.length);
  x[i] = (i * Math.PI * 2) / data.length;
}

const [dY, ddY] = sggPair(data, x, { windowSize: 45, polynomial: 3 });

// the same answer as, and faster than:
const options = { windowSize: 45, polynomial: 3 };
const alsoDY = sgg(data, x, { ...options, derivative: 1 });
const alsoDdY = sgg(data, x, { ...options, derivative: 2 });
```

## License

[MIT](./LICENSE)
