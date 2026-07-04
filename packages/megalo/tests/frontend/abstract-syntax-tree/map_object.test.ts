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

describe("mapObjectParser", () => {
  it("parses map_object with filter name and keyword quoted-string properties", () => {
    const source = `map_object slayer_stuff
\tlabel "slayer"
end
map_object health_packs
\ttype "health_station"
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);
    expect(ast.elements).toHaveLength(2);

    const slayer = ast.elements[0]!;
    expect(slayer.elementKind).toBe(ElementKind.MAP_OBJECT);
    if (slayer.elementKind !== ElementKind.MAP_OBJECT) {
      return;
    }

    expect(slayer.filterName).toMatchObject({ value: "slayer_stuff" });
    expect(slayer.properties).toHaveLength(1);
    expect(slayer.properties[0]).toMatchObject({
      key: "label",
      value: { kind: SyntaxKind.QUOTED_STRING, value: "slayer" },
    });

    const healthPacks = ast.elements[1]!;
    if (healthPacks.elementKind !== ElementKind.MAP_OBJECT) {
      return;
    }

    expect(healthPacks.filterName).toMatchObject({ value: "health_packs" });
    expect(healthPacks.properties[0]).toMatchObject({
      key: "type",
      value: { kind: SyntaxKind.QUOTED_STRING, value: "health_station" },
    });
  });

  it("parses multiple keyword quoted-string properties in one block", () => {
    const source = `map_object flag_spawn_point
\tlabel "ctf_flag_spawn"
\tteam "each"
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.MAP_OBJECT) {
      return;
    }

    expect(element.properties).toHaveLength(2);
    expect(element.properties[0]).toMatchObject({
      key: "label",
      value: { kind: SyntaxKind.QUOTED_STRING, value: "ctf_flag_spawn" },
    });
    expect(element.properties[1]).toMatchObject({
      key: "team",
      value: { kind: SyntaxKind.QUOTED_STRING, value: "each" },
    });
  });

  it("reports missing quoted string values", () => {
    const source = `map_object slayer_stuff
\tlabel slayer
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("QuotedString");
  });

  it("skips invalid property keys without adding empty entries", () => {
    const source = `map_object test_filter
\t123 "bad"
\tlabel "good"
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.MAP_OBJECT) {
      return;
    }

    expect(element.properties).toHaveLength(1);
    expect(element.properties[0]).toMatchObject({
      key: "label",
      value: { kind: SyntaxKind.QUOTED_STRING, value: "good" },
    });
  });

  it("reports missing filter name on the header line", () => {
    const source = `map_object
\tlabel "slayer"
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
  });

  it("reports missing end before eof", () => {
    const source = `map_object slayer_stuff
\tlabel "slayer"
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors().some((error) => error.message.includes("end"))).toBe(true);
  });
});
