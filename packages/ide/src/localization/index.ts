import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import rosetta from "rosetta";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

export type IdeLocale = "en" | "ja";

export const IDE_LOCALES: IdeLocale[] = ["en", "ja"];

type LocaleCatalog = typeof en;

const i18n = rosetta<LocaleCatalog>({ en, ja });
i18n.locale("en");

export type IdeMessageKey = keyof LocaleCatalog;

export const getIdeLocale = (): IdeLocale => i18n.locale() as IdeLocale;

export const setIdeLocale = (locale: IdeLocale): void => {
  i18n.locale(locale);
};

export const translate = (
  key: IdeMessageKey,
  params?: Record<string, string | number>
): string => i18n.t(key, params);

export const failedToCompileStatus = (errorCount: number): string => {
  const count = Math.max(errorCount, 1);
  return translate(
    count === 1
      ? "status_failed_to_compile_one"
      : "status_failed_to_compile_other",
    { count }
  );
};

const DISK_ERROR_KEYS = {
  "Cannot rename the workspace root": "disk_error_rename_root",
  "Invalid folder name": "disk_error_invalid_folder_name",
  "Invalid file name": "disk_error_invalid_file_name",
  "Cannot move the workspace root": "disk_error_move_root",
  "Cannot move a folder into itself": "disk_error_move_into_self",
  "Cannot delete the workspace root": "disk_error_delete_root",
  "Cannot duplicate the workspace root": "disk_error_duplicate_root",
} as const satisfies Record<string, IdeMessageKey>;

const LAUNCH_ERROR_KEYS = {
  "Launching Halo MCC is only available in the desktop app":
    "launch_mcc_desktop_only",
  "Launching the game is only available in the desktop app":
    "launch_game_desktop_only",
} as const satisfies Record<string, IdeMessageKey>;

export const translateDiskError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  const key = DISK_ERROR_KEYS[message as keyof typeof DISK_ERROR_KEYS];
  return key ? translate(key) : message;
};

export const translateLaunchError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  const key = LAUNCH_ERROR_KEYS[message as keyof typeof LAUNCH_ERROR_KEYS];
  return key ? translate(key) : message;
};

interface IdeLocaleContextValue {
  locale: IdeLocale;
  setLocale: (locale: IdeLocale) => void;
  t: typeof translate;
}

const IdeLocaleContext = createContext<IdeLocaleContextValue | null>(null);

export function IdeLocaleProvider({
  locale,
  children,
}: {
  locale: IdeLocale;
  children: ReactNode;
}) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setIdeLocale(locale);
    setRevision((n) => n + 1);
  }, [locale]);

  const setLocale = useCallback((next: IdeLocale) => {
    setIdeLocale(next);
    setRevision((n) => n + 1);
  }, []);

  const value = useMemo<IdeLocaleContextValue>(
    () => ({
      locale: getIdeLocale(),
      setLocale,
      t: translate,
    }),
    [locale, revision, setLocale]
  );

  return createElement(IdeLocaleContext.Provider, { value }, children);
}

export function useIdeLocale(): IdeLocaleContextValue {
  const ctx = useContext(IdeLocaleContext);
  if (!ctx) {
    return {
      locale: getIdeLocale(),
      setLocale: setIdeLocale,
      t: translate,
    };
  }
  return ctx;
}

/** Prefer this in React components so they re-render when locale changes. */
export function useT(): typeof translate {
  return useIdeLocale().t;
}
