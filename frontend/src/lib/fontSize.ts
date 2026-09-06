export interface WordBox {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

export interface FontSizeFinding {
  ruleId: string;
  field: string;
  matchedText: string;
  heightPx: number;
  heightPctOfImage: number;
  rating: "ok" | "warn" | "fail";
  message: string;
}

const MIN_HEIGHT_PCT = 1.6;

export function analyzeFontSize(
  words: WordBox[],
  imageHeight: number,
  ruleHits: { ruleId: string; ruleName: string; matchedValue?: string }[]
): FontSizeFinding[] {
  const findings: FontSizeFinding[] = [];

  const KEY_FIELDS: { ruleId: string; label: string; matchers: RegExp[] }[] = [
    { ruleId: "mrp", label: "MRP", matchers: [/\b(?:mrp|maximum\s*retail\s*price)\b/i, /₹\s*[0-9]/] },
    { ruleId: "net_quantity", label: "Net Quantity", matchers: [/\b(net\s*wt\.?|net\s*weight|net\s*qty|quantity)\b/i] },
    { ruleId: "mfg_date", label: "Manufacturing Date", matchers: [/\b(?:mfg\.?|mfd\.?|best\s*before|expiry|exp\.?)\b/i] },
    { ruleId: "manufacturer_address", label: "Manufacturer / Address", matchers: [/\b(?:mfd\.?\s*by|mfg\.?\s*by|manufactured\s*by|packed\s*by|imported\s*by)\b/i] },
    { ruleId: "consumer_care", label: "Consumer Care", matchers: [/\b(customer\s*care|consumer\s*care|for\s*complaints)\b/i] },
  ];

  for (const field of KEY_FIELDS) {
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!field.matchers.some((m) => m.test(w.text))) continue;

      const start = Math.max(0, i);
      const end = Math.min(words.length, i + 12);
      let label = "";
      for (let j = start; j < end; j++) {
        const word = words[j];
        if (/[A-Za-z0-9]/.test(word.text)) {
          label = j === start ? word.text : label + " " + word.text;
          if (label.length > 60) break;
        }
        if (/(rs\.?|inr|₹)/i.test(word.text) || /\d/.test(word.text) || /[a-z]{3,}\s*\d{4}/i.test(label)) {
          break;
        }
      }

      const group = words.slice(start, Math.min(end, start + 8));
      if (group.length === 0) continue;
      const anchorY = (group[0].bbox.y0 + group[0].bbox.y1) / 2;
      const lineWords = group.filter(
        (g) => Math.abs((g.bbox.y0 + g.bbox.y1) / 2 - anchorY) < Math.max(20, (g.bbox.y1 - g.bbox.y0) * 2)
      );
      if (lineWords.length === 0) continue;
      const minY = Math.min(...lineWords.map((g) => g.bbox.y0));
      const maxY = Math.max(...lineWords.map((g) => g.bbox.y1));
      const heightPx = maxY - minY;
      const heightPct = imageHeight > 0 ? (heightPx / imageHeight) * 100 : 0;

      const rating: FontSizeFinding["rating"] =
        heightPct >= MIN_HEIGHT_PCT ? "ok" : heightPct >= MIN_HEIGHT_PCT * 0.6 ? "warn" : "fail";

      const message =
        rating === "ok"
          ? `Font size OK (${heightPct.toFixed(2)}% of image height).`
          : rating === "warn"
          ? `Font size appears small (${heightPct.toFixed(2)}% of image height). Rule 6 generally requires declarations to be legible.`
          : `Font size is too small (${heightPct.toFixed(2)}% of image height). Declaration may be illegible.`;

      findings.push({
        ruleId: field.ruleId,
        field: field.label,
        matchedText: label.trim().slice(0, 60),
        heightPx: Math.round(heightPx),
        heightPctOfImage: parseFloat(heightPct.toFixed(2)),
        rating,
        message,
      });
      break;
    }
  }

  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = f.ruleId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
