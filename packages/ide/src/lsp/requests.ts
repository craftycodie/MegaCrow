import {
  MEGACROW_ANALYZE_OBJECT_LIST_METHOD,
  MEGACROW_REQUEST_ARTIFACTS_METHOD,
  MEGACROW_SET_COMPILER_SETTINGS_METHOD,
  MEGACROW_SET_LOCALE_METHOD,
  MEGACROW_SET_MEGACROW_EXTENSIONS_METHOD,
  MEGACROW_SET_MEGALO_VERSION_METHOD,
  MEGACROW_SET_OBJECT_LISTS_METHOD,
  MEGACROW_VERSION_CONFIGURATION_METHOD,
  type MegacrowArtifactKind,
  type MegacrowRequestArtifactsResult,
} from "@megacrow/lsp/protocol";
import type {
  CompilerSettings,
  MegacrowExtensions,
  MegaloVersionId,
  ObjectLists,
} from "@megacrow/megalo";
import type { Diagnostic } from "vscode-languageserver-protocol";
import { getConnection, lspDocumentUri, lspSyncDocument } from "./connection";

function decodeBase64(dataBase64: string): Uint8Array {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export type { MegacrowArtifactKind };

export interface MegacrowCompileResult {
  dataBase64?: string;
  diagnostics: Diagnostic[];
  error?: string;
  limitUsage?: import("@megacrow/megalo").VariantLimitUsage;
  metadata?: import("@megacrow/megalo").CompiledMegaloMetadata;
  ok: boolean;
  variantByteLength?: number;
}

export async function lspCompileSource(
  text: string,
  fileType: "mglo" | "mpvr" | "gvar" = "mglo"
): Promise<{
  ok: boolean;
  bytes?: Uint8Array;
  diagnostics: Diagnostic[];
  error?: string;
  metadata?: MegacrowCompileResult["metadata"];
  variantByteLength?: number;
  limitUsage?: MegacrowCompileResult["limitUsage"];
}> {
  const artifacts = await lspRequestArtifacts(text, ["diagnostics", fileType]);
  if (!(artifacts.ok && artifacts.bytes)) {
    return {
      ok: false,
      diagnostics: artifacts.diagnostics ?? [],
      error: artifacts.error,
    };
  }
  return {
    ok: true,
    bytes: artifacts.bytes,
    diagnostics: artifacts.diagnostics ?? [],
    metadata: artifacts.metadata,
    variantByteLength: artifacts.variantByteLength,
    limitUsage: artifacts.limitUsage,
  };
}

export async function lspRequestArtifacts(
  text: string,
  artifacts: MegacrowArtifactKind[]
): Promise<{
  ok?: boolean;
  bytes?: Uint8Array;
  diagnostics: Diagnostic[];
  error?: string;
  metadata?: MegacrowCompileResult["metadata"];
  semanticTokens?: number[];
  version: number;
  variantByteLength?: number;
  limitUsage?: MegacrowCompileResult["limitUsage"];
}> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  const result = (await connection.sendRequest(
    MEGACROW_REQUEST_ARTIFACTS_METHOD,
    {
      textDocument: { uri: lspDocumentUri() },
      text,
      artifacts,
    }
  )) as MegacrowRequestArtifactsResult;

  return {
    ok: result.ok,
    bytes: result.dataBase64 ? decodeBase64(result.dataBase64) : undefined,
    diagnostics: result.diagnostics ?? [],
    error: result.error,
    metadata: result.metadata,
    semanticTokens: result.semanticTokens,
    version: result.version,
    variantByteLength: result.variantByteLength,
    limitUsage: result.limitUsage,
  };
}

export async function lspSemanticTokens(text: string): Promise<number[]> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  const result = (await connection.sendRequest(
    "textDocument/semanticTokens/full",
    {
      textDocument: { uri: lspDocumentUri() },
    }
  )) as { data?: number[] } | null;
  return result?.data ?? [];
}

