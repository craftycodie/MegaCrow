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
  const { ast, symbolTable } = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable, diagnostics };
};

describe("engineDataParser", () => {
  it("parses engine_data with string and numeric fields", () => {
    const source = `string_table english
\tslayer_title "Slayer"
\tslayer_description "Slayer description"
end
constants number
\tk_engine_icon_slayer 5
end
engine_data
\tname slayer_title
\tdescription slayer_description
\ticon k_engine_icon_slayer
\tcategory slayer
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[2]!;
    expect(element.elementKind).toBe(ElementKind.ENGINE_DATA);
    if (element.elementKind !== ElementKind.ENGINE_DATA) {
      return;
    }

    expect(element.properties).toHaveLength(4);
    expect(element.properties[0]).toMatchObject({
      identifier: "name",
      parameters: [{ kind: SyntaxKind.REFERENCE, identifier: "slayer_title" }],
    });
    expect(element.properties[1]).toMatchObject({
      identifier: "description",
      parameters: [{ kind: SyntaxKind.REFERENCE, identifier: "slayer_description" }],
    });
    expect(element.properties[2]).toMatchObject({
      identifier: "icon",
      parameters: [{ kind: SyntaxKind.REFERENCE, identifier: "k_engine_icon_slayer" }],
    });
    expect(element.properties[3]).toMatchObject({
      identifier: "category",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "slayer" }],
    });
  });

  it("parses numeric icon and category values", () => {
    const source = `string_table english
\tengine_name "Custom"
\tengine_description "Custom description"
end
constants number
\tk_engine_icon_slayer 5
end
engine_data
\tname engine_name
\tdescription engine_description
\ticon k_engine_icon_slayer
\tcategory invasion
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[2]!;
    if (element.elementKind !== ElementKind.ENGINE_DATA) {
      return;
    }

    expect(element.properties[2]).toMatchObject({
      identifier: "icon",
      parameters: [{ kind: SyntaxKind.REFERENCE, identifier: "k_engine_icon_slayer" }],
    });
    expect(element.properties[3]).toMatchObject({
      identifier: "category",
      parameters: [{ kind: SyntaxKind.KEYWORD, value: "invasion" }],
    });
  });

  it("reports unknown engine_data properties", () => {
    const source = `engine_data
\tnot_a_property 1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("engine_data property");
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_property");

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.ENGINE_DATA) {
      return;
    }

    expect(element.properties).toHaveLength(0);
  });

  it("reports unresolved string references", () => {
    const source = `engine_data
\tname missing_title
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("missing_title");
  });

  it("reports missing end before eof", () => {
    const source = `engine_data
\ticon k_engine_icon_slayer
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors().some((error) => error.message.includes("end"))).toBe(true);
  });
});
