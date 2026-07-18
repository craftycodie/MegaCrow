import type { MegaloVersion } from "../../version";
import {
  BUILT_IN_POSITION,
  type Diagnostics,
  type SourceCodeLocation,
  type SourceLocation,
  SourceLocationType,
  type SourcePosition,
} from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import {
  type StringTableEntry,
  stringTableEntry,
} from "../intermediate-representation/game/string_table";
import type { StringTableLanguage } from "../language-configuration/omni/strings";
import type { ObjectListType } from "../object-lists";

export enum SymbolKind {
  Constant = 0,
  Variable = 1,
  String = 2,
  GameOption = 3,
  HudWidget = 4,
  Loadout = 5,
  LoadoutPalette = 6,
  RequisitionPalette = 7,
  ObjectListItem = 8,
}

// Modelled based on Bungie.Megalo.VariableType
export enum VariableType {
  Timer = 0,
  Number = 1,
  Team = 2,
  Player = 3,
  Object = 4,
}

export enum VariableScope {
  Global = 0,
  Team = 1,
  Player = 2,
  Object = 3,
}

export type SymbolId = number;

export type SymbolTableEntryBase = {
  id: SymbolId;
  name: string;

  /**
   * Lexical scope range.
   * `start` is the declaration position (built-ins use `BUILT_IN_POSITION`).
   * `end` is the exclusive end of visibility; open-ended symbols (globals, built-ins)
   * keep `end` as `BUILT_IN_POSITION` until EOF.
   */
  range: SourceCodeLocation;

  references: SourceCodeLocation[];
};

const declarationRange = (declaration: SourceLocation): SourceCodeLocation => {
  if (declaration.type === SourceLocationType.BUILT_IN) {
    return {
      type: SourceLocationType.SOURCE_CODE,
      start: BUILT_IN_POSITION,
      end: BUILT_IN_POSITION,
    };
  }
  if (declaration.type === SourceLocationType.OBJECT_LIST) {
    return {
      type: SourceLocationType.SOURCE_CODE,
      start: declaration.source,
      end: BUILT_IN_POSITION,
    };
  }
  return {
    type: SourceLocationType.SOURCE_CODE,
    start: declaration.start,
    end: BUILT_IN_POSITION,
  };
};

export type SymbolTableVariableEntry = SymbolTableEntryBase & {
  kind: SymbolKind.Variable;
  type: VariableType;
  declaration: SourceLocation;
  scope: VariableScope;
};

export type SymbolTableGameOptionEntry = SymbolTableEntryBase & {
  kind: SymbolKind.GameOption;
  type: VariableType.Number;
  declaration: SourceLocation;
};

export type SymbolTableConstantEntry = SymbolTableEntryBase & {
  kind: SymbolKind.Constant;
  type: VariableType.Number;
  declaration: SourceLocation;
  value: number;
};

export type SymbolTableStringEntry = SymbolTableEntryBase & {
  kind: SymbolKind.String;
  languageDeclarations: Partial<Record<StringTableLanguage, SourceLocation>>;
  languageContents: StringTableEntry;
};

export type SymbolTableHudWidgetEntry = SymbolTableEntryBase & {
  kind: SymbolKind.HudWidget;
  declaration: SourceLocation;
};

export type SymbolTableLoadoutEntry = SymbolTableEntryBase & {
  kind: SymbolKind.Loadout;
  declaration: SourceLocation;
};

export type SymbolTableLoadoutPaletteEntry = SymbolTableEntryBase & {
  kind: SymbolKind.LoadoutPalette;
  declaration: SourceLocation;
};

export type SymbolTableRequisitionPaletteEntry = SymbolTableEntryBase & {
  kind: SymbolKind.RequisitionPalette;
  declaration: SourceLocation;
};

export type SymbolTableObjectListItemEntry = SymbolTableEntryBase & {
  kind: SymbolKind.ObjectListItem;
  objectType: ObjectListType;
  index: number;
  declaration: SourceLocation;
};

export type SymbolTableEntry =
  | SymbolTableVariableEntry
  | SymbolTableConstantEntry
  | SymbolTableStringEntry
  | SymbolTableGameOptionEntry
  | SymbolTableHudWidgetEntry
  | SymbolTableLoadoutEntry
  | SymbolTableLoadoutPaletteEntry
  | SymbolTableRequisitionPaletteEntry
  | SymbolTableObjectListItemEntry;

