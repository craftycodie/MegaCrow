import type { ValueWithLocation } from "..";
import type { PlayerTraits } from "./game_engine_player_traits";
import type { StringTableReference } from "./string_table";

export type PlayerTraitOption = {
  name: ValueWithLocation<StringTableReference>;
  description: ValueWithLocation<StringTableReference>;
  traits: ValueWithLocation<PlayerTraits>;
};
