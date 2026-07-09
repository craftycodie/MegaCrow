import { MegaloVersion } from "../../version";
import { Diagnostics, SourceCodeLocation, SourceLocation, SourceLocationType } from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";

export const enum SymbolKind {
    Constant,
    Variable,
    String,
    GameOption,
    HudWidget,
    Loadout,
    LoadoutPalette,
    RequisitionPalette,
}

// Modelled based on Bungie.Megalo.VariableType 
export const enum VariableType {
    Timer,
    Number,
    Team,
    Player,
    Object
}

export const enum VariableScope {
    Global,
    Team,
    Player,
    Object,
}

export type SymbolId = number;

export type SymbolTableEntryBase = {
    id: SymbolId;
    name: string;

    references: SourceCodeLocation[],
}

export type SymbolTableVariableEntry = SymbolTableEntryBase & {
    kind: SymbolKind.Variable;
    type: VariableType;
    declaration: SourceLocation,
    scope: VariableScope,
}

export type SymbolTableGameOptionEntry = SymbolTableEntryBase & {
    kind: SymbolKind.GameOption;
    type: VariableType.Number
    declaration: SourceLocation,
}

export type SymbolTableConstantEntry = SymbolTableEntryBase & {
    kind: SymbolKind.Constant;
    type: VariableType.Number
    declaration: SourceLocation,
}

export type SymbolTableStringEntry = SymbolTableEntryBase & {
    kind: SymbolKind.String;
    languageDeclarations: Map<string, SourceLocation>;
}

export type SymbolTableHudWidgetEntry = SymbolTableEntryBase & {
    kind: SymbolKind.HudWidget;
    declaration: SourceLocation;
}

export type SymbolTableLoadoutEntry = SymbolTableEntryBase & {
    kind: SymbolKind.Loadout;
    declaration: SourceLocation;
}

export type SymbolTableLoadoutPaletteEntry = SymbolTableEntryBase & {
    kind: SymbolKind.LoadoutPalette;
    declaration: SourceLocation;
}

export type SymbolTableRequisitionPaletteEntry = SymbolTableEntryBase & {
    kind: SymbolKind.RequisitionPalette;
    declaration: SourceLocation;
}

export type SymbolTableEntry = 
      SymbolTableVariableEntry 
    | SymbolTableConstantEntry 
    | SymbolTableStringEntry 
    | SymbolTableGameOptionEntry
    | SymbolTableHudWidgetEntry
    | SymbolTableLoadoutEntry
    | SymbolTableLoadoutPaletteEntry
    | SymbolTableRequisitionPaletteEntry;

export type SymbolTable = readonly SymbolTableEntry[];

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

    public addString(entry: Pick<SymbolTableStringEntry, "name"> & { language: string, declaration: SourceCodeLocation }): SymbolId | undefined {
        const existingString = this.table.find(
            (symbol): symbol is SymbolTableStringEntry =>
                symbol.kind === SymbolKind.String && symbol.name === entry.name,
        );

        if (existingString?.languageDeclarations.has(entry.language)) {
            this.diagnostics.addError(
                diagnosticMessages.stringAlreadyDefined(entry.language, entry.name),
                entry.declaration,
            );
            return undefined;
        }

        if (existingString) {
            existingString.languageDeclarations.set(entry.language, entry.declaration);
            return existingString.id;
        }

        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.String,
            languageDeclarations: new Map([[entry.language, entry.declaration]]),
        });
        return id;
    }

    public addVariable(entry: Pick<SymbolTableVariableEntry, "name" | "type" | "declaration" | "scope">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.Variable,
            type: entry.type,
            declaration: entry.declaration,
            scope: entry.scope,
        });
        return id;
    }

    public addGameOption(entry: Pick<SymbolTableGameOptionEntry, "name" | "type" | "declaration">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.GameOption,
            type: entry.type,
            declaration: entry.declaration,
        });
        return id;
    }

    public addConstant(entry: Pick<SymbolTableConstantEntry, "name" | "declaration">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.Constant,
            type: VariableType.Number,
            declaration: entry.declaration,
        });
        return id;
    }

    public addHudWidget(entry: Pick<SymbolTableHudWidgetEntry, "name" | "declaration">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.HudWidget,
            declaration: entry.declaration,
        });
        return id;
    }

    public addLoadout(entry: Pick<SymbolTableLoadoutEntry, "name" | "declaration">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.Loadout,
            declaration: entry.declaration,
        });
        return id;
    }

    public addLoadoutPalette(entry: Pick<SymbolTableLoadoutPaletteEntry, "name" | "declaration">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.LoadoutPalette,
            declaration: entry.declaration,
        });
        return id;
    }

    public addRequisitionPalette(entry: Pick<SymbolTableRequisitionPaletteEntry, "name" | "declaration">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.RequisitionPalette,
            declaration: entry.declaration,
        });
        return id;
    }

    public addReference(symbolId: SymbolId, reference: SourceCodeLocation): void {
        this.table[symbolId].references.push(reference);
    }

    public getSymbolEntry(symbolId: SymbolId): SymbolTableEntry | undefined {
        return this.table[symbolId];
    }

    public getSymbolTable(): SymbolTable {
        return this.table;
    }
}
