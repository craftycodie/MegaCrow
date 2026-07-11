import { StringTableReference } from "../string_table";

export type UserDefinedOptionValue = {
    value: number;
    name?: StringTableReference;
    description?: StringTableReference;
}

type UserDefinedOptionBase = {
    name?: StringTableReference;
    description?: StringTableReference;
    locked?: boolean;
    hidden?: boolean;
}

export type RangedUserDefinedOption = UserDefinedOptionBase & {
    defaultValue: UserDefinedOptionValue;
    minValue: UserDefinedOptionValue;
    maxValue: UserDefinedOptionValue;
    currentValue: number;
}

export type NormalUserDefinedOption = UserDefinedOptionBase & {
    values: UserDefinedOptionValue[];
    defaultValueIndex: number;
    currentValueIndex: number;
}

export type UserDefinedOption = RangedUserDefinedOption | NormalUserDefinedOption;