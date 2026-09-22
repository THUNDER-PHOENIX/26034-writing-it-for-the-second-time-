"use client";
import type { ScanRecord } from "../storage";
import {
  saveScanRemote,
  getAllScansRemote,
  getScanByIdRemote,
  deleteScanRemote,
  isSupabaseConfigured,
} from "./remote";

/**
 * Storage dispatcher.
 *
 * - When Supabase env vars are set at build time, all reads/writes go to
 *   Supabase (Postgres + Storage). Inspectors can collaborate across devices.
 * - When they're not, we silently fall back to the existing localStorage
 *   behavior. The current UI doesn't need to know which is in use.
 *
 * Errors from the remote side are caught and downgraded to local-storage
 * behavior so a transient network failure never bricks a scan.
 */

const KEY = "lm_scans_v1";

function localGet(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function localSet(scans: ScanRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(scans.slice(0, 200)));
  } catch (error) {
    // Camera photos are often several megabytes, while mobile browsers usually
    // allow only about 5 MB for localStorage. The scan result is more important
    // than retaining a duplicate of the photo, so retry with metadata only.
    // Remote storage still keeps the image whenever Supabase is available.
    const metadataOnly = scans.map((scan) => ({ ...scan, imageDataUrl: null }));
    try {
      localStorage.setItem(KEY, JSON.stringify(metadataOnly.slice(0, 200)));
    } catch (retryError) {
      console.error("Unable to save scan metadata locally:", retryError);
      throw new Error("Your browser storage is full. Clear old scans and try again.");
    }
    console.warn("Local storage quota reached; saved scan details without the captured image.", error);
  }
}

export async function updateScanAnywhere(s: ScanRecord): Promise<ScanRecord> {
  if (isSupabaseConfigured()) {
    try {
      return await saveScanRemote(s);
    } catch (e) {
      console.warn("Remote update failed, falling back to localStorage:", e);
    }
  }
  // localStorage update
  const all = localGet();
  const index = all.findIndex((item) => item.id === s.id);
  if (index !== -1) {
    all[index] = s;
    localSet(all);
  } else {
    // If not found, add it
    all.unshift(s);
    localSet(all);
  }
  return s;
}

export async function saveScanAnywhere(s: ScanRecord): Promise<ScanRecord> {
  if (isSupabaseConfigured()) {
    try {
      return await saveScanRemote(s);
    } catch (e) {
      console.warn("Remote save failed, falling back to localStorage:", e);
    }
  }
  // localStorage fallback (preserves the original sync-ish behavior).
  const all = localGet();
  all.unshift(s);
  localSet(all);
  return s;
}

export async function getAllScansAnywhere(): Promise<ScanRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await getAllScansRemote();
      if (remote !== null) return remote;
    } catch (e) {
      console.warn("Remote list failed, using localStorage:", e);
    }
  }
  return localGet();
}

export async function getScanByIdAnywhere(id: string): Promise<ScanRecord | null> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await getScanByIdRemote(id);
      if (remote !== null) return remote;
    } catch (e) {
      console.warn("Remote get failed, using localStorage:", e);
    }
  }
  return localGet().find((s) => s.id === id) ?? null;
}

export async function deleteScanAnywhere(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      if (await deleteScanRemote(id)) return;
    } catch (e) {
      console.warn("Remote delete failed, using localStorage:", e);
    }
  }
  const all = localGet().filter((s) => s.id !== id);
  localSet(all);
}

export { isSupabaseConfigured };
