import { STRING_TABLE_LANGUAGES } from "../../abstract-syntax-tree/language-configuration/omni/strings";

export type StringTableEntry = Record<keyof typeof STRING_TABLE_LANGUAGES, string>;
export type StringTable = StringTableEntry[];
export type StringTableReference = number;