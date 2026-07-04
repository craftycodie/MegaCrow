import { describe, expect, it } from "vitest";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer, TokenKind } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

describe("unescapeQuotedString", () => {
  const quotedValue = (source: string): string => {
    const token = new Lexer(MEGALO_VERSIONS["107-mcc"]).lex(source, new Diagnostics())[0];
    expect(token?.kind).toBe(TokenKind.QuotedString);
    return token!.value;
  };

  it("returns an empty string unchanged", () => {
    expect(quotedValue('""')).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(quotedValue('"hello world"')).toBe("hello world");
  });

  it("unescapes \\n, \\r, and \\t", () => {
    expect(quotedValue('"line\\nbreak"')).toBe("line\nbreak");
    expect(quotedValue('"a\\rb"')).toBe("a\rb");
    expect(quotedValue('"a\\tb"')).toBe("a\tb");
  });

  it("unescapes backslash and quote escapes", () => {
    expect(quotedValue('"path\\\\file"')).toBe("path\\file");
    expect(quotedValue('"say \\"hi\\""')).toBe('say "hi"');
  });

  it("drops the backslash for unknown escapes and preserves the character", () => {
    expect(quotedValue('"unknown\\x"')).toBe("unknownx");
  });

  it("leaves a trailing backslash unchanged when it is not part of an escape", () => {
    expect(quotedValue('"foo\\\\"')).toBe("foo\\");
  });

  it("handles multiple escape sequences in one string", () => {
    expect(quotedValue('"\\n\\r\\t"')).toBe("\n\r\t");
  });
});
