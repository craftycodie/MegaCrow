import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { context } from "esbuild";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(packageDir, "..");
const megaloSrc = path.resolve(rootDir, "../megalo/src");
const watch = process.argv.includes("--watch");

const readBuildInfoExports = () => {
  const buildInfoPath = path.join(megaloSrc, "build-info.ts");
  const source = fs.readFileSync(buildInfoPath, "utf8");
  const readString = (name, fallback) => {
    const match = new RegExp(`${name}\\s*=\\s*("(?:\\\\.|[^"\\\\])*")`).exec(
      source
    );
    if (!match) {
      return fallback;
    }
    return JSON.parse(match[1]);
  };
  return {
    buildString: readString("MEGACROW_BUILD_STRING", "untracked version"),
    packageVersion: readString("MEGACROW_PACKAGE_VERSION", "0.0.0"),
  };
};

/** Extension marketplace version: `0.<build-number>.0`. */
const extensionVersionFromBuild = (buildString, packageVersion) => {
  const match = /^(\d+)\./.exec(buildString);
  if (match) {
    return `0.${Number.parseInt(match[1], 10)}.0`;
  }
  // Untracked / local: keep package version if already 0.x.0, else 0.0.0.
  if (/^0\.\d+\.0$/.test(packageVersion)) {
    return packageVersion;
  }
  return "0.0.0";
};

const {
  buildString: megacrowBuildString,
  packageVersion: megacrowPackageVersion,
} = readBuildInfoExports();
const extensionVersion = extensionVersionFromBuild(
  megacrowBuildString,
  megacrowPackageVersion
);
console.log(
  `Bundling with MEGACROW_BUILD_STRING=${megacrowBuildString} version=${extensionVersion}`
);

const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
if (packageJson.version !== extensionVersion) {
  packageJson.version = extensionVersion;
  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
    "utf8"
  );
  console.log(`Stamped package.json version: ${extensionVersion}`);
}

const readmePath = path.join(rootDir, "README.md");
const readme = fs.readFileSync(readmePath, "utf8");
const nextReadme = readme.replace(
  /(\*\*Build:\*\* `)[^`]*(`)/,
  `$1${megacrowBuildString}$2`
);
if (nextReadme !== readme) {
  fs.writeFileSync(readmePath, nextReadme, "utf8");
  console.log(`Stamped README build string: ${megacrowBuildString}`);
}

/** Resolve megalo package `src/...` path aliases used throughout the compiler. */
const megaloSrcAliasPlugin = {
  name: "megalo-src-alias",
  setup(build) {
    build.onResolve({ filter: /^src(\/|$)/ }, (args) => {
      const rest =
        args.path === "src" ? "index.ts" : args.path.slice("src/".length);
      const candidates = [
        path.join(megaloSrc, rest),
        path.join(megaloSrc, `${rest}.ts`),
        path.join(megaloSrc, rest, "index.ts"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return { path: candidate };
        }
      }
      return {
        path: path.join(megaloSrc, `${rest}.ts`),
      };
    });
  },
};

/** Prefer package source entry points over package.json "main" in the monorepo. */
const workspacePackagePlugin = {
  name: "workspace-package-source",
  setup(build) {
    const packages = {
      "@megacrow/lsp/node": path.resolve(rootDir, "../lsp/src/node/index.ts"),
      "@megacrow/lsp/browser": path.resolve(
        rootDir,
        "../lsp/src/browser/index.ts"
      ),
      "@megacrow/lsp/core": path.resolve(rootDir, "../lsp/src/core.ts"),
      "@megacrow/lsp/protocol": path.resolve(rootDir, "../lsp/src/protocol.ts"),
      "@megacrow/lsp": path.resolve(rootDir, "../lsp/src/node/index.ts"),
      "@megacrow/megalo": path.resolve(rootDir, "../megalo/src/index.ts"),
    };

    for (const [filter, entry] of Object.entries(packages)) {
      build.onResolve(
        { filter: new RegExp(`^${filter.replace(/\//g, "\\/")}$`) },
        () => ({
          path: entry,
        })
      );
    }
  },
};

const shared = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  logLevel: "info",
  sourcemap: true,
  plugins: [megaloSrcAliasPlugin, workspacePackagePlugin],
  loader: {
    ".json": "json",
  },
};

const contexts = await Promise.all([
  context({
    ...shared,
    entryPoints: [path.join(rootDir, "src/extension.ts")],
    outfile: path.join(rootDir, "dist/extension.js"),
    external: ["vscode"],
  }),
  context({
    ...shared,
    entryPoints: [path.join(rootDir, "src/server.ts")],
    outfile: path.join(rootDir, "dist/server.js"),
  }),
]);

if (watch) {
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("Watching vscode-extension…");
} else {
  await Promise.all(contexts.map((ctx) => ctx.rebuild()));
  await Promise.all(contexts.map((ctx) => ctx.dispose()));
  console.log("Built packages/vscode-extension/dist");
}
