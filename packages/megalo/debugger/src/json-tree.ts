export type JsonPrimitive = null | boolean | number | string;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

const isObject = (value: unknown): value is Record<string, JsonValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const formatPrimitive = (value: JsonPrimitive): string => {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return String(value);
};

const createSummary = (value: JsonValue): string => {
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }
  if (isObject(value)) {
    return `Object(${Object.keys(value).length})`;
  }
  return formatPrimitive(value);
};

const renderNode = (
  key: string | null,
  value: JsonValue,
  options: { open?: boolean } = {}
): HTMLElement => {
  const row = document.createElement("div");
  row.className = "json-node";

  if (Array.isArray(value) || isObject(value)) {
    const details = document.createElement("details");
    details.className = "json-details";
    details.open = options.open === true;

    const summary = document.createElement("summary");
    summary.className = "json-summary";

    const keySpan = document.createElement("span");
    keySpan.className = "json-key";
    keySpan.textContent = key === null ? createSummary(value) : key;

    const preview = document.createElement("span");
    preview.className = "json-preview";
    preview.textContent = key === null ? "" : `: ${createSummary(value)}`;

    summary.append(keySpan, preview);
    details.append(summary);

    const children = document.createElement("div");
    children.className = "json-children";

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        children.append(renderNode(String(index), item));
      });
    } else {
      for (const [childKey, childValue] of Object.entries(value)) {
        children.append(renderNode(childKey, childValue));
      }
    }

    details.append(children);
    row.append(details);
    return row;
  }

  const leaf = document.createElement("div");
  leaf.className = "json-leaf";

  if (key !== null) {
    const keySpan = document.createElement("span");
    keySpan.className = "json-key";
    keySpan.textContent = key;
    leaf.append(keySpan);

    const separator = document.createElement("span");
    separator.className = "json-separator";
    separator.textContent = ": ";
    leaf.append(separator);
  }

  const valueSpan = document.createElement("span");
  valueSpan.className = `json-value json-value-${value === null ? "null" : typeof value}`;
  valueSpan.textContent = formatPrimitive(value);
  leaf.append(valueSpan);

  row.append(leaf);
  return row;
};

/** Replace `container` contents with an accordion JSON tree. Root node starts open. */
export const renderJsonTree = (
  container: HTMLElement,
  value: unknown
): void => {
  container.replaceChildren();
  container.append(renderNode(null, value as JsonValue, { open: true }));
};
