import { MegaloVersion } from "../../version";
import { Diagnostics, SourceCodeLocation, SourceLocationType } from "../diagnostics";
import { FrontendError } from "../error";
import { SymbolId, SymbolBinder, SymbolKind, SymbolTableEntry } from "../symbol-table";
import { addBuiltInConstants, addBuiltInGameOptions, addBuiltInVariables } from "../symbol-table/built-in";
import { addBuiltInScopeVariables, ParserScope, ParserScopeKind } from "../symbol-table/scope";

/**
 * SymbolParser is used by the parser to refer to variables in scope.
 * We do a shallow Symbol Binder pass at parse to provide a subset of
 * symbol resolution as required for context-aware parsing.
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
    private readonly declaredLoadouts: Map<string, SymbolId> = new Map();
    private readonly declaredLoadoutPalettes: Map<string, SymbolId> = new Map();
    private readonly declaredRequisitionPalettes: Map<string, SymbolId> = new Map();
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

    public addLoadoutToScope(name: string, declaration: SourceCodeLocation): SymbolId {
        const id = this.symbolBinder.addLoadout({
            name,
            declaration,
        });
        this.declaredLoadouts.set(name, id);
        return id;
    }

    public lookupLoadout(name: string): SymbolId | undefined {
        return this.declaredLoadouts.get(name);
    }

    public addLoadoutPaletteToScope(name: string, declaration: SourceCodeLocation): SymbolId {
        const id = this.symbolBinder.addLoadoutPalette({
            name,
            declaration,
        });
        this.declaredLoadoutPalettes.set(name, id);
        return id;
    }

    public lookupLoadoutPalette(name: string): SymbolId | undefined {
        return this.declaredLoadoutPalettes.get(name);
    }

    public addRequisitionPaletteToScope(name: string, declaration: SourceCodeLocation): SymbolId {
        const id = this.symbolBinder.addRequisitionPalette({
            name,
            declaration,
        });
        this.declaredRequisitionPalettes.set(name, id);
        return id;
    }

    public lookupRequisitionPalette(name: string): SymbolId | undefined {
        return this.declaredRequisitionPalettes.get(name);
    }

    public lookupString(name: string): SymbolId | undefined {
        return this.declaredStrings.get(name);
    }

    /** Prefer english content; otherwise the first declared language's text. */
    public lookupStringContent(name: string): string | undefined {
        const id = this.declaredStrings.get(name);
        if (id === undefined) {
            return undefined;
        }

        const entry = this.symbolBinder.getSymbolEntry(id);
        if (entry === undefined || entry.kind !== SymbolKind.String) {
            return undefined;
        }

        const english = entry.languageContents.get("english");
        if (english !== undefined) {
            return english;
        }

        for (const content of entry.languageContents.values()) {
            return content;
        }

        return undefined;
    }

    public pushScope(scope: ParserScope = { kind: ParserScopeKind.Block }): void {
        this.symbolScopes.push(new Map());
        addBuiltInScopeVariables(this.megaloVersion, this, scope);
    }

    public popScope(): void {
        if (this.symbolScopes.length <= 1) {
            throw new FrontendError("Cannot pop global scope.", {
                type: SourceLocationType.SOURCE_CODE,
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 0, line: 1, column: 1 },
            });
        }

        this.symbolScopes.pop();
    }
}
