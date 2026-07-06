import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const webRoot = resolve(__dirname, "apps", "web");

export default defineConfig({
  root: webRoot,
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist-web"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(webRoot, "index.html"),
        explore: resolve(webRoot, "gallery.html"),
        generate: resolve(webRoot, "generate.html"),
        characters: resolve(webRoot, "characters.html"),
        assets: resolve(webRoot, "assets.html"),
        dashboard: resolve(webRoot, "dashboard.html"),
        history: resolve(webRoot, "history.html"),
        pricing: resolve(webRoot, "pricing.html"),
        signin: resolve(webRoot, "signin.html"),
        share: resolve(webRoot, "share.html"),
        app: resolve(webRoot, "app-shell.html"),
      },
    },
  },
});
