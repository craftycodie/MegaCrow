import type { Connection } from "vscode-languageserver";
import {
  type CompileResolvers,
  MEGACROW_RESOLVE_BASE_FILE_METHOD,
  MEGACROW_RESOLVE_INCLUDE_METHOD,
  type MegacrowResolveBaseFileParams,
  type MegacrowResolveBaseFileResult,
  type MegacrowResolveIncludeParams,
  type MegacrowResolveIncludeResult,
} from "./protocol";

const decodeBase64 = (dataBase64: string): Uint8Array => {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const createResolvers = (
  connection: Connection,
  resolveBaseFileEnabled: boolean
): CompileResolvers => {
  const resolvers: CompileResolvers = {
    resolveInclude: async (
      path: string,
      ctx: { kind: "include" | "localized_include"; fromUri?: string }
    ) => {
      const result = (await connection.sendRequest(
        MEGACROW_RESOLVE_INCLUDE_METHOD,
        {
          path,
          kind: ctx.kind,
          fromUri: ctx.fromUri,
        } satisfies MegacrowResolveIncludeParams
      )) as MegacrowResolveIncludeResult;

      if ("error" in result) {
        return null;
      }
      return { text: result.text, uri: result.uri };
    },
  };

  if (resolveBaseFileEnabled) {
    resolvers.resolveBaseFile = async (
      path: string,
      ctx: { fromUri?: string }
    ) => {
      const result = (await connection.sendRequest(
        MEGACROW_RESOLVE_BASE_FILE_METHOD,
        {
          path,
          fromUri: ctx.fromUri,
        } satisfies MegacrowResolveBaseFileParams
      )) as MegacrowResolveBaseFileResult;

      if ("error" in result) {
        return null;
      }
      return decodeBase64(result.dataBase64);
    };
  }

  return resolvers;
};
