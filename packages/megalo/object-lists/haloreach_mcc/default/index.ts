import { ObjectListType, type ObjectLists } from "../../../frontend/object-lists";
import equipment from "./equipment";
import grenades from "./grenades";
import hudWidgetIcons from "./hud_widget_icons";
import incidents from "./incidents";
import loadouts from "./loadouts";
import loadoutPalettes from "./loadout_palettes";
import objects from "./objects";
import strings from "./strings";
import vehicles from "./vehicles";
import vehicleSets from "./vehicle_sets";
import weapons from "./weapons";
import weaponSets from "./weapon_sets";

const objectLists = {
  [ObjectListType.Equipment]: equipment,
  [ObjectListType.Grenades]: grenades,
  [ObjectListType.HudWidgetIcons]: hudWidgetIcons,
  [ObjectListType.Incidents]: incidents,
  [ObjectListType.Loadouts]: loadouts,
  [ObjectListType.LoadoutPalettes]: loadoutPalettes,
  [ObjectListType.Objects]: objects,
  [ObjectListType.Strings]: strings,
  [ObjectListType.Vehicles]: vehicles,
  [ObjectListType.VehicleSets]: vehicleSets,
  [ObjectListType.Weapons]: weapons,
  [ObjectListType.WeaponSets]: weaponSets,
} satisfies ObjectLists;

export default objectLists;
