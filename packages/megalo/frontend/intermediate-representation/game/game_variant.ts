import type { ValueWithLocation } from "..";
import { EngineCategories } from "../engine-categories";
import type { GameEngineBaseVariant } from "./game_engine_default";
import type { PlayerTraitOption } from "./game_engine_traits";
import type { Action } from "./megalogamengine/megalogamengine_actions";
import type { Condition } from "./megalogamengine/megalogamengine_conditions";
import type { HudWidgetPosition } from "./megalogamengine/megalogamengine_hud_widgets";
import type { ObjectFilter } from "./megalogamengine/megalogamengine_map_objects";
import type { MegaloGameEngineMapPermissions } from "./megalogamengine/megalogamengine_map_permissions";
import type { MegaloGameStatistic } from "./megalogamengine/megalogamengine_statistics";
import type { Trigger } from "./megalogamengine/megalogamengine_trigger";
import type { UserDefinedOption } from "./megalogamengine/megalogamengine_user_defined_options";
import type { VariableMetadata } from "./megalogamengine/megalogamengine_variable_metadata";
import type { BuiltInGameOptionFlags } from "./parameters";
import type { StringTable, StringTableReference } from "./string_table";

// Based on c_game_engine_custom_variant
// A lot of this is partial, as its applied as an override on the default game engine definition.
export type GameEngineCustomVariant = {
  baseVariant: GameEngineBaseVariant;
  playerTraits: PlayerTraitOption[];
  userDefinedOptions: UserDefinedOption[];
  scriptStrings: StringTable;
  baseNameStringIndex: StringTableReference;
  localizedName?: ValueWithLocation<StringTable>;
  localizedDescription?: ValueWithLocation<StringTable>;
  localizedCategory?: ValueWithLocation<StringTable>;
  engineIcon: ValueWithLocation<number>;
  engineCategory: ValueWithLocation<EngineCategories>;
  mapPermissions?: MegaloGameEngineMapPermissions;
  playerRatings?: Partial<{
    ratingScale: ValueWithLocation<number>;
    killWeight: ValueWithLocation<number>;
    assistWeight: ValueWithLocation<number>;
    betrayalWeight: ValueWithLocation<number>;
    deathWeight: ValueWithLocation<number>;
    normalizeByMaxKills: ValueWithLocation<boolean>;
    base: ValueWithLocation<number>;
    range: ValueWithLocation<number>;
    lossScalar: ValueWithLocation<number>;
    customStat0: ValueWithLocation<number>;
    customStat1: ValueWithLocation<number>;
    customStat2: ValueWithLocation<number>;
    customStat3: ValueWithLocation<number>;
    expansion0: ValueWithLocation<number>;
    expansion1: ValueWithLocation<number>;
    showInScoreboard: ValueWithLocation<boolean>;
  }>;
  scoreToWinRound?: ValueWithLocation<number>;
  fireTeamsEnabled?: ValueWithLocation<boolean>;
  symmetricGametype?: ValueWithLocation<boolean>;
  baseVariantParametersLocked: BuiltInGameOptionFlags;
  baseVariantParametersHidden: BuiltInGameOptionFlags;
  // lock and hide flags are stored within userDefinedOptions on IR.
  // userDefinedOptionsLocked: GameVariantParameterFlags;
  // userDefinedOptionsHidden: GameVariantParameterFlags;
  gameEngine: CustomGameEngineDefinition;
  tu1Settings: Partial<{
    alwaysSpilloverDamage: ValueWithLocation<boolean>;
    armorLockStickiesRemain: ValueWithLocation<boolean>;
    attachedDamageBypassShields: ValueWithLocation<boolean>;
    activeCamoOverrideEnergyCurve: ValueWithLocation<boolean>;
    swordGunClangKills: ValueWithLocation<boolean>;
    magnumIsAutomatic: ValueWithLocation<boolean>;
    precisionBloom: ValueWithLocation<number>;
    armorLockDamageDrain: ValueWithLocation<number>;
    armorLockDamageDrainLimit: ValueWithLocation<number>;
    activeCamoEnergyCurveMin: ValueWithLocation<number>;
    activeCamoEnergyCurveMax: ValueWithLocation<number>;
    magnumDamage: ValueWithLocation<number>;
    magnumFireDelay: ValueWithLocation<number>;
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
  hudWidgets: ValueWithLocation<HudWidgetPosition>[];
  initializationTriggerIndex: number;
  localInitializationTriggerIndex: number;
  hostMigrationTriggerIndex: number;
  doubleMigrationTriggerIndex: number;
  objectDeathEventTriggerIndex: number;
  localTriggerIndex: number;
  pregameTriggerIndex: number;
  objectsUsed: boolean[];
  objectFilters: ObjectFilter[];
};
