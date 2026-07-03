import rosetta from "rosetta";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

export type SupportedLocale = "en" | "ja";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "ja"];

type LocaleCatalog = typeof en;

const i18n = rosetta<LocaleCatalog>({ en, ja });
i18n.locale("en");

export const getLocale = (): SupportedLocale =>
    i18n.locale() as SupportedLocale;

export const setLocale = (locale: SupportedLocale): void => {
    i18n.locale(locale);
};

export const translate = (
    key: keyof LocaleCatalog,
    params?: Record<string, string | number>,
): string => i18n.t(key, params);
