import type { MegaloVersionId } from "@megacrow/megalo";
import { MEGALO_VERSIONS } from "@megacrow/megalo";

/** Reach gametype storage slot size (bytes) — matches version config `encodedSize`. */
export const VARIANT_STORAGE_CAPACITY = 0x5000;

export const VARIANT_CAPACITY_BY_MEGALO_VERSION: Record<
  MegaloVersionId,
  number
> = Object.fromEntries(
  (Object.keys(MEGALO_VERSIONS) as MegaloVersionId[]).map((id) => [
    id,
    VARIANT_STORAGE_CAPACITY,
  ])
) as Record<MegaloVersionId, number>;

export function formatVariantBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export type VariantCapacityLevel = "ok" | "warn" | "danger";

export function variantCapacityLevel(
  usedBytes: number,
  capacityBytes: number
): VariantCapacityLevel {
  if (usedBytes > capacityBytes) {
    return "danger";
  }
  const ratio = usedBytes / capacityBytes;
  if (ratio >= 0.95) {
    return "danger";
  }
  if (ratio >= 0.8) {
    return "warn";
  }
  return "ok";
}
