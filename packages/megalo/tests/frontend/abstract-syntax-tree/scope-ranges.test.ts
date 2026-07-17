import { describe, expect, it } from "vitest";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Diagnostics } from "../../../frontend/diagnostics";
import { SymbolKind, VariableType } from "../../../frontend/symbol-table";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const parse = (source: string) => {
  const diagnostics = new Diagnostics();
  const version = MEGALO_VERSIONS["107-mcc"];
  const tokens = new Lexer(version).lex(source, diagnostics);
  const ast = new Parser(version).parse(tokens, diagnostics);
  return { ast, symbolTable: ast.symbolTable, diagnostics };
};

describe("symbol scope ranges and symbolId stamping", () => {
  it("records from/to on temporaries and leaves globals open-ended", () => {
    const source = [
      "variables global",
      "\tlocal number score 0",
      "end",
      "",
      "trigger general",
      "begin",
      "\ttemporary number score 1",
      "\tcondition game_is_forge",
      "end",
    ].join("\n");

    const { symbolTable, diagnostics } = parse(source);
    expect(diagnostics.hasErrors()).toBe(false);

    const scores = symbolTable.filter(
      (entry) => entry.kind === SymbolKind.Variable && entry.name === "score",
    );
    expect(scores.length).toBeGreaterThanOrEqual(2);

    const globalScore = scores.find(
      (entry) => entry.range.end.offset === -1 && entry.range.start.offset !== -1,
    );
    const temporaryScore = scores.find((entry) => entry.range.end.offset !== -1);

    expect(globalScore).toBeDefined();
    expect(temporaryScore).toBeDefined();
    expect(temporaryScore!.range.start.offset).toBeGreaterThanOrEqual(0);
    expect(temporaryScore!.range.end.offset).toBeGreaterThan(temporaryScore!.range.start.offset);
  });

  it("stamps symbolId on condition references to the in-scope variable", () => {
    const source = [
      "variables global",
      "\tlocal number score 0",
      "end",
      "",
      "trigger general",
      "begin",
      "\tcondition if score equal_to 0",
      "end",
    ].join("\n");

    const { ast, symbolTable, diagnostics } = parse(source);
    expect(diagnostics.hasErrors()).toBe(false);

    const score = symbolTable.find(
      (entry) =>
        entry.kind === SymbolKind.Variable
        && entry.name === "score"
        && entry.type === VariableType.Number
        && entry.range.start.offset !== -1
        && entry.range.end.offset === -1,
    );
    expect(score).toBeDefined();
    expect(score!.references.length).toBeGreaterThanOrEqual(1);

    const trigger = ast.elements.find((element) => element.elementKind === ElementKind.TRIGGER);
    expect(trigger).toBeDefined();

    const findReference = (node: unknown): { kind: SyntaxKind; symbolId?: number } | undefined => {
      if (!node || typeof node !== "object") {
        return undefined;
      }
      const record = node as Record<string, unknown>;
      if (record.kind === SyntaxKind.REFERENCE && record.identifier === "score") {
        return record as { kind: SyntaxKind; symbolId?: number };
      }
      for (const value of Object.values(record)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            const found = findReference(item);
            if (found) {
              return found;
            }
          }
        } else {
          const found = findReference(value);
          if (found) {
            return found;
          }
        }
      }
      return undefined;
    };

    const reference = findReference(ast);
    expect(reference).toMatchObject({
      kind: SyntaxKind.REFERENCE,
      symbolId: score!.id,
    });
  });
});
