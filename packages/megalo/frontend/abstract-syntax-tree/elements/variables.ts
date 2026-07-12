import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTReferenceNode, isAstErrorNode, SyntaxKind } from "..";
import { SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import {
    isNumericVariableType,
    isVariableScopeName,
    isVariableTypeName,
    variableScopeFromName,
    variableTypeFromName,
    type VariableScopeName,
    type VariableTypeName,
} from "../../language-configuration/omni/variables";
import { type NumericInitialValue, parseNumericInitialValue } from "./constants";
import { locationSpan } from "./game_options/shared";

type VariableEntryNodeNetwork = { value: string; location: SourceCodeLocation };
type VariableEntryNodeType = { value: VariableTypeName; location: SourceCodeLocation };
type VariableEntryNodeName = { value: string; location: SourceCodeLocation };
type IdentifierInitialValue = ASTReferenceNode | ASTErrorNode;
type VariableEntryNodeInitial = NumericInitialValue | IdentifierInitialValue;

const isMissingInitial = (token: Token | undefined): boolean =>
    !token || (token.kind === TokenKind.Identifier && token.value === "end");

const parseIdentifierInitialValue = (
    ctx: ParserContext,
    anchor: Token,
): IdentifierInitialValue => {
    const valuePeek = ctx.peekToken();
    if (isMissingInitial(valuePeek)) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, valuePeek?.kind ?? TokenKind.None, valuePeek?.value ?? ""),
            anchor.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor.location,
        };
    }

    const valueToken = ctx.getToken();
    if (valueToken.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, valueToken.kind, valueToken.value),
            valueToken.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: valueToken.location,
        };
    }

    const symbolId = ctx.symbolParser.lookupSymbol(valueToken.value);
    if (symbolId !== undefined) {
        return {
            kind: SyntaxKind.REFERENCE,
            location: valueToken.location,
            identifier: valueToken.value,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedVariableReference(valueToken.value),
        valueToken.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: valueToken.location,
    };
};

export type VariableEntryNode = {
    network: VariableEntryNodeNetwork | ASTErrorNode;
    type: VariableEntryNodeType | ASTErrorNode;
    name: VariableEntryNodeName | ASTErrorNode;
    initial: VariableEntryNodeInitial;
    location: SourceCodeLocation;
};

export type VariablesElementNode = ASTElementBase<ElementKind.VARIABLES> & {
    scope: { value: VariableScopeName; location: SourceCodeLocation } | ASTErrorNode;
    entries: VariableEntryNode[];
};

const parseScope = (
    ctx: ParserContext,
    elementToken: Token,
): VariablesElementNode["scope"] => {
    const next = ctx.peekToken();
    if (
        !next ||
        next.kind !== TokenKind.Identifier ||
        next.location.start.line !== elementToken.location.start.line
    ) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, next?.kind ?? TokenKind.None, next?.value ?? ""),
            elementToken.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: elementToken.location,
        };
    }

    const scopeToken = ctx.getToken();
    if (scopeToken.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, scopeToken.kind, scopeToken.value),
            scopeToken.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: scopeToken.location,
        };
    }

    if (!isVariableScopeName(scopeToken.value)) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, scopeToken.kind, scopeToken.value),
            scopeToken.location,
        );
    }

    return {
        value: scopeToken.value as VariableScopeName,
        location: scopeToken.location,
    };
};

const parseVariableEntry = (
    ctx: ParserContext,
    variableScope: ReturnType<typeof variableScopeFromName> | undefined,
): VariableEntryNode => {
    const networkToken = ctx.getToken();
    let network: VariableEntryNode["network"];
    if (networkToken.kind === TokenKind.Identifier) {
        network = {
            value: networkToken.value,
            location: networkToken.location,
        };
    } else {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, networkToken.kind, networkToken.value),
            networkToken.location,
        );
        network = {
            kind: SyntaxKind.INVALID,
            location: networkToken.location,
        };
    }

    const typeToken = ctx.getToken();
    let type: VariableEntryNode["type"];
    if (typeToken.kind === TokenKind.Identifier && isVariableTypeName(typeToken.value)) {
        type = {
            value: typeToken.value,
            location: typeToken.location,
        };
    } else {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedVariableType(typeToken.value),
            typeToken.location,
        );
        type = {
            kind: SyntaxKind.INVALID,
            location: typeToken.location,
        };
    }

    const nameToken = ctx.getToken();
    let name: VariableEntryNode["name"];
    if (nameToken.kind === TokenKind.Identifier) {
        name = {
            value: nameToken.value,
            location: nameToken.location,
        };

        if (!isAstErrorNode(type) && variableScope !== undefined) {
            ctx.symbolParser.addVariableToScope({
                name: nameToken.value,
                type: variableTypeFromName(type.value),
                declaration: nameToken.location,
                scope: variableScope,
            });
        }
    } else {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, nameToken.kind, nameToken.value),
            nameToken.location,
        );
        name = {
            kind: SyntaxKind.INVALID,
            location: nameToken.location,
        };
    }

    const initial =
        !isAstErrorNode(type) && isNumericVariableType(type.value)
            ? parseNumericInitialValue(ctx, nameToken)
            : parseIdentifierInitialValue(ctx, nameToken);

    return {
        network,
        type,
        name,
        initial,
        location: {
            type: SourceLocationType.SOURCE_CODE,
            start: networkToken.location.start,
            end: initial.location.end,
        },
    };
};

export const variablesParser = (ctx: ParserContext, elementToken: Token): VariablesElementNode => {
    const scope = parseScope(ctx, elementToken);
    const entries: VariableEntryNode[] = [];
    const hasValidScope = !isAstErrorNode(scope) && isVariableScopeName(scope.value);
    const variableScope = hasValidScope ? variableScopeFromName(scope.value) : undefined;
    let foundEnd = false;
    let endLocation: SourceCodeLocation = elementToken.location;

    while (ctx.hasMore()) {
        const token = ctx.peekToken()!;
        if (token.kind === TokenKind.Identifier && token.value === "end") {
            const endToken = ctx.getToken();
            foundEnd = true;
            endLocation = endToken.location;
            break;
        }

        const entry = parseVariableEntry(ctx, variableScope);
        if (hasValidScope) {
            entries.push(entry);
        }
    }

    if (!foundEnd) {
        endLocation =
            entries.at(-1)?.location ??
            (!isAstErrorNode(scope) ? scope.location : elementToken.location);
        ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), endLocation);
    }

    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.VARIABLES,
        keywordLocation: elementToken.location,
        location: locationSpan(elementToken.location, endLocation),
        scope,
        entries,
    };
};
