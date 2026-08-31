import { describe, expect, it } from "vitest";
import { decodeTextFile, encodeMegaloTextFile } from "./decodeTextFile";

function utf16le(text: string, bom = false): Uint8Array {
  const body = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    body[i * 2] = code & 0xff;
    body[i * 2 + 1] = code >> 8;
  }
  if (!bom) {
    return body;
  }
  const out = new Uint8Array(body.length + 2);
  out[0] = 0xff;
  out[1] = 0xfe;
  out.set(body, 2);
  return out;
}

describe("decodeTextFile", () => {
  it("decodes UTF-16 LE with BOM", () => {
    const source = "engine_data\r\nbegin\r\n";
    expect(decodeTextFile(utf16le(source, true))).toBe(source);
  });

  it("decodes UTF-16 LE without BOM", () => {
    const source = "trigger initialization\r\n";
    expect(decodeTextFile(utf16le(source))).toBe(source);
  });

  it("decodes UTF-8", () => {
    const source = "engine_data\nbegin\n";
    expect(decodeTextFile(new TextEncoder().encode(source))).toBe(source);
  });

  it("round-trips Reach UTF-16 LE encoding", () => {
    const source = "engine_data\r\n\tname test\r\nend\r\n";
    expect(decodeTextFile(encodeMegaloTextFile(source))).toBe(source);
  });
});
