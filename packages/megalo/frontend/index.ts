import type { SupportedMegaloVersion } from "../version";
import { Parser } from "./abstract-syntax-tree";
import { type Compiler, getCompilerForVersion } from "./compile";
import { Diagnostics } from "./diagnostics";
import { Lowerer } from "./intermediate-representation";
import type { ObjectLists } from "./object-lists";
import { Lexer } from "./tokens";

// The frontend is Workspace lifecycle - it is instanced per workspace.
export class Frontend {
  private readonly megaloVersion: SupportedMegaloVersion;

  private readonly lexer: Lexer;
  private readonly parser: Parser;
  private readonly lowerer: Lowerer;
  private readonly compiler: Compiler;

  public constructor(megaloVersion: SupportedMegaloVersion) {
    this.megaloVersion = megaloVersion;
    this.lexer = new Lexer(this.megaloVersion);
    this.parser = new Parser(this.megaloVersion);
    this.lowerer = new Lowerer(this.megaloVersion);
    this.compiler = getCompilerForVersion(this.megaloVersion);
  }

  public analyzeSource(source: string, objectLists: ObjectLists = {}) {
    const diagnostics = new Diagnostics();

    const tokens = this.lexer.lex(source, diagnostics);
    const ast = this.parser.parse(tokens, diagnostics, objectLists);
    const ir = this.lowerer.lower(ast, diagnostics, { objectLists });
    this.compiler.dryRun(ir, diagnostics);

    return ir;
  }
}
