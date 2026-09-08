"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ScanRecord } from "../storage";

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function rowToScan(r: Record<string, unknown>): ScanRecord {
  return {
    id: String(r.id),
    productName: String(r.product_name ?? "Untitled Product"),
    manufacturer: (r.manufacturer as string | null) ?? null,
    imageDataUrl: null,
    imagePath: (r.image_path as string | null) ?? null,
    ocrText: String(r.ocr_text ?? ""),
    ocrProvider: (r.ocr_provider as string | null) ?? undefined,
    category: (r.category as string | null) ?? undefined,
    mrp: (r.mrp as string | null) ?? null,
    netQuantity: (r.net_quantity as string | null) ?? null,
    mfgDate: (r.mfg_date as string | null) ?? null,
    score: Number(r.score ?? 0),
    compliant: Boolean(r.compliant),
    criticalCount: Number(r.critical_count ?? 0),
    majorCount: Number(r.major_count ?? 0),
    minorCount: Number(r.minor_count ?? 0),
    violations: (r.violations as ScanRecord["violations"]) ?? [],
    fontFindings: (r.font_findings as ScanRecord["fontFindings"]) ?? undefined,
    barcodeValue: (r.barcode_value as string | null) ?? null,
    inspector: String(r.inspector ?? "Inspector"),
    location: String(r.location ?? "—"),
    scannedAt: (r.created_at as string) ?? new Date().toISOString(),
  };
}

function scanToRow(s: ScanRecord) {
  return {
    id: s.id,
    product_name: s.productName,
    inspector: s.inspector,
    location: s.location,
    category: s.category ?? null,
    manufacturer: s.manufacturer,
    mrp: s.mrp,
    net_quantity: s.netQuantity,
    mfg_date: s.mfgDate,
    ocr_text: s.ocrText,
    ocr_provider: s.ocrProvider ?? null,
    image_path: s.imagePath ?? null,
    score: s.score,
    compliant: s.compliant,
    critical_count: s.criticalCount,
    major_count: s.majorCount,
    minor_count: s.minorCount,
    violations: s.violations,
    font_findings: s.fontFindings ?? null,
    barcode_value: s.barcodeValue ?? null,
  };
}

async function uploadImageIfPresent(s: ScanRecord): Promise<string | null> {
  if (!s.imageDataUrl) return s.imagePath ?? null;
  const client = getClient();
  if (!client) return null;

  // Convert dataURL to Blob.
  const m = s.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return s.imagePath ?? null;
  const mime = m[1];
  const base64 = m[2];
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });

  const path = `${s.id}.${mime.split("/")[1] || "jpg"}`;
  const { error } = await client.storage.from("scans").upload(path, blob, {
    upsert: true,
    contentType: mime,
    cacheControl: "3600",
  });
  if (error) {
    console.warn("Supabase image upload failed:", error.message);
    return null;
  }
  return path;
}

function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const client = getClient();
  if (!client) return null;
  const { data } = client.storage.from("scans").getPublicUrl(path);
  return data.publicUrl;
}

export async function saveScanRemote(s: ScanRecord): Promise<ScanRecord> {
  const client = getClient();
  if (!client) return s;
  const imagePath = await uploadImageIfPresent(s);
  const row = scanToRow({ ...s, imagePath });
  const { error } = await client.from("scans").upsert(row);
  if (error) {
    // Let the storage dispatcher persist locally. Returning success here
    // caused the caller to navigate to a report which did not exist anywhere.
    throw new Error(`Supabase save failed: ${error.message}`);
  }
  return { ...s, imagePath };
}

export async function getAllScansRemote(): Promise<ScanRecord[] | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.warn("Supabase fetch failed:", error.message);
    return null;
  }
  return (data || []).map((r) => {
    const scan = rowToScan(r);
    // Re-attach public image URL if present.
    const url = publicImageUrl(scan.imagePath ?? null);
    if (url) scan.imageDataUrl = url;
    return scan;
  });
}

export async function getScanByIdRemote(id: string): Promise<ScanRecord | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client.from("scans").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const scan = rowToScan(data);
  const url = publicImageUrl(scan.imagePath ?? null);
  if (url) scan.imageDataUrl = url;
  return scan;
}

export async function deleteScanRemote(id: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  // Best effort: also delete the image first.
  for (const ext of ["jpg", "jpeg", "png"]) {
    await client.storage.from("scans").remove([`${id}.${ext}`]);
  }
  const { error } = await client.from("scans").delete().eq("id", id);
  return !error;
}
