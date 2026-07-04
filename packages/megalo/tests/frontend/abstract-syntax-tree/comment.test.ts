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
  const ast = new Parser(version).parse(tokens, diagnostics);
  return { ast, diagnostics };
};

describe("commentParser", () => {
  it("does not consume the token after a comment", () => {
    const source = `; header
include "foo.megalo"
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.elements).toHaveLength(2);
    expect(ast.elements[0]?.elementKind).toBe(ElementKind.COMMENT);
    expect(ast.elements[1]?.elementKind).toBe(ElementKind.INCLUDE);
  });
});
