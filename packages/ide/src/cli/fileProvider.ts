import { readFile } from "node:fs/promises";
import path from "node:path";
import { decodeTextFile } from "../files";
import type { FileProvider } from "../files/fileProvider";

export function createNodeFileProvider(): FileProvider {
  return {
    async readText(filePath: string): Promise<string | null> {
      try {
        const bytes = new Uint8Array(await readFile(filePath));
        return decodeTextFile(bytes);
      } catch {
        return null;
      }
    },
    async readBytes(filePath: string): Promise<Uint8Array | null> {
      try {
        return new Uint8Array(await readFile(filePath));
      } catch {
        return null;
      }
    },
    resolvePath(relativePath: string, fromDir: string): string {
      if (path.isAbsolute(relativePath)) {
        return relativePath;
      }
      return path.resolve(fromDir, relativePath);
    },
  };
}
