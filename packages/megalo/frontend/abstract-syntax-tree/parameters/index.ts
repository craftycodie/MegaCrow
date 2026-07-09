import { ASTErrorNode, ASTIntegerNode, ASTNode, ASTReferenceNode, SyntaxKind } from "../kinds";
import { SourceCodeLocation } from "../../diagnostics";
import { SymbolKind, SymbolTableEntry, SymbolId, VariableType } from "../../symbol-table";
import { TokenKind } from "../../tokens";
import { ParserContext } from "../context";

export const enum ParameterType {
    Keyword,
    Number,
    String,
    Timer,
    Team,
    Player,
    Object,
    HudWidget,
    Loadout,
    LoadoutPalette,
    RequisitionPalette,
    MathOperation,
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

export type OptionalParameterSpec = {
    readonly kind: "optional";
    readonly name: string;
    readonly specs?: readonly ParameterSpec[];
};

export const OptionalParameter = (
    name: string,
    ...specs: ParameterSpec[]
): OptionalParameterSpec => ({
    kind: "optional",
    name,
    specs: specs.length > 0 ? specs : undefined,
});

export type ParameterSlot = ParameterSpec | readonly ParameterSpec[] | OptionalParameterSpec;

export type ParameterSignature = readonly ParameterSlot[];

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

const isOptionalParameter = (slot: ParameterSlot): slot is OptionalParameterSpec =>
    typeof slot === "object" && !Array.isArray(slot) && "kind" in slot && slot.kind === "optional";

const isParameterUnion = (slot: ParameterSlot): slot is readonly ParameterSpec[] =>
    Array.isArray(slot);

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
        case ParameterType.Loadout:
            return entry.kind === SymbolKind.Loadout;
        case ParameterType.LoadoutPalette:
            return entry.kind === SymbolKind.LoadoutPalette;
        case ParameterType.RequisitionPalette:
            return entry.kind === SymbolKind.RequisitionPalette;
        case ParameterType.String:
            return entry.kind === SymbolKind.String;
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
        } else if (ctx.symbolParser.lookupLoadoutPalette(node.identifier) !== undefined) {
            ctx.symbolParser.addLoadoutPaletteReference(node.identifier, node.location);
        } else if (ctx.symbolParser.lookupRequisitionPalette(node.identifier) !== undefined) {
            ctx.symbolParser.addRequisitionPaletteReference(node.identifier, node.location);
        } else if (ctx.symbolParser.lookupLoadout(node.identifier) !== undefined) {
            ctx.symbolParser.addLoadoutReference(node.identifier, node.location);
        } else if (ctx.symbolParser.lookupString(node.identifier) !== undefined) {
            ctx.symbolParser.addStringReference(node.identifier, node.location);
        } else {
            ctx.symbolParser.addSymbolReference(node.identifier, node.location);
        }
    }
};

const lookupReferenceSymbolId = (ctx: ParserContext, name: string): SymbolId | undefined =>
    ctx.symbolParser.lookupSymbol(name)
    ?? ctx.symbolParser.lookupString(name)
    ?? ctx.symbolParser.lookupHudWidget(name)
    ?? ctx.symbolParser.lookupLoadout(name)
    ?? ctx.symbolParser.lookupLoadoutPalette(name)
    ?? ctx.symbolParser.lookupRequisitionPalette(name);

const consumeLenientParameter = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTParameterNode => {
    const token = ctx.getToken();

    if (token.kind === TokenKind.Integer) {
        return {
            kind: SyntaxKind.INTEGER,
            value: Number.parseInt(token.value, 10),
            location: token.location,
        };
    }

    if (token.kind === TokenKind.Operator || token.kind === TokenKind.Identifier) {
        const symbolId = token.kind === TokenKind.Identifier
            ? lookupReferenceSymbolId(ctx, token.value)
            : undefined;

        if (symbolId !== undefined) {
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: token.value,
                symbolId,
                location: token.location,
            };
        }

        return {
            kind: SyntaxKind.KEYWORD,
            value: token.value,
            location: token.location,
        };
    }

    return {
        kind: SyntaxKind.INVALID,
        location: token.location ?? anchor,
    };
};