export class SymbolTable {
  private readonly table: SymbolTableEntry[] = [];

  public constructor(table: SymbolTableEntry[]) {
    this.table = table;
  }

  public getSymbol(symbolId: SymbolId): SymbolTableEntry | undefined {
    return this.table.find((symbol) => symbol.id === symbolId);
  }

  public toArray(): readonly SymbolTableEntry[] {
    return this.table;
  }
}

/**
 * SymbolBinder is responsible for binding symbols to their declarations and adding references to them.
 * It handles diagnostics for things related to symbol declarations, like duplicate declarations or scope issues.
 */
// Analysis lifecycle - we build a new one each analysis pass.
export class SymbolBinder {
  private readonly megaloVersion: MegaloVersion;
  private readonly table: SymbolTableEntry[] = [];
  private readonly diagnostics: Diagnostics;

  public constructor(megaloVersion: MegaloVersion, diagnostics: Diagnostics) {
    this.megaloVersion = megaloVersion;
    this.diagnostics = diagnostics;
  }

  public addString(
    entry: Pick<SymbolTableStringEntry, "name"> & {
      language: StringTableLanguage;
      content: string;
      declaration: SourceLocation;
    }
  ): SymbolId | undefined {
    const existingString = this.table.find(
      (symbol): symbol is SymbolTableStringEntry =>
        symbol.kind === SymbolKind.String && symbol.name === entry.name
    );

    if (existingString?.languageDeclarations[entry.language] !== undefined) {
      if (entry.declaration.type === SourceLocationType.SOURCE_CODE) {
        this.diagnostics.addError(
          diagnosticMessages.stringAlreadyDefined(entry.language, entry.name),
          entry.declaration
        );
      }
      return;
    }

    if (existingString) {
      existingString.languageDeclarations[entry.language] = entry.declaration;
      existingString.languageContents[entry.language] = entry.content;
      return existingString.id;
    }

    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.String,
      languageDeclarations: { [entry.language]: entry.declaration },
      languageContents: stringTableEntry(entry.language, entry.content),
    });
    return id;
  }

  public addVariable(
    entry: Pick<
      SymbolTableVariableEntry,
      "name" | "type" | "declaration" | "scope"
    >
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.Variable,
      type: entry.type,
      declaration: entry.declaration,
      scope: entry.scope,
    });
    return id;
  }

  public addGameOption(
    entry: Pick<SymbolTableGameOptionEntry, "name" | "type" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.GameOption,
      type: entry.type,
      declaration: entry.declaration,
    });
    return id;
  }

  public addConstant(
    entry: Pick<SymbolTableConstantEntry, "name" | "declaration" | "value">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.Constant,
      type: VariableType.Number,
      declaration: entry.declaration,
      value: entry.value,
    });
    return id;
  }

  public addHudWidget(
    entry: Pick<SymbolTableHudWidgetEntry, "name" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.HudWidget,
      declaration: entry.declaration,
    });
    return id;
  }

  public addLoadout(
    entry: Pick<SymbolTableLoadoutEntry, "name" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.Loadout,
      declaration: entry.declaration,
    });
    return id;
  }

  public addLoadoutPalette(
    entry: Pick<SymbolTableLoadoutPaletteEntry, "name" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.LoadoutPalette,
      declaration: entry.declaration,
    });
    return id;
  }

  public addRequisitionPalette(
    entry: Pick<SymbolTableRequisitionPaletteEntry, "name" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.RequisitionPalette,
      declaration: entry.declaration,
    });
    return id;
  }

  public addObjectListItem(
    entry: Pick<
      SymbolTableObjectListItemEntry,
      "name" | "objectType" | "index" | "declaration"
    >
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.ObjectListItem,
      objectType: entry.objectType,
      index: entry.index,
      declaration: entry.declaration,
    });
    return id;
  }

  public addReference(symbolId: SymbolId, reference: SourceCodeLocation): void {
    this.table[symbolId].references.push(reference);
  }

  public setScopeEnd(symbolId: SymbolId, position: SourcePosition): void {
    const entry = this.table[symbolId];
    if (entry !== undefined) {
      entry.range = {
        ...entry.range,
        end: position,
      };
    }
  }

  public getSymbolEntry(symbolId: SymbolId): SymbolTableEntry | undefined {
    return this.table[symbolId];
  }

  public getSymbolTable(): SymbolTable {
    return new SymbolTable(this.table);
  }
}
