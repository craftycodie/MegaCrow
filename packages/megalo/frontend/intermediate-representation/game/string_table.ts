import type { StringTableLanguage } from "../../language-configuration/omni/strings";

type AtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> &
    Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

// Object of LanguageKey: string with at least one language set
export type StringTableEntry = AtLeastOne<Record<StringTableLanguage, string>>;

export type StringTableReference = number;

export const stringTableEntry = (
  language: StringTableLanguage,
  content: string
): StringTableEntry => ({ [language]: content }) as StringTableEntry;

export class StringTable {
  private readonly table: StringTableEntry[] = [];

  public constructor(table: StringTableEntry[] = []) {
    this.table = table;
  }

  public addEntry(entry: StringTableEntry): StringTableReference {
    this.table.push(entry);
    return this.table.length;
  }

  public toArray(): readonly StringTableEntry[] {
    return this.table;
  }
}
