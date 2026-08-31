import {
  basename,
  dirname,
  extname,
  join,
  normalize,
} from "@tauri-apps/api/path";
import { mkdir, readDir, readFile, writeFile } from "@tauri-apps/plugin-fs";
import { createTauriFileProvider } from "../files/fileProvider";
import type { CliFilesystem } from "./filesystem";
import { listTxtFilesAsync } from "./listTxtFiles";

export function createTauriFilesystem(): CliFilesystem {
  const fileProvider = createTauriFileProvider();
  return {
    fileProvider,
    resolve: async (...paths) => normalize(await join(...paths)),
    dirname: (filePath) => dirname(filePath),
    relative: async (from, to) => {
      const fromParts = (await normalize(from)).split(/[\\/]/);
      const toParts = (await normalize(to)).split(/[\\/]/);
      let index = 0;
      while (
        index < fromParts.length &&
        index < toParts.length &&
        fromParts[index]!.toLowerCase() === toParts[index]!.toLowerCase()
      ) {
        index++;
      }
      const ups = fromParts.slice(index).map(() => "..");
      return [...ups, ...toParts.slice(index)].join("\\");
    },
    basename: (filePath, ext) => basename(filePath, ext),
    extname: (filePath) => extname(filePath),
    readBytes: async (filePath) => readFile(filePath),
    writeBytes: async (filePath, bytes) => {
      await writeFile(filePath, bytes);
    },
    mkdirRecursive: async (dirPath) => {
      await mkdir(dirPath, { recursive: true });
    },
    isDirectory: async (targetPath) => {
      try {
        const parent = await dirname(targetPath);
        const name = await basename(targetPath);
        const entries = await readDir(parent);
        const entry = entries.find((candidate) => candidate.name === name);
        return entry?.isDirectory ?? false;
      } catch {
        return false;
      }
    },
    listTxtFiles: (rootDir, recursive) =>
      listTxtFilesAsync(
        async (dir) => {
          const entries = await readDir(dir);
          return entries.map((entry) => ({
            name: entry.name,
            isDirectory: () => entry.isDirectory,
            isFile: () => entry.isFile,
          }));
        },
        join,
        normalize,
        rootDir,
        recursive
      ),
  };
}
