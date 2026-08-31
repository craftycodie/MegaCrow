import type { CompiledMegaloFileType } from "@megacrow/megalo";

export type GametypeSaveFormat = "mglo" | "gvar" | "mpvr" | "asq";

/** Reach autosave queue `.game` slot size (zero-padded). */
export const AUTOSAVE_QUEUE_FILE_SIZE = 0x6000;

/** Private Alpha / Delta autosave slots are larger (see Xenia ASQ samples). */
export const AUTOSAVE_QUEUE_FILE_SIZE_PRERELEASE = 0xf000;

export function autosaveQueueFileSizeForMegaloVersionId(
  versionId: string | undefined
): number {
  return versionId === "49" || versionId === "73"
    ? AUTOSAVE_QUEUE_FILE_SIZE_PRERELEASE
    : AUTOSAVE_QUEUE_FILE_SIZE;
}

/** Reach autosave queue filenames: `asq<time64_t uppercase hex, 16 digits>.game`. */
export function autosaveQueueFileName(date: Date = new Date()): string {
  const time64 = BigInt(Math.floor(date.getTime() / 1000));
  return `asq${time64.toString(16).toUpperCase().padStart(16, "0")}.game`;
}

/** Zero-pad an mpvr BLF to the autosave-queue `.game` slot size. */
export function padAutosaveQueueBytes(
  bytes: Uint8Array,
  slotSize: number = AUTOSAVE_QUEUE_FILE_SIZE
): Uint8Array {
  if (bytes.length > slotSize) {
    throw new Error(
      `Autosave queue file is ${bytes.length} bytes; max is ${slotSize}`
    );
  }
  if (bytes.length === slotSize) {
    return bytes;
  }
  const padded = new Uint8Array(slotSize);
  padded.set(bytes);
  return padded;
}

/** Bytes ready to write for a save format (ASQ pads mpvr to the slot size). */
export function finalizeGametypeSaveBytes(
  bytes: Uint8Array,
  format: GametypeSaveFormat,
  options?: { autosaveSlotSize?: number }
): Uint8Array {
  return format === "asq"
    ? padAutosaveQueueBytes(
        bytes,
        options?.autosaveSlotSize ?? AUTOSAVE_QUEUE_FILE_SIZE
      )
    : bytes;
}

/** ASQ is presentation-only — content is a packed `mpvr` BLF (then zero-padded). */
export function compiledFileTypeForSaveFormat(
  format: GametypeSaveFormat
): CompiledMegaloFileType {
  switch (format) {
    case "gvar":
      return "gvar";
    case "mpvr":
    case "asq":
      return "mpvr";
    case "mglo":
      return "mglo";
  }
}
