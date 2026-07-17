import { MegaloVersion } from "../../version";
import { Diagnostics, SourceCodeLocation, SourceLocation, SourceLocationType, SourcePosition } from "../diagnostics";
import { FrontendError } from "../error";
import { OBJECT_LIST_TYPES, ObjectLists, ObjectListType, objectListLocation } from "../object-lists";
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
    private readonly scopeSymbolIds: SymbolId[][] = [[]];
    // we store strings separately to everything else because Megalo supports variables
    // and strings with the same name, they dont shadow.
    private readonly declaredStrings: Map<string, SymbolId> = new Map();
    private readonly declaredHudWidgets: Map<string, SymbolId> = new Map();
    private readonly declaredLoadouts: Map<string, SymbolId> = new Map();
    private readonly declaredLoadoutPalettes: Map<string, SymbolId> = new Map();
    private readonly declaredRequisitionPalettes: Map<string, SymbolId> = new Map();
    private readonly declaredObjectListItems = new Map<ObjectListType, Map<string, SymbolId>>();
    private readonly symbolBinder: SymbolBinder;

    public constructor(
        megaloVersion: MegaloVersion,
        diagnostics: Diagnostics,
        symbolTable: SymbolBinder,
        objectLists: ObjectLists = {},
    ) {
        this.megaloVersion = megaloVersion;
        this.diagnostics = diagnostics;
        this.symbolBinder = symbolTable;

        this.registerObjectListItems(objectLists, diagnostics);
        addBuiltInConstants(this.megaloVersion, this);
        addBuiltInVariables(this.megaloVersion, this);
        addBuiltInGameOptions(this.megaloVersion, this);
    }

    private registerObjectListItems(objectLists: ObjectLists, diagnostics: Diagnostics): void {
        for (const objectType of OBJECT_LIST_TYPES) {
            const entries = objectLists[objectType] ?? [];
            const byName = new Map<string, SymbolId>();
            for (let i = 0; i < entries.length; i++) {
                const name = entries[i]!;
                // First occurrence wins if duplicates exist.
                if (byName.has(name)) {
                    diagnostics.addError(`Duplicate object "${name}" in ${objectType} object list`, objectListLocation(objectType, i));
                    continue;
                }

                const id = this.symbolBinder.addObjectListItem({
                    name,
                    objectType,
                    index: i,
                    declaration: objectListLocation(objectType, i),
                });
                byName.set(name, id);
            }
            this.declaredObjectListItems.set(objectType, byName);
        }
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
        this.registerInCurrentScope(entry.name, id);
        return id;
    }

    public addVariableToScope(entry: Parameters<SymbolBinder["addVariable"]>[0]): SymbolId {
        const id = this.symbolBinder.addVariable(entry);
        this.registerInCurrentScope(entry.name, id);
        return id;
    }

    public addGameOptionToScope(entry: Parameters<SymbolBinder["addGameOption"]>[0]): SymbolId {
        // game_options is only valid at top-level, so a string declaration not at global scope should be impossible.
        if (!this.currentScopeIsGlobal()) {
            throw new FrontendError("Game options can only be declared in global scope.", entry.declaration);
        }

        const id = this.symbolBinder.addGameOption(entry);
        this.registerInCurrentScope(entry.name, id);
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

    public recordReference(symbolId: SymbolId, reference: SourceCodeLocation): void {
        this.symbolBinder.addReference(symbolId, reference);
    }

    public addHudWidgetToScope(name: string, declaration: SourceLocation): SymbolId {
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

    public addLoadoutToScope(name: string, declaration: SourceLocation): SymbolId {
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

    public addLoadoutPaletteToScope(name: string, declaration: SourceLocation): SymbolId {
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

    public addRequisitionPaletteToScope(name: string, declaration: SourceLocation): SymbolId {
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

    public lookupObjectListItem(objectType: ObjectListType, name: string): SymbolId | undefined {
        return this.declaredObjectListItems.get(objectType)?.get(name);
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
        this.scopeSymbolIds.push([]);
        addBuiltInScopeVariables(this.megaloVersion, this, scope);
    }

    /**
     * Pop the current (non-global) scope and mark its symbols as ending at `endPosition`.
     * Built-in declarations keep an open range.
     */
    public popScope(endPosition?: SourcePosition): void {
        if (this.symbolScopes.length <= 1) {
            throw new FrontendError("Cannot pop global scope.", {
                type: SourceLocationType.SOURCE_CODE,
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 0, line: 1, column: 1 },
            });
        }

        const ids = this.scopeSymbolIds.pop()!;
        this.symbolScopes.pop();

        if (endPosition !== undefined) {
            for (const id of ids) {
                const entry = this.symbolBinder.getSymbolEntry(id);
                if (entry !== undefined && entry.range.start.offset !== -1) {
                    this.symbolBinder.setScopeEnd(id, endPosition);
                }
            }
        }
    }

    private registerInCurrentScope(name: string, id: SymbolId): void {
        this.symbolScopes.at(-1)!.set(name, id);
        this.scopeSymbolIds.at(-1)!.push(id);
    }
}