export async function lspHover(
  text: string,
  position: { line: number; character: number }
): Promise<{
  contents: { kind: string; value: string } | string;
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
} | null> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  return (await connection.sendRequest("textDocument/hover", {
    textDocument: { uri: lspDocumentUri() },
    position,
  })) as {
    contents: { kind: string; value: string } | string;
    range?: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  } | null;
}

export interface LspDefinitionLocation {
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  uri: string;
}

export async function lspDefinition(
  text: string,
  position: { line: number; character: number }
): Promise<LspDefinitionLocation[]> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  const result = await connection.sendRequest("textDocument/definition", {
    textDocument: { uri: lspDocumentUri() },
    position,
  });

  const asLocation = (value: unknown): LspDefinitionLocation | null => {
    if (!(value && typeof value === "object")) {
      return null;
    }
    const record = value as Record<string, unknown>;
    if (
      typeof record.uri === "string" &&
      record.range &&
      typeof record.range === "object"
    ) {
      const range = record.range as LspDefinitionLocation["range"];
      return { uri: record.uri, range };
    }
    if (
      typeof record.targetUri === "string" &&
      record.targetSelectionRange &&
      typeof record.targetSelectionRange === "object"
    ) {
      return {
        uri: record.targetUri,
        range: record.targetSelectionRange as LspDefinitionLocation["range"],
      };
    }
    if (
      typeof record.targetUri === "string" &&
      record.targetRange &&
      typeof record.targetRange === "object"
    ) {
      return {
        uri: record.targetUri,
        range: record.targetRange as LspDefinitionLocation["range"],
      };
    }
    return null;
  };

  if (result === null || result === undefined) {
    return [];
  }
  if (Array.isArray(result)) {
    return result
      .map(asLocation)
      .filter(
        (location): location is LspDefinitionLocation => location !== null
      );
  }
  const single = asLocation(result);
  return single ? [single] : [];
}

export async function lspCompletions(
  text: string,
  position: { line: number; character: number }
): Promise<
  Array<{
    label: string;
    kind?: number;
    detail?: string;
    documentation?: string | { kind: string; value: string };
    filterText?: string;
    insertText?: string;
    insertTextFormat?: number;
    command?: { title: string; command: string; arguments?: unknown[] };
  }>
> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  await Promise.resolve();
  const result = await connection.sendRequest("textDocument/completion", {
    textDocument: { uri: lspDocumentUri() },
    position,
  });
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === "object" && "items" in result) {
    return (
      result as {
        items: Array<{
          label: string;
          kind?: number;
          detail?: string;
          documentation?: string | { kind: string; value: string };
          filterText?: string;
          insertText?: string;
          insertTextFormat?: number;
          command?: { title: string; command: string; arguments?: unknown[] };
        }>;
      }
    ).items;
  }
  return [];
}

export async function lspVersionConfiguration(): Promise<{
  objectListNames: readonly string[];
}> {
  const connection = await getConnection();
  return (await connection.sendRequest(
    MEGACROW_VERSION_CONFIGURATION_METHOD,
    {}
  )) as { objectListNames: readonly string[] };
}

export async function lspAnalyzeObjectList(text: string): Promise<{
  diagnostics: Diagnostic[];
}> {
  const connection = await getConnection();
  return (await connection.sendRequest(MEGACROW_ANALYZE_OBJECT_LIST_METHOD, {
    text,
  })) as { diagnostics: Diagnostic[] };
}

export async function lspSetObjectLists(
  objectLists: ObjectLists | null
): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_OBJECT_LISTS_METHOD, {
    objectLists,
  });
}

export async function lspSetMegaloVersion(
  megaloVersion: MegaloVersionId
): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_MEGALO_VERSION_METHOD, {
    megaloVersion,
  });
}

export async function lspSetLocale(locale: "en" | "ja"): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_LOCALE_METHOD, { locale });
}

export async function lspSetMegacrowExtensions(
  megacrowExtensions: MegacrowExtensions
): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_MEGACROW_EXTENSIONS_METHOD, {
    megacrowExtensions,
  });
}

export async function lspSetCompilerSettings(
  compilerSettings: Partial<CompilerSettings>
): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_COMPILER_SETTINGS_METHOD, {
    compilerSettings,
  });
}
