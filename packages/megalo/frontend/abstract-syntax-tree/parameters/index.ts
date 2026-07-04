import { ASTErrorNode, ASTIntegerNode, ASTNode, ASTReferenceNode, SyntaxKind } from "../kinds";
import { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { SymbolKind, SymbolTableEntry, VariableType } from "../../symbol-table";
import { TokenKind } from "../../tokens";
import { ParserContext } from "../context";

export const enum ParameterType {
    Keyword,
    Number,
    Timer,
    Team,
    Player,
    Object,
    HudWidget,
}

export type KeywordParameter = {
    readonly kind: "keyword";
    readonly value: string;
};

export const KeywordParameter = (value: string): KeywordParameter => ({
    kind: "keyword",
    value,
});

export type ParameterSpec = ParameterType | KeywordParameter;

export type ASTKeywordParameterNode = ASTNode<SyntaxKind.KEYWORD> & {
    value: string;
};

export type ASTParameterNode =
    | ASTKeywordParameterNode
    | ASTIntegerNode
    | ASTReferenceNode
    | ASTErrorNode;

export type ParameterParser = (ctx: ParserContext, anchor: SourceCodeLocation) => ASTParameterNode[];

const isKeywordParameter = (spec: ParameterSpec): spec is KeywordParameter =>
    typeof spec === "object" && spec.kind === "keyword";

const parameterTypeName = (spec: ParameterSpec): string => {
    if (isKeywordParameter(spec)) {
        return `'${spec.value}'`;
    }

    switch (spec) {
        case ParameterType.Keyword:
            return "keyword";
        case ParameterType.Number:
            return "number";
        case ParameterType.Timer:
            return "timer";
        case ParameterType.Team:
            return "team";
        case ParameterType.Player:
            return "player";
        case ParameterType.Object:
            return "object";
        case ParameterType.HudWidget:
            return "hud widget";
        default:
            return "parameter";
    }
};

const matchesParameterType = (entry: SymbolTableEntry, type: ParameterType): boolean => {
    switch (type) {
        case ParameterType.Number:
            return entry.kind === SymbolKind.Constant
                || entry.kind === SymbolKind.GameOption
                || (entry.kind === SymbolKind.Variable && entry.type === VariableType.Number);
        case ParameterType.Timer:
            return entry.kind === SymbolKind.Variable && entry.type === VariableType.Timer;
        case ParameterType.Team:
            return entry.kind === SymbolKind.Variable && entry.type === VariableType.Team;
        case ParameterType.Player:
            return entry.kind === SymbolKind.Variable && entry.type === VariableType.Player;
        case ParameterType.Object:
            return entry.kind === SymbolKind.Variable && entry.type === VariableType.Object;
        case ParameterType.HudWidget:
            return entry.kind === SymbolKind.HudWidget;
        default:
            return false;
    }
};

const commitReferences = (ctx: ParserContext, nodes: readonly ASTParameterNode[]): void => {
    for (const node of nodes) {
        if (node.kind !== SyntaxKind.REFERENCE) {
            continue;
        }

        if (ctx.symbolParser.lookupHudWidget(node.identifier) !== undefined) {
            ctx.symbolParser.addHudWidgetReference(node.identifier, node.location);
        } else {
            ctx.symbolParser.addSymbolReference(node.identifier, node.location);
        }
    }
};

const parseParameter = (
    ctx: ParserContext,
    spec: ParameterSpec,
    anchor: SourceCodeLocation,
    reportErrors: boolean,
): ASTParameterNode | undefined => {
    const token = ctx.peekToken();

    if (isKeywordParameter(spec)) {
        if (token?.kind !== TokenKind.Identifier || token.value !== spec.value) {
            if (reportErrors) {
                ctx.diagnostics.addError(
                    diagnosticMessages.expectedParameterType(parameterTypeName(spec), token?.value ?? ""),
                    token?.location ?? anchor,
                );
            }
            return undefined;
        }

        const keywordToken = ctx.getToken();
        return {
            kind: SyntaxKind.KEYWORD,
            value: keywordToken.value,
            location: keywordToken.location,
        };
    }

    switch (spec) {
        case ParameterType.Keyword: {
            if (token?.kind !== TokenKind.Identifier) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token?.value ?? ""),
                        token?.location ?? anchor,
                    );
                }
                return undefined;
            }

            const keywordToken = ctx.getToken();
            return {
                kind: SyntaxKind.KEYWORD,
                value: keywordToken.value,
                location: keywordToken.location,
            };
        }

        case ParameterType.Number: {
            if (token?.kind === TokenKind.Integer) {
                const integerToken = ctx.getToken();
                return {
                    kind: SyntaxKind.INTEGER,
                    value: Number.parseInt(integerToken.value, 10),
                    location: integerToken.location,
                };
            }

            if (token?.kind !== TokenKind.Identifier) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token?.value ?? ""),
                        token?.location ?? anchor,
                    );
                }
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupSymbol(token.value);
            if (symbolId === undefined) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token.value),
                        token.location,
                    );
                }
                return undefined;
            }

            const entry = ctx.symbolParser.getSymbolEntry(symbolId);
            if (entry === undefined || !matchesParameterType(entry, ParameterType.Number)) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token.value),
                        token.location,
                    );
                }
                return undefined;
            }

            const referenceToken = ctx.getToken();
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: referenceToken.value,
                symbolId,
                location: referenceToken.location,
            };
        }

        case ParameterType.HudWidget: {
            if (token?.kind !== TokenKind.Identifier) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token?.value ?? ""),
                        token?.location ?? anchor,
                    );
                }
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupHudWidget(token.value);
            if (symbolId === undefined) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token.value),
                        token.location,
                    );
                }
                return undefined;
            }

            const referenceToken = ctx.getToken();
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: referenceToken.value,
                symbolId,
                location: referenceToken.location,
            };
        }

        default: {
            if (token?.kind !== TokenKind.Identifier) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token?.value ?? ""),
                        token?.location ?? anchor,
                    );
                }
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupSymbol(token.value);
            if (symbolId === undefined) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token.value),
                        token.location,
                    );
                }
                return undefined;
            }

            const entry = ctx.symbolParser.getSymbolEntry(symbolId);
            if (entry === undefined || !matchesParameterType(entry, spec)) {
                if (reportErrors) {
                    ctx.diagnostics.addError(
                        diagnosticMessages.expectedParameterType(parameterTypeName(spec), token.value),
                        token.location,
                    );
                }
                return undefined;
            }

            const referenceToken = ctx.getToken();
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: referenceToken.value,
                symbolId,
                location: referenceToken.location,
            };
        }
    }
};

const tryParseSignature = (
    ctx: ParserContext,
    signature: readonly ParameterSpec[],
    anchor: SourceCodeLocation,
): ASTParameterNode[] | undefined => {
    const parameters: ASTParameterNode[] = [];

    for (const spec of signature) {
        const parameter = parseParameter(ctx, spec, anchor, false);
        if (parameter === undefined) {
            return undefined;
        }

        parameters.push(parameter);
    }

    return parameters;
};

const parseSignature = (
    ctx: ParserContext,
    signature: readonly ParameterSpec[],
    anchor: SourceCodeLocation,
): ASTParameterNode[] => {
    const parameters: ASTParameterNode[] = [];

    for (const spec of signature) {
        const parameter = parseParameter(ctx, spec, anchor, true);
        if (parameter === undefined) {
            return parameters;
        }

        parameters.push(parameter);
    }

    return parameters;
};

export const parameterParserBuilder = (...signatures: ParameterSpec[][]): ParameterParser => {
    if (signatures.length === 0) {
        throw new Error("parameterParserBuilder requires at least one signature.");
    }

    return (ctx: ParserContext, anchor: SourceCodeLocation) => {
        const parseAnchor = anchor;

        for (const signature of signatures) {
            const mark = ctx.mark();
            const parameters = tryParseSignature(ctx, signature, parseAnchor);
            if (parameters !== undefined) {
                commitReferences(ctx, parameters);
                return parameters;
            }

            ctx.reset(mark);
        }

        const parameters = parseSignature(ctx, signatures[0]!, parseAnchor);
        commitReferences(ctx, parameters);
        return parameters;
    };
};
