// Verifies the preprocessImageForOcr behavior with a synthetic image.
const { Jimp } = require("jimp");

const MAX_SIDE = 1600;
const JPEG_QUALITY = 88;

async function preprocessImageForOcr(input) {
  let jimp;
  if (typeof input === "string" && input.startsWith("data:")) {
    const base64 = input.replace(/^data:[^;]+;base64,/, "");
    jimp = await Jimp.read(Buffer.from(base64, "base64"));
  } else {
    jimp = await Jimp.read(input);
  }
  const origW = jimp.width, origH = jimp.height;
  let didPreprocess = false;
  if (Math.max(origW, origH) > MAX_SIDE) {
    if (origW >= origH) jimp.resize({ w: MAX_SIDE });
    else jimp.resize({ h: MAX_SIDE });
    didPreprocess = true;
  }
  jimp.greyscale();
  didPreprocess = true;
  jimp.normalize();
  try { jimp.convolute([[0,-1,0],[-1,5,-1],[0,-1,0]]); } catch {}
  const out = await jimp.getBuffer("image/jpeg", { quality: JPEG_QUALITY });
  return { base64: Buffer.from(out).toString("base64"), newSize: { w: jimp.width, h: jimp.height }, originalSize: { w: origW, h: origH }, preprocessed: didPreprocess };
}

(async () => {
  // 1. Large image (3000x2000) — should resize.
  let j = new Jimp({ width: 3000, height: 2000, color: 0xffffffff });
  let dataUrl = "data:image/png;base64," + (await j.getBuffer("image/png")).toString("base64");
  let r = await preprocessImageForOcr(dataUrl);
  console.log("Large:", r.originalSize, "->", r.newSize, "preprocessed:", r.preprocessed);
  if (r.newSize.w !== 1600 || r.newSize.h !== Math.round(2000 * 1600 / 3000)) throw new Error("Large resize failed");

  // 2. Small image (500x400) — should NOT resize.
  j = new Jimp({ width: 500, height: 400, color: 0xffffffff });
  dataUrl = "data:image/png;base64," + (await j.getBuffer("image/png")).toString("base64");
  r = await preprocessImageForOcr(dataUrl);
  console.log("Small:", r.originalSize, "->", r.newSize, "preprocessed:", r.preprocessed);
  if (r.newSize.w !== 500 || r.newSize.h !== 400) throw new Error("Small should not resize");

  // 3. Tall image (2000x3000) — should resize by height.
  j = new Jimp({ width: 2000, height: 3000, color: 0xffffffff });
  dataUrl = "data:image/png;base64," + (await j.getBuffer("image/png")).toString("base64");
  r = await preprocessImageForOcr(dataUrl);
  console.log("Tall:", r.originalSize, "->", r.newSize);
  if (r.newSize.h !== 1600) throw new Error("Tall resize failed");

  // 4. Output is a valid JPEG (starts with FF D8 FF).
  if (Buffer.from(r.base64, "base64").slice(0, 3).toString("hex") !== "ffd8ff") throw new Error("Output not a JPEG");
  console.log("All checks passed.");
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
