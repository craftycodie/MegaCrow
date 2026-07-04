import { ElementKind } from "..";
import { SyntaxKind } from "../..";
import { SourceCodeLocation } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { Token, TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";
import { optionParser } from "./option";
import { overrideParser } from "./override";
import { playerTraitsParser } from "./player_traits";
import { rangedOptionParser } from "./ranged_option";
import { isEndToken } from "./shared";
import {
    type GameOptionEntryNode,
    type GameOptionModifiers,
    type GameOptionsElementNode,
} from "./types";

export type {
    ASTStringLiteralOrReference,
    GameOptionEntryNode,
    GameOptionModifiers,
    GameOptionsElementNode,
    OverrideEntryNode,
    OverrideLoadoutPaletteNode,
    OverrideNestedBodyNode,
    OverrideSimpleValueNode,
    UserDefinedOptionNode,
    UserDefinedOptionValueNode,
} from "./types";

export { GameOptionEntryKind } from "./types";

export const gameOptionsParser = (ctx: ParserContext, elementToken: Token): GameOptionsElementNode => {
    const entries: GameOptionEntryNode[] = [];
    let foundEnd = false;
    let pendingLock = false;
    let pendingHide = false;

    while (ctx.hasMore()) {
        const token = ctx.peekToken()!;
        if (token.kind === TokenKind.Comment) {
            ctx.getToken();
            continue;
        }
        if (isEndToken(token)) {
            ctx.getToken();
            foundEnd = true;
            break;
        }

        if (token.kind === TokenKind.Identifier && token.value === "lock") {
            ctx.getToken();
            pendingLock = true;
            continue;
        }

        if (token.kind === TokenKind.Identifier && token.value === "hide") {
            ctx.getToken();
            pendingHide = true;
            continue;
        }

        const modifiers: GameOptionModifiers = {
            lock: pendingLock,
            hide: pendingHide,
        };
        pendingLock = false;
        pendingHide = false;

        if (token.kind !== TokenKind.Identifier) {
            ctx.diagnostics.addError(
                diagnosticMessages.expectedGameOptionElement(token.value),
                token.location,
            );
            ctx.getToken();
            continue;
        }

        const keywordToken = ctx.getToken();
        switch (keywordToken.value) {
            case "override":
                entries.push(overrideParser(ctx, keywordToken, modifiers));
                break;
            case "option":
                entries.push(optionParser(ctx, keywordToken, modifiers));
                break;
            case "ranged_option":
                entries.push(rangedOptionParser(ctx, keywordToken, modifiers));
                break;
            case "player_traits":
                entries.push(playerTraitsParser(ctx, keywordToken, modifiers));
                break;
            default:
                ctx.diagnostics.addError(
                    diagnosticMessages.expectedGameOptionElement(keywordToken.value),
                    keywordToken.location,
                );
                break;
        }
    }

    if (!foundEnd) {
        const location: SourceCodeLocation = entries.at(-1)?.location ?? elementToken.location;
        ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), location);
    }

    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.GAME_OPTIONS,
        location: elementToken.location,
        entries,
    };
};
