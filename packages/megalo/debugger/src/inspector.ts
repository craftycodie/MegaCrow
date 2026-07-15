import { decodeMglo, toPlainJson } from "./mglo";
import "./styles.css";

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root element.");
}

app.innerHTML = `
  <div class="inspector-app">
    <header class="toolbar">
      <h1>Megalo Inspector</h1>
      <a class="toolbar-link" href="/">Debugger</a>
      <span class="toolbar-status" data-role="status"></span>
    </header>
    <main class="inspector-main" data-role="main">
      <label class="dropzone" data-role="dropzone">
        <input
          type="file"
          accept=".mglo,application/octet-stream"
          hidden
          data-role="file-input"
        />
        <span class="dropzone-title">Drag and drop or click to select file</span>
        <span class="dropzone-hint">Accepts compiled .mglo gametypes</span>
      </label>
      <section class="inspector-result" data-role="result" hidden>
        <div class="inspector-meta" data-role="meta"></div>
        <div class="json-tree" data-role="tree"></div>
      </section>
      <p class="inspector-error" data-role="error" hidden></p>
    </main>
  </div>
`;

const dropzone = app.querySelector<HTMLLabelElement>('[data-role="dropzone"]');
const fileInput = app.querySelector<HTMLInputElement>('[data-role="file-input"]');
const resultPanel = app.querySelector<HTMLElement>('[data-role="result"]');
const metaView = app.querySelector<HTMLElement>('[data-role="meta"]');
const treeView = app.querySelector<HTMLElement>('[data-role="tree"]');
const errorView = app.querySelector<HTMLElement>('[data-role="error"]');
const statusView = app.querySelector<HTMLElement>('[data-role="status"]');

if (
  !dropzone ||
  !fileInput ||
  !resultPanel ||
  !metaView ||
  !treeView ||
  !errorView ||
  !statusView
) {
  throw new Error("Inspector layout failed to initialize.");
}

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
  options: { open?: boolean } = {},
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
    preview.textContent =
      key === null ? "" : `: ${createSummary(value)}`;

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

const renderTree = (value: unknown): void => {
  treeView.replaceChildren();
  treeView.append(renderNode(null, value as JsonValue, { open: true }));
};

const showError = (message: string): void => {
  resultPanel.hidden = true;
  errorView.hidden = false;
  errorView.textContent = message;
  statusView.textContent = "";
};

const showResult = (fileName: string, bytes: Uint8Array): void => {
  try {
    const decoded = decodeMglo(bytes);
    const json = toPlainJson(decoded.gametype);

    errorView.hidden = true;
    resultPanel.hidden = false;
    dropzone.classList.add("is-compact");

    metaView.textContent = [
      fileName,
      `encoding ${decoded.version.encodingVersion}`,
      decoded.version.label,
      `build ${decoded.buildNumber}`,
    ].join(" · ");

    statusView.textContent = decoded.version.id;
    renderTree(json);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to decode .mglo file.";
    showError(message);
  }
};

const readFile = async (file: File): Promise<void> => {
  if (!file.name.toLowerCase().endsWith(".mglo")) {
    showError("Please select a .mglo file.");
    return;
  }

  statusView.textContent = "Reading…";
  const buffer = await file.arrayBuffer();
  showResult(file.name, new Uint8Array(buffer));
};

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) {
    void readFile(file);
  }
  fileInput.value = "";
});

dropzone.addEventListener("dragenter", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragging");
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragging");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("is-dragging");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-dragging");
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    void readFile(file);
  }
});
