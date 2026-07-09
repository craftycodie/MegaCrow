import { isAstErrorNode, SyntaxKind } from "../..";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { SymbolKind } from "../../../symbol-table";
import { Token, TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";
import { parseNumericInitialValue } from "../constants";
import {
    isEndToken,
    locationSpan,
    parseIdentifier,
} from "./shared";
import { parsePlayerTraitOptions } from "./player_traits";
import { GameOptionEntryKind, type GameOptionModifiers, type OverrideEntryNode, type OverrideNameNode, type OverrideSimpleValueNode } from "./types";

const PLAYER_TRAITS_OVERRIDE_OPTIONS = new Set([
    "base_player_traits",
    "respawn_traits",
    "red_powerup_traits",
    "blue_powerup_traits",
    "yellow_powerup_traits",
]);

const BUILT_IN_NON_NUMERIC_OVERRIDE_OPTIONS = new Set([
    ...PLAYER_TRAITS_OVERRIDE_OPTIONS,
    "weapon_set",
    "vehicle_set",
    "loadout_palette",
]);

const parseOverrideName = (
    ctx: ParserContext,
    nameToken: Token,
): OverrideNameNode => {
    if (nameToken.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, nameToken.kind, nameToken.value),
            nameToken.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: nameToken.location,
        };
    }

    const symbolId = ctx.symbolParser.lookupSymbol(nameToken.value);
    if (symbolId !== undefined) {
        const entry = ctx.symbolParser.getSymbolEntry(symbolId);
        if (entry?.kind === SymbolKind.GameOption) {
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: nameToken.value,
                symbolId,
                location: nameToken.location,
            };
        }
    }

    if (BUILT_IN_NON_NUMERIC_OVERRIDE_OPTIONS.has(nameToken.value)) {
        return {
            kind: SyntaxKind.KEYWORD,
            value: nameToken.value,
            location: nameToken.location,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedParameterType("game option", nameToken.value),
        nameToken.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: nameToken.location,
    };
};

const isNestedPlayerTraitsOverride = (nameToken: Token, peek: Token | undefined): boolean =>
    nameToken.kind === TokenKind.Identifier &&
    PLAYER_TRAITS_OVERRIDE_OPTIONS.has(nameToken.value) &&
    peek !== undefined &&
    peek.location.start.line !== nameToken.location.start.line;

const parseOverrideSimpleValue = (
    ctx: ParserContext,
    anchor: Token,
): OverrideSimpleValueNode["value"] => {
    const token = ctx.peekToken();
    if (token?.kind === TokenKind.Integer) {
        return parseNumericInitialValue(ctx, anchor);
    }

    if (token?.kind === TokenKind.Identifier) {
        const valueToken = ctx.getToken();
        const symbolId = ctx.symbolParser.lookupSymbol(valueToken.value);
        if (symbolId !== undefined) {
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: valueToken.value,
                symbolId,
                location: valueToken.location,
            };
        }

        return {
            kind: SyntaxKind.KEYWORD,
            value: valueToken.value,
            location: valueToken.location,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedConstantValue(token?.value ?? ""),
        token?.location ?? anchor.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: anchor.location,
    };
};

export const overrideParser = (
    ctx: ParserContext,
    keywordToken: Token,
    modifiers: GameOptionModifiers,
): OverrideEntryNode => {
    const nameToken = ctx.getToken();
    const name = parseOverrideName(ctx, nameToken);

    let value: OverrideEntryNode["value"];
    const peek = ctx.peekToken();

    if (nameToken.kind === TokenKind.Identifier && nameToken.value === "loadout_palette") {
        const tier = parseIdentifier(ctx, nameToken);
        const palette = parseIdentifier(ctx, nameToken);
        value = {
            kind: "loadout_palette",
            tier,
            palette,
        };
    } else if (isNestedPlayerTraitsOverride(nameToken, peek)) {
        const body = parsePlayerTraitOptions(ctx, nameToken);
        value = {
            kind: "nested",
            body,
        };
    } else if (
        peek &&
        (peek.kind === TokenKind.Integer ||
            (peek.kind === TokenKind.Identifier && peek.value !== "end"))
    ) {
        value = {
            kind: "simple",
            value: parseOverrideSimpleValue(ctx, nameToken),
        };
    } else if (isEndToken(peek)) {
        value = {
            kind: SyntaxKind.INVALID,
            location: nameToken.location,
        };
    } else {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType("override value", peek?.value ?? ""),
            peek?.location ?? nameToken.location,
        );
        value = {
            kind: SyntaxKind.INVALID,
            location: nameToken.location,
        };
    }

    const valueLocation =
        value.kind === SyntaxKind.INVALID
            ? value.location
            : value.kind === "simple"
              ? value.value.location
              : value.kind === "loadout_palette"
                ? isAstErrorNode(value.palette)
                    ? value.palette.location
                    : value.palette.location
                : value.body.location;

    return {
        kind: GameOptionEntryKind.OVERRIDE,
        modifiers,
        name,
        value,
        location: locationSpan(keywordToken.location, valueLocation),
    };
};
