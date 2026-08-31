/** Shared `.txt` directory walk for CLI filesystem adapters. */
export async function listTxtFilesAsync(
  readDir: (
    dir: string
  ) => Promise<
    Iterable<{ isDirectory(): boolean; isFile(): boolean; name: string }>
  >,
  join: (dir: string, name: string) => string | Promise<string>,
  normalize: (path: string) => string | Promise<string>,
  rootDir: string,
  recursive: boolean
): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readDir(dir);
    for (const entry of entries) {
      const absolutePath = await join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) {
          await walk(absolutePath);
        }
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".txt")) {
        results.push(absolutePath);
      }
    }
  }

  await walk(await normalize(rootDir));
  return results.sort();
}

export function listTxtFilesSync(
  readdir: (
    dir: string
  ) => Iterable<{ isDirectory(): boolean; isFile(): boolean; name: string }>,
  join: (...parts: string[]) => string,
  resolve: (...parts: string[]) => string,
  rootDir: string,
  recursive: boolean
): string[] {
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdir(dir)) {
      const absolutePath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) {
          walk(absolutePath);
        }
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".txt")) {
        results.push(absolutePath);
      }
    }
  };
  walk(resolve(rootDir));
  return results.sort();
}
