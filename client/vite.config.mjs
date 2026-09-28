import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev/build commands are run from the repo root, so point Vite at ./client.
export default defineConfig({
  root: "client",
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
    proxy: {
      "/api": "http://127.0.0.1:4099",
      "/track": "http://127.0.0.1:4099",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
