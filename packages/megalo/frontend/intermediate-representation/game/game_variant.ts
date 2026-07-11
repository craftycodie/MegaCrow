import { GameEngineBaseVariant } from "./game_engine_default";
import { PlayerTraitOption } from "./game_engine_traits";
import { Action } from "./megalogamengine/megalogamengine_actions";
import { Condition } from "./megalogamengine/megalogamengine_conditions";
import { HudWidgetPosition } from "./megalogamengine/megalogamengine_hud_widgets";
import { ObjectFilter } from "./megalogamengine/megalogamengine_map_objects";
import { MegaloGameEngineMapPermissions } from "./megalogamengine/megalogamengine_map_permissions";
import { MegaloGameStatistic } from "./megalogamengine/megalogamengine_statistics";
import { Trigger } from "./megalogamengine/megalogamengine_trigger";
import { UserDefinedOption } from "./megalogamengine/megalogamengine_user_defined_options";
import { VariableMetadata } from "./megalogamengine/megalogamengine_variable_metadata";
import { BuiltInGameOptionFlags } from "./parameters";
import { StringTable } from "./string_table";

// Based on c_game_engine_custom_variant
// A lot of this is partial, as its applied as an override on the default game engine definition.
export type GameEngineCustomVariant = {
    encodingVersion: number;
    buildNumber: number;
    baseVariant: GameEngineBaseVariant;
    playerTraits: PlayerTraitOption[];
    userDefinedOptions: UserDefinedOption[];
    scriptStrings: StringTable;
    baseNameStringIndex: number;
    localizedName: StringTable;
    localizedDescription: StringTable;
    localizedCategory: StringTable;
    engineIcon: number;
    engineCategory: number;
    mapPermissions: MegaloGameEngineMapPermissions;
    playerRatings: Partial<{
        ratingScale: number;
        killWeight: number;
        assistWeight: number;
        betrayalWeight: number;
        deathWeight: number;
        normalizeByMaxKills: boolean;
        base: number;
        range: number;
        lossScalar: number;
        customStat0: number;
        customStat1: number;
        customStat2: number;
        customStat3: number;
        expansion0: number;
        expansion1: number;
        showInScoreboard: boolean;
    }>;
    scoreToWinRound: number;
    fireTeamsEnabled: boolean;
    symmetricGametype: boolean;
    baseVariantParametersLocked: BuiltInGameOptionFlags;
    baseVariantParametersHidden: BuiltInGameOptionFlags;
    // lock and hide flags are stored within userDefinedOptions on IR.
    // userDefinedOptionsLocked: GameVariantParameterFlags;
    // userDefinedOptionsHidden: GameVariantParameterFlags;
    gameEngine: CustomGameEngineDefinition;
    tu1Settings: Partial<{
        alwaysSpilloverDamage: boolean;
        armorLockStickiesRemain: boolean;
        attachedDamageBypassShields: boolean;
        activeCamoOverrideEnergyCurve: boolean;
        swordGunClangKills: boolean;
        magnumIsAutomatic: boolean;
        precisionBloom: number;
        activeCamoEnergyCurveMin: number;
        activeCamoEnergyCurveMax: number;
        armorLockDamageDrain: number;
        armorLockDamageDrainLimit: number;
        magnumDamage: number;
        magnumFireDelay: number;
    }>;
};

export type CustomGameEngineDefinition = {
    conditions: Condition[];
    actions: Action[];
    triggers: Trigger[];
    statistics: MegaloGameStatistic[];
    globalVariableMetadata: VariableMetadata;
    playerVariableMetadata: VariableMetadata;
    objectVariableMetadata: VariableMetadata;
    teamVariableMetadata: VariableMetadata;
    hudWidgets: HudWidgetPosition[];
    initializationTriggerIndex: number;
    localInitializationTriggerIndex: number;
    hostMigrationTriggerIndex: number;
    doubleMigrationTriggerIndex: number;
    objectDeathEventTriggerIndex: number;
    localTriggerIndex: number;
    pregameTriggerIndex: number;
    objectsUsed: boolean[];
    objectFilters: ObjectFilter[];
}