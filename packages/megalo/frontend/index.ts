import { MegaloVersion } from "../version";
import { Parser } from "./abstract-syntax-tree";
import { Diagnostics } from "./diagnostics";
import { Lowerer } from "./intermediate-representation";
import { Lexer } from "./tokens";

// The frontend is Workspace lifecycle - it is instanced per workspace.
export class Frontend {
    private readonly megaloVersion: MegaloVersion;

    private readonly lexer: Lexer;
    private readonly parser: Parser;
    private readonly lowerer: Lowerer;
    
    public constructor(megaloVersion: MegaloVersion) {
        this.megaloVersion = megaloVersion;
        this.lexer = new Lexer(this.megaloVersion);
        this.parser = new Parser(this.megaloVersion);
        this.lowerer = new Lowerer(this.megaloVersion);
    }

    public analyzeSource(source: string) {
        const diagnostics = new Diagnostics();
        
        const tokens = this.lexer.lex(source, diagnostics);
        const ast = this.parser.parse(tokens, diagnostics);
        const ir = this.lowerer.lower(ast);

        return ir;
    }
}