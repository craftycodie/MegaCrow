import { STRING_TABLE_LANGUAGES } from "../../language-configuration/omni/strings";

type LanguageKeys = (typeof STRING_TABLE_LANGUAGES)[number];

type AtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

// Object of LanguageKey: string with at least one language set
type StringTableEntry = AtLeastOne<Record<LanguageKeys, string>>;

export type StringTable = StringTableEntry[];
export type StringTableReference = number;

export const addStringTableEntry = (stringTable: StringTable, entry: StringTableEntry): StringTableReference => {
    stringTable.push(entry);
    return stringTable.length - 1;
}