import { MegaloVersion } from "../../version";
import { TRIGGER_EXECUTION_KINDS, TriggerExecutionKind } from "../abstract-syntax-tree/language-configuration/omni/triggers";
import { BUILT_IN_LOCATION } from "../diagnostics";
import { VariableScope, VariableType } from ".";
import { ParserSymbolContext } from "./parser";

export const enum ParserScopeKind {
    Block,
    Trigger,
}

export type TriggerHeader =
    | { kind: TriggerExecutionKind }
    | { kind: "object"; objectFilter: string };

export type ParserScope =
    | { kind: ParserScopeKind.Block }
    | { kind: ParserScopeKind.Trigger; trigger: TriggerHeader };

export const normalizeTriggerHeader = (name: string): TriggerHeader => {
    const lower = name.toLowerCase();
    if ((TRIGGER_EXECUTION_KINDS as readonly string[]).includes(lower)) {
        return { kind: lower as TriggerExecutionKind };
    }

    return { kind: "object", objectFilter: name };
};

const addScopedVariable = (
    symbolParser: ParserSymbolContext,
    variableName: string,
    type: VariableType,
): void => {
    symbolParser.addVariableToScope({
        name: variableName,
        type,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
};

export const addBuiltInScopeVariables = (
    _megaloVersion: MegaloVersion,
    symbolParser: ParserSymbolContext,
    scope: ParserScope,
): void => {
    if (scope.kind !== ParserScopeKind.Trigger) {
        return;
    }

    switch (scope.trigger.kind) {
        case "player":
        case "random_player":
            addScopedVariable(symbolParser, "current_player", VariableType.Player);
            break;
        case "team":
            addScopedVariable(symbolParser, "current_team", VariableType.Team);
            break;
        case "object":
            addScopedVariable(symbolParser, "current_object", VariableType.Object);
            break;
        case "object_death":
            addScopedVariable(symbolParser, "object_death_damage_type", VariableType.Number);
            addScopedVariable(symbolParser, "object_death_dead_object", VariableType.Object);
            addScopedVariable(symbolParser, "object_death_killing_object", VariableType.Object);
            addScopedVariable(symbolParser, "object_death_killing_player", VariableType.Player);
            break;
        default:
            break;
    }
};
