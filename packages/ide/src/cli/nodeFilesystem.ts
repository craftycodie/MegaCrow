import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createNodeFileProvider } from "./fileProvider";
import type { CliFilesystem } from "./filesystem";
import { listTxtFilesSync } from "./listTxtFiles";

export function createNodeFilesystem(): CliFilesystem {
  const fileProvider = createNodeFileProvider();
  return {
    fileProvider,
    resolve: (...paths) => Promise.resolve(path.resolve(...paths)),
    dirname: (filePath) => Promise.resolve(path.dirname(filePath)),
    relative: (from, to) => Promise.resolve(path.relative(from, to)),
    basename: (filePath, ext) => Promise.resolve(path.basename(filePath, ext)),
    extname: (filePath) => Promise.resolve(path.extname(filePath)),
    readBytes: async (filePath) => new Uint8Array(readFileSync(filePath)),
    writeBytes: async (filePath, bytes) => {
      writeFileSync(filePath, bytes);
    },
    mkdirRecursive: async (dirPath) => {
      mkdirSync(dirPath, { recursive: true });
    },
    isDirectory: async (targetPath) => statSync(targetPath).isDirectory(),
    listTxtFiles: async (rootDir, recursive) =>
      listTxtFilesSync(
        (dir) => readdirSync(dir, { withFileTypes: true }),
        path.join,
        path.resolve,
        rootDir,
        recursive
      ),
  };
}
