// Run: node scripts/test-preprocess.cjs [--regression]
// Loads the production TypeScript. Canvas is a deterministic test double;
// actual browser decoding/encoding and OCR accuracy still need image fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const regression = process.argv.includes('--regression');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/image/preprocess.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function harness(width, height, pixel = () => [120, 80, 40, 255], fail = false) {
  let pixels, canvas;
  const revoked = [];
  class ImageMock {
    naturalWidth = width;
    naturalHeight = height;
    set src(value) { queueMicrotask(() => fail ? this.onerror(new Error('decode')) : this.onload()); }
  }
  const context = {
    fillStyle: '',
    fillRect() {},
    drawImage() {
      pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) pixels.set(pixel(x, y), (y * canvas.width + x) * 4);
      }
    },
    getImageData() { return { data: new Uint8ClampedArray(pixels) }; },
    putImageData(image) { pixels = new Uint8ClampedArray(image.data); }
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, Image: ImageMock, Uint8Array, Uint8ClampedArray, Float64Array, Math, Promise,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: (url) => revoked.push(url) },
    document: { createElement: () => {
      canvas = { width: 0, height: 0, getContext: () => context,
        toDataURL: (mime, quality) => {
          assert.equal(mime, 'image/jpeg');
          assert.ok(quality > 0 && quality <= 1);
          return 'data:image/jpeg;base64,dGVzdA==';
        } };
      return canvas;
    } },
    queueMicrotask
  });
  return { api: exports, revoked, pixels: () => pixels };
}

(async () => {
  for (const [w, h, ew, eh] of [[3000, 2000, 1600, 1067], [2000, 3000, 1067, 1600], [50, 40, 50, 40]]) {
    const harn = harness(w, h);
    const result = await harn.api.preprocessImageForOcr('data:image/png;base64,test');
    assert.equal(result.newSize.w, ew);
    assert.equal(result.newSize.h, eh);
    assert.equal(result.originalSize.w, w);
    assert.equal(result.originalSize.h, h);
    assert.equal(result.mimeType, 'image/jpeg');
    assert.equal(result.preprocessed, true);
    assert.equal(result.base64, 'dGVzdA==');
    assert.equal(harn.revoked.length, 0);
    const pixels = harn.pixels();
    for (let i = 0; i < pixels.length; i += 4) {
      assert.equal(pixels[i], pixels[i + 1]);
      assert.equal(pixels[i], pixels[i + 2]);
    }
  }
  const blob = harness(4, 4);
  await blob.api.preprocessImageForOcr({});
  assert.deepEqual(blob.revoked, ['blob:test']);
  const failed = harness(4, 4, undefined, true);
  await assert.rejects(failed.api.preprocessImageForOcr({}), /Failed to load image/);
  assert.deepEqual(failed.revoked, ['blob:test']);
  assert.equal(blob.api.dataUrlToBase64('data:image/png;base64,YQ=='), 'YQ==');

  if (regression) {
    // A constant image must not turn black due to a zero contrast range.
    const white = harness(16, 16, () => [255, 255, 255, 255]);
    await white.api.preprocessImageForOcr('test');
    assert.equal(white.pixels()[0], 255);
    const thin = harness(100000, 1);
    const result = await thin.api.preprocessImageForOcr('test');
    assert.equal(result.newSize.h, 1);
    const empty = harness(0, 0);
    await assert.rejects(empty.api.preprocessImageForOcr('test'), /dimensions/i);
    // Strong varying illumination with thin, darker vertical text-like strokes.
    const gradient = harness(128, 64, (x) => {
      const value = 60 + Math.round(180 * x / 127) - (x % 16 === 8 ? 35 : 0);
      return [value, value, value, 255];
    });
    await gradient.api.preprocessImageForOcr('test');
    const p = gradient.pixels();
    const at = (x) => p[(32 * 128 + x) * 4];
    assert.ok(at(12) > 100, 'lift shadow background');
    assert.ok(at(8) < at(12), 'retain dark strokes');
    assert.ok(at(120) < at(124), 'retain bright-region strokes');
    // A normal black-on-white image keeps text dark and background bright.
    const clean = harness(64, 32, (x) => x === 20 ? [0, 0, 0, 255] : [255, 255, 255, 255]);
    await clean.api.preprocessImageForOcr('test');
    assert.equal(clean.pixels()[(16 * 64 + 20) * 4], 0);
    assert.equal(clean.pixels()[(16 * 64 + 30) * 4], 255);
  }
  console.log('Production preprocessing checks passed' + (regression ? ' (including regressions).' : '.'));
})().catch((error) => { console.error(error); process.exitCode = 1; });
