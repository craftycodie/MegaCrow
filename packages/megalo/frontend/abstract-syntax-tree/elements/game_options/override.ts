import { isAstErrorNode, SyntaxKind } from "../..";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { SymbolKind } from "../../../symbol-table";
import { Token, TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";
import {
    isBuiltInNonNumericOverrideOption,
    isPlayerTraitsOverrideOption,
} from "../../../language-configuration/omni/game_options";
import { parseNumericInitialValue } from "../constants";
import {
    isEndToken,
    locationSpan,
    parseIdentifier,
} from "./shared";
import { parsePlayerTraitOptions } from "./player_traits";
import { GameOptionEntryKind, OverrideValueKind, type GameOptionModifiers, type OverrideEntryNode, type OverrideNameNode, type OverrideSimpleValueNode } from "./types";

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
            ctx.symbolParser.recordReference(symbolId, nameToken.location);
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: nameToken.value,
                symbolId,
                location: nameToken.location,
            };
        }
    }

    if (isBuiltInNonNumericOverrideOption(nameToken.value)) {
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
    isPlayerTraitsOverrideOption(nameToken.value) &&
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
            ctx.symbolParser.recordReference(symbolId, valueToken.location);
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
            kind: OverrideValueKind.LOADOUT_PALETTE,
            tier,
            palette,
        };
    } else if (isNestedPlayerTraitsOverride(nameToken, peek)) {
        const body = parsePlayerTraitOptions(ctx, nameToken);
        value = {
            kind: OverrideValueKind.NESTED,
            body,
        };
    } else if (
        peek &&
        (peek.kind === TokenKind.Integer ||
            (peek.kind === TokenKind.Identifier && peek.value !== "end"))
    ) {
        value = {
            kind: OverrideValueKind.SIMPLE,
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
            : value.kind === OverrideValueKind.SIMPLE
              ? value.value.location
              : value.kind === OverrideValueKind.LOADOUT_PALETTE
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
