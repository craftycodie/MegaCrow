import type { Diagnostics } from "../diagnostics";
import type { IR } from "../intermediate-representation";

export abstract class Compiler {
  public abstract dryRun(ir: IR, diagnostics: Diagnostics): void;
  public abstract writeMegaloFile(ir: IR, diagnostics: Diagnostics): Uint8Array;
}
