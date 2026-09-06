import { analyzeFontSize, type WordBox } from "../src/lib/fontSize";

const words: WordBox[] = [
  { text: "MRP", bbox: { x0: 10, y0: 100, x1: 50, y1: 130 }, confidence: 90 },
  { text: "Rs.", bbox: { x0: 60, y0: 102, x1: 90, y1: 128 }, confidence: 90 },
  { text: "120", bbox: { x0: 100, y0: 100, x1: 150, y1: 130 }, confidence: 90 },
  { text: "Net", bbox: { x0: 10, y0: 200, x1: 40, y1: 208 }, confidence: 90 },
  { text: "Wt.", bbox: { x0: 45, y0: 200, x1: 70, y1: 208 }, confidence: 90 },
  { text: "200g", bbox: { x0: 75, y0: 200, x1: 120, y1: 208 }, confidence: 90 },
];

const small = words.map((w) => ({ ...w, bbox: { ...w.bbox, y0: w.bbox.y0, y1: w.bbox.y0 + 4 } }));
console.log("Image height: 1000");
console.log("Large font findings:", analyzeFontSize(words, 1000, []).map(f => `${f.field}: ${f.rating} (${f.heightPctOfImage}%)`));
console.log("Small font findings:", analyzeFontSize(small, 1000, []).map(f => `${f.field}: ${f.rating} (${f.heightPctOfImage}%)`));
