import type { MegaloVersion } from "../../version";
import type { ParserSymbolContext } from "../abstract-syntax-tree/symbol-context";
import { BUILT_IN_LOCATION } from "../diagnostics";
import { TEAM_DESIGNATORS } from "../language-configuration/omni/teams";
import { VariableScope, VariableType } from ".";

export const addBuiltInConstants = (
  megaloVersion: MegaloVersion,
  symbolParser: ParserSymbolContext
): void => {
  const addBuiltInConstant = (name: string) => {
    symbolParser.addConstantToScope({
      name,
      declaration: BUILT_IN_LOCATION,
    });
  };

  // Halo: Reach
  addBuiltInConstant("true");
  addBuiltInConstant("false");
};

export const addBuiltInVariables = (
  megaloVersion: MegaloVersion,
  symbolParser: ParserSymbolContext
): void => {
  const addBuiltInVariable = (
    name: string,
    type: VariableType = VariableType.Number
  ) => {
    symbolParser.addVariableToScope({
      name,
      declaration: BUILT_IN_LOCATION,
      type,
      scope: VariableScope.Global,
    });
  };

  // Constants, a bit hacky
  symbolParser.addVariableToScope({
    name: "none",
    declaration: BUILT_IN_LOCATION,
    type: VariableType.Object,
    scope: VariableScope.Global,
  });
  symbolParser.addVariableToScope({
    name: "none",
    declaration: BUILT_IN_LOCATION,
    type: VariableType.Player,
    scope: VariableScope.Global,
  });
  symbolParser.addVariableToScope({
    name: "none",
    declaration: BUILT_IN_LOCATION,
    type: VariableType.Team,
    scope: VariableScope.Global,
  });

  // Halo: Reach
  addBuiltInVariable("round_index");
  addBuiltInVariable("symmetric_gametype");
  addBuiltInVariable("round_timer", VariableType.Timer);
  addBuiltInVariable("sudden_death_timer", VariableType.Timer);
  addBuiltInVariable("grace_period_timer", VariableType.Timer);

  // Team designators — always-available Team refs (see language/references#team-designators).
  // `none` is registered above as the shared empty sentinel.
  for (const designator of TEAM_DESIGNATORS) {
    addBuiltInVariable(designator, VariableType.Team);
  }
};

export const addBuiltInGameOptions = (
  megaloVersion: MegaloVersion,
  symbolParser: ParserSymbolContext
): void => {
  const addBuiltInGameOption = (name: string) => {
    symbolParser.addGameOptionToScope({
      name,
      declaration: BUILT_IN_LOCATION,
      type: VariableType.Number,
    });
  };

  // Halo: Reach
  addBuiltInGameOption("score_to_win_round");
  addBuiltInGameOption("fire_teams_enabled");
  addBuiltInGameOption("teams_enabled");
  addBuiltInGameOption("round_time_limit");
  addBuiltInGameOption("round_count");
  addBuiltInGameOption("perfection_enabled");
  addBuiltInGameOption("early_victory_win_count");
  addBuiltInGameOption("sudden_death_time_limit");
  addBuiltInGameOption("grace_period_time_limit");
  addBuiltInGameOption("lives_per_round");
  addBuiltInGameOption("team_lives_per_round");
  addBuiltInGameOption("respawn_time");
  addBuiltInGameOption("suicide_respawn_penalty");
  addBuiltInGameOption("betrayal_respawn_penalty");
  addBuiltInGameOption("respawn_time_growth");
  addBuiltInGameOption("loadout_selection_time");
  addBuiltInGameOption("respawn_traits_duration");
  addBuiltInGameOption("friendly_fire_enabled");
  addBuiltInGameOption("betrayal_booting_enabled");
  addBuiltInGameOption("enemy_voice_enabled");
  addBuiltInGameOption("open_channel_voice_enabled");
  addBuiltInGameOption("dead_player_voice_enabled");
  addBuiltInGameOption("grenades_on_map");
  addBuiltInGameOption("indestructible_vehicles");
  addBuiltInGameOption("red_powerup_duration");
  addBuiltInGameOption("blue_powerup_duration");
  addBuiltInGameOption("yellow_powerup_duration");
};
