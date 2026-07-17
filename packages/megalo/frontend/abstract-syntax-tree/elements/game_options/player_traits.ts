import { MegaloVersion } from "../../../../version";
import { SourceCodeLocation } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { Token } from "../../../tokens";
import { ParserContext } from "../../context";
import { ASTErrorNode, ASTNode, isAstErrorNode, SyntaxKind } from "../../kinds";
import { ASTParameterNode, KeywordParameter, ParameterParser, ParameterType, parameterParserBuilder as buildParameterParser } from "../../parameters";
import { grenadeCountParser } from "../../parameters/types/grenade-count";
import { ASTStringLiteralOrReference, parseStringLiteralOrReference } from "../../parameters/string_literal_or_reference";
import { locationSpan, parseIdentifier } from "./shared";
import { GameOptionEntryKind, type GameOptionModifiers } from "./types";

export type PlayerTraitOptionNode = {
    identifier: string,
    parameters: ASTParameterNode[]
}

export const parsePlayerTraitOptions = (
    ctx: ParserContext,
    anchor: Token,
): { options: PlayerTraitOptionNode[]; location: SourceCodeLocation } => {
    const options: PlayerTraitOptionNode[] = [];

    while (ctx.hasMore()) {
        const optionIdentifier = parseIdentifier(ctx, anchor);

        if (isAstErrorNode(optionIdentifier)) {
            continue;
        }

        if (optionIdentifier.value === "end") {
            return {
                options,
                location: locationSpan(anchor.location, optionIdentifier.location),
            };
        }

        const parser = ctx.playerTraitParserRepository.getParser(optionIdentifier.value);
        if (parser) {
            options.push({
                identifier: optionIdentifier.value,
                parameters: parser(ctx, optionIdentifier.location),
            });
        } else {
            ctx.diagnostics.addError(
                diagnosticMessages.unknownPlayerTrait(optionIdentifier.value),
                optionIdentifier.location,
            );
        }
    }

    ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), anchor.location);
    return {
        options,
        location: anchor.location,
    };
};

export type PlayerTraitsElementNode = {
    kind: GameOptionEntryKind.PLAYER_TRAITS;
    modifiers: GameOptionModifiers;
    name: { value: string; location: SourceCodeLocation } | ASTErrorNode;
    displayName: ASTStringLiteralOrReference;
    description: ASTStringLiteralOrReference;
    location: SourceCodeLocation;
    options: PlayerTraitOptionNode[]
};

export const playerTraitsParser = (
    ctx: ParserContext,
    keywordToken: Token,
    modifiers: GameOptionModifiers,
): PlayerTraitsElementNode => {
    const name = parseIdentifier(ctx, keywordToken);
    const displayName = parseStringLiteralOrReference(ctx, keywordToken);
    const description = parseStringLiteralOrReference(ctx, keywordToken);
    const { options, location } = parsePlayerTraitOptions(ctx, keywordToken);

    return {
        kind: GameOptionEntryKind.PLAYER_TRAITS,
        modifiers,
        name,
        displayName,
        description,
        location,
        options,
    };
};

export type ASTPlayerTraitNode = {
    identifier: Token,
    parameters: ASTNode<SyntaxKind.KEYWORD | SyntaxKind.INTEGER | SyntaxKind.REFERENCE>
}

export class PlayerTraitParserRepository {
    private readonly parsers = new Map<string, ParameterParser>();

    private registerParser(name: string, parser: ParameterParser) {
        this.parsers.set(name, parser);
    }

    private registerParsers(megaloVersion: MegaloVersion) {
        this.registerParser("damage_resistance", buildParameterParser([ParameterType.Keyword], [ParameterType.Number]));
        this.registerParser("body_recharge", buildParameterParser([ParameterType.Number]));
        this.registerParser("shield_recharge", buildParameterParser([ParameterType.Number]));
        this.registerParser("vampirism", buildParameterParser([ParameterType.Number]));
        this.registerParser("headshot_immunity", buildParameterParser([ParameterType.Number]));
        this.registerParser("body_multiplier", buildParameterParser([ParameterType.Number]));
        this.registerParser("shield_multiplier", buildParameterParser([ParameterType.Number]));
        this.registerParser("assassination_immunity", buildParameterParser([ParameterType.Number]));
        this.registerParser("damage_modifier", buildParameterParser([ParameterType.Keyword], [ParameterType.Number]));
        this.registerParser("melee_damage_modifier", buildParameterParser([ParameterType.Keyword], [ParameterType.Number]));
        this.registerParser("initial_primary_weapon", buildParameterParser([ParameterType.Number]));
        this.registerParser("initial_secondary_weapon", buildParameterParser([ParameterType.Number]));
        this.registerParser("initial_equipment", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("initial_grenades", grenadeCountParser);
        this.registerParser("recharging_grenades", buildParameterParser([ParameterType.Number]));
        this.registerParser("infinite_ammo", buildParameterParser([ParameterType.Number]));
        this.registerParser("bottomless_clip", buildParameterParser([ParameterType.Number]));
        this.registerParser("weapon_pickup", buildParameterParser([ParameterType.Number]));
        this.registerParser("drop_equipment", buildParameterParser([ParameterType.Number]));
        this.registerParser("infinite_equipment", buildParameterParser([ParameterType.Number]));
        this.registerParser("speed", buildParameterParser([ParameterType.Number]));
        this.registerParser("gravity", buildParameterParser([ParameterType.Number]));
        this.registerParser("vehicle_usage", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("jump_modifier", buildParameterParser([ParameterType.Number]));
        this.registerParser("sprinting", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("equipment_usage", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("active_camo", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("waypoint", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("gamertag_visibility", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("color", buildParameterParser([ParameterType.Keyword], [ParameterType.Number, ParameterType.Number, ParameterType.Number]));
        this.registerParser("tracker_mode", buildParameterParser([ParameterType.Keyword]));
        this.registerParser("tracker_range", buildParameterParser([ParameterType.Number]));
    }

    public constructor(megaloVersion: MegaloVersion) {
        this.registerParsers(megaloVersion);
    }

    public getParser(name: string): ParameterParser | undefined {
        return this.parsers.get(name);
    }
};