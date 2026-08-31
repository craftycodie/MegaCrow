import type { Connection } from "vscode-languageserver";
import type { TextDocument } from "vscode-languageserver-textdocument";

export class DocumentStore {
  private readonly documents = new Map<string, TextDocument>();

  get(uri: string): TextDocument | undefined {
    return this.documents.get(uri);
  }

  set(uri: string, doc: TextDocument): void {
    this.documents.set(uri, doc);
  }

  delete(uri: string): void {
    this.documents.delete(uri);
  }

  clear(): void {
    this.documents.clear();
  }

  entries(): IterableIterator<[string, TextDocument]> {
    return this.documents.entries();
  }

  keys(): IterableIterator<string> {
    return this.documents.keys();
  }

  clearDiagnostics(connection: Connection, uri: string): void {
    this.delete(uri);
    connection.sendDiagnostics({ uri, diagnostics: [] });
  }

  clearAllDiagnostics(connection: Connection): void {
    const uris = [...this.keys()];
    this.clear();
    for (const uri of uris) {
      connection.sendDiagnostics({ uri, diagnostics: [] });
    }
  }
}
