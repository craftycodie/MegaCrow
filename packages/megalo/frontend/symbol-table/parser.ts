import { MegaloVersion } from "../../version";
import { Diagnostics, SourceCodeLocation } from "../diagnostics";
import { FrontendError } from "../error";
import { SymbolId, SymbolBinder, SymbolTableEntry } from ".";
import { addBuiltInConstants, addBuiltInGameOptions, addBuiltInVariables } from "./built-in";

/**
 * SymbolParser is used by the parser to refer to variables in scope.
 */
// Analysis lifecycle - we build a new one each analysis pass.
export class ParserSymbolContext {
    private readonly megaloVersion: MegaloVersion;
    public readonly diagnostics: Diagnostics;

    private readonly symbolScopes: Map<string, SymbolId>[] = [new Map()];
    // we store strings separately to everything else because Megalo supports variables
    // and strings with the same name, they dont shadow.
    private readonly declaredStrings: Map<string, SymbolId> = new Map();
    private readonly declaredHudWidgets: Map<string, SymbolId> = new Map();
    private readonly symbolBinder: SymbolBinder;

    public constructor(megaloVersion: MegaloVersion, diagnostics: Diagnostics, symbolTable: SymbolBinder) {
        this.megaloVersion = megaloVersion;
        this.diagnostics = diagnostics;
        this.symbolBinder = symbolTable;

        addBuiltInConstants(this.megaloVersion, this);
        addBuiltInVariables(this.megaloVersion, this);
        addBuiltInGameOptions(this.megaloVersion, this);
    }

    public currentScopeIsGlobal(): boolean {
        return this.symbolScopes.length === 1;
    }

    public addStringToScope(entry: Parameters<SymbolBinder["addString"]>[0]): SymbolId | undefined {
        // string_table is only valid at top-level, so a string declaration not at global scope should be impossible.
        if (!this.currentScopeIsGlobal()) {
            throw new FrontendError("Strings can only be declared in global scope.", entry.declaration);
        }

        const id = this.symbolBinder.addString(entry);
        if (id !== undefined) {
            this.declaredStrings.set(entry.name, id);
        }

        return id;
    }

    public addConstantToScope(entry: Parameters<SymbolBinder["addConstant"]>[0]): SymbolId {
        // constants is only valid at top-level, so a string declaration not at global scope should be impossible.
        if (!this.currentScopeIsGlobal()) {
            throw new FrontendError("Constants can only be declared in global scope.", entry.declaration);
        }

        const id = this.symbolBinder.addConstant(entry);
        this.symbolScopes.at(-1)!.set(entry.name, id);
        return id;
    }

    public addVariableToScope(entry: Parameters<SymbolBinder["addVariable"]>[0]): SymbolId {
        const id = this.symbolBinder.addVariable(entry);
        this.symbolScopes.at(-1)!.set(entry.name, id);
        return id;
    }

    public addGameOptionToScope(entry: Parameters<SymbolBinder["addGameOption"]>[0]): SymbolId {
        // game_options is only valid at top-level, so a string declaration not at global scope should be impossible.
        if (!this.currentScopeIsGlobal()) {
            throw new FrontendError("Game options can only be declared in global scope.", entry.declaration);
        }

        const id = this.symbolBinder.addGameOption(entry);
        this.symbolScopes.at(-1)!.set(entry.name, id);
        return id;
    }

    public lookupSymbol(symbolName: string): SymbolId | undefined {
        for (let i = this.symbolScopes.length - 1; i >= 0; i--) {
            const id = this.symbolScopes[i].get(symbolName);
            if (id !== undefined) {
                return id;
            }
        }

        return undefined;
    }

    public getSymbolEntry(symbolId: SymbolId): SymbolTableEntry | undefined {
        return this.symbolBinder.getSymbolEntry(symbolId);
    }

    public addHudWidgetToScope(name: string, declaration: SourceCodeLocation): SymbolId {
        const id = this.symbolBinder.addHudWidget({
            name,
            declaration,
        });
        this.declaredHudWidgets.set(name, id);
        return id;
    }

    public lookupHudWidget(name: string): SymbolId | undefined {
        return this.declaredHudWidgets.get(name);
    }

    public addHudWidgetReference(name: string, reference: SourceCodeLocation): SymbolId | undefined {
        const id = this.declaredHudWidgets.get(name);
        if (id !== undefined) {
            this.symbolBinder.addReference(id, reference);
        }

        return id;
    }

    public addSymbolReference(symbolName: string, reference: SourceCodeLocation): SymbolId | undefined {
        const id = this.lookupSymbol(symbolName);
        if (id !== undefined) {
            this.symbolBinder.addReference(id, reference);
        }

        return id;
    }

    public addStringReference(symbolName: string, reference: SourceCodeLocation): SymbolId | undefined {
        const id = this.declaredStrings.get(symbolName);
        if (id !== undefined) {
            this.symbolBinder.addReference(id, reference);
            return id;
        }

        return undefined;
    }

    public popScope(): void {
        this.symbolScopes.pop();
    }
}
