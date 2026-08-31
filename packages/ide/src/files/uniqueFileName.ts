/** Split a file name into stem + extension; directories keep the full name as stem. */
export function splitStemAndExt(
  name: string,
  options?: { directory?: boolean }
): { ext: string; stem: string } {
  if (options?.directory) {
    return { stem: name, ext: "" };
  }
  const dot = name.lastIndexOf(".");
  if (dot <= 0) {
    return { stem: name, ext: "" };
  }
  return { stem: name.slice(0, dot), ext: name.slice(dot) };
}

/** `script.txt` + 1 → `script (1).txt`; folders use `folder (1)`. */
export function numberedFileName(
  name: string,
  n: number,
  options?: { directory?: boolean }
): string {
  const { stem, ext } = splitStemAndExt(name, options);
  return `${stem} (${n})${ext}`;
}

/**
 * If `desired` is free, return it. Otherwise `name (1).ext`, `name (2).ext`, …
 * `isTaken` should return false for the entry being renamed.
 */
export async function allocateNumberedName(
  desired: string,
  isTaken: (name: string) => boolean | Promise<boolean>,
  options?: { directory?: boolean }
): Promise<string> {
  if (!(await isTaken(desired))) {
    return desired;
  }
  let n = 1;
  for (;;) {
    const candidate = numberedFileName(desired, n, options);
    if (!(await isTaken(candidate))) {
      return candidate;
    }
    n += 1;
  }
}
