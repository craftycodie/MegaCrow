import type { ValueWithLocation } from "../..";
import type { StringTableReference } from "../string_table";

export type UserDefinedOptionValue = {
  value: ValueWithLocation<number>;
  name?: ValueWithLocation<StringTableReference>;
  description?: ValueWithLocation<StringTableReference>;
};

type UserDefinedOptionBase = {
  name?: ValueWithLocation<StringTableReference>;
  description?: ValueWithLocation<StringTableReference>;
  // on compiled gametypes, hide and lock are stored separately from options.
  locked?: ValueWithLocation<boolean>;
  hidden?: ValueWithLocation<boolean>;
};

export type RangedUserDefinedOption = UserDefinedOptionBase & {
  defaultValue: ValueWithLocation<UserDefinedOptionValue>;
  minValue: ValueWithLocation<UserDefinedOptionValue>;
  maxValue: ValueWithLocation<UserDefinedOptionValue>;
  currentValue: ValueWithLocation<number>;
};

export type NormalUserDefinedOption = UserDefinedOptionBase & {
  values: ValueWithLocation<UserDefinedOptionValue>[];
  defaultValueIndex: ValueWithLocation<number>;
  currentValueIndex: ValueWithLocation<number>;
};

export type UserDefinedOption =
  | RangedUserDefinedOption
  | NormalUserDefinedOption;
