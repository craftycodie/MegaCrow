import { describe, expect, it } from "vitest";
import {
  lex,
  TokenKind,
  type Token,
  type Tokens,
} from "../../../frontend/tokens/index.ts";

const kinds = (source: string): TokenKind[] =>
  lex(source).map((token) => token.kind);

const values = (source: string): string[] =>
  lex(source).map((token) => token.value);

const tokens = (source: string): Tokens => lex(source);

const expectToken = (
  token: Token,
  kind: TokenKind,
  value: string,
  location: Partial<Token["location"]>
): void => {
  expect(token.kind).toBe(kind);
  expect(token.value).toBe(value);
  expect(token.location).toMatchObject(location);
};

describe("lex", () => {
  it("returns no tokens for empty source", () => {
    expect(tokens("")).toEqual([]);
  });

  it("skips whitespace between tokens", () => {
    expect(kinds("  trigger \n\t player  ")).toEqual([
      TokenKind.Identifier,
      TokenKind.Identifier,
    ]);
    expect(values("  trigger \n\t player  ")).toEqual(["trigger", "player"]);
  });

  it("tokenizes identifiers", () => {
    expect(kinds("trigger set_to _foo player1")).toEqual([
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
    ]);
  });

  it("stops identifiers at member separators", () => {
    expect(kinds("foo.bar")).toEqual([
      TokenKind.Identifier,
      TokenKind.MemberVariableSeparator,
      TokenKind.Identifier,
    ]);
    expect(values("foo.bar")).toEqual(["foo", ".", "bar"]);
  });

  it("tokenizes member variable separators", () => {
    expect(tokens(".")).toEqual([
      expect.objectContaining({
        kind: TokenKind.MemberVariableSeparator,
        value: ".",
      }),
    ]);
  });

  it("tokenizes integer literals", () => {
    expect(kinds("0 42 -5")).toEqual([
      TokenKind.Integer,
      TokenKind.Integer,
      TokenKind.Integer,
    ]);
    expect(values("0 42 -5")).toEqual(["0", "42", "-5"]);
  });

  it("tokenizes floating-point literals", () => {
    expect(kinds("1.5 -3.14 10.0")).toEqual([
      TokenKind.FloatingPoint,
      TokenKind.FloatingPoint,
      TokenKind.FloatingPoint,
    ]);
    expect(values("1.5 -3.14 10.0")).toEqual(["1.5", "-3.14", "10.0"]);
  });

  it("tokenizes quoted strings", () => {
    expect(kinds('"hello"')).toEqual([TokenKind.QuotedString]);
    expect(values('"hello"')).toEqual(["hello"]);
  });

  it("tokenizes comments through end of line", () => {
    expect(kinds("; note\ntrigger")).toEqual([
      TokenKind.Comment,
      TokenKind.Identifier,
    ]);
    expect(values("; note\ntrigger")).toEqual([" note", "trigger"]);
  });

  it("tokenizes comments before a carriage return", () => {
    expect(values("; note\rtrigger")).toEqual([" note", "trigger"]);
  });

  it("tokenizes comments before CRLF", () => {
    expect(values("; note\r\ntrigger")).toEqual([" note\r", "trigger"]);
  });

  it("emits None for unclosed quoted strings", () => {
    expect(kinds('"hello')).toEqual([TokenKind.None]);
    expect(values('"hello')).toEqual(["hello"]);
  });

  it("emits None for invalid numeric literals", () => {
    expect(kinds("1player")).toEqual([TokenKind.None]);
    expect(values("1player")).toEqual(["1player"]);
  });

  it("emits None for unrecognized characters", () => {
    expect(kinds("@")).toEqual([TokenKind.None]);
    expect(values("@")).toEqual(["@"]);
  });

  it("records source locations", () => {
    const source = "foo\n; bar\nbaz";
    const result = tokens(source);

    expectToken(result[0]!, TokenKind.Identifier, "foo", {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 3, line: 1, column: 4 },
    });
    expectToken(result[1]!, TokenKind.Comment, " bar", {
      start: { offset: 4, line: 2, column: 1 },
      end: { offset: 9, line: 2, column: 6 },
    });
    expectToken(result[2]!, TokenKind.Identifier, "baz", {
      start: { offset: 10, line: 3, column: 1 },
      end: { offset: 13, line: 3, column: 4 },
    });
  });

  it("tokenizes a realistic megalo snippet", () => {
    const source = `variables global
  number score 0
end

trigger player
  action set score set_to 1
end`;

    expect(kinds(source)).toEqual([
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Integer,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Identifier,
      TokenKind.Integer,
      TokenKind.Identifier,
    ]);
  });
});
