import { MegaloVersion } from "../../version";
import { Diagnostics } from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import { Token, TokenKind, Tokens } from "../tokens";

// Used by the parse function to track it's progress & refer to variables in scope.
export class ParserContext {
    private readonly tokens: Tokens;
    private tokenIndex: number = 0;

    private readonly megaloVersion: MegaloVersion;
    public readonly diagnostics: Diagnostics;

    public constructor(tokens: Tokens, megaloVersion: MegaloVersion, diagnostics: Diagnostics) {
        this.megaloVersion = megaloVersion;
        this.diagnostics = diagnostics;
        this.tokens = tokens;
    }

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
}
