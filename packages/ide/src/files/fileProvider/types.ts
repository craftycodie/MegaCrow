/** Host filesystem adapter for Megalo includes and `base` resolution. */
export interface FileProvider {
  readBytes?(path: string): Promise<Uint8Array | null>;
  readText(path: string): Promise<string | null>;
  resolvePath(relativePath: string, fromDir: string): string;
}
