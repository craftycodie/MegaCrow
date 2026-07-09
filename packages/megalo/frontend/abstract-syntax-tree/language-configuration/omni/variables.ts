import { VariableScope, VariableType } from "../../../symbol-table";

// We need to be strict on variable type & scope at parse because
// parsing actions needs the context of what type of variable a given parameter is
// in order to know how many parameters to expect,
// some actions have different parameter counts depending on the variable type.
export const VARIABLE_TYPE_NAMES = ["timer", "number", "team", "player", "object"] as const;
export const VARIABLE_SCOPE_NAMES = ["global", "team", "player", "object"] as const;

export type VariableTypeName = (typeof VARIABLE_TYPE_NAMES)[number];
export type VariableScopeName = (typeof VARIABLE_SCOPE_NAMES)[number];

export const isVariableTypeName = (value: string): value is VariableTypeName =>
    (VARIABLE_TYPE_NAMES as readonly string[]).includes(value);

export const isVariableScopeName = (value: string): value is VariableScopeName =>
    (VARIABLE_SCOPE_NAMES as readonly string[]).includes(value);

export const isNumericVariableType = (value: string): value is "timer" | "number" =>
    value === "timer" || value === "number";

export const variableTypeFromName = (name: VariableTypeName): VariableType => {
    switch (name) {
        case "timer":
            return VariableType.Timer;
        case "number":
            return VariableType.Number;
        case "team":
            return VariableType.Team;
        case "player":
            return VariableType.Player;
        case "object":
            return VariableType.Object;
    }
};

export const variableScopeFromName = (name: VariableScopeName): VariableScope => {
    switch (name) {
        case "global":
            return VariableScope.Global;
        case "team":
            return VariableScope.Team;
        case "player":
            return VariableScope.Player;
        case "object":
            return VariableScope.Object;
    }
};
