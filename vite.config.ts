import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const webRoot = resolve(__dirname, "apps", "web");

export default defineConfig({
  root: webRoot,
  base: "./",
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist-web"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(webRoot, "index.html"),
        tools: resolve(webRoot, "app.html"),
        explore: resolve(webRoot, "gallery.html"),
        generate: resolve(webRoot, "generate.html"),
        characters: resolve(webRoot, "characters.html"),
        assets: resolve(webRoot, "assets.html"),
        campaigns: resolve(webRoot, "campaigns.html"),
        aiStudio: resolve(webRoot, "ai-studio.html"),
        pipeline: resolve(webRoot, "pipeline.html"),
        queue: resolve(webRoot, "queue.html"),
        dashboard: resolve(webRoot, "dashboard.html"),
        history: resolve(webRoot, "history.html"),
        pricing: resolve(webRoot, "pricing.html"),
        freeCoins: resolve(webRoot, "free-coins.html"),
        referral: resolve(webRoot, "referral.html"),
        myCreations: resolve(webRoot, "my-creations.html"),
        imageTools: resolve(webRoot, "image-tools.html"),
        videoTools: resolve(webRoot, "video-tools.html"),
        imageToVideo: resolve(webRoot, "image-to-video.html"),
        imageEditor: resolve(webRoot, "image-editor.html"),
        faceSwap: resolve(webRoot, "face-swap.html"),
        outfitStudio: resolve(webRoot, "outfit-studio.html"),
        poseGenerator: resolve(webRoot, "pose-generator.html"),
        nanoBanana: resolve(webRoot, "nano-banana.html"),
        imageCombiner: resolve(webRoot, "image-combiner.html"),
        aiEffects: resolve(webRoot, "ai-effects.html"),
        blog: resolve(webRoot, "blog.html"),
        terms: resolve(webRoot, "terms.html"),
        privacy: resolve(webRoot, "privacy.html"),
        cookie: resolve(webRoot, "cookie.html"),
        signin: resolve(webRoot, "signin.html"),
        share: resolve(webRoot, "share.html"),
        admin: resolve(webRoot, "admin.html"),
        app: resolve(webRoot, "app-shell.html"),
      },
    },
  },
});
