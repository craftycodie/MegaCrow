import { MegaloVersion } from "../../version";
import { Diagnostics } from "../diagnostics";
import { Token, Tokens } from "../tokens";

// Used by the parse function to track it's progress & refer to variables in scope.
export class ParserContext {
    private readonly tokens: Tokens;
    private tokenIndex: number = 0;

    // Version 
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

    public available(): number {
        return this.tokens.length - this.tokenIndex;
    }
}