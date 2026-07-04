import { ASTElementBase, ElementKind } from "..";
import { ASTErrorNode, ASTReferenceNode, SyntaxKind } from "../..";
import { SourceCodeLocation } from "../../../diagnostics";
import { type NumericInitialValue } from "../constants";
import { type ASTStringLiteralOrReference } from "../string_literal_or_reference";
import { PlayerTraitsElementNode } from "./player_traits";

export type { ASTStringLiteralOrReference } from "../string_literal_or_reference";

export const enum GameOptionEntryKind {
    OVERRIDE = 0,
    OPTION = 1,
    RANGED_OPTION = 2,
    PLAYER_TRAITS = 3,
}

export type GameOptionModifiers = {
    lock: boolean;
    hide: boolean;
};

export type UserDefinedOptionValueNode = {
    value: NumericInitialValue;
    name?: ASTStringLiteralOrReference;
    description?: ASTStringLiteralOrReference;
    location: SourceCodeLocation;
};

export type UserDefinedOptionNode = {
    kind: GameOptionEntryKind.OPTION | GameOptionEntryKind.RANGED_OPTION;
    modifiers: GameOptionModifiers;
    name: { value: string; location: SourceCodeLocation; symbolId: number } | ASTErrorNode;
    displayName: ASTStringLiteralOrReference;
    description: ASTStringLiteralOrReference;
    defaultValue: NumericInitialValue;
    values: UserDefinedOptionValueNode[];
    location: SourceCodeLocation;
};

export type OverrideSimpleValueNode = {
    kind: "simple";
    value: NumericInitialValue;
};

export type OverrideLoadoutPaletteNode = {
    kind: "loadout_palette";
    tier: { value: string; location: SourceCodeLocation } | ASTErrorNode;
    palette: { value: string; location: SourceCodeLocation } | ASTErrorNode;
};

export type OverrideNestedBodyNode = {
    kind: "nested";
    body: { location: SourceCodeLocation };
};

export type OverrideEntryNode = {
    kind: GameOptionEntryKind.OVERRIDE;
    modifiers: GameOptionModifiers;
    name: ASTReferenceNode | ASTErrorNode;
    value: OverrideSimpleValueNode | OverrideLoadoutPaletteNode | OverrideNestedBodyNode | ASTErrorNode;
    location: SourceCodeLocation;
};

export type GameOptionEntryNode =
    | OverrideEntryNode
    | UserDefinedOptionNode
    | PlayerTraitsElementNode;

export type GameOptionsElementNode = ASTElementBase<ElementKind.GAME_OPTIONS> & {
    entries: GameOptionEntryNode[];
};
