import { SourceLocation } from "../diagnostics";
import { GameEngineCustomVariant } from "./game/game_variant";

export type ValueWithLocation<T> = T & {
    location: SourceLocation;
}

export type IR = {
    game_variant: GameEngineCustomVariant;
};

