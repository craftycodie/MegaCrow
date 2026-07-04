import { ASTElementBase, ElementKind } from ".";
import { MegaloVersion } from "../../../version";
import { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { isEndToken, locationSpan, parseIdentifier } from "./game_options/shared";
import { isAstErrorNode, SyntaxKind } from "../kinds";
import {
    ASTParameterNode,
    ParameterParser,
    ParameterType,
    parameterParserBuilder as buildParameterParser,
} from "../parameters";

export type TeamsPropertyNode = {
    identifier: string;
    parameters: ASTParameterNode[];
};

export type TeamNode = {
    properties: TeamsPropertyNode[];
    location: SourceCodeLocation;
};

export type TeamsElementNode = ASTElementBase<ElementKind.TEAMS> & {
    properties: TeamsPropertyNode[];
    teams: TeamNode[];
};

export class TeamsParserRepository {
    private readonly teamsOptionParsers = new Map<string, ParameterParser>();
    private readonly teamOptionParsers = new Map<string, ParameterParser>();

    private registerParser(
        parsers: Map<string, ParameterParser>,
        name: string,
        parser: ParameterParser,
    ) {
        parsers.set(name, parser);
    }

    private registerParsers(_megaloVersion: MegaloVersion) {
        // under teams
        this.registerParser(this.teamsOptionParsers, "model", buildParameterParser([ParameterType.Keyword]));
        this.registerParser(this.teamsOptionParsers, "designator_switch_type", buildParameterParser([ParameterType.Keyword]));

        // under team
        this.registerParser(this.teamOptionParsers, "name", buildParameterParser([ParameterType.Keyword]));
        this.registerParser(this.teamOptionParsers, "designator", buildParameterParser([ParameterType.Keyword]));
        this.registerParser(this.teamOptionParsers, "model", buildParameterParser([ParameterType.Keyword]));
        this.registerParser(this.teamOptionParsers, "color", buildParameterParser([ParameterType.Number, ParameterType.Number, ParameterType.Number]));
        this.registerParser(this.teamOptionParsers, "fireteam_count", buildParameterParser([ParameterType.Number]));
    }

    public constructor(megaloVersion: MegaloVersion) {
        this.registerParsers(megaloVersion);
    }

    public getBlockParser(name: string): ParameterParser | undefined {
        return this.teamsOptionParsers.get(name);
    }

    public getTeamParser(name: string): ParameterParser | undefined {
        return this.teamOptionParsers.get(name);
    }
}

const parseTeamBlock = (ctx: ParserContext, teamToken: Token): TeamNode => {
    const properties: TeamsPropertyNode[] = [];

    ctx.parseUntilEnd(() => {
        const propertyIdentifier = parseIdentifier(ctx, teamToken);

        if (isAstErrorNode(propertyIdentifier)) {
            return;
        }

        const parser = ctx.teamsParserRepository.getTeamParser(propertyIdentifier.value);
        if (parser) {
            properties.push({
                identifier: propertyIdentifier.value,
                parameters: parser(ctx, propertyIdentifier.location),
            });
        } else {
            ctx.diagnostics.addError(
                diagnosticMessages.unknownTeamProperty(propertyIdentifier.value),
                propertyIdentifier.location,
            );
        }
    });

    const endToken = ctx.peekToken(-1);
    const endLocation = endToken?.location ?? teamToken.location;

    return {
        properties,
        location: locationSpan(teamToken.location, endLocation),
    };
};

export const teamsParser = (ctx: ParserContext, elementToken: Token): TeamsElementNode => {
    const properties: TeamsPropertyNode[] = [];
    const teams: TeamNode[] = [];

    while (ctx.hasMore()) {
        const token = ctx.peekToken();
        if (!token) {
            break;
        }

        if (isEndToken(token)) {
            const endToken = ctx.getToken();
            return {
                kind: SyntaxKind.ELEMENT,
                elementKind: ElementKind.TEAMS,
                properties,
                teams,
                location: locationSpan(elementToken.location, endToken.location),
            };
        }

        if (token.kind === TokenKind.Identifier && token.value === "team") {
            const teamToken = ctx.getToken();
            teams.push(parseTeamBlock(ctx, teamToken));
            continue;
        }

        const propertyIdentifier = parseIdentifier(ctx, elementToken);

        if (isAstErrorNode(propertyIdentifier)) {
            continue;
        }

        const parser = ctx.teamsParserRepository.getBlockParser(propertyIdentifier.value);
        if (parser) {
            properties.push({
                identifier: propertyIdentifier.value,
                parameters: parser(ctx, propertyIdentifier.location),
            });
        } else {
            ctx.diagnostics.addError(
                diagnosticMessages.unknownTeamsBlockProperty(propertyIdentifier.value),
                propertyIdentifier.location,
            );
        }
    }

    ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), elementToken.location);
    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.TEAMS,
        properties,
        teams,
        location: elementToken.location,
    };
};
