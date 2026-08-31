import type { MegaloIncludeRoot } from "../compile/megaloIncludes";

export interface FileNavSourceEntry {
  absoluteFilePath: string | null;
  displayName: string;
  text: string;
  type: "source";
}

export type FileNavEntry = FileNavSourceEntry;

export interface FileNavState {
  entries: FileNavEntry[];
  index: number;
}

export const EMPTY_FILE_NAV: FileNavState = {
  entries: [],
  index: -1,
};

const samePath = (a: string | null, b: string | null): boolean => {
  if (!(a && b)) {
    return false;
  }
  return (
    a.replace(/\\/g, "/").toLowerCase() === b.replace(/\\/g, "/").toLowerCase()
  );
};

export const fileNavEntryKey = (entry: FileNavEntry): string => {
  if (entry.absoluteFilePath) {
    return `source:${entry.absoluteFilePath.replace(/\\/g, "/").toLowerCase()}`;
  }
  return `source-name:${entry.displayName.toLowerCase()}`;
};

export const isSameFileNavEntry = (a: FileNavEntry, b: FileNavEntry): boolean =>
  fileNavEntryKey(a) === fileNavEntryKey(b);

/** Capture the live editor buffer into the current history slot before leaving it. */
export const withUpdatedCurrentText = (
  state: FileNavState,
  text: string
): FileNavState => {
  const current = state.entries[state.index];
  if (!current) {
    return state;
  }
  if (current.text === text) {
    return state;
  }
  const entries = state.entries.slice();
  entries[state.index] = { ...current, text };
  return { ...state, entries };
};

export const pushFileNavEntry = (
  state: FileNavState,
  entry: FileNavEntry,
  currentEditorText?: string
): FileNavState => {
  let next = state;
  if (currentEditorText !== undefined) {
    next = withUpdatedCurrentText(next, currentEditorText);
  }

  const current = next.entries[next.index];
  if (current && isSameFileNavEntry(current, entry)) {
    // Refresh snapshot / display for the active file; drop any forward branch.
    const entries = next.entries.slice(0, next.index + 1);
    entries[next.index] = entry;
    return { entries, index: next.index };
  }

  const entries = next.entries.slice(0, next.index + 1);
  entries.push(entry);
  return { entries, index: entries.length - 1 };
};

export const canNavigateFileNavBack = (state: FileNavState): boolean =>
  state.index > 0;

export const canNavigateFileNavForward = (state: FileNavState): boolean =>
  state.index >= 0 && state.index < state.entries.length - 1;

export const navigateFileNavBack = (
  state: FileNavState,
  currentEditorText?: string
): { state: FileNavState; entry: FileNavEntry } | null => {
  if (!canNavigateFileNavBack(state)) {
    return null;
  }
  let next = state;
  if (currentEditorText !== undefined) {
    next = withUpdatedCurrentText(next, currentEditorText);
  }
  const index = next.index - 1;
  const entry = next.entries[index];
  if (!entry) {
    return null;
  }
  return { state: { ...next, index }, entry };
};

export const navigateFileNavForward = (
  state: FileNavState,
  currentEditorText?: string
): { state: FileNavState; entry: FileNavEntry } | null => {
  if (!canNavigateFileNavForward(state)) {
    return null;
  }
  let next = state;
  if (currentEditorText !== undefined) {
    next = withUpdatedCurrentText(next, currentEditorText);
  }
  const index = next.index + 1;
  const entry = next.entries[index];
  if (!entry) {
    return null;
  }
  return { state: { ...next, index }, entry };
};

export const sourceNavEntry = (
  text: string,
  displayName: string,
  includeRoot?: MegaloIncludeRoot | null
): FileNavSourceEntry => ({
  type: "source",
  displayName,
  absoluteFilePath: includeRoot?.absoluteFilePath ?? null,
  text,
});

/** Keep history in sync when the active file is renamed on disk. */
export const renameFileNavEntries = (
  state: FileNavState,
  oldName: string,
  newName: string,
  absoluteFilePath?: string
): FileNavState => {
  let changed = false;
  const entries = state.entries.map((entry) => {
    const nameMatch =
      entry.displayName.localeCompare(oldName, undefined, {
        sensitivity: "accent",
      }) === 0;
    const pathMatch =
      absoluteFilePath !== undefined &&
      samePath(entry.absoluteFilePath, absoluteFilePath);
    if (!(nameMatch || pathMatch)) {
      return entry;
    }
    changed = true;
    return {
      ...entry,
      displayName: newName,
      absoluteFilePath: absoluteFilePath ?? entry.absoluteFilePath,
    };
  });
  return changed ? { ...state, entries } : state;
};
