import type { AnalysisSnapshot } from "@megacrow/megalo";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  analyzeDocumentSnapshot,
  semanticTokensFromSnapshot,
} from "./artifacts";
import type { CompileResolvers } from "./protocol";
import type { MegacrowSession } from "./sessionSettings";

export interface SnapshotCacheEntry {
  semanticTokens: number[];
  snapshot: AnalysisSnapshot;
  version: number;
}

export class SnapshotCache {
  private readonly cache = new Map<string, SnapshotCacheEntry>();
  private readonly inflight = new Map<string, Promise<SnapshotCacheEntry>>();

  delete(uri: string): void {
    this.cache.delete(uri);
    for (const key of [...this.inflight.keys()]) {
      if (key.startsWith(`${uri}:`)) {
        this.inflight.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.inflight.clear();
  }

  get(uri: string): SnapshotCacheEntry | undefined {
    return this.cache.get(uri);
  }

  set(uri: string, entry: SnapshotCacheEntry): void {
    this.cache.set(uri, entry);
  }

  refresh(
    uri: string,
    text: string,
    version: number,
    session: MegacrowSession,
    options: {
      objectLists?: import("@megacrow/megalo").ObjectLists;
      resolvers: CompileResolvers;
    }
  ): Promise<SnapshotCacheEntry> {
    const cached = this.cache.get(uri);
    if (cached && cached.version === version) {
      return Promise.resolve(cached);
    }

    const inflightKey = `${uri}:${version}`;
    const existing = this.inflight.get(inflightKey);
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      const snapshot = await analyzeDocumentSnapshot(text, session, {
        version: session.megaloVersion,
        objectLists: options.objectLists,
        fromUri: uri,
        resolvers: options.resolvers,
      });
      const entry: SnapshotCacheEntry = {
        snapshot,
        semanticTokens: semanticTokensFromSnapshot(snapshot),
        version,
      };
      this.cache.set(uri, entry);
      return entry;
    })().finally(() => {
      this.inflight.delete(inflightKey);
    });

    this.inflight.set(inflightKey, promise);
    return promise;
  }

  async getOrRefresh(
    uri: string,
    doc: TextDocument,
    session: MegacrowSession,
    options: {
      objectLists?: import("@megacrow/megalo").ObjectLists;
      resolvers: CompileResolvers;
    }
  ): Promise<SnapshotCacheEntry> {
    const cached = this.cache.get(uri);
    if (cached && cached.version === doc.version) {
      return cached;
    }
    return await this.refresh(
      uri,
      doc.getText(),
      doc.version,
      session,
      options
    );
  }
}
