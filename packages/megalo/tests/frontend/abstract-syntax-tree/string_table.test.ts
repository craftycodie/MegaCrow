import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser } from "../../../frontend/abstract-syntax-tree";
import { SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { Diagnostics } from "../../../frontend/diagnostics";
import { Lexer } from "../../../frontend/tokens";
import {
  SymbolKind,
  type SymbolTableStringEntry,
} from "../../../frontend/symbol-table";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const { ast, symbolTable } = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable, diagnostics };
};

const stringSymbols = (symbolTable: readonly { kind: SymbolKind; name: string }[]) =>
  symbolTable.filter(
    (entry): entry is SymbolTableStringEntry => entry.kind === SymbolKind.String,
  );

describe("stringTableParser", () => {
  it("parses a string_table block with language and entries", () => {
    const source = `string_table english
\tslayer_title "Slayer"
\tslayer_description "Score points by killing players on the opposing team."
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);
    expect(ast.elements).toHaveLength(1);

    const element = ast.elements[0]!;
    expect(element.elementKind).toBe(ElementKind.STRING_TABLE);
    if (element.elementKind !== ElementKind.STRING_TABLE) {
      return;
    }

    expect(element.language.value).toBe("english");
    expect(element.entries).toHaveLength(2);
    expect(element.entries[0]?.symbol).toMatchObject({
      value: "slayer_title",
    });
    expect(element.entries[0]?.value).toMatchObject({
      kind: SyntaxKind.QUOTED_STRING,
      value: "Slayer",
    });
    expect(element.entries[1]?.symbol).toMatchObject({
      value: "slayer_description",
    });
    expect(element.entries[1]?.value).toMatchObject({
      kind: SyntaxKind.QUOTED_STRING,
      value: "Score points by killing players on the opposing team.",
    });

    const symbols = stringSymbols(symbolTable);
    expect(symbols).toHaveLength(2);
    expect(symbols.map((entry) => entry.name)).toEqual([
      "slayer_title",
      "slayer_description",
    ]);
    expect(symbols.every((entry) => entry.languageDeclarations.has("english"))).toBe(
      true,
    );
  });

  it("accepts any identifier as language", () => {
    const source = `string_table test
\tmsg_welcome "Welcome"
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.STRING_TABLE) {
      return;
    }

    expect(element.language.value).toBe("test");
    expect(element.entries).toHaveLength(1);

    const [symbol] = stringSymbols(symbolTable);
    expect(symbol?.name).toBe("msg_welcome");
    expect(symbol?.languageDeclarations.get("test")).toBeDefined();
  });

  it("parses without a language identifier on the same line", () => {
    const source = `string_table
\tmsg_welcome "Welcome"
end
`;

    const { ast, symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const element = ast.elements[0]!;
    if (element.elementKind !== ElementKind.STRING_TABLE) {
      return;
    }

    expect(element.language.value).toBe("");
    expect(element.entries).toHaveLength(1);

    const [symbol] = stringSymbols(symbolTable);
    expect(symbol?.languageDeclarations.has("")).toBe(true);
  });

  it("binds the same symbol name across languages into one entry", () => {
    const source = `string_table english
\tmsg_welcome "Welcome"
end
string_table french
\tmsg_welcome "Bienvenue"
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(false);

    const symbols = stringSymbols(symbolTable);
    expect(symbols).toHaveLength(1);
    expect(symbols[0]?.name).toBe("msg_welcome");
    expect([...symbols[0]!.languageDeclarations.keys()]).toEqual([
      "english",
      "french",
    ]);
  });

  it("reports duplicate string symbols in the same language", () => {
    const source = `string_table english
\tmsg_welcome "Welcome"
\tmsg_welcome "Hello again"
end
`;

    const { symbolTable, diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("msg_welcome");
    expect(stringSymbols(symbolTable)).toHaveLength(1);
  });

  it("reports missing end before eof", () => {
    const source = `string_table english
\tmsg_welcome "Welcome"
`;

    const { diagnostics } = parse(source);

    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("end");
  });
});
