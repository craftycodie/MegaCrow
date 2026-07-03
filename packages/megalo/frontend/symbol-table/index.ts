// Modelled based on Bungie.Megalo.VariableType 
const enum VariableType {
    Timer,
    Number,
    Team,
    Player,
    Object
}

// Since Megalo is context-dependant, we build the Symbol Table at parse.
export type SymbolTable = {};