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

describe("playerRatingParser", () => {
  it("parses player_rating fields as a key-value map", () => {
    const source = `player_rating
\tkill_weight 1
\tassist_weight 0.5
\tbetrayal_weight 1
\tdeath_weight 0.5
\tloss_scalar 1
\trating_scale 1
\tnormalize_by_max_kills 1
\tbase_value 1000
\trange 1000
\tcustom_stat_0 0
\tcustom_stat_1 0
\tcustom_stat_2 0
\tcustom_stat_3 0
\tshow_in_scoreboard 0
\texpansion_0 1
\texpansion_1 2
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.PLAYER_RATING);
    if (element.elementKind !== ElementKind.PLAYER_RATING) {
      return;
    }

    expect(element.fields).toHaveLength(16);
    expect(element.fields[0]).toMatchObject({
      key: "kill_weight",
      value: { kind: SyntaxKind.INTEGER, value: 1 },
    });
    expect(element.fields[1]).toMatchObject({
      key: "assist_weight",
      value: { kind: SyntaxKind.FLOATING_POINT, value: 0.5 },
    });
    expect(element.fields[7]).toMatchObject({
      key: "base_value",
      value: { kind: SyntaxKind.INTEGER, value: 1000 },
    });
    expect(element.fields[8]).toMatchObject({
      key: "range",
      value: { kind: SyntaxKind.INTEGER, value: 1000 },
    });
    expect(element.fields[15]).toMatchObject({
      key: "expansion_1",
      value: { kind: SyntaxKind.INTEGER, value: 2 },
    });
  });

  it("accepts unknown field names", () => {
    const source = `player_rating
\tfuture_field 1
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.PLAYER_RATING) {
      return;
    }

    expect(element.fields[0]).toMatchObject({
      key: "future_field",
      value: { kind: SyntaxKind.INTEGER, value: 1 },
    });
  });

  it("parses constant values as references", () => {
    const source = `constants number
\tkill_weight_override 2
end
player_rating
\tkill_weight kill_weight_override
end
`;

    const { ast, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[1]!;
    if (element.elementKind !== ElementKind.PLAYER_RATING) {
      return;
    }

    expect(element.fields[0]).toMatchObject({
      key: "kill_weight",
      value: { kind: SyntaxKind.REFERENCE, identifier: "kill_weight_override" },
    });
  });

  it("reports unresolved identifier values", () => {
    const source = `player_rating
\tkill_weight not_a_constant
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("not_a_constant");
  });

  it("reports missing end before eof", () => {
    const source = `player_rating
\tkill_weight 1
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors().some((error) => error.message.includes("end"))).toBe(true);
  });
});
