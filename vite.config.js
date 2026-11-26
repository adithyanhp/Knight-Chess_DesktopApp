import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import offlinePlugin from "./offline-plugin.js";
export default defineConfig({
  plugins: [react(), offlinePlugin()],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
