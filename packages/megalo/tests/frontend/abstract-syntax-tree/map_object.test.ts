import { describe, expect, it } from "vitest";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Diagnostics } from "../../../frontend/diagnostics";
import {
  type ObjectLists,
  ObjectListType,
} from "../../../frontend/object-lists";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string, objectLists: ObjectLists = {}) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics, objectLists);
  return { ast, symbolTable: ast.symbolTable.toArray(), diagnostics };
};

describe("mapObjectParser", () => {
  it("parses map_object with filter name and properties", () => {
    const source = `string_table english
\tslayer "slayer"
end
map_object slayer_stuff
\tlabel "slayer"
end
map_object health_packs
\ttype "health_station"
end
`;

    const { ast, diagnostics } = parse(source, {
      [ObjectListType.Objects]: ["health_station"],
    });

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);
    expect(ast.elements).toHaveLength(3);

    const slayer = ast.elements[1]!;
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

    const healthPacks = ast.elements[2]!;
    if (healthPacks.elementKind !== ElementKind.MAP_OBJECT) {
      return;
    }

    expect(healthPacks.filterName).toMatchObject({ value: "health_packs" });
    expect(healthPacks.properties[0]).toMatchObject({
      key: "type",
      value: {
        kind: SyntaxKind.REFERENCE,
        identifier: "health_station",
      },
    });
  });

  it("parses label as string reference and team as keyword", () => {
    const source = `string_table english
\tctf_flag_spawn "CTF Flag Spawn"
end
map_object flag_spawn_point
\tlabel ctf_flag_spawn
\tteam each
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.MAP_OBJECT) {
      return;
    }

    expect(element.properties).toHaveLength(2);
    expect(element.properties[0]).toMatchObject({
      key: "label",
      value: { kind: SyntaxKind.REFERENCE, identifier: "ctf_flag_spawn" },
    });
    expect(element.properties[1]).toMatchObject({
      key: "team",
      value: { kind: SyntaxKind.KEYWORD, value: "each" },
    });
  });

  it("parses user_data and min as integers", () => {
    const source = `map_object phase_markers
\tlabel "phase_marker"
\tuser_data 2
\tmin 1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.MAP_OBJECT) {
      return;
    }

    expect(element.properties).toMatchObject([
      {
        key: "label",
        value: { kind: SyntaxKind.QUOTED_STRING, value: "phase_marker" },
      },
      { key: "user_data", value: { kind: SyntaxKind.INTEGER, value: 2 } },
      { key: "min", value: { kind: SyntaxKind.INTEGER, value: 1 } },
    ]);
  });

  it("reports unknown label string identifiers", () => {
    const source = `map_object slayer_stuff
\tlabel slayer
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("slayer");
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
    expect(
      diagnostics.getErrors().some((error) => error.message.includes("end"))
    ).toBe(true);
  });
});
