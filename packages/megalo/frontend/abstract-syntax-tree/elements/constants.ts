import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTNode, ASTReferenceNode, SyntaxKind } from "..";
import { SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { locationSpan } from "./game_options/shared";

type ConstantEntryNodeType = { value: "number"; location: SourceCodeLocation };
type ConstantEntryNodeName = { value: string; location: SourceCodeLocation };

export type NumericInitialValue =
    | (ASTNode<SyntaxKind.INTEGER> & { value: number })
    | ASTReferenceNode
    | ASTErrorNode;

export type ConstantEntryNode = {
    type: ConstantEntryNodeType | ASTErrorNode;
    name: ConstantEntryNodeName | ASTErrorNode;
    value: NumericInitialValue;
    location: SourceCodeLocation;
};

export type ConstantsElementNode = ASTElementBase<ElementKind.CONSTANTS> & {
    entries: ConstantEntryNode[];
};

const isMissingInitial = (token: Token | undefined): boolean =>
    !token || (token.kind === TokenKind.Identifier && token.value === "end");

export const parseNumericInitialValue = (
    ctx: ParserContext,
    anchor: Token,
): NumericInitialValue => {
    const valuePeek = ctx.peekToken();
    if (isMissingInitial(valuePeek)) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedConstantValue(valuePeek?.value ?? ""),
            anchor.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor.location,
        };
    }

    const valueToken = ctx.getToken();
    if (valueToken.kind === TokenKind.Integer) {
        return {
            kind: SyntaxKind.INTEGER,
            location: valueToken.location,
            value: Number.parseInt(valueToken.value, 10),
        };
    }

    if (valueToken.kind === TokenKind.Identifier) {
        const symbolId = ctx.symbolParser.lookupSymbol(valueToken.value);
        if (symbolId === undefined) {
            ctx.diagnostics.addError(
                diagnosticMessages.expectedConstantValue(valueToken.value),
                valueToken.location,
            );
            return {
                kind: SyntaxKind.INVALID,
                location: valueToken.location,
            };
        }

        return {
            kind: SyntaxKind.REFERENCE,
            location: valueToken.location,
            identifier: valueToken.value,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedConstantValue(valueToken.value),
        valueToken.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: valueToken.location,
    };
};

const parseConstantEntry = (ctx: ParserContext): ConstantEntryNode => {
    const typeToken = ctx.getToken();
    let type: ConstantEntryNode["type"];
    if (typeToken.kind === TokenKind.Identifier && typeToken.value === "number") {
        type = {
            value: "number",
            location: typeToken.location,
        };
    } else {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedNumberOrEnd(typeToken.value),
            typeToken.location,
        );
        type = {
            kind: SyntaxKind.INVALID,
            location: typeToken.location,
        };
        return {
            type,
            name: {
                kind: SyntaxKind.INVALID,
                location: typeToken.location,
            },
            value: {
                kind: SyntaxKind.INVALID,
                location: typeToken.location,
            },
            location: typeToken.location,
        };
    }

    const nameToken = ctx.getToken();
    let name: ConstantEntryNode["name"];
    if (nameToken.kind === TokenKind.Identifier) {
        name = {
            value: nameToken.value,
            location: nameToken.location,
        };

        ctx.symbolParser.addConstantToScope({
            name: nameToken.value,
            declaration: nameToken.location,
        });
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

    const value = parseNumericInitialValue(ctx, nameToken);

    return {
        type,
        name,
        value,
        location: {
            type: SourceLocationType.SOURCE_CODE,
            start: typeToken.location.start,
            end: value.location.end,
        },
    };
};

export const constantsParser = (ctx: ParserContext, elementToken: Token): ConstantsElementNode => {
    const entries: ConstantEntryNode[] = [];
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

        entries.push(parseConstantEntry(ctx));
    }

    if (!foundEnd) {
        endLocation = entries.at(-1)?.location ?? elementToken.location;
        ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), endLocation);
    }

    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.CONSTANTS,
        keywordLocation: elementToken.location,
        location: locationSpan(elementToken.location, endLocation),
        entries,
    };
};
