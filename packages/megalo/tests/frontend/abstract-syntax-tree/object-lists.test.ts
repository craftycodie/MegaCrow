import { describe, expect, it } from "vitest";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { ParserContext } from "../../../frontend/abstract-syntax-tree/context";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import {
  ObjectListParameter,
  parameterParserBuilder,
} from "../../../frontend/abstract-syntax-tree/parameters";
import { Diagnostics, SourceLocationType } from "../../../frontend/diagnostics";
import { ObjectListType } from "../../../frontend/object-lists";
import { SymbolBinder, SymbolKind } from "../../../frontend/symbol-table";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const version = MEGALO_VERSIONS["107-mcc"];

describe("object list parameters", () => {
  it("resolves object list entries to REFERENCE symbols with ObjectListLocation", () => {
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(version).lex("sniper_rifle", diagnostics);
    const binder = new SymbolBinder(version, diagnostics);
    const ctx = new ParserContext(tokens, version, diagnostics, binder, {
      [ObjectListType.Weapons]: ["dmr", "assault_rifle", "sniper_rifle"],
    });

    const nodes = parameterParserBuilder([
      ObjectListParameter(ObjectListType.Weapons),
    ])(ctx, tokens[0]!.location);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "sniper_rifle",
    });

    const symbolId =
      nodes[0]!.kind === SyntaxKind.REFERENCE ? nodes[0].symbolId : undefined;
    expect(symbolId).toBeDefined();
    const entry = binder.getSymbolEntry(symbolId!);
    expect(entry).toMatchObject({
      kind: SymbolKind.ObjectListItem,
      name: "sniper_rifle",
      objectType: ObjectListType.Weapons,
      index: 2,
      declaration: {
        type: SourceLocationType.OBJECT_LIST,
        objectType: ObjectListType.Weapons,
        source: { line: 2, column: 0, offset: -1 },
      },
    });
    expect(entry?.references).toHaveLength(1);
  });

  it("rejects unknown object list entries", () => {
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(version).lex("not_a_weapon", diagnostics);
    const binder = new SymbolBinder(version, diagnostics);
    const ctx = new ParserContext(tokens, version, diagnostics, binder, {
      [ObjectListType.Weapons]: ["dmr", "assault_rifle"],
    });

    const nodes = parameterParserBuilder([
      ObjectListParameter(ObjectListType.Weapons),
    ])(ctx, tokens[0]!.location);

    // Fallback lenient parse yields a keyword when the object-list slot fails.
    expect(nodes[0]?.kind).not.toBe(SyntaxKind.REFERENCE);
  });

  it("resolves map_object type against objects.txt via Parser.parse", () => {
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(version).lex(
      `map_object health_packs
\ttype "health_station"
end
`,
      diagnostics
    );
    const ast = new Parser(version).parse(tokens, diagnostics, {
      [ObjectListType.Objects]: [
        "flag_stand",
        "health_station",
        "capture_plate",
      ],
    });

    expect(diagnostics.hasErrors()).toBe(false);
    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.MAP_OBJECT);
    if (element.elementKind !== ElementKind.MAP_OBJECT) {
      return;
    }

    const value = element.properties[0]?.value;
    expect(value).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "health_station",
    });
    if (value?.kind !== SyntaxKind.REFERENCE) {
      return;
    }

    expect(ast.symbolTable[value.symbolId]).toMatchObject({
      kind: SymbolKind.ObjectListItem,
      objectType: ObjectListType.Objects,
      index: 1,
    });
  });

  it("rejects unknown map_object type names when objects.txt is loaded", () => {
    const diagnostics = new Diagnostics();
    const tokens = new Lexer(version).lex(
      `map_object bad
\ttype "not_an_object"
end
`,
      diagnostics
    );
    new Parser(version).parse(tokens, diagnostics, {
      [ObjectListType.Objects]: ["health_station"],
    });

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toBe(
      "This is not a valid object type."
    );
  });
});
