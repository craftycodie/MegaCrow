import { isAstErrorNode, SyntaxKind } from "../..";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { Token, TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";
import { parseNumericInitialValue } from "../constants";
import {
    consumeUntilEnd,
    isEndToken,
    locationSpan,
    parseGameOptionReference,
    parseIdentifier,
} from "./shared";
import { GameOptionEntryKind, type GameOptionModifiers, type OverrideEntryNode } from "./types";

const NESTED_OVERRIDE_OPTIONS = new Set([
    "base_player_traits",
    "respawn_traits",
    "weapon_set",
    "vehicle_set",
    "red_powerup_traits",
    "blue_powerup_traits",
    "yellow_powerup_traits",
]);

export const overrideParser = (
    ctx: ParserContext,
    keywordToken: Token,
    modifiers: GameOptionModifiers,
): OverrideEntryNode => {
    const nameToken = ctx.getToken();
    const name = parseGameOptionReference(ctx, nameToken);

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
    } else if (
        nameToken.kind === TokenKind.Identifier &&
        NESTED_OVERRIDE_OPTIONS.has(nameToken.value)
    ) {
        value = {
            kind: "nested",
            body: {
                location: consumeUntilEnd(ctx, nameToken),
            },
        };
    } else if (
        peek &&
        (peek.kind === TokenKind.Integer ||
            (peek.kind === TokenKind.Identifier && peek.value !== "end"))
    ) {
        value = {
            kind: "simple",
            value: parseNumericInitialValue(ctx, nameToken),
        };
    } else if (isEndToken(peek)) {
        value = {
            kind: SyntaxKind.INVALID,
            location: nameToken.location,
        };
    } else {
        value = {
            kind: "nested",
            body: {
                location: consumeUntilEnd(ctx, nameToken),
            },
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
