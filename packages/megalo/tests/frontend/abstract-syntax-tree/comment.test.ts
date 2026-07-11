import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser } from "../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const { ast } = new Parser(version).parse(tokens, diagnostics);
  return { ast, diagnostics };
};

describe("commentParser", () => {
  it("does not consume the token after a comment", () => {
    const source = `; header
include "foo.megalo"
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.comments).toHaveLength(1);
    expect(ast.comments[0]).toMatchObject({
      lines: [" header"],
      describesLine: { start: { line: 2, column: 1 } },
    });
    expect(ast.elements).toHaveLength(1);
    expect(ast.elements[0]?.elementKind).toBe(ElementKind.INCLUDE);
  });

  it("points indented full-line comments at the following code line", () => {
    const source = `trigger foo
\t; set the vip
\taction end_round
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.comments).toHaveLength(1);
    expect(ast.comments[0]).toMatchObject({
      lines: [" set the vip"],
      describesLine: { start: { line: 3, column: 1 } },
    });
  });

  it("points trailing comments at the same line", () => {
    const source = `include "foo.megalo" ; pull shared defs
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.comments).toHaveLength(1);
    expect(ast.comments[0]).toMatchObject({
      lines: [" pull shared defs"],
      describesLine: { start: { line: 1, column: 1 } },
    });
  });

  it("groups contiguous leading comment lines into one block", () => {
    const source = `; ************
; * STRINGS  *
; ************
include "foo.megalo"
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.comments).toHaveLength(1);
    expect(ast.comments[0]).toMatchObject({
      lines: [" ************", " * STRINGS  *", " ************"],
      describesLine: { start: { line: 4, column: 1 } },
    });
    expect(ast.comments[0]!.location.start.line).toBe(1);
    expect(ast.comments[0]!.location.end.line).toBe(3);
  });

  it("does not group leading comments separated by a blank line", () => {
    const source = `; first block

; second block
include "foo.megalo"
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.comments).toHaveLength(2);
    expect(ast.comments[0]).toMatchObject({
      lines: [" first block"],
      // skips the blank line and points at the following code
      describesLine: { start: { line: 4, column: 1 } },
    });
    expect(ast.comments[1]).toMatchObject({
      lines: [" second block"],
      describesLine: { start: { line: 4, column: 1 } },
    });
  });

  it("does not merge a trailing comment into a following leading block", () => {
    const source = `include "foo.megalo" ; trailing
; leading block
; still leading
include "bar.megalo"
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.comments).toHaveLength(2);
    expect(ast.comments[0]).toMatchObject({
      lines: [" trailing"],
      describesLine: { start: { line: 1, column: 1 } },
    });
    expect(ast.comments[1]).toMatchObject({
      lines: [" leading block", " still leading"],
      describesLine: { start: { line: 4, column: 1 } },
    });
  });
});
