
// Modelled based on Bungie.Megalo.VariableType 
const enum VariableType {
    Timer,
    Number,
    Team,
    Player,
    Object
}

export type ParserContext = {
    variablesInScope: Record<string, VariableType>;
}