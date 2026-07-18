import type { MegaloVersion } from "../../version";
import { type AST } from "../abstract-syntax-tree";
import {
  BUILT_IN_LOCATION,
  type Diagnostics,
  type SourceLocation,
} from "../diagnostics";
import type { ObjectLists } from "../object-lists";
import { ELEMENT_LOWERERS } from "./elements";
import type { GameEngineCustomVariant } from "./game/game_variant";
import { StringTable } from "./game/string_table";
import { applyBaseName } from "./postprocessing/applyBaseName";
import { applyDefaultLoadoutCameraTime } from "./postprocessing/applyDefaultLoadoutCameraTime";
import { applyMetadata } from "./postprocessing/applyMetadata";

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
  baseFilePath?: string;
  gameVariant: GameEngineCustomVariant;
};

export type LowerContext = {
  objectLists?: ObjectLists;
};

export const valueWithLocation = <T>(
  value: T,
  location: SourceLocation
): ValueWithLocation<T> => {
  if (value !== null && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    // Keep class instances (e.g. StringTable) intact; only clone plain objects.
    if (proto !== Object.prototype && proto !== null) {
      return Object.assign(value as object, {
        location,
      }) as ValueWithLocation<T>;
    }
    return { ...value, location } as ValueWithLocation<T>;
  }
  // Box primitives so they can carry .location
  return Object.assign(Object(value), { location }) as ValueWithLocation<T>;
};

export class Lowerer {
  private readonly megaloVersion: MegaloVersion;
  public constructor(megaloVersion: MegaloVersion) {
    this.megaloVersion = megaloVersion;
  }

  public lower(
    ast: AST,
    diagnostics: Diagnostics,
    context: LowerContext = {}
  ): IR {
    void ast;
    void context;
    void this.megaloVersion;

    const ir = this.buildDefaultIR();

    ast.elements.forEach((element) => {
      const elementLowerer = ELEMENT_LOWERERS.get(element.elementKind);
      if (elementLowerer) {
        elementLowerer(element, ast, ir, diagnostics);
      }
      else {
        console.warn(`lowerer for ${element.elementKind} NYI`);
      }
    });

    this.postprocess(ir);

    return ir;
  }

  private postprocess(ir: IR) {
    applyDefaultLoadoutCameraTime(ir);
    applyBaseName(ir);
    applyMetadata(ir);
  }

  private buildDefaultIR(): IR {
    const scriptStrings = new StringTable();
    const defaultNameIndex = scriptStrings.addEntry({
      english: "Custom Game",
    });

    const ir: IR = {
      baseFilePath: undefined,
      gameVariant: {
        baseVariant: {
          metadata: {
            general: {
              gameEngineType: 0,
              gameMode: 0,
            },
            creationHistory: {
              timestamp: new Date(),
              xuid: BigInt(0),
              name: "Default",
              isOnline: false,
            },
            modificationHistory: {
              timestamp: new Date(),
              xuid: BigInt(0),
              name: "Default",
              isOnline: false,
            },
          },
          builtIn: valueWithLocation(false, BUILT_IN_LOCATION),
          miscellaneousOptions: {},
          respawnOptions: {},
          socialOptions: {},
          mapOverrideOptions: {},
          teamOptions: {},
          loadoutTraits: {},
        },
        playerTraits: [],
        userDefinedOptions: [],
        scriptStrings,
        baseNameStringIndex: valueWithLocation(
          defaultNameIndex,
          BUILT_IN_LOCATION
        ),
        localizedName: undefined,
        localizedDescription: undefined,
        localizedCategory: undefined,
        engineIcon: valueWithLocation(0, BUILT_IN_LOCATION),
        engineCategory: valueWithLocation(0, BUILT_IN_LOCATION),
        mapPermissions: undefined,
        playerRatings: undefined,
        scoreToWinRound: undefined,
        fireTeamsEnabled: undefined,
        symmetricGametype: undefined,
        baseVariantParametersLocked: {},
        baseVariantParametersHidden: {},
        gameEngine: {
          conditions: [],
          actions: [],
          triggers: [],
          statistics: [],
          globalVariableMetadata: {
            numericVariables: [],
            timerVariables: [],
            teamVariables: [],
            playerVariables: [],
            objectVariables: [],
          },
          playerVariableMetadata: {
            numericVariables: [],
            timerVariables: [],
            teamVariables: [],
            playerVariables: [],
            objectVariables: [],
          },
          objectVariableMetadata: {
            numericVariables: [],
            timerVariables: [],
            teamVariables: [],
            playerVariables: [],
            objectVariables: [],
          },
          teamVariableMetadata: {
            numericVariables: [],
            timerVariables: [],
            teamVariables: [],
            playerVariables: [],
            objectVariables: [],
          },
          hudWidgets: [],
          initializationTriggerIndex: 0,
          localInitializationTriggerIndex: 0,
          hostMigrationTriggerIndex: 0,
          doubleMigrationTriggerIndex: 0,
          objectDeathEventTriggerIndex: 0,
          localTriggerIndex: 0,
          pregameTriggerIndex: 0,
          objectsUsed: [],
          objectFilters: [],
        },
        tu1Settings: {},
      },
    };
    return ir;
  }
}
