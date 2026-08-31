export interface SourceFileQuickOpenEntry {
  /** Secondary text (folder, workspace, etc.). */
  description?: string;
  /** Stable id for the pick (path or opfs name). */
  id: string;
  /** Primary label shown in the picker (searchable). */
  label: string;
  open: () => void | Promise<void>;
}
