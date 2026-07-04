import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTNode, ASTReferenceNode, SyntaxKind } from "..";
import { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";

type ConstantEntryNodeType = { value: "number"; location: SourceCodeLocation };
type ConstantEntryNodeName = { value: string; location: SourceCodeLocation };
type ConstantEntryNodeIntegerValue = ASTNode<SyntaxKind.INTEGER> & { value: number };
type ConstantEntryNodeReferenceValue = ASTReferenceNode;
type ConstantEntryNodeValue =
    | ConstantEntryNodeIntegerValue
    | ConstantEntryNodeReferenceValue
    | ASTErrorNode;

export type ConstantEntryNode = {
    type: ConstantEntryNodeType | ASTErrorNode;
    name: ConstantEntryNodeName | ASTErrorNode;
    value: ConstantEntryNodeValue;
    location: SourceCodeLocation;
};

export type ConstantsElementNode = ASTElementBase<ElementKind.CONSTANTS> & {
    entries: ConstantEntryNode[];
};

const parseConstantValue = (
    ctx: ParserContext,
    nameToken: Token,
): ConstantEntryNodeValue => {
    const valuePeek = ctx.peekToken();
    if (
        !valuePeek ||
        (valuePeek.kind === TokenKind.Identifier && valuePeek.value === "end")
    ) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedConstantValue(valuePeek?.value ?? ""),
            nameToken.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: nameToken.location,
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
        const symbolId = ctx.symbolParser.addSymbolReference(valueToken.value, valueToken.location);
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
            symbolId,
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

export const constantsParser = (ctx: ParserContext, elementToken: Token): ConstantsElementNode => {
    const entries: ConstantEntryNode[] = [];

    ctx.parseUntilEnd(() => {
        const token = ctx.peekToken();
        if (!token) {
            return;
        }
        if (token.kind === TokenKind.Comment) {
            ctx.getToken();
            return;
        }

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
            entries.push({
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
            });
            return;
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

        const value = parseConstantValue(ctx, nameToken);

        entries.push({
            type,
            name,
            value,
            location: {
                start: typeToken.location.start,
                end: value.location.end,
            },
        });
    });

    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.CONSTANTS,
        location: elementToken.location,
        entries,
    };
};
