import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies /api → backend so the browser never hits
// third-party APIs directly (no CORS, no exposed keys).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/macropulse-global/" : "/",
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist", sourcemap: false },
}));
