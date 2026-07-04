import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer } from "../../../frontend/tokens";
import { SymbolKind } from "../../../frontend/symbol-table";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const { ast, symbolTable } = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable, diagnostics };
};

describe("gameStatsParser", () => {
  it("parses game_stats entries with five fields per line", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
\tstat_carry_time_text "Carry Time"
\tstat_plants_text "Plants"
\tstat_returns_text "Returns"
end
game_stats
\tstat_caps number stat_caps_text none 1
\tstat_carry_time timer stat_carry_time_text none 0
\tstat_plants number stat_plants_text none 0
\tstat_returns number stat_returns_text none 0
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[1]!;
    expect(element.elementKind).toBe(ElementKind.GAME_STATS);
    if (element.elementKind !== ElementKind.GAME_STATS) {
      return;
    }

    expect(element.entries).toHaveLength(4);
    expect(element.entries[0]).toMatchObject({
      name: { value: "stat_caps" },
      type: { value: "number" },
      labelString: { kind: SyntaxKind.REFERENCE, identifier: "stat_caps_text" },
      unitString: { kind: SyntaxKind.KEYWORD, value: "none" },
      flags: { kind: SyntaxKind.INTEGER, value: 1 },
    });
    expect(element.entries[1]).toMatchObject({
      name: { value: "stat_carry_time" },
      type: { value: "timer" },
      labelString: { kind: SyntaxKind.REFERENCE, identifier: "stat_carry_time_text" },
      unitString: { kind: SyntaxKind.KEYWORD, value: "none" },
      flags: { kind: SyntaxKind.INTEGER, value: 0 },
    });
  });

  it("adds string references for label_string fields", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number stat_caps_text none 1
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_STATS) {
      return;
    }

    expect(element.entries[0]?.labelString).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "stat_caps_text",
    });

    const stringEntry = symbolTable.find(
      (entry) => entry.kind === SymbolKind.String && entry.name === "stat_caps_text",
    );
    expect(stringEntry?.references).toHaveLength(1);
  });

  it("parses label_string as a string literal or string reference", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number "Caps" none 1
\tstat_score number stat_caps_text none 0
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_STATS) {
      return;
    }

    expect(element.entries[0]?.labelString).toMatchObject({
      kind: SyntaxKind.QUOTED_STRING,
      value: "Caps",
    });
    expect(element.entries[1]?.labelString).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "stat_caps_text",
    });
  });

  it("parses unit_string as a string literal or string reference", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
\tstat_caps_unit "pts"
end
game_stats
\tstat_caps number stat_caps_text "inline unit" 1
\tstat_score number stat_caps_text stat_caps_unit 0
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.GAME_STATS) {
      return;
    }

    expect(element.entries[0]?.unitString).toMatchObject({
      kind: SyntaxKind.QUOTED_STRING,
      value: "inline unit",
    });
    expect(element.entries[1]?.unitString).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "stat_caps_unit",
    });

    const unitString = symbolTable.find(
      (entry) => entry.kind === SymbolKind.String && entry.name === "stat_caps_unit",
    );
    expect(unitString?.references).toHaveLength(1);
  });

  it("reports unresolved unit_string references", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number stat_caps_text missing_unit 1
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("missing_unit");
  });

  it("reports unknown statistic format types", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps not_a_type stat_caps_text none 1
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_type");
  });

  it("reports unresolved label_string references", () => {
    const source = `game_stats
\tstat_caps number missing_label none 1
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("missing_label");
  });

  it("reports missing end before eof", () => {
    const source = `string_table english
\tstat_caps_text "Caps"
end
game_stats
\tstat_caps number stat_caps_text none 1
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors().some((error) => error.message.includes("end"))).toBe(true);
  });
});
