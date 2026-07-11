import { StringTableReference } from "../string_table";

export enum ObjectTeamFilter {
    None = -1,
    Team1 = 0,
    Team2 = 1,
    Team3 = 2,
    Team4 = 3,
    Team5 = 4,
    Team6 = 5,
    Team7 = 6,
    Team8 = 7,
    Neutral = 8,
    Each = 9,
}

export type ObjectFilter = Partial<{
    label: StringTableReference;
    objectType: number; // object_lists/objects.txt
    team: ObjectTeamFilter;
    userData: number;
    min: number;
}>;
