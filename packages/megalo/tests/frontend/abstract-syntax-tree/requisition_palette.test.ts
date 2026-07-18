import { describe, expect, it } from "vitest";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Diagnostics } from "../../../frontend/diagnostics";
import {
  SymbolKind,
  type SymbolTableRequisitionPaletteEntry,
} from "../../../frontend/symbol-table";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const requisitionPaletteSymbols = (
  symbolTable: readonly { kind: SymbolKind; name: string }[]
) =>
  symbolTable.filter(
    (entry): entry is SymbolTableRequisitionPaletteEntry =>
      entry.kind === SymbolKind.RequisitionPalette
  );

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable: ast.symbolTable.toArray(), diagnostics };
};

describe("requisitionPaletteParser", () => {
  it("parses requisition_palette blocks with baseline and item entries", () => {
    const source = `requisition_palette covy_palette_gold
\tbaseline elite
end
requisition_palette covy_palette_silver
\tbaseline elite
\titem "banshee" disabled
\titem "wraith_heavy" disabled
\titem "energy_blade" disabled
end
requisition_palette covy_palette_bronze
\tbaseline empty
\titem "needler" enabled
\titem "plasma_pistol" enabled
\titem "plasma_carbine" enabled
end
requisition_palette unsc_palette_gold
\tbaseline spartan
\titem "wolverine" disabled
\titem "falcon" enabled
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    expect(
      requisitionPaletteSymbols(symbolTable).map((entry) => entry.name)
    ).toEqual([
      "covy_palette_gold",
      "covy_palette_silver",
      "covy_palette_bronze",
      "unsc_palette_gold",
    ]);

    const palettes = ast.elements.filter(
      (element) => element.elementKind === ElementKind.REQUISITION_PALETTE
    );
    expect(palettes).toHaveLength(4);

    const gold = palettes[0]!;
    if (gold.elementKind !== ElementKind.REQUISITION_PALETTE) {
      return;
    }

    expect(gold.name).toMatchObject({ value: "covy_palette_gold" });
    expect(gold.baseline).toMatchObject({ value: "elite" });
    expect(gold.items).toHaveLength(0);

    const silver = palettes[1]!;
    if (silver.elementKind !== ElementKind.REQUISITION_PALETTE) {
      return;
    }

    expect(silver.baseline).toMatchObject({ value: "elite" });
    expect(silver.items).toHaveLength(3);
    expect(silver.items[0]).toMatchObject({
      name: { kind: SyntaxKind.QUOTED_STRING, value: "banshee" },
      state: { kind: SyntaxKind.KEYWORD, value: "disabled" },
    });
    expect(silver.items[2]).toMatchObject({
      name: { kind: SyntaxKind.QUOTED_STRING, value: "energy_blade" },
      state: { kind: SyntaxKind.KEYWORD, value: "disabled" },
    });

    const bronze = palettes[2]!;
    if (bronze.elementKind !== ElementKind.REQUISITION_PALETTE) {
      return;
    }

    expect(bronze.baseline).toMatchObject({ value: "empty" });
    expect(bronze.items).toHaveLength(3);
    expect(bronze.items[0]?.state).toMatchObject({
      kind: SyntaxKind.KEYWORD,
      value: "enabled",
    });

    const unsc = palettes[3]!;
    if (unsc.elementKind !== ElementKind.REQUISITION_PALETTE) {
      return;
    }

    expect(unsc.baseline).toMatchObject({ value: "spartan" });
    expect(unsc.items[0]?.state).toMatchObject({ value: "disabled" });
    expect(unsc.items[1]).toMatchObject({
      name: { kind: SyntaxKind.QUOTED_STRING, value: "falcon" },
      state: { kind: SyntaxKind.KEYWORD, value: "enabled" },
    });
  });

  it("reports unknown requisition_palette properties", () => {
    const source = `requisition_palette test_palette
\tnot_a_property elite
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_property");

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.REQUISITION_PALETTE) {
      return;
    }

    expect(element.baseline).toBeUndefined();
    expect(element.items).toHaveLength(0);
  });

  it("accepts any identifier as an item state", () => {
    const source = `requisition_palette test_palette
\tbaseline spartan
\titem "falcon" maybe
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.REQUISITION_PALETTE) {
      return;
    }

    expect(element.items[0]?.state).toMatchObject({
      kind: SyntaxKind.KEYWORD,
      value: "maybe",
    });
  });

  it("reports missing quoted string on item lines", () => {
    const source = `requisition_palette test_palette
\titem falcon disabled
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("QuotedString");
  });

  it("reports missing end before eof", () => {
    const source = `requisition_palette test_palette
\tbaseline spartan
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(
      diagnostics.getErrors().some((error) => error.message.includes("end"))
    ).toBe(true);
  });
});
