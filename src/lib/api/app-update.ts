import { apiFetch } from "./client";
import type { LatestRelease } from "@/lib/types/app-update";

/**
 * Ultima release publicada de la app (endpoint publico del backend).
 * El backend sirve el APK desde R2 (subido automaticamente por el webhook de
 * GitHub Releases). Devuelve null si todavia no hay ninguna release (204).
 */
export async function getLatestRelease(platform = "android"): Promise<LatestRelease | null> {
  const res = await apiFetch<LatestRelease | undefined>(`/app/latest?platform=${platform}`);
  return res ?? null;
}
