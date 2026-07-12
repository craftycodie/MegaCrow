import { ValueWithLocation } from "../..";

export type MegaloGameEngineMapPermissions = {
    exceptMapIds: ValueWithLocation<number>[];
    allowByDefault: ValueWithLocation<boolean>;
};