import {
  type Diagnostics,
  type ObjectListLocation,
  SourceLocationType,
} from "../diagnostics";

// files that live under <megalo source folder>/object_lists/
export enum ObjectListType {
  Objects = "objects",
  Weapons = "weapons",
  Vehicles = "vehicles",
  Equipment = "equipment",
  Grenades = "grenades",
  Incidents = "incidents",
  Effects = "effects",
  Medals = "medals",
  Loadouts = "loadouts",
  LoadoutPalettes = "loadout_palettes",
  HudWidgetIcons = "hud_widget_icons",
  WeaponSets = "weapon_sets",
  VehicleSets = "vehicle_sets",
  Strings = "strings",

  // Halo 4
  Ordnances = "ordnances",
  CustomApps = "customapps",
  EquipmentSets = "equipment_sets",
}

export const OBJECT_LIST_TYPES: readonly ObjectListType[] = [
  ObjectListType.Objects,
  ObjectListType.Weapons,
  ObjectListType.Vehicles,
  ObjectListType.Equipment,
  ObjectListType.Grenades,
  ObjectListType.Incidents,
  ObjectListType.Effects,
  ObjectListType.Medals,
  ObjectListType.Loadouts,
  ObjectListType.LoadoutPalettes,
  ObjectListType.HudWidgetIcons,
  ObjectListType.WeaponSets,
  ObjectListType.VehicleSets,
  ObjectListType.EquipmentSets,
  ObjectListType.Ordnances,
  ObjectListType.Strings,
];

export type ObjectLists = Readonly<
  Partial<Record<ObjectListType, readonly string[]>>
>;

export const objectListLocation = (
  objectType: ObjectListType,
  index: number
): ObjectListLocation => ({
  type: SourceLocationType.OBJECT_LIST,
  objectType,
  source: { offset: -1, line: index, column: 0 },
});

export class ObjectListParser {
  public parse(text: string, diagnostics: Diagnostics): string[] {
    const lines = text.split("\n");
    const objectList: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") {
        continue;
      }
      if (objectList.includes(line)) {
        diagnostics.addError(
          `Duplicate object "${line}" in object list`,
          objectListLocation(ObjectListType.Objects, i)
        );
        // When we have a failure we dont compile,
        // so its fine to continue parsing the rest of the file.
        continue;
      }
      objectList.push(line);
    }
    return objectList;
  }
}
