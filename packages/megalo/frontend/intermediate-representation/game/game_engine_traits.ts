import { PlayerTraits } from "./game_engine_player_traits";
import { StringTableReference } from "./string_table";

export type PlayerTraitOption = {
    name: StringTableReference;
    description: StringTableReference;
    traits: PlayerTraits;
}