import { SourceLocation } from "../diagnostics";
import { GameEngineCustomVariant } from "./game/game_variant";

type LocationMeta = { location: SourceLocation };
export type ValueWithLocation<T> = 
    // Enforce that the provided T doesnt already have a location property.
    // Then enforce that a SourceLocation is provided.
    T extends object 
        ? "location" extends keyof T
            ? never
            : T & LocationMeta
        : T & LocationMeta;

export type IR = {
    game_variant: GameEngineCustomVariant;
};

