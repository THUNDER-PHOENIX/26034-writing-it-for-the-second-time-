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
  localStorage.setItem(KEY, JSON.stringify(scans.slice(0, 200)));
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
