import { NextRequest, NextResponse } from "next/server";
import { createOcrSpaceProvider } from "@/lib/ocr/ocrspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// OCR.space can take a few seconds on cold start; allow up to 60s for better reliability.
export const maxDuration = 60;

interface OcrRequestBody {
  /** base64 (without data: prefix) of the image */
  imageBase64: string;
  /** MIME type, e.g. "image/jpeg" or "image/png" */
  mimeType?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "OCR is not configured on the server. Set OCR_SPACE_API_KEY, or use the client-side fallback (slower).",
        configured: false,
      },
      { status: 503 }
    );
  }

  let body: OcrRequestBody;
  try {
    body = (await req.json()) as OcrRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  // OCR.space free tier caps the request body at ~1MB; the client should already
  // have preprocessed/resized, but defend here too.
  if (body.imageBase64.length > 1_500_000) {
    return NextResponse.json(
      { error: "Image too large. Please reduce to <1MB and try again." },
      { status: 413 }
    );
  }

  try {
    const provider = createOcrSpaceProvider(apiKey);
    const result = await provider.recognize({
      kind: "base64",
      data: body.imageBase64,
      mimeType: body.mimeType || "image/jpeg",
    });
    return NextResponse.json({ configured: true, ...result });
  } catch (err) {
    const message = (err as Error)?.message || "OCR failed";
    console.error("OCR processing error:", err);
    return NextResponse.json({ error: message, configured: true }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OCR_SPACE_API_KEY),
    provider: "ocrspace",
    maxDuration: 60,
  });
}
