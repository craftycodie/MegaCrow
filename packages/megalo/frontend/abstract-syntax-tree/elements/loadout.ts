import { ASTElementBase, ElementKind } from ".";
import { MegaloVersion } from "../../../version";
import { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { ASTErrorNode, isAstErrorNode, SyntaxKind } from "../kinds";
import {
    ASTParameterNode,
    KeywordParameter,
    ParameterParser,
    ParameterType,
    parameterParserBuilder as buildParameterParser,
} from "../parameters";
import { grenadeCountParser } from "../parameters/types/grenade-count";
import { locationSpan } from "./game_options/shared";

export type LoadoutItemNode = {
    identifier: string;
    parameters: ASTParameterNode[];
};

export type LoadoutElementNode = ASTElementBase<ElementKind.LOADOUT> & {
    name: { value: string; location: SourceCodeLocation } | ASTErrorNode;
    items: LoadoutItemNode[];
};

const parseIdentifier = (
    ctx: ParserContext,
    anchor: Token,
): { value: string; location: SourceCodeLocation } | ASTErrorNode => {
    const token = ctx.getToken();
    if (token.kind === TokenKind.Identifier) {
        return {
            value: token.value,
            location: token.location,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedTokenKind(TokenKind.Identifier, token.kind, token.value),
        token.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: anchor.location,
    };
};

export class LoadoutParserRepository {
    private readonly parsers = new Map<string, ParameterParser>();

    private registerParser(name: string, parser: ParameterParser) {
        this.parsers.set(name, parser);
    }

    private registerParsers(_megaloVersion: MegaloVersion) {
        this.registerParser("name", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("primary_weapon", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("backpack_weapon", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("equipment", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("grenades", grenadeCountParser);
    }

    public constructor(megaloVersion: MegaloVersion) {
        this.registerParsers(megaloVersion);
    }

    public getParser(name: string): ParameterParser | undefined {
        return this.parsers.get(name);
    }
}

export const loadoutParser = (ctx: ParserContext, elementToken: Token): LoadoutElementNode => {
    const nameToken = ctx.getToken();
    let name: LoadoutElementNode["name"];
    if (nameToken.kind === TokenKind.Identifier) {
        ctx.symbolParser.addLoadoutToScope(nameToken.value, nameToken.location);
        name = {
            value: nameToken.value,
            location: nameToken.location,
        };
    } else {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, nameToken.kind, nameToken.value),
            nameToken.location,
        );
        name = {
            kind: SyntaxKind.INVALID,
            location: elementToken.location,
        };
    }

    const items: LoadoutItemNode[] = [];

    while (ctx.hasMore()) {
        const itemIdentifier = parseIdentifier(ctx, elementToken);

        if (isAstErrorNode(itemIdentifier)) {
            continue;
        }

        if (itemIdentifier.value === "end") {
            return {
                kind: SyntaxKind.ELEMENT,
                elementKind: ElementKind.LOADOUT,
                keywordLocation: elementToken.location,
                name,
                items,
                location: locationSpan(elementToken.location, itemIdentifier.location),
            };
        }

        const parser = ctx.loadoutParserRepository.getParser(itemIdentifier.value);
        if (parser) {
            items.push({
                identifier: itemIdentifier.value,
                parameters: parser(ctx, itemIdentifier.location),
            });
        } else {
            ctx.diagnostics.addError(
                diagnosticMessages.unknownLoadoutProperty(itemIdentifier.value),
                itemIdentifier.location,
            );
        }
    }

    ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), elementToken.location);
    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.LOADOUT,
        keywordLocation: elementToken.location,
        name,
        items,
        location: elementToken.location,
    };
};
