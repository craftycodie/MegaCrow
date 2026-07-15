import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  appType: "mpa",
  server: {
    port: 5175,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(root, "index.html"),
        inspector: path.resolve(root, "inspector.html"),
      },
    },
  },
  plugins: [
    {
      name: "megalo-debugger-routes",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/inspector" || req.url === "/inspector/") {
            req.url = "/inspector.html";
          }
          next();
        });
      },
    },
  ],
});
