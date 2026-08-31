import type { CompileSourceOptions } from "@megacrow/megalo";
import {
  type CompiledMegaloMetadata,
  type CompilerSettings,
  type MegacrowExtensions,
  type MegaloVersionId,
  type ObjectLists,
  type PathDirectoryEntry,
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  type VariantLimitUsage,
} from "@megacrow/megalo";
import type {
  Diagnostic,
  SemanticTokensLegend,
} from "vscode-languageserver-types";

export const MEGACROW_REQUEST_ARTIFACTS_METHOD = "megacrow/requestArtifacts";
export const MEGACROW_RESOLVE_INCLUDE_METHOD = "megacrow/resolveInclude";
export const MEGACROW_RESOLVE_BASE_FILE_METHOD = "megacrow/resolveBaseFile";
export const MEGACROW_LIST_DIRECTORY_METHOD = "megacrow/listDirectory";
export const MEGACROW_VERSION_CONFIGURATION_METHOD =
  "megacrow/versionConfiguration";
export const MEGACROW_ANALYZE_OBJECT_LIST_METHOD = "megacrow/analyzeObjectList";
export const MEGACROW_SET_OBJECT_LISTS_METHOD = "megacrow/setObjectLists";
export const MEGACROW_SET_RESOLVE_BASE_FILE_METHOD =
  "megacrow/setResolveBaseFile";
export const MEGACROW_SET_LOCALE_METHOD = "megacrow/setLocale";
export const MEGACROW_SET_MEGACROW_EXTENSIONS_METHOD =
  "megacrow/setMegacrowExtensions";
export const MEGACROW_SET_COMPILER_SETTINGS_METHOD =
  "megacrow/setCompilerSettings";
export const MEGACROW_SET_MEGALO_VERSION_METHOD = "megacrow/setMegaloVersion";
export const MEGACROW_RESET_SESSION_METHOD = "megacrow/resetSession";

export const MEGACROW_DEFINITION_SCHEME = "megacrow-definition";

export const SEMANTIC_TOKENS_LEGEND: SemanticTokensLegend = {
  tokenTypes: [...SEMANTIC_TOKEN_TYPES],
  tokenModifiers: [...SEMANTIC_TOKEN_MODIFIERS],
};

export type MegacrowArtifactKind =
  | "semanticTokens"
  | "diagnostics"
  | "mglo"
  | "mpvr"
  | "gvar";

export interface MegacrowRequestArtifactsParams {
  artifacts: MegacrowArtifactKind[];
  objectLists?: ObjectLists;
  /** When omitted, the server uses the last synced document text for the URI. */
  text?: string;
  textDocument: { uri: string };
}

export interface MegacrowRequestArtifactsResult {
  /** Base64-encoded output bytes when a binary artifact was requested and compilation succeeded. */
  dataBase64?: string;
  diagnostics?: Diagnostic[];
  error?: string;
  /** Compile-time resource usage from the same lowered IR. */
  limitUsage?: VariantLimitUsage;
  metadata?: CompiledMegaloMetadata;
  /** Present when a binary artifact was requested. */
  ok?: boolean;
  semanticTokens?: number[];
  /** Raw `.mglo` bitstream length (excludes BLF framing). */
  variantByteLength?: number;
  /** Document version the artifacts were computed for (server-side). */
  version: number;
}

export interface MegacrowResolveIncludeParams {
  fromUri?: string;
  kind: "include" | "localized_include";
  path: string;
}

export type MegacrowResolveIncludeResult =
  | { text: string; uri: string }
  | { error: string };

export interface MegacrowResolveBaseFileParams {
  fromUri?: string;
  path: string;
}

export type MegacrowResolveBaseFileResult =
  | { dataBase64: string }
  | { error: string };

export interface MegacrowListDirectoryParams {
  /** Relative directory under the document (or search root). Empty = document dir. */
  directory: string;
  fromUri?: string;
}

export type MegacrowListDirectoryResult =
  | { entries: PathDirectoryEntry[] }
  | { error: string };

export interface MegacrowVersionConfigurationResult {
  objectListNames: readonly string[];
}

export interface MegacrowAnalyzeObjectListParams {
  text: string;
}

export interface MegacrowAnalyzeObjectListResult {
  diagnostics: Diagnostic[];
}

export interface MegacrowSetObjectListsParams {
  /** Workspace object lists, or omit/`null` to use bundled defaults. */
  objectLists?: ObjectLists | null;
}

export interface MegacrowSetResolveBaseFileParams {
  /** When false, compile omits `resolveBaseFile` (silent sibling-source JIT). */
  enabled: boolean;
}

export interface MegacrowSetLocaleParams {
  /** Diagnostics / hover locale (`en` or `ja`). */
  locale: "en" | "ja";
}

export interface MegacrowSetMegacrowExtensionsParams {
  megacrowExtensions: MegacrowExtensions;
}

export interface MegacrowSetCompilerSettingsParams {
  compilerSettings: Partial<CompilerSettings>;
}

export interface MegacrowSetMegaloVersionParams {
  /** Engine profile id (e.g. `107-mcc`, `106`). */
  megaloVersion: MegaloVersionId;
}

/** Params for {@link MEGACROW_RESET_SESSION_METHOD} (currently unused; reserved). */
export type MegacrowResetSessionParams = Record<string, never>;

export type CompileResolvers = Pick<CompileSourceOptions, "resolveInclude"> &
  Partial<Pick<CompileSourceOptions, "resolveBaseFile">>;
