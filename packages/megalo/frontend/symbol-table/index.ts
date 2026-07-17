import { MegaloVersion } from "../../version";
import { BUILT_IN_POSITION, Diagnostics, SourceCodeLocation, SourceLocation, SourceLocationType, SourcePosition } from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import { ObjectListType } from "../object-lists";

export const enum SymbolKind {
    Constant,
    Variable,
    String,
    GameOption,
    HudWidget,
    Loadout,
    LoadoutPalette,
    RequisitionPalette,
    ObjectListItem,
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

    /**
     * Lexical scope range.
     * `start` is the declaration position (built-ins use `BUILT_IN_POSITION`).
     * `end` is the exclusive end of visibility; open-ended symbols (globals, built-ins)
     * keep `end` as `BUILT_IN_POSITION` until EOF.
     */
    range: SourceCodeLocation;

    references: SourceCodeLocation[],
}

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
    languageContents: Map<string, string>;
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

export type SymbolTableObjectListItemEntry = SymbolTableEntryBase & {
    kind: SymbolKind.ObjectListItem;
    objectType: ObjectListType;
    index: number;
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
    | SymbolTableRequisitionPaletteEntry
    | SymbolTableObjectListItemEntry;

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

    public addString(entry: Pick<SymbolTableStringEntry, "name"> & {
        language: string;
        content: string;
        declaration: SourceLocation;
    }): SymbolId | undefined {
        const existingString = this.table.find(
            (symbol): symbol is SymbolTableStringEntry =>
                symbol.kind === SymbolKind.String && symbol.name === entry.name,
        );

        if (existingString?.languageDeclarations.has(entry.language)) {
            if (entry.declaration.type === SourceLocationType.SOURCE_CODE) {
                this.diagnostics.addError(
                    diagnosticMessages.stringAlreadyDefined(entry.language, entry.name),
                    entry.declaration,
                );
            }
            return undefined;
        }

        if (existingString) {
            existingString.languageDeclarations.set(entry.language, entry.declaration);
            existingString.languageContents.set(entry.language, entry.content);
            return existingString.id;
        }

        const id = this.table.length;
        this.table.push({
            id,
            range: declarationRange(entry.declaration),
            references: [],
            name: entry.name,
            kind: SymbolKind.String,
            languageDeclarations: new Map([[entry.language, entry.declaration]]),
            languageContents: new Map([[entry.language, entry.content]]),
        });
        return id;
    }

    public addVariable(entry: Pick<SymbolTableVariableEntry, "name" | "type" | "declaration" | "scope">): SymbolId {
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

    public addGameOption(entry: Pick<SymbolTableGameOptionEntry, "name" | "type" | "declaration">): SymbolId {
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

    public addConstant(entry: Pick<SymbolTableConstantEntry, "name" | "declaration">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            range: declarationRange(entry.declaration),
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
            range: declarationRange(entry.declaration),
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
            range: declarationRange(entry.declaration),
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
            range: declarationRange(entry.declaration),
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
            range: declarationRange(entry.declaration),
            references: [],
            name: entry.name,
            kind: SymbolKind.RequisitionPalette,
            declaration: entry.declaration,
        });
        return id;
    }

    public addObjectListItem(entry: Pick<SymbolTableObjectListItemEntry, "name" | "objectType" | "index" | "declaration">): SymbolId {
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
        return this.table;
    }
}
