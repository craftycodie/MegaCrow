import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  server: {
    port: 5175,
    strictPort: true,
  },
});
