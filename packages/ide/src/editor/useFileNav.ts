import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  canNavigateFileNavBack,
  canNavigateFileNavForward,
  EMPTY_FILE_NAV,
  type FileNavEntry,
  type FileNavState,
  installFileNavShortcuts,
  navigateFileNavBack,
  navigateFileNavForward,
  pushFileNavEntry,
  renameFileNavEntries,
} from "../editor";

interface UseFileNavOptions {
  activeWorkspaceId: string | null;
  loadMegaloSource: (
    text: string,
    name: string,
    includeRoot?: { absoluteFilePath: string }
  ) => void;
  readFileForNav: (entry: FileNavEntry) => Promise<{
    text: string;
    name: string;
    includeRoot?: { absoluteFilePath: string };
  } | null>;
  sourceRef: RefObject<string>;
  suppressFileNavRef: RefObject<boolean>;
}

export function useFileNav({
  activeWorkspaceId,
  loadMegaloSource,
  readFileForNav,
  sourceRef,
  suppressFileNavRef,
}: UseFileNavOptions) {
  const [fileNav, setFileNav] = useState<FileNavState>(EMPTY_FILE_NAV);
  const fileNavWorkspaceIdRef = useRef<string | null>(activeWorkspaceId);

  useEffect(() => {
    if (fileNavWorkspaceIdRef.current === activeWorkspaceId) {
      return;
    }
    fileNavWorkspaceIdRef.current = activeWorkspaceId;
    suppressFileNavRef.current = false;
    setFileNav(EMPTY_FILE_NAV);
  }, [activeWorkspaceId]);

  const recordFileNavOpen = useCallback(
    (entry: FileNavEntry) => {
      if (suppressFileNavRef.current) {
        return;
      }
      setFileNav((prev) =>
        pushFileNavEntry(prev, entry, sourceRef.current ?? "")
      );
    },
    [sourceRef]
  );

  const openFileNavEntry = useCallback(
    async (entry: FileNavEntry) => {
      suppressFileNavRef.current = true;
      try {
        const resolved = await readFileForNav(entry);
        if (resolved) {
          loadMegaloSource(resolved.text, resolved.name, resolved.includeRoot);
          return;
        }
        loadMegaloSource(
          entry.text,
          entry.displayName,
          entry.absoluteFilePath
            ? { absoluteFilePath: entry.absoluteFilePath }
            : undefined
        );
      } finally {
        queueMicrotask(() => {
          suppressFileNavRef.current = false;
        });
      }
    },
    [loadMegaloSource, readFileForNav]
  );

  const handleNavigateBack = useCallback(() => {
    const result = navigateFileNavBack(fileNav, sourceRef.current ?? "");
    if (!result) {
      return;
    }
    setFileNav(result.state);
    void openFileNavEntry(result.entry);
  }, [fileNav, openFileNavEntry, sourceRef]);

  const handleNavigateForward = useCallback(() => {
    const result = navigateFileNavForward(fileNav, sourceRef.current ?? "");
    if (!result) {
      return;
    }
    setFileNav(result.state);
    void openFileNavEntry(result.entry);
  }, [fileNav, openFileNavEntry, sourceRef]);

  const handleFileRenamed = useCallback(
    (oldName: string, newName: string, absoluteFilePath: string) => {
      setFileNav((prev) =>
        renameFileNavEntries(prev, oldName, newName, absoluteFilePath)
      );
    },
    []
  );

  const navigateBackRef = useRef(handleNavigateBack);
  const navigateForwardRef = useRef(handleNavigateForward);
  const canNavigateBackRef = useRef(false);
  const canNavigateForwardRef = useRef(false);
  navigateBackRef.current = handleNavigateBack;
  navigateForwardRef.current = handleNavigateForward;
  canNavigateBackRef.current = canNavigateFileNavBack(fileNav);
  canNavigateForwardRef.current = canNavigateFileNavForward(fileNav);

  useEffect(
    () =>
      installFileNavShortcuts({
        canGoBack: () => canNavigateBackRef.current,
        canGoForward: () => canNavigateForwardRef.current,
        goBack: () => navigateBackRef.current(),
        goForward: () => navigateForwardRef.current(),
      }),
    []
  );

  return {
    canNavigateBack: canNavigateFileNavBack(fileNav),
    canNavigateForward: canNavigateFileNavForward(fileNav),
    handleFileRenamed,
    handleNavigateBack,
    handleNavigateForward,
    recordFileNavOpen,
    setFileNav,
  };
}
