import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer } from "../../../frontend/tokens";
import {
  SymbolKind,
  type SymbolTableLoadoutEntry,
  type SymbolTableLoadoutPaletteEntry,
} from "../../../frontend/symbol-table";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const { ast, symbolTable } = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable, diagnostics };
};

const loadoutSymbols = (symbolTable: readonly { kind: SymbolKind; name: string }[]) =>
  symbolTable.filter(
    (entry): entry is SymbolTableLoadoutEntry => entry.kind === SymbolKind.Loadout,
  );

const loadoutPaletteSymbols = (symbolTable: readonly { kind: SymbolKind; name: string }[]) =>
  symbolTable.filter(
    (entry): entry is SymbolTableLoadoutPaletteEntry => entry.kind === SymbolKind.LoadoutPalette,
  );

const minimalLoadout = (name: string) => `loadout ${name}
\tname ${name}_label
end
`;

describe("loadoutPaletteParser", () => {
  it("parses loadout_palette blocks with item loadout references", () => {
    const source = `${minimalLoadout("loadout_scout")}
${minimalLoadout("loadout_ninja")}
${minimalLoadout("loadout_air_assault")}
${minimalLoadout("loadout_specter")}
${minimalLoadout("loadout_guard")}
loadout_palette slayer_loadouts_t1
\titem loadout_scout
\titem loadout_ninja
end
loadout_palette slayer_loadouts_t2
\titem loadout_scout
\titem loadout_ninja
\titem loadout_air_assault
\titem loadout_specter
end
loadout_palette slayer_loadouts_t3
\titem loadout_scout
\titem loadout_ninja
\titem loadout_air_assault
\titem loadout_specter
\titem loadout_guard
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const palettes = ast.elements.filter(
      (element) => element.elementKind === ElementKind.LOADOUT_PALETTE,
    );
    expect(palettes).toHaveLength(3);

    const tier1 = palettes[0]!;
    if (tier1.elementKind !== ElementKind.LOADOUT_PALETTE) {
      return;
    }

    expect(tier1.name).toMatchObject({ value: "slayer_loadouts_t1" });
    expect(tier1.items).toHaveLength(2);
    expect(tier1.items[0]).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "loadout_scout",
    });
    expect(tier1.items[1]).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "loadout_ninja",
    });

    const tier3 = palettes[2]!;
    if (tier3.elementKind !== ElementKind.LOADOUT_PALETTE) {
      return;
    }

    expect(tier3.items).toHaveLength(5);
    expect(tier3.items[4]).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "loadout_guard",
    });

    expect(loadoutPaletteSymbols(symbolTable).map((entry) => entry.name)).toEqual([
      "slayer_loadouts_t1",
      "slayer_loadouts_t2",
      "slayer_loadouts_t3",
    ]);

    const scout = loadoutSymbols(symbolTable).find((entry) => entry.name === "loadout_scout");
    expect(scout?.references.length).toBeGreaterThanOrEqual(3);
  });

  it("reports unknown loadout palette properties", () => {
    const source = `${minimalLoadout("loadout_scout")}
loadout_palette slayer_loadouts_t1
\tnot_a_property loadout_scout
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("item or end");
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_property");

    const element = ast.elements.find((entry) => entry.elementKind === ElementKind.LOADOUT_PALETTE);
    if (element?.elementKind !== ElementKind.LOADOUT_PALETTE) {
      return;
    }

    expect(element.items).toHaveLength(0);
  });

  it("parses unresolved loadout references leniently", () => {
    const source = `loadout_palette slayer_loadouts_t1
\titem loadout_scout
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements.find((entry) => entry.elementKind === ElementKind.LOADOUT_PALETTE);
    if (element?.elementKind !== ElementKind.LOADOUT_PALETTE) {
      return;
    }

    expect(element.items[0]).toMatchObject({
      kind: SyntaxKind.KEYWORD,
      value: "loadout_scout",
    });
  });

  it("reports missing end before eof", () => {
    const source = `${minimalLoadout("loadout_scout")}
loadout_palette slayer_loadouts_t1
\titem loadout_scout
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });
});
