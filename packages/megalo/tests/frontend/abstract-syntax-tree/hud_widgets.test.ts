import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser } from "../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer } from "../../../frontend/tokens";
import { SymbolKind, type SymbolTableHudWidgetEntry } from "../../../frontend/symbol-table";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const { ast, symbolTable } = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable, diagnostics };
};

const hudWidgetSymbols = (symbolTable: readonly { kind: SymbolKind; name: string }[]) =>
  symbolTable.filter(
    (entry): entry is SymbolTableHudWidgetEntry => entry.kind === SymbolKind.HudWidget,
  );

describe("hudWidgetsParser", () => {
  it("parses a hud_widgets block with custom and built-in widget names", () => {
    const source = `hud_widgets
\tattacker_widget top_left
\tdefender_widget top_left
\tproximity_warning high_center
\tarming_warning low_center
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);
    expect(ast.elements).toHaveLength(1);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.HUD_WIDGETS);
    if (element.elementKind !== ElementKind.HUD_WIDGETS) {
      return;
    }

    expect(element.entries).toHaveLength(4);
    expect(element.entries[0]).toMatchObject({
      name: { value: "attacker_widget" },
      position: { value: "top_left" },
    });
    expect(element.entries[2]).toMatchObject({
      name: { value: "proximity_warning" },
      position: { value: "high_center" },
    });

    expect(hudWidgetSymbols(symbolTable).map((entry) => entry.name)).toEqual([
      "attacker_widget",
      "defender_widget",
      "proximity_warning",
      "arming_warning",
    ]);
  });

  it("parses widget entries without validating position names", () => {
    const source = `hud_widgets
\twatermark not_a_position
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.HUD_WIDGETS) {
      return;
    }

    expect(element.entries[0]).toMatchObject({
      name: { value: "watermark" },
      position: { value: "not_a_position" },
    });
  });

  it("reports missing end before eof", () => {
    const source = `hud_widgets
\twatermark bottom_center
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });
});
