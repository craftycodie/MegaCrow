import { MegaloVersion } from "../../version";
import { Diagnostics, SourceLocation } from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import { FrontendError } from "../error";
import { SymbolId, SymbolBinder } from "../symbol-table";
import { Token, TokenKind, Tokens } from "../tokens";

// Used by the parse function to track it's progress & refer to variables in scope.
export class ParserContext {
    private readonly tokens: Tokens;
    private tokenIndex: number = 0;

    private readonly megaloVersion: MegaloVersion;
    public readonly diagnostics: Diagnostics;

    public readonly symbolScopes: Map<string, SymbolId>[] = [new Map()];
    private readonly symbolTable: SymbolBinder;

    public constructor(tokens: Tokens, megaloVersion: MegaloVersion, diagnostics: Diagnostics, symbolTable: SymbolBinder) {
        this.megaloVersion = megaloVersion;
        this.diagnostics = diagnostics;
        this.tokens = tokens;
        this.symbolTable = symbolTable;
    }


    // #region Token Management

    public getToken(): Token {
        return this.tokens[this.tokenIndex++];
    }

    public peekToken(offset: number = 0): Token | undefined {
        return this.tokens[this.tokenIndex + offset];
    }

    public hasMore(): boolean {
        return this.tokenIndex < this.tokens.length;
    }

    /**
     * Use with caution.
     * In Megalo, "end" is a valid variable name.
     * In some elements like string_table, variables are never used, so this is OK.
     */
    public parseUntilEnd(parseItem: () => void): void {
        while (this.hasMore()) {
            const token = this.peekToken()!;
            if (token.kind === TokenKind.Identifier && token.value === "end") {
                this.getToken();
                return;
            }

            const indexBefore = this.tokenIndex;
            parseItem();
            if (this.tokenIndex === indexBefore && this.hasMore()) {
                this.getToken();
            }
        }

        const lastToken = this.tokens.at(-1);
        const location = lastToken?.location ?? {
            start: { offset: 0, line: 1, column: 1 },
            end: { offset: 0, line: 1, column: 1 },
        };
        this.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), location);
    }

    // #endregion

    // #region Symbol Scope Management

    public currentScopeIsGlobal(): boolean {
        return this.symbolScopes.length === 1;
    }

    public addStringToScope(entry: Parameters<SymbolBinder["addString"]>[0]): SymbolId | undefined {
        // string_table is only valid at top-level, so a string declaration not at global scope should be impossible.
        if (!this.currentScopeIsGlobal()) {
            throw new FrontendError("Strings can only be declared in global scope.", entry.declaration);
        }

        const id = this.symbolTable.addString(entry);
        if (id) {
            this.symbolScopes.at(-1)!.set(entry.name, id);
        }

        return id;
    }

    public addSymbolReference(symbolName: string, reference: SourceLocation): void {
        // backtrack through scopes to find the symbol
        for (let i = this.symbolScopes.length - 1; i >= 0; i--) {
            const scope = this.symbolScopes[i];
            const id = scope.get(symbolName);
            if (id) {
                this.symbolTable.addReference(id, reference);
                return;
            }
        }

        //this.diagnostics.addError(diagnosticMessages.expectedTokenKind(TokenKind.Identifier, symbolName), reference);
    }

    public popScope(): void {
        this.symbolScopes.pop();
    }

    // #endregion
}
