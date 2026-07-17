import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable: ast.symbolTable, diagnostics };
};

describe("mapPermissionsParser", () => {
  it("parses map_permissions entries as key-value pairs", () => {
    const source = `constants
\tnumber k_map_id_boneyard 1080
\tnumber k_map_id_spire 2002
end
map_permissions
\tdefault false
\texception k_map_id_boneyard
\texception k_map_id_spire
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[1]!;
    expect(element.elementKind).toBe(ElementKind.MAP_PERMISSIONS);
    if (element.elementKind !== ElementKind.MAP_PERMISSIONS) {
      return;
    }

    expect(element.entries).toHaveLength(3);
    expect(element.entries[0]).toMatchObject({
      key: "default",
      value: { kind: SyntaxKind.KEYWORD, value: "false" },
    });
    expect(element.entries[1]).toMatchObject({
      key: "exception",
      value: { kind: SyntaxKind.REFERENCE, identifier: "k_map_id_boneyard" },
    });
    expect(element.entries[2]).toMatchObject({
      key: "exception",
      value: { kind: SyntaxKind.REFERENCE, identifier: "k_map_id_spire" },
    });
  });

  it("parses numeric exception values", () => {
    const source = `map_permissions
\tdefault true
\texception 1080
\texception 2002
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.MAP_PERMISSIONS) {
      return;
    }

    expect(element.entries[0]?.value).toMatchObject({
      kind: SyntaxKind.KEYWORD,
      value: "true",
    });
    expect(element.entries[1]?.value).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: 1080,
    });
    expect(element.entries[2]?.value).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: 2002,
    });
  });

  it("parses constant exception values as references", () => {
    const source = `constants
\tnumber k_map_id_dlc_invasion 2002
end
map_permissions
\tdefault false
\texception k_map_id_dlc_invasion
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.MAP_PERMISSIONS) {
      return;
    }

    expect(element.entries[1]?.value).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "k_map_id_dlc_invasion",
    });
  });

  it("reports unresolved identifier values", () => {
    const source = `map_permissions
\tdefault false
\texception k_map_id_boneyard
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("k_map_id_boneyard");
  });

  it("reports missing end before eof", () => {
    const source = `map_permissions
\tdefault false
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors().some((error) => error.message.includes("end"))).toBe(true);
  });
});
