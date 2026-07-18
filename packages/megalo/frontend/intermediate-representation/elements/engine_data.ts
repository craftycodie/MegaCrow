import { ElementLowerer } from ".";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { markCurrentValueUnused } from "../diagnostics/markCurrentValueUnused";
import { expectParameterCount } from "../diagnostics/expectParameterCount";
import { SyntaxKind } from "../../abstract-syntax-tree";
import { assertSymbolKind } from "../diagnostics/assertSymbolKind";
import { SymbolKind } from "../../symbol-table";
import { StringTable } from "../game/string_table";
import { valueWithLocation } from "..";
import { dxAssertionScope } from "../diagnostics";
import { EngineDataElementNode } from "../../abstract-syntax-tree/elements/engine_data";
import { parseEnumCategory as parseEngineCategory } from "../engine-categories";
import { ENGINE_CATEGORY_STRING_PREFIX } from "../../language-configuration/omni/engine_data";

export const engineDataLowerer: ElementLowerer<EngineDataElementNode> = (element, ast, ir, diagnostics) => {
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
                  const enumValue = parseEngineCategory(enumValueKey);
                  if (enumValue !== undefined) {
                      ir.gameVariant.engineCategory = valueWithLocation(enumValue, parameter.location);
                  }
              });
            break;
        }
      }
}