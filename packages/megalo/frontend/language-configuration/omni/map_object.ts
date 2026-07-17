export const MAP_OBJECT_PROPERTY_KEYS = ["label", "type", "team", "user_data", "min"] as const;

export type MapObjectPropertyKey = (typeof MAP_OBJECT_PROPERTY_KEYS)[number];

export const isMapObjectPropertyKey = (key: string): key is MapObjectPropertyKey =>
    (MAP_OBJECT_PROPERTY_KEYS as readonly string[]).includes(key);
