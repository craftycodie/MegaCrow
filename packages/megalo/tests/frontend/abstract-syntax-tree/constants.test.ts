import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer } from "../../../frontend/tokens";
import {
  SymbolKind,
  type SymbolTableConstantEntry,
} from "../../../frontend/symbol-table";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const { ast, symbolTable } = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable, diagnostics };
};

const userConstantSymbols = (symbolTable: readonly { kind: SymbolKind; name: string }[]) =>
  symbolTable.filter(
    (entry): entry is SymbolTableConstantEntry =>
      entry.kind === SymbolKind.Constant &&
      entry.name !== "true" &&
      entry.name !== "false",
  );

describe("constantsParser", () => {
  it("parses a constants block with number entries", () => {
    const source = `constants
\tnumber k_special_death_type_none 0
\tnumber k_special_death_type_melee 1
\tnumber k_special_death_type_headshot 5
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);
    expect(ast.elements).toHaveLength(1);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.CONSTANTS);
    if (element.elementKind !== ElementKind.CONSTANTS) {
      return;
    }

    expect(element.entries).toHaveLength(3);
    expect(element.entries[2]?.value).toMatchObject({
      kind: SyntaxKind.INTEGER,
      value: 5,
    });

    expect(userConstantSymbols(symbolTable)).toHaveLength(3);
  });

  it("parses true and false as references to built-in constants", () => {
    const source = `constants
\tnumber k_special_death_type_none 0
\tnumber k_special_death_type_melee 1
\tnumber k_special_death_type_headshot true
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.failed).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.CONSTANTS) {
      return;
    }

    expect(element.entries[2]?.value).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "true",
      symbolId: 0,
    });

    const builtInTrue = symbolTable.find((entry) => entry.name === "true");
    expect(builtInTrue?.references).toHaveLength(1);
  });

  it("parses a constant value that references another constant", () => {
    const source = `constants
\tnumber k_special_death_type_none 0
\tnumber k_special_death_type_melee 1
\tnumber k_special_death_type_headshot k_special_death_type_melee
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.CONSTANTS) {
      return;
    }

    expect(element.entries[2]?.value).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      identifier: "k_special_death_type_melee",
      symbolId: 3,
    });

    const melee = userConstantSymbols(symbolTable).find(
      (entry) => entry.name === "k_special_death_type_melee",
    );
    expect(melee?.references).toHaveLength(1);
  });

  it("reports unexpected tokens inside the block", () => {
    const source = `constants
\ttimer k_bad 0
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("timer");
  });

  it("reports missing integer value", () => {
    const source = `constants
\tnumber k_bad
end
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });

  it("reports missing end before eof", () => {
    const source = `constants
\tnumber k_special_death_type_none 0
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });
});
