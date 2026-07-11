import { describe, expect, it } from "vitest";
import { Diagnostics, SourceLocationType, type SourceCodeLocation } from "../../../frontend/diagnostics";
import {
  SymbolBinder,
  SymbolKind,
  VariableScope,
  VariableType,
  type SymbolTableStringEntry,
} from "../../../frontend/symbol-table";
import { ParserSymbolContext } from "../../../frontend/symbol-table/parser";
import { ParserScopeKind } from "../../../frontend/symbol-table/scope";
import { MEGALO_VERSIONS } from "../../../version";

const version = MEGALO_VERSIONS["107-mcc"];

const loc = (line: number, column = 1): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: { offset: 0, line, column },
  end: { offset: 0, line, column: column + 1 },
});

const createBinder = () => new SymbolBinder(version, new Diagnostics());

describe("SymbolBinder", () => {
  it("addString creates a string symbol with language declaration", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);
    const declaration = loc(2, 5);

    const id = binder.addString({
      name: "slayer_title",
      language: "english",
      declaration,
    });

    expect(id).toBe(0);
    expect(diagnostics.hasErrors()).toBe(false);

    const [entry] = binder.getSymbolTable();
    expect(entry).toMatchObject({
      id: 0,
      name: "slayer_title",
      kind: SymbolKind.String,
      references: [],
    });

    const stringEntry = entry as SymbolTableStringEntry;
    expect(stringEntry.languageDeclarations.get("english")).toEqual(declaration);
  });

  it("addString merges language declarations for the same symbol name", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);
    const englishDeclaration = loc(2);
    const frenchDeclaration = loc(5);

    const englishId = binder.addString({
      name: "msg_welcome",
      language: "english",
      declaration: englishDeclaration,
    });
    const frenchId = binder.addString({
      name: "msg_welcome",
      language: "french",
      declaration: frenchDeclaration,
    });

    expect(englishId).toBe(0);
    expect(frenchId).toBe(0);
    expect(diagnostics.hasErrors()).toBe(false);
    expect(binder.getSymbolTable()).toHaveLength(1);

    const stringEntry = binder.getSymbolTable()[0] as SymbolTableStringEntry;
    expect(stringEntry.languageDeclarations.get("english")).toEqual(englishDeclaration);
    expect(stringEntry.languageDeclarations.get("french")).toEqual(frenchDeclaration);
  });

  it("addString reports duplicate declarations for the same language", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);
    const firstDeclaration = loc(2);
    const duplicateDeclaration = loc(3);

    binder.addString({
      name: "msg_welcome",
      language: "english",
      declaration: firstDeclaration,
    });
    const duplicateId = binder.addString({
      name: "msg_welcome",
      language: "english",
      declaration: duplicateDeclaration,
    });

    expect(duplicateId).toBeUndefined();
    expect(diagnostics.hasErrors()).toBe(true);
    expect(diagnostics.getErrors()[0]?.message).toContain("msg_welcome");
    expect(diagnostics.getErrors()[0]?.location).toEqual(duplicateDeclaration);

    const stringEntry = binder.getSymbolTable()[0] as SymbolTableStringEntry;
    expect(stringEntry.languageDeclarations.get("english")).toEqual(firstDeclaration);
    expect(stringEntry.languageDeclarations.size).toBe(1);
  });

  it("addVariable and addConstant append distinct entries", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);
    const variableDeclaration = loc(1);
    const constantDeclaration = loc(2);

    const variableId = binder.addVariable({
      name: "player_count",
      type: 1,
      declaration: variableDeclaration,
      scope: VariableScope.Global,
    });
    const constantId = binder.addConstant({
      name: "max_score",
      declaration: constantDeclaration,
    });

    expect(variableId).toBe(0);
    expect(constantId).toBe(1);
    expect(diagnostics.hasErrors()).toBe(false);

    const table = binder.getSymbolTable();
    expect(table).toHaveLength(2);
    expect(table[0]).toMatchObject({
      id: 0,
      name: "player_count",
      kind: SymbolKind.Variable,
      type: 1,
      declaration: variableDeclaration,
      references: [],
    });
    expect(table[1]).toMatchObject({
      id: 1,
      name: "max_score",
      kind: SymbolKind.Constant,
      type: 1,
      declaration: constantDeclaration,
      references: [],
    });
  });

  it("addReference records reference locations on a symbol", () => {
    const binder = createBinder();
    const declaration = loc(2);
    const reference = loc(10, 8);

    const id = binder.addString({
      name: "msg_welcome",
      language: "english",
      declaration,
    });
    binder.addReference(id!, reference);

    const stringEntry = binder.getSymbolTable()[0] as SymbolTableStringEntry;
    expect(stringEntry.references).toEqual([reference]);
  });

  it("registers built-in timers in the global scope", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);
    const parser = new ParserSymbolContext(version, diagnostics, binder);

    for (const name of ["round_timer", "sudden_death_timer", "grace_period_timer"] as const) {
      const id = parser.lookupSymbol(name);
      expect(id).toBeDefined();
      expect(parser.getSymbolEntry(id!)).toMatchObject({
        kind: SymbolKind.Variable,
        type: VariableType.Timer,
        name,
      });
    }
  });

  it("pushScope and popScope isolate variable lookups", () => {
    const diagnostics = new Diagnostics();
    const binder = new SymbolBinder(version, diagnostics);
    const parser = new ParserSymbolContext(version, diagnostics, binder);

    parser.addVariableToScope({
      name: "outer_var",
      type: VariableType.Number,
      declaration: loc(1),
      scope: VariableScope.Global,
    });

    parser.pushScope({ kind: ParserScopeKind.Block });
    parser.addVariableToScope({
      name: "inner_var",
      type: VariableType.Number,
      declaration: loc(2),
      scope: VariableScope.Global,
    });

    expect(parser.lookupSymbol("inner_var")).toBeDefined();
    expect(parser.lookupSymbol("outer_var")).toBeDefined();
    expect(parser.currentScopeIsGlobal()).toBe(false);

    parser.popScope();

    expect(parser.lookupSymbol("inner_var")).toBeUndefined();
    expect(parser.lookupSymbol("outer_var")).toBeDefined();
    expect(parser.currentScopeIsGlobal()).toBe(true);
  });
});
