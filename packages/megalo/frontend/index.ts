import { MegaloVersion } from "../version";
import { Parser } from "./abstract-syntax-tree";
import { Diagnostics } from "./diagnostics";
import { Lexer } from "./tokens";


// The frontend is Workspace lifecycle - it is instanced per workspace.
export class Frontend {
    private readonly megaloVersion: MegaloVersion;

    private readonly lexer: Lexer;
    private readonly parser: Parser;
    
    public constructor(megaloVersion: MegaloVersion) {
        this.megaloVersion = megaloVersion;
        this.lexer = new Lexer(this.megaloVersion);
        this.parser = new Parser(this.megaloVersion);
    }

    public analyzeSource(source: string) {
        const diagnostics = new Diagnostics();
        
        const tokens = this.lexer.lex(source, diagnostics);
        const ast = this.parser.parse(tokens, diagnostics);
    }
}