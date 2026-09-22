"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { runComplianceCheck, extractKeyFields } from "@/lib/rules";
import { analyzeFontSize } from "@/lib/fontSize";
import { saveScan, getAllScans } from "@/lib/storage";
import { preprocessImageForOcr } from "@/lib/image/preprocess";
import { analyzeImageQuality, type ImageQualityReport } from "@/lib/image/quality";
import { CATEGORY_OPTIONS, detectCategory, requiredRulesFor, type Category } from "@/lib/rules/categories";
import { decodeBarcodeFromDataUrl } from "@/lib/barcode/zxing";

type OcrSource = "server" | "tesseract";

async function recognizeOnServer(imageDataUrl: string): Promise<{
  text: string;
  words: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; confidence: number }[];
  source: OcrSource;
  raw?: unknown;
}> {
  const base64 = imageDataUrl.replace(/^data:[^;]+;base64,/, "");
  const mime = (imageDataUrl.match(/^data:([^;]+);/) || [, "image/jpeg"])[1];
  const resp = await fetch("/api/ocr", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(`Server OCR unavailable: ${body?.error || resp.statusText}`);
  }
  const json = await resp.json();
  if (!json?.text) throw new Error("Server OCR returned empty result");
  return { text: json.text, words: json.words || [], source: "server", raw: json };
}

async function recognizeOnClient(imageDataUrl: string, onProgress?: (status: string, pct: number) => void) {
  // PSM 3 = fully automatic page segmentation (default).
  // PSM 6 = assume a single uniform block — better for product labels with mixed
  // font sizes, reflections, or rotated text, where auto-layout analysis stumbles.
  // We try PSM 6 first; if it returns empty text we retry with PSM 3.
  const tryRecognize = (psm: string) =>
    Tesseract.recognize(imageDataUrl, "eng", {
      logger: (m) => {
        if (onProgress) {
          onProgress(m.status || "recognizing", typeof m.progress === "number" ? Math.round(m.progress * 100) : 0);
        }
      },
      // Tesseract.js accepts raw Tesseract configuration parameters as extra keys.
      tessedit_pageseg_mode: psm,
      tessedit_char_whitelist: "",
      preserve_interword_spaces: "1",
    });

  let result = await tryRecognize("6");
  // If PSM 6 produced no text, fall back to default auto-layout (PSM 3).
  if (!result.data?.text?.trim()) {
    result = await tryRecognize("3");
  }
  return { ...result, source: "tesseract" as const };
}

export default function ScanPage() {
  const router = useRouter();
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [productName, setProductName] = useState("");
  const [location, setLocation] = useState("");
  const [inspector, setInspector] = useState("Inspector Demo");
  const [category, setCategory] = useState<Category>("unknown");
  const [ocrLanguage, setOcrLanguage] = useState<"eng" | "hin" | "kan">("eng");
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);
  const [barcodeHistory, setBarcodeHistory] = useState<{ count: number; lastDate: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [ocrEngine, setOcrEngine] = useState<"server" | "client" | "unknown">("unknown");

  useEffect(() => {
    // Auto-populate inspector details from logged-in user
    const storedUser = localStorage.getItem("lm_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setInspector(user.name || user.email.split("@")[0]);
        if (user.state) {
          setLocation(user.state);
        }
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  useEffect(() => {
    // Probe /api/ocr to show which engine will be used.
    fetch("/api/ocr")
      .then((r) => r.json())
      .then((j) => setOcrEngine(j?.configured ? "server" : "client"))
      .catch(() => setOcrEngine("client"));
  }, []);

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImageDataUrl(dataUrl);
      // Analyze image quality immediately
      try {
        const quality = await analyzeImageQuality(dataUrl);
        setQualityReport(quality);
      } catch (err) {
        console.error("Quality analysis failed:", err);
        setQualityReport(null);
      }
    };
    reader.readAsDataURL(f);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraOn(true);
      }
    } catch (err) {
      alert("Camera not available: " + (err as Error).message);
    }
  }

  async function capture() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setImageDataUrl(dataUrl);
    const stream = v.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setCameraOn(false);

    // Analyze image quality
    try {
      const quality = await analyzeImageQuality(dataUrl);
      setQualityReport(quality);
    } catch (err) {
      console.error("Quality analysis failed:", err);
      setQualityReport(null);
    }
  }

  async function runOcr() {
    if (!imageDataUrl) return;
    setRunning(true);
    setProgress(0);
    setStatus("Preprocessing image for OCR…");

    let text = "";
    let words: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; confidence: number }[] = [];
    let imageHeight = 1000;
    let provider: OcrSource = "tesseract";
    let processedDataUrl = imageDataUrl;
    let barcodeValue: string | null = null;

    try {
      // 0. Try to read a barcode from the original image (ZXing is faster
      //    and more accurate than OCR-derived digit runs).
      try {
        const hit = await decodeBarcodeFromDataUrl(imageDataUrl);
        if (hit) {
          barcodeValue = hit.value;
          setStatus(`Barcode detected: ${hit.value} (${hit.format})`);
        }
      } catch (e) {
        // Not a hard failure — fall through to OCR.
        console.warn("Barcode scan failed:", e);
      }

      // 1. Preprocess for OCR (grayscale, contrast stretch, mild sharpen, resize).
      try {
        const pre = await preprocessImageForOcr(imageDataUrl);
        processedDataUrl = pre.dataUrl;
        setStatus(`Preprocessed ${pre.originalSize.w}x${pre.originalSize.h} → ${pre.newSize.w}x${pre.newSize.h}`);
      } catch (e) {
        console.warn("Preprocessing failed, using original image:", e);
        setStatus("Preprocessing skipped, using original image");
      }

      // 2. Try server (cloud) OCR first.
      try {
        setStatus("Calling server OCR…");
        const server = await recognizeOnServer(processedDataUrl);
        text = server.text;
        words = server.words;
        provider = "server";
        if (words.length > 0) {
          imageHeight = Math.max(...words.map((w) => w.bbox.y1), 1000);
        }
        setStatus(`Server OCR (${words.length} words)`);
      } catch (serverErr) {
        console.warn("Server OCR failed, falling back to in-browser Tesseract:", serverErr);
        setStatus("Running in-browser OCR (Tesseract.js)…");
        const fallback = await recognizeOnClient(processedDataUrl, (statusMsg, pct) => {
          setStatus(statusMsg);
          setProgress(pct);
        });
        text = fallback.data?.text || "";
        words = (fallback.data?.words || []).map((w) => ({
          text: w.text,
          bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 },
          confidence: w.confidence,
        }));
        imageHeight = (fallback.data as { imageHeight?: number })?.imageHeight ?? Math.max(...words.map((w) => w.bbox.y1), 1000);
        provider = "tesseract";
      }

      const fields = extractKeyFields(text);
      // First pass: run all rules so we can auto-detect category if needed.
      const firstPass = runComplianceCheck(text);
      const effectiveCategory: Category = category === "unknown" ? detectCategory(text, firstPass.violations) : category;
      const required = requiredRulesFor(effectiveCategory);
      // Final pass: score against the rules actually required for this category.
      const result_ = runComplianceCheck(text, { requiredRuleIds: required });
      const fontFindings = analyzeFontSize(words, imageHeight, result_.violations);

      const id = `scan-${Date.now()}`;
      await saveScan({
        id,
        productName: productName || "Untitled Product",
        manufacturer: fields.company,
        imageDataUrl,
        ocrText: text,
        mrp: fields.mrp,
        netQuantity: fields.netQuantity,
        mfgDate: fields.mfgDate,
        score: result_.score,
        compliant: result_.compliant,
        fontFindings,
        criticalCount: result_.criticalCount,
        majorCount: result_.majorCount,
        minorCount: result_.minorCount,
        violations: result_.violations,
        inspector,
        location: location || "—",
        scannedAt: new Date().toISOString(),
        ocrProvider: provider,
        category: effectiveCategory,
        barcodeValue,
      });
      router.push(`/reports/${id}`);
    } catch (e) {
      const msg = (e as Error)?.message || String(e);
      console.error("OCR failed:", e);
      // Save a partial/zero scan instead of showing an opaque alert.
      // This lets the user see the report page with a clear explanation
      // rather than a dead-end modal.
      try {
        const id = `scan-${Date.now()}`;
        const emptyCheck = runComplianceCheck("");
        await saveScan({
          id,
          productName: productName || "Untitled Product",
          manufacturer: null,
          imageDataUrl: imageDataUrl ?? "",
          ocrText: "",
          mrp: null,
          netQuantity: null,
          mfgDate: null,
          score: 0,
          compliant: false,
          fontFindings: [],
          criticalCount: emptyCheck.criticalCount,
          majorCount: emptyCheck.majorCount,
          minorCount: emptyCheck.minorCount,
          violations: [
            {
              ruleId: "ocr_failure",
              ruleName: "OCR / Image Recognition",
              ruleRef: "—",
              severity: "critical" as const,
              message: `Could not extract text from image: ${msg}. ` +
                "If OCR.space API key is not configured the app uses Tesseract.js, " +
                "which struggles with metallic / shiny labels, rotated text, or " +
                "dot-matrix print. Try: (1) a flat, well-lit photo, " +
                "(2) configure OCR_SPACE_API_KEY for cloud OCR.",
              matched: false,
            },
            ...emptyCheck.violations,
          ],
          inspector,
          location: location || "—",
          scannedAt: new Date().toISOString(),
          ocrProvider: provider,
          category,
          barcodeValue,
        });
        router.push(`/reports/${id}`);
      } catch (saveErr) {
        // Absolute last resort — nothing can be saved.
        console.error("Could not save partial scan:", saveErr);
        alert(
          "OCR processing failed and the result could not be saved.\n\n" +
          `Error: ${msg}\n\n` +
          "Please try a clearer image with good, even lighting and no glare."
        );
      }
    } finally {
      setRunning(false);
    }
  }

  function loadSample() {
    const sample = makeSampleImage();
    setImageDataUrl(sample);
    setProductName("Sample Chips Pack 100g");
    analyzeImageQuality(sample).then(setQualityReport).catch(() => setQualityReport(null));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scan a Product</h1>
        <p className="text-slate-500 text-sm">Upload a clear image of the product label and run automated compliance check.</p>
        <div className="mt-2 text-xs">
          {ocrEngine === "server" && (
            <span className="badge badge-green" title="OCR.space server-side OCR with image preprocessing. Best accuracy on real product photos.">OCR: Cloud (high accuracy)</span>
          )}
          {ocrEngine === "client" && (
            <span className="badge badge-yellow" title="Server OCR not configured. Falling back to in-browser Tesseract.js.">OCR: Browser (offline)</span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <div className="font-semibold mb-3">Capture or Upload</div>

          {!imageDataUrl && !cameraOn && (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <div className="text-slate-500 mb-4">Drop an image here, or choose a source below.</div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="btn-primary">Upload Image</button>
                <button onClick={startCamera} className="btn-secondary">Use Camera</button>
                <button onClick={loadSample} className="btn-secondary">Try a sample</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            </div>
          )}

          {cameraOn && (
            <div className="space-y-3">
              <video ref={videoRef} className="w-full rounded-lg border" playsInline muted />
              <div className="flex gap-2">
                <button onClick={capture} className="btn-primary">Capture</button>
                <button
                  onClick={() => {
                    const stream = videoRef.current?.srcObject as MediaStream | null;
                    stream?.getTracks().forEach((t) => t.stop());
                    setCameraOn(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {imageDataUrl && (
            <div className="space-y-3">
              <img src={imageDataUrl} alt="Captured" className="w-full rounded-lg border" />

              {/* Image Quality Assessment Card */}
              {qualityReport && (
                <div className={`p-3 rounded-lg border-2 ${
                  qualityReport.isAcceptable
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-amber-50 border-amber-300"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {qualityReport.isAcceptable ? "✓ Image Quality: Good" : "⚠️ Image Quality Issues"}
                      </span>
                      <span className="badge badge-blue text-xs">{qualityReport.score}/100</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div className={`px-2 py-1 rounded ${
                      qualityReport.sharpness.status === "sharp" ? "bg-emerald-100 text-emerald-800" :
                      qualityReport.sharpness.status === "fair" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      <div className="font-semibold">Sharpness</div>
                      <div className="capitalize">{qualityReport.sharpness.status}</div>
                    </div>
                    <div className={`px-2 py-1 rounded ${
                      qualityReport.brightness.status === "good" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      <div className="font-semibold">Lighting</div>
                      <div className="capitalize">{qualityReport.brightness.status}</div>
                    </div>
                    <div className={`px-2 py-1 rounded ${
                      qualityReport.resolution.status === "good" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      <div className="font-semibold">Resolution</div>
                      <div>{qualityReport.resolution.w}×{qualityReport.resolution.h}</div>
                    </div>
                  </div>
                  {qualityReport.warnings.length > 0 && (
                    <div className="space-y-1">
                      {qualityReport.warnings.map((w, i) => (
                        <div key={i} className="text-xs text-amber-800 flex items-start gap-1">
                          <span>•</span>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={runOcr}
                  disabled={running}
                  className="btn-primary"
                >
                  {running ? `Running OCR… ${progress}%` : "Run Compliance Check"}
                </button>
                <button onClick={() => { setImageDataUrl(null); setQualityReport(null); }} className="btn-secondary" disabled={running}>
                  Retake
                </button>
              </div>
              {running && (
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
              {running && <div className="text-xs text-slate-500">{status}</div>}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-3">Inspection Details</div>
          <div className="space-y-3 text-sm">
            <Field label="Product Name (optional)">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Chips Pack 100g"
              />
            </Field>
            <Field label="Product Category">
              <select
                className="w-full border rounded-md px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500 mt-1">
                {CATEGORY_OPTIONS.find((o) => o.value === category)?.hint}
              </div>
            </Field>
            <Field label="OCR Language Support">
              <select
                className="w-full border rounded-md px-3 py-2"
                value={ocrLanguage}
                onChange={(e) => setOcrLanguage(e.target.value as "eng" | "hin" | "kan")}
              >
                <option value="eng">English (Standard Declarations)</option>
                <option value="hin">Hindi (हिंदी - Multilingual)</option>
                <option value="kan">Kannada (ಕನ್ನಡ - Karnataka Zone)</option>
              </select>
              <div className="text-[11px] text-slate-500 mt-1">
                Dual-language validation under Legal Metrology Rule 9
              </div>
            </Field>
            <Field label="Inspector">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
              />
            </Field>
            <Field label="Location">
              <input
                className="w-full border rounded-md px-3 py-2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai"
              />
            </Field>
            <div className="text-xs text-slate-500 pt-2">
              Tip: For best OCR results, capture a flat label in good lighting, avoid glare, and frame the text.
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-2">What gets checked?</div>
        <ul className="text-sm text-slate-600 grid sm:grid-cols-2 gap-y-1">
          <li>• Manufacturer / Packer / Importer name &amp; address</li>
          <li>• Net quantity (g, kg, ml, L)</li>
          <li>• MRP inclusive of all taxes</li>
          <li>• Month &amp; year of manufacture / packing</li>
          <li>• Country of origin (imported goods)</li>
          <li>• Consumer care (phone / email)</li>
          <li>• Best before / expiry (food items)</li>
          <li>• Ingredients (food items)</li>
          <li>• Nutritional information (food items)</li>
          <li>• Veg / Non-veg symbol</li>
          <li>• Customer care email / phone</li>
          <li>• Barcode presence</li>
        </ul>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      {children}
    </label>
  );
}

function makeSampleImage(): string {
  const lines = [
    "ABC FOODS PVT LTD",
    "Plot 12, MIDC, Mumbai 400001",
    "Butter Cookies 200g",
    "Net Wt. 200g",
    "MRP Rs. 120 (incl. of all taxes)",
    "Mfd. Date: Mar 2024",
    "Best before 12 months from packaging",
    "Customer Care: 1800-123-4567",
    "care@abcfoods.in",
    "Made in India",
    "Ingredients: Wheat flour, sugar, butter, salt",
    "8901234567890",
  ];
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff8e7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#222";
  ctx.font = "bold 36px serif";
  ctx.fillText("Butter Cookies", 150, 50);
  ctx.font = "24px monospace";
  lines.forEach((l, i) => ctx.fillText(l, 40, 100 + i * 45));
  return canvas.toDataURL("image/png");
}
