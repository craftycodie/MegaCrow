// MegaloEdit Compiler Settings
export interface CompilerSettings {
  /**
   * Author name written into gametype content metadata (creation /
   * modification history). Max 16 characters on the wire.
   */
  creatorGamertag: string;
  strictStringLiterals: boolean;
  temporaryVariablesCanOverflowIntoUnusedGlobalVariables: boolean;
}

export const DEFAULT_COMPILER_SETTINGS: CompilerSettings = {
  creatorGamertag: "MegaloEvolved",
  strictStringLiterals: false,
  temporaryVariablesCanOverflowIntoUnusedGlobalVariables: true,
};

export const resolveCompilerSettings = (
  partial?: Partial<CompilerSettings>
): CompilerSettings => ({
  ...DEFAULT_COMPILER_SETTINGS,
  ...partial,
});
