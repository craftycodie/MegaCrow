import { MegaloVersion } from "../../version";
import { Diagnostics, SourceCodeLocation } from "../diagnostics";
import { FrontendError } from "../error";
import { SymbolId, SymbolBinder } from ".";
import { addBuiltInConstants } from "./built-in";

/**
 * SymbolParser is used by the parser to refer to variables in scope.
 */
// Analysis lifecycle - we build a new one each analysis pass.
export class ParserSymbolContext {
    private readonly megaloVersion: MegaloVersion;
    public readonly diagnostics: Diagnostics;

    public readonly symbolScopes: Map<string, SymbolId>[] = [new Map()];
    private readonly symbolBinder: SymbolBinder;

    public constructor(megaloVersion: MegaloVersion, diagnostics: Diagnostics, symbolTable: SymbolBinder) {
        this.megaloVersion = megaloVersion;
        this.diagnostics = diagnostics;
        this.symbolBinder = symbolTable;

        addBuiltInConstants(this.megaloVersion, this);
    }

    // #region Symbol Scope Management

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
            this.symbolScopes.at(-1)!.set(entry.name, id);
        }

        return id;
    }

    public addConstantToScope(entry: Parameters<SymbolBinder["addConstant"]>[0]): SymbolId {
        if (!this.currentScopeIsGlobal()) {
            throw new FrontendError("Constants can only be declared in global scope.", entry.declaration);
        }

        const id = this.symbolBinder.addConstant(entry);
        this.symbolScopes.at(-1)!.set(entry.name, id);
        return id;
    }

    public addSymbolReference(symbolName: string, reference: SourceCodeLocation): SymbolId | undefined {
        // backtrack through scopes to find the symbol
        for (let i = this.symbolScopes.length - 1; i >= 0; i--) {
            const scope = this.symbolScopes[i];
            const id = scope.get(symbolName);
            if (id !== undefined) {
                this.symbolBinder.addReference(id, reference);
                return id;
            }
        }

        return undefined;
    }

    public popScope(): void {
        this.symbolScopes.pop();
    }

    // #endregion
}
