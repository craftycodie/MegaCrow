import { Diagnostics, SourceLocation } from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";

export const enum SymbolKind {
    Constant,
    Variable,
    String,
}

// Modelled based on Bungie.Megalo.VariableType 
const enum VariableType {
    Timer,
    Number,
    Team,
    Player,
    Object
}

export type SymbolId = number;

export type SymbolTableEntryBase = {
    id: SymbolId;
    name: string;

    references: SourceLocation[],
}

export type SymbolTableVariableEntry = SymbolTableEntryBase & {
    kind: SymbolKind.Variable;
    type: VariableType;
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

export type SymbolTableEntry = SymbolTableVariableEntry | SymbolTableConstantEntry | SymbolTableStringEntry;

export type SymbolTable = readonly SymbolTableEntry[];

/**
 * SymbolBinder is responsible for binding symbols to their declarations and adding references to them.
 * It handles diagnostics for things related to symbol declarations, like duplicate declarations or scope issues.
 */
// Analysis lifecycle - we build a new one each analysis pass.
export class SymbolBinder {
    private readonly table: SymbolTableEntry[] = [];
    /**
     * We dont publish scopes to the LSP, its not necessary,
     * but since the Parser depends on symbols, it need to know what symbols are in scope.
     */
    private readonly symbolScopes: Map<string, SymbolId>[] = [new Map()];
    
    private readonly diagnostics: Diagnostics;

    public constructor(diagnostics: Diagnostics) {
        this.diagnostics = diagnostics;
    }

    public addString(entry: Pick<SymbolTableStringEntry, "name"> & { language: string, declaration: SourceLocation }): SymbolId | undefined {
        const existingString = this.table.find(
            (symbol): symbol is SymbolTableStringEntry =>
                symbol.kind === SymbolKind.String && symbol.name === entry.name,
        );

        if (existingString?.languageDeclarations.has(entry.language)) {
            this.diagnostics.addError(
                diagnosticMessages.stringAlreadyDefined(entry.language, entry.name),
                existingString.languageDeclarations.get(entry.language)!,
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

    public addVariable(entry: Pick<SymbolTableVariableEntry, "name" | "type" | "declaration">): SymbolId {
        const id = this.table.length;
        this.table.push({
            id,
            references: [],
            name: entry.name,
            kind: SymbolKind.Variable,
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

    public addReference(symbolId: SymbolId, reference: SourceLocation): void {
        this.table[symbolId].references.push(reference);
    }

    public getSymbolTable(): SymbolTable {
        return this.table;
    }
}
