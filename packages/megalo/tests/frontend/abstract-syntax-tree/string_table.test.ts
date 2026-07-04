import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser } from "../../../frontend/abstract-syntax-tree";
import { SyntaxKind } from "../../../frontend/abstract-syntax-tree";
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

describe("stringTableParser", () => {
  it("parses a string_table block with language and entries", () => {
    const source = `string_table english
\tslayer_title "Slayer"
\tslayer_description "Score points by killing players on the opposing team."
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.elements).toHaveLength(1);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.STRING_TABLE);
    if (element.elementKind !== ElementKind.STRING_TABLE) {
      return;
    }

    expect(element.language.value).toBe("english");
    expect(element.entries).toHaveLength(2);
    expect(element.entries[0]?.symbol).toMatchObject({
      value: "slayer_title",
    });
    expect(element.entries[0]?.value).toMatchObject({
      kind: SyntaxKind.QUOTED_STRING,
      value: "Slayer",
    });
    expect(element.entries[1]?.symbol).toMatchObject({
      value: "slayer_description",
    });
    expect(element.entries[1]?.value).toMatchObject({
      kind: SyntaxKind.QUOTED_STRING,
      value: "Score points by killing players on the opposing team.",
    });
  });

  it("defaults language to default when omitted", () => {
    const source = `string_table
\tmsg_welcome "Welcome"
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.STRING_TABLE) {
      return;
    }

    expect(element.language.value).toBe("default");
    expect(element.entries).toHaveLength(1);
  });

  it("reports missing end before eof", () => {
    const source = `string_table english
\tmsg_welcome "Welcome"
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });
});
