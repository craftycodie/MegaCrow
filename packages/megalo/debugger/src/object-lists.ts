import type { ObjectLists } from "../../frontend/object-lists";
import objectListsHaloReachMccDefault from "../../object-lists/haloreach_mcc/default";

const OBJECT_LISTS_BY_VERSION: Readonly<Record<string, ObjectLists>> = {
  "107-mcc": objectListsHaloReachMccDefault,
};

/** Load the bundled object lists for a given megalo version (e.g. "107-mcc"). */
export const loadObjectLists = (versionId: string): ObjectLists =>
  OBJECT_LISTS_BY_VERSION[versionId] ?? {};
