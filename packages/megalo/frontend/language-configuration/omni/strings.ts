export const STRING_TABLE_LANGUAGES = [
  "english",
  "japanese",
  "german",
  "french",
  "spanish",
  "mexican_spanish",
  "italian",
  "korean",
  "traditional_chinese",
  "simplified_chinese",
  "portuguese",
  "polish",
] as const;

export type StringTableLanguage = (typeof STRING_TABLE_LANGUAGES)[number];
