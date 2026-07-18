import type { MegaloVersion } from "../../version";
import { type AST, SyntaxKind } from "../abstract-syntax-tree";
import { ElementKind } from "../abstract-syntax-tree/elements";
import { locationSpan } from "../abstract-syntax-tree/elements/game_options/shared";
import type { ASTParameterNode } from "../abstract-syntax-tree/parameters";
import {
  BUILT_IN_LOCATION,
  type Diagnostics,
  type SourceLocation,
  SourceLocationType,
} from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import { FrontendError } from "../error";
import { ENGINE_CATEGORY_STRING_PREFIX } from "../language-configuration/omni/engine_data";
import type { ObjectLists } from "../object-lists";
import { SymbolKind, type SymbolTableEntry } from "../symbol-table";
import { assertSymbolKind } from "./diagnostics/assertSymbolKind";
import { assertSyntaxKind } from "./diagnostics/assertSyntaxKind";
import { expectParameterCount } from "./diagnostics/expectParameterCount";
import { markCurrentValueUnused } from "./diagnostics/markCurrentValueUnused";
import { EngineCategories, parseEnumCategory } from "./engine-categories";
import { LowerError } from "./error";
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

const dxAssertionScope = (diagnostics: Diagnostics, func: () => void) => {
  try {
    func();
  } catch (error) {
    if (error instanceof LowerError) {
      diagnostics.addError(error.message, error.location);
    } else {
      throw error;
    }
  }
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
      if (element.elementKind === ElementKind.ENGINE_DATA) {
        for (const property of element.properties) {
          switch (property.identifier) {
            case "name":
              markCurrentValueUnused(ir.gameVariant.localizedName, diagnostics);
              expectParameterCount(1, property.parameters);
              dxAssertionScope(diagnostics, () => {
                const parameter = property.parameters[0]!;
                assertSyntaxKind(parameter, SyntaxKind.REFERENCE);
                const symbol = ast.symbolTable.getSymbol(parameter.symbolId);
                assertSymbolKind(symbol, SymbolKind.String);
                const localizedName = new StringTable();
                localizedName.addEntry(symbol.languageContents);
                ir.gameVariant.localizedName = valueWithLocation(
                  localizedName,
                  parameter.location
                );
              });
              break;
            case "description":
              markCurrentValueUnused(
                ir.gameVariant.localizedDescription,
                diagnostics
              );
              expectParameterCount(1, property.parameters);
              dxAssertionScope(diagnostics, () => {
                const parameter = property.parameters[0]!;
                assertSyntaxKind(parameter, SyntaxKind.REFERENCE);
                const symbol = ast.symbolTable.getSymbol(parameter.symbolId);
                assertSymbolKind(symbol, SymbolKind.String);
                const localizedDescription = new StringTable();
                localizedDescription.addEntry(symbol.languageContents);
                ir.gameVariant.localizedDescription = valueWithLocation(
                  localizedDescription,
                  parameter.location
                );
              });
              break;
            case "icon":
              markCurrentValueUnused(ir.gameVariant.engineIcon, diagnostics);
              expectParameterCount(1, property.parameters);
              dxAssertionScope(diagnostics, () => {
                const parameter = property.parameters[0]!;
                assertSyntaxKind(parameter, [
                  SyntaxKind.REFERENCE,
                  SyntaxKind.INTEGER,
                ]);
                if (parameter.kind === SyntaxKind.REFERENCE) {
                  const symbol = ast.symbolTable.getSymbol(parameter.symbolId);
                  assertSymbolKind(symbol, SymbolKind.Constant);
                  ir.gameVariant.engineIcon = valueWithLocation(
                    symbol.value,
                    parameter.location
                  );
                } else {
                  ir.gameVariant.engineIcon = valueWithLocation(
                    parameter.value,
                    parameter.location
                  );
                }
              });
              break;
            case "category":
                markCurrentValueUnused(
                    ir.gameVariant.localizedCategory,
                    diagnostics
                );
                expectParameterCount(1, property.parameters);
                    dxAssertionScope(diagnostics, () => {
                    const parameter = property.parameters[0]!;
                    assertSyntaxKind(parameter, SyntaxKind.REFERENCE);
                    const symbol = ast.symbolTable.getSymbol(parameter.symbolId);
                    assertSymbolKind(symbol, SymbolKind.String);
                    const localizedCategory = new StringTable();
                    localizedCategory.addEntry(symbol.languageContents);
                    ir.gameVariant.localizedCategory = valueWithLocation(
                        localizedCategory,
                        parameter.location
                    );
                    // engine_data category is weird, it maps to a string table entry and an enum
                    // the symbol name has the prefix "engine_category_" so we need to remove it to get the enum member name
                    const enumValueKey = symbol.name.replace(new RegExp(`^${ENGINE_CATEGORY_STRING_PREFIX}`), "");
                    const enumValue = parseEnumCategory(enumValueKey);
                    if (enumValue !== undefined) {
                        ir.gameVariant.engineCategory = valueWithLocation(enumValue, parameter.location);
                    }
                });
              break;
          }
        }
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