const parseParameter = (
    ctx: ParserContext,
    spec: ParameterSpec,
): ASTParameterNode | undefined => {
    const token = ctx.peekToken();

    if (isKeywordParameter(spec)) {
        if (token?.kind !== TokenKind.Identifier || token.value !== spec.value) {
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
                return undefined;
            }

            const keywordToken = ctx.getToken();
            return {
                kind: SyntaxKind.KEYWORD,
                value: keywordToken.value,
                location: keywordToken.location,
            };
        }

        case ParameterType.MathOperation: {
            if (token?.kind !== TokenKind.Operator && token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const mathToken = ctx.getToken();
            return {
                kind: SyntaxKind.KEYWORD,
                value: mathToken.value,
                location: mathToken.location,
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
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupSymbol(token.value);
            if (symbolId === undefined) {
                return undefined;
            }

            const entry = ctx.symbolParser.getSymbolEntry(symbolId);
            if (entry === undefined || !matchesParameterType(entry, ParameterType.Number)) {
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
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupHudWidget(token.value);
            if (symbolId === undefined) {
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

        case ParameterType.Loadout: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupLoadout(token.value);
            if (symbolId === undefined) {
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

        case ParameterType.LoadoutPalette: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupLoadoutPalette(token.value);
            if (symbolId === undefined) {
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

        case ParameterType.RequisitionPalette: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupRequisitionPalette(token.value);
            if (symbolId === undefined) {
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

        case ParameterType.String: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupString(token.value);
            if (symbolId === undefined) {
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
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupSymbol(token.value);
            if (symbolId === undefined) {
                return undefined;
            }

            const entry = ctx.symbolParser.getSymbolEntry(symbolId);
            if (entry === undefined || !matchesParameterType(entry, spec)) {
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

const tryParseSlot = (
    ctx: ParserContext,
    slot: ParameterSlot,
): ASTParameterNode[] | undefined => {
    if (isOptionalParameter(slot)) {
        const token = ctx.peekToken();
        if (token?.kind !== TokenKind.Identifier || token.value !== slot.name) {
            return [];
        }

        const nameToken = ctx.getToken();
        const nodes: ASTParameterNode[] = [{
            kind: SyntaxKind.KEYWORD,
            value: nameToken.value,
            location: nameToken.location,
        }];

        if (slot.specs !== undefined) {
            for (const spec of slot.specs) {
                const parameter = parseParameter(ctx, spec);
                if (parameter === undefined) {
                    return undefined;
                }

                nodes.push(parameter);
            }
        }

        return nodes;
    }

    if (isParameterUnion(slot)) {
        for (const spec of slot) {
            const mark = ctx.mark();
            const parameter = parseParameter(ctx, spec);
            if (parameter !== undefined) {
                return [parameter];
            }

            ctx.reset(mark);
        }

        return undefined;
    }

    const parameter = parseParameter(ctx, slot);
    return parameter === undefined ? undefined : [parameter];
};

const parseSlot = (
    ctx: ParserContext,
    slot: ParameterSlot,
    anchor: SourceCodeLocation,
): ASTParameterNode[] => {
    if (isOptionalParameter(slot)) {
        const token = ctx.peekToken();
        if (token?.kind !== TokenKind.Identifier || token.value !== slot.name) {
            return [];
        }

        const nameToken = ctx.getToken();
        const nodes: ASTParameterNode[] = [{
            kind: SyntaxKind.KEYWORD,
            value: nameToken.value,
            location: nameToken.location,
        }];

        if (slot.specs !== undefined) {
            for (const spec of slot.specs) {
                const parameter = parseParameter(ctx, spec) ?? consumeLenientParameter(ctx, anchor);
                nodes.push(parameter);
            }
        }

        return nodes;
    }

    if (isParameterUnion(slot)) {
        for (const spec of slot) {
            const mark = ctx.mark();
            const parameter = parseParameter(ctx, spec);
            if (parameter !== undefined) {
                return [parameter];
            }

            ctx.reset(mark);
        }

        return [consumeLenientParameter(ctx, anchor)];
    }

    return [parseParameter(ctx, slot) ?? consumeLenientParameter(ctx, anchor)];
};

const tryParseSignature = (
    ctx: ParserContext,
    signature: ParameterSignature,
): ASTParameterNode[] | undefined => {
    const parameters: ASTParameterNode[] = [];

    for (const slot of signature) {
        const parsed = tryParseSlot(ctx, slot);
        if (parsed === undefined) {
            return undefined;
        }

        parameters.push(...parsed);
    }

    return parameters;
};

const parseSignature = (
    ctx: ParserContext,
    signature: ParameterSignature,
    anchor: SourceCodeLocation,
): ASTParameterNode[] => {
    const parameters: ASTParameterNode[] = [];

    for (const slot of signature) {
        parameters.push(...parseSlot(ctx, slot, anchor));
    }

    return parameters;
};

export const parameterParserBuilder = (...signatures: ParameterSignature[]): ParameterParser => {
    if (signatures.length === 0) {
        return () => [];
    }

    return (ctx: ParserContext, anchor: SourceCodeLocation) => {
        const parseAnchor = anchor;

        for (const signature of signatures) {
            const mark = ctx.mark();
            const parameters = tryParseSignature(ctx, signature);
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
