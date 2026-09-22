// Run: node scripts/test-tesseract.cjs [--regression]
// Execute production TypeScript with a mocked engine; no downloads/API calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const regression = process.argv.includes('--regression');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/ocr/tesseract-client.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
}).outputText;
function result(text, confidence) {
  return { data: { text, confidence, words: [{ text, confidence, bbox: { x0: 1, y0: 2, x1: 30, y1: 20 } }] } };
}
function harness(responses) {
  let calls = 0, terminated = 0;
  const sources = [], modes = [];
  const recognize = async (src) => {
    sources.push(src);
    const response = responses[calls++];
    if (response instanceof Error) throw response;
    assert.ok(response, 'unexpected extra OCR pass');
    return response;
  };
  const engine = {
    PSM: { AUTO: '3', SINGLE_BLOCK: '6', SPARSE_TEXT: '11' },
    recognize,
    createWorker: async () => ({ recognize, setParameters: async (params) => modes.push(params.tessedit_pageseg_mode),
      terminate: async () => { terminated++; } })
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => {
    assert.equal(name, 'tesseract.js');
    return engine;
  }, Math, Number });
  return { provider: exports.createTesseractProvider(), sources, modes, calls: () => calls, terminated: () => terminated };
}
(async () => {
  const clean = harness([result('NORMAL PRODUCT LABEL', 95)]);
  const recognized = await clean.provider.recognize({ kind: 'url', url: 'test-image' });
  assert.equal(recognized.provider, 'tesseract.js');
  assert.equal(recognized.text, 'NORMAL PRODUCT LABEL');
  assert.equal(recognized.words[0].bbox.x0, 1);
  assert.equal(recognized.words[0].confidence, 95);
  assert.equal(recognized.lines.length, 0);
  assert.equal(clean.calls(), 1);
  const base64 = harness([result('NORMAL PRODUCT LABEL', 95)]);
  await base64.provider.recognize({ kind: 'base64', data: 'YQ==', mimeType: 'image/png' });
  assert.equal(base64.sources[0], 'data:image/png;base64,YQ==');
  const failed = harness([new Error('engine failed')]);
  await assert.rejects(failed.provider.recognize({ kind: 'url', url: 'test' }), /engine failed/);
  if (regression) {
    assert.equal(clean.terminated(), 1);
    assert.equal(failed.terminated(), 1);
    const retry = harness([result('bad', 20), result('CLEAR PRODUCT LABEL', 92), result('noise', 10)]);
    const better = await retry.provider.recognize({ kind: 'url', url: 'test' });
    assert.equal(better.text, 'CLEAR PRODUCT LABEL');
    assert.equal(retry.calls(), 3);
    assert.deepEqual(retry.modes, ['11', '3']);
    assert.equal(retry.terminated(), 1);
    const fallback = harness([result('original label', 50), new Error('retry failed'), new Error('retry failed')]);
    const original = await fallback.provider.recognize({ kind: 'url', url: 'test' });
    assert.equal(original.text, 'original label');
    assert.equal(fallback.terminated(), 1);
    const worse = harness([result('original label', 60), result('xxx', 5), result('yyy', 4)]);
    assert.equal((await worse.provider.recognize({ kind: 'url', url: 'test' })).text, 'original label');
    const empty = harness([{ data: { text: '', words: [], confidence: 0 } }, result('READABLE LABEL', 90), result('??', 0)]);
    assert.equal((await empty.provider.recognize({ kind: 'url', url: 'test' })).text, 'READABLE LABEL');
    // More low-confidence characters must not beat a credible result.
    const noise = harness([result('original label', 60), result('x'.repeat(1000), 5), result('???', 0)]);
    assert.equal((await noise.provider.recognize({ kind: 'url', url: 'test' })).text, 'original label');
  }
  console.log('Production Tesseract checks passed' + (regression ? ' (including regressions).' : '.'));
})().catch((error) => { console.error(error); process.exitCode = 1; });
