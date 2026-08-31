import { useCallback, useState } from "react";
import { revealInFileManager, writeClipboardText } from "../../desktop";
import {
  deleteTauriMegaloFile,
  type FileClipboardPayload,
  getOpfsGametypeClipboardFiles,
  type LocalDiskNode,
  type LocalDiskRoot,
  pathKey,
  readFileClipboard,
  resolveTauriMegaloFilePath,
  writeFileClipboard,
} from "../../files";
import { isObjectListsPath } from "../../gametype";
import { translateDiskError } from "../../localization";
import { findLocalDiskNode } from "../../workspace";
import type { useDiskFileOps } from "./useDiskFileOps";
import type { useOpfsFileOps } from "./useOpfsFileOps";

export type FilesContextTarget =
  | { type: "file"; path: string[]; virtual?: boolean }
  | { type: "directory"; path: string[]; virtual?: boolean };

export type FilesContextSource = "local" | "opfs" | "builds";

export interface FilesContextMenuState {
  selectedTargets?: FilesContextTarget[];
  source: FilesContextSource;
  target: FilesContextTarget;
  x: number;
  y: number;
}

type OpfsOps = ReturnType<typeof useOpfsFileOps>;
type DiskOps = ReturnType<typeof useDiskFileOps>;

interface Options {
  diskOps: DiskOps;
  localRoot: LocalDiskRoot | null;
  localTree: LocalDiskNode[];
  opfsOps: OpfsOps;
  outputPath: string | null;
  refreshBuilds: () => Promise<void>;
  setBuildsError: (error: string | null) => void;
  setLocalError: (error: string | null) => void;
  setRenamingPathKey: (key: string | null) => void;
  tauriAvailable: boolean;
}

