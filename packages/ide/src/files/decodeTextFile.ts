/**
 * Decode Megalo / Reach `.txt` script bytes.
 * Official scripts are usually UTF-16 LE (often with BOM).
 */
export function decodeTextFile(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return "";
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }

  if (looksLikeUtf16Le(bytes)) {
    return new TextDecoder("utf-16le").decode(bytes);
  }

  return new TextDecoder("utf-8").decode(bytes);
}

function looksLikeUtf16Le(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes.length % 2 !== 0) {
    return false;
  }

  const sample = Math.min(bytes.length, 256);
  let asciiPairs = 0;
  for (let i = 0; i < sample; i += 2) {
    const low = bytes[i]!;
    const high = bytes[i + 1]!;
    if (
      high === 0 &&
      (low === 0x09 || low === 0x0a || low === 0x0d || low < 0x80)
    ) {
      asciiPairs++;
    }
  }

  return asciiPairs / (sample / 2) > 0.6;
}

export async function readTextFileBlob(file: Blob): Promise<string> {
  return decodeTextFile(new Uint8Array(await file.arrayBuffer()));
}

/** Encode Megalo source the way Reach/HREK `.txt` scripts are stored on disk. */
export function encodeMegaloTextFile(text: string): Uint8Array {
  const body = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    body[i * 2] = code & 0xff;
    body[i * 2 + 1] = (code >> 8) & 0xff;
  }
  const bytes = new Uint8Array(2 + body.length);
  bytes[0] = 0xff;
  bytes[1] = 0xfe;
  bytes.set(body, 2);
  return bytes;
}
