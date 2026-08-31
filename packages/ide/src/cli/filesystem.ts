import type { FileProvider } from "../files/fileProvider";

export interface CliFilesystem {
  basename(filePath: string, ext?: string): Promise<string>;
  dirname(filePath: string): Promise<string>;
  extname(filePath: string): Promise<string>;
  readonly fileProvider: FileProvider;
  isDirectory(path: string): Promise<boolean>;
  listTxtFiles(rootDir: string, recursive: boolean): Promise<string[]>;
  mkdirRecursive(dirPath: string): Promise<void>;
  readBytes(filePath: string): Promise<Uint8Array>;
  relative(from: string, to: string): Promise<string>;
  resolve(...paths: string[]): Promise<string>;
  writeBytes(filePath: string, bytes: Uint8Array): Promise<void>;
}