export function useFilesPanelContextMenu({
  opfsOps,
  diskOps,
  localRoot,
  localTree,
  outputPath,
  refreshBuilds,
  setBuildsError,
  setLocalError,
  setRenamingPathKey,
  tauriAvailable,
}: Options) {
  const [contextMenu, setContextMenu] = useState<FilesContextMenuState | null>(
    null
  );
  const [pendingBuildsDelete, setPendingBuildsDelete] = useState<
    string[][] | null
  >(null);
  const [pastePayload, setPastePayload] = useState<FileClipboardPayload | null>(
    null
  );

  const refreshPasteFromClipboard = useCallback(() => {
    void readFileClipboard().then(setPastePayload);
  }, []);

  const openContextMenu = useCallback(
    (menu: FilesContextMenuState) => {
      setPastePayload(null);
      setContextMenu(menu);
      refreshPasteFromClipboard();
    },
    [refreshPasteFromClipboard]
  );

  const resolveContextAbsolutePath = useCallback(
    async (
      path: string[],
      source: FilesContextSource
    ): Promise<string | null> => {
      if (source === "builds") {
        if (!outputPath) {
          return null;
        }
        return resolveTauriMegaloFilePath({ path: outputPath }, path);
      }
      if (source === "local") {
        return diskOps.resolveContextAbsolutePath(path);
      }
      return null;
    },
    [diskOps, outputPath]
  );

  const activePendingDelete =
    opfsOps.pendingDelete === null
      ? diskOps.pendingDelete === null
        ? pendingBuildsDelete === null
          ? null
          : {
              paths: pendingBuildsDelete,
              source: "builds" as const,
              targets: pendingBuildsDelete.map((path) => ({
                type: "file" as const,
                path,
              })),
            }
        : {
            paths: diskOps.pendingDelete.paths,
            source: "local" as const,
            targets: diskOps.pendingDelete.targets,
          }
      : {
          paths: [[opfsOps.pendingDelete.name]],
          source: "opfs" as const,
          targets: [
            { type: "file" as const, path: [opfsOps.pendingDelete.name] },
          ],
        };

  const handleConfirmDelete = useCallback(() => {
    if (opfsOps.pendingDelete) {
      opfsOps.confirmDelete();
      return;
    }
    if (diskOps.pendingDelete) {
      diskOps.confirmDelete();
      return;
    }
    if (pendingBuildsDelete && outputPath) {
      const paths = pendingBuildsDelete;
      setPendingBuildsDelete(null);
      void (async () => {
        try {
          setBuildsError(null);
          for (const path of paths) {
            await deleteTauriMegaloFile({ path: outputPath }, path);
          }
          await refreshBuilds();
        } catch (error) {
          setBuildsError(String(error));
          console.error("Failed to delete built gametype(s):", error);
        }
      })();
    }
  }, [
    diskOps,
    opfsOps,
    outputPath,
    pendingBuildsDelete,
    refreshBuilds,
    setBuildsError,
  ]);

  const handleCancelDelete = useCallback(() => {
    opfsOps.cancelDelete();
    diskOps.cancelDelete();
    setPendingBuildsDelete(null);
  }, [diskOps, opfsOps]);

  const resetOnRootChange = useCallback(() => {
    setContextMenu(null);
    setPastePayload(null);
    setPendingBuildsDelete(null);
  }, []);

  const contextMenuProps = {
    canPaste:
      pastePayload !== null &&
      contextMenu !== null &&
      pastePayload.source === contextMenu.source,
    menu: contextMenu,
    onClose: () => {
      setContextMenu(null);
      setPastePayload(null);
    },
    onCopy: (path: string[], source: FilesContextSource) => {
      void (async () => {
        try {
          if (source === "opfs") {
            const name = path[0];
            if (!name) {
              return;
            }
            const payload = { source: "opfs" as const, name };
            const files = await getOpfsGametypeClipboardFiles(name);
            await writeFileClipboard(payload, { files });
            setPastePayload(payload);
            return;
          }
          if (source === "builds") {
            return;
          }
          if (!localRoot) {
            return;
          }
          const payload = { source: "local" as const, path: [...path] };
          const absolute = await resolveTauriMegaloFilePath(localRoot, path);
          await writeFileClipboard(payload, { absolutePaths: [absolute] });
          setPastePayload(payload);
        } catch (error) {
          if (source === "opfs") {
            opfsOps.setOpfsError(String(error));
          } else if (source === "builds") {
            setBuildsError(String(error));
          } else {
            setLocalError(translateDiskError(error));
          }
        }
      })();
    },
    onCopyPath: (paths: string[][], source: FilesContextSource) => {
      if (source === "opfs") {
        const name = paths[0]?.[0];
        if (name) {
          void opfsOps.copyOpfsPath(name);
        }
        return;
      }
      void (async () => {
        try {
          const absolutes: string[] = [];
          for (const path of paths) {
            const absolute = await resolveContextAbsolutePath(path, source);
            if (absolute) {
              absolutes.push(absolute);
            }
          }
          if (absolutes.length === 0) {
            return;
          }
          await writeClipboardText(absolutes.join("\n"));
        } catch (error) {
          if (source === "builds") {
            setBuildsError(String(error));
          } else {
            setLocalError(translateDiskError(error));
          }
        }
      })();
    },
    onDelete: (targets: FilesContextTarget[], source: FilesContextSource) => {
      const deletable = targets.filter((target) => !target.virtual);
      if (deletable.length === 0) {
        return;
      }
      if (source === "opfs") {
        const name = deletable[0]?.path[0];
        if (name) {
          opfsOps.requestDelete(name);
        }
        return;
      }
      if (source === "builds") {
        setPendingBuildsDelete(deletable.map((target) => target.path));
        return;
      }
      diskOps.requestDelete(
        deletable.map((target) => target.path),
        deletable
      );
    },
    onNewFile: (parentPath: string[], source: FilesContextSource) => {
      if (source === "local") {
        void diskOps.createLocalFile(parentPath);
      }
    },
    onNewFolder: (parentPath: string[], source: FilesContextSource) => {
      if (source === "local") {
        void diskOps.createLocalFolder(parentPath);
      }
    },
    onPaste: (target: FilesContextTarget, source: FilesContextSource) => {
      const payloadSnapshot = pastePayload;
      void (async () => {
        const payload = (await readFileClipboard()) ?? payloadSnapshot;
        if (!payload || payload.source !== source) {
          return;
        }
        if (source === "opfs") {
          await opfsOps.pasteOpfsFile(payload);
          return;
        }
        const parent =
          target.type === "directory" ? target.path : target.path.slice(0, -1);
        await diskOps.pasteLocalFile(parent, payload);
      })();
    },
    onRename: (path: string[], source: FilesContextSource) => {
      if (source === "opfs") {
        if (isObjectListsPath(path)) {
          return;
        }
        setRenamingPathKey(pathKey(path));
        return;
      }
      if (source === "builds") {
        return;
      }
      const node = findLocalDiskNode(localTree, path);
      if (node?.virtual) {
        return;
      }
      setRenamingPathKey(pathKey(path));
    },
    onReveal: tauriAvailable
      ? (path: string[], source: FilesContextSource) => {
          void (async () => {
            try {
              const absolute = await resolveContextAbsolutePath(path, source);
              if (!absolute) {
                return;
              }
              await revealInFileManager(absolute);
            } catch (error) {
              if (source === "builds") {
                setBuildsError(String(error));
              } else {
                setLocalError(translateDiskError(error));
              }
            }
          })();
        }
      : undefined,
  };

  return {
    activePendingDelete,
    contextMenuProps,
    handleCancelDelete,
    handleConfirmDelete,
    openContextMenu,
    resetOnRootChange,
  };
}
