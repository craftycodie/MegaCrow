import { ASTElementBase, ElementKind } from "..";
import { ASTNode, SyntaxKind } from "../../kinds";
import { SourceCodeLocation } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { Token, TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";
import { isEndToken, locationSpan } from "../game_options/shared";
import { ParserScopeKind, normalizeTriggerHeader, type ParserScope } from "../../../symbol-table/scope";
import { parseAction, type ActionStatementNode } from "./action";
import { parseCondition, type ConditionStatementNode } from "./condition";
import { parseTemporary, type TemporaryStatementNode } from "./temporary";

export { ActionParserRepository, parseAction, type ActionStatementNode, type TriggerActionStatementNode } from "./action";
export {
    ConditionParserRepository,
    parseCondition,
    type ConditionStatementNode,
} from "./condition";
export {
    parseTemporary,
    type TemporaryStatementNode,
    type TemporaryStorageName,
} from "./temporary";

export type BeginStatementNode = ASTNode<SyntaxKind.BEGIN> & {
    statements: TriggerStatementNode[];
};

export type ForEachStatementNode = ASTNode<SyntaxKind.FOR_EACH> & {
    target: { value: string; location: SourceCodeLocation };
    statements: TriggerStatementNode[];
};

export type TriggerStatementNode =
    | ConditionStatementNode
    | ActionStatementNode
    | BeginStatementNode
    | TemporaryStatementNode
    | ForEachStatementNode;

export type TriggerElementNode = ASTElementBase<ElementKind.TRIGGER> & {
    name: { value: string; location: SourceCodeLocation };
    statements: TriggerStatementNode[];
};

const withScope = <T extends { location: SourceCodeLocation }>(
    ctx: ParserContext,
    scope: ParserScope,
    fn: () => T,
): T => {
    ctx.symbolParser.pushScope(scope);
    try {
        const result = fn();
        ctx.symbolParser.popScope(result.location.end);
        return result;
    } catch (error) {
        ctx.symbolParser.popScope();
        throw error;
    }
};

const isStatementKeyword = (token: Token | undefined, keyword: string): boolean =>
    token?.kind === TokenKind.Identifier && token.value === keyword;

const parseTriggerName = (
    ctx: ParserContext,
    anchor: Token,
): TriggerElementNode["name"] => {
    const token = ctx.peekToken();
    if (token?.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, token?.kind ?? TokenKind.None, token?.value ?? ""),
            token?.location ?? anchor.location,
        );
        return {
            value: "",
            location: anchor.location,
        };
    }

    const nameToken = ctx.getToken();
    return {
        value: nameToken.value,
        location: nameToken.location,
    };
};

export const parseTriggerStatements = (ctx: ParserContext): TriggerStatementNode[] => {
    const statements: TriggerStatementNode[] = [];

    while (ctx.hasMore()) {
        const token = ctx.peekToken();
        if (!token) {
            break;
        }

        if (isEndToken(token)) {
            break;
        }

        if (isStatementKeyword(token, "condition")) {
            const conditionToken = ctx.getToken();
            statements.push(parseCondition(ctx, conditionToken));
            continue;
        }

        if (isStatementKeyword(token, "action")) {
            const actionToken = ctx.getToken();
            statements.push(parseAction(ctx, actionToken));
            continue;
        }

        if (isStatementKeyword(token, "begin")) {
            const beginToken = ctx.getToken();
            statements.push(parseBegin(ctx, beginToken));
            continue;
        }

        if (isStatementKeyword(token, "temporary")) {
            const temporaryToken = ctx.getToken();
            statements.push(parseTemporary(ctx, temporaryToken));
            continue;
        }

        ctx.diagnostics.addError(
            diagnosticMessages.unknownTriggerStatement(token.value),
            token.location,
        );
        ctx.getToken();
    }

    return statements;
};

const parseScopedTriggerBody = (
    ctx: ParserContext,
    openLocation: SourceCodeLocation,
    anchorForErrors: SourceCodeLocation,
): { statements: TriggerStatementNode[]; location: SourceCodeLocation } => {
    const statements = parseTriggerStatements(ctx);

    const endToken = ctx.peekToken();
    if (!isEndToken(endToken)) {
        ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), anchorForErrors);
        const lastStatement = statements.at(-1);
        const endLocation: SourceCodeLocation = lastStatement?.location ?? openLocation;
        return {
            statements,
            location: locationSpan(openLocation, endLocation),
        };
    }

    const consumedEnd = ctx.getToken();
    return {
        statements,
        location: locationSpan(openLocation, consumedEnd.location),
    };
};

export const parseBegin = (
    ctx: ParserContext,
    beginToken: Token,
): BeginStatementNode => withScope(ctx, { kind: ParserScopeKind.Block }, () => {
    const { statements, location } = parseScopedTriggerBody(ctx, beginToken.location, beginToken.location);
    return {
        kind: SyntaxKind.BEGIN,
        statements,
        location,
    };
});

const parseForEachTarget = (
    ctx: ParserContext,
    anchor: Token,
): ForEachStatementNode["target"] | undefined => {
    const token = ctx.peekToken();
    if (token?.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, token?.kind ?? TokenKind.None, token?.value ?? ""),
            token?.location ?? anchor.location,
        );
        return undefined;
    }

    const targetToken = ctx.getToken();
    return {
        value: targetToken.value,
        location: targetToken.location,
    };
};

export const parseForEach = (
    ctx: ParserContext,
    actionToken: Token,
): ForEachStatementNode => {
    const target = parseForEachTarget(ctx, actionToken);

    return withScope(ctx, {
        kind: ParserScopeKind.Trigger,
        trigger: normalizeTriggerHeader(target?.value ?? ""),
    }, () => {
        const { statements, location } = parseScopedTriggerBody(
            ctx,
            actionToken.location,
            target?.location ?? actionToken.location,
        );

        return {
            kind: SyntaxKind.FOR_EACH,
            target: target ?? { value: "", location: actionToken.location },
            statements,
            location,
        };
    });
};

export const triggerParser = (
    ctx: ParserContext,
    elementToken: Token,
): TriggerElementNode => {
    const name = parseTriggerName(ctx, elementToken);

    const maybeBegin = ctx.peekToken();
    if (isStatementKeyword(maybeBegin, "begin")) {
        ctx.getToken();
    }

    return withScope(ctx, {
        kind: ParserScopeKind.Trigger,
        trigger: normalizeTriggerHeader(name.value),
    }, () => {
        const statements = parseTriggerStatements(ctx);

        const endToken = ctx.peekToken();
        if (!isEndToken(endToken)) {
            ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), elementToken.location);
            const lastStatement = statements.at(-1);
            const endLocation: SourceCodeLocation = lastStatement?.location ?? name.location;
            return {
                kind: SyntaxKind.ELEMENT,
                elementKind: ElementKind.TRIGGER,
                keywordLocation: elementToken.location,
                name,
                statements,
                location: locationSpan(elementToken.location, endLocation),
            };
        }

        const consumedEnd = ctx.getToken();
        return {
            kind: SyntaxKind.ELEMENT,
            elementKind: ElementKind.TRIGGER,
            keywordLocation: elementToken.location,
            name,
            statements,
            location: locationSpan(elementToken.location, consumedEnd.location),
        };
    });
};
