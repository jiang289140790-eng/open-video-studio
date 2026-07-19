import { cp, copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("apps/web");
const out = resolve("dist-web");
await mkdir(out, { recursive: true });
for (const file of ["styles.css", "app.js", "tools-data.js", "spicy-effects-data.js", "tool-config.js"]) {
  await copyFile(resolve(root, file), resolve(out, file));
}
await copyFile(resolve(root, "public", "favicon.png"), resolve(out, "favicon.png"));
for (const dir of ["brand", "home-assets"]) {
  await cp(resolve(root, "public", dir), resolve(out, dir), { recursive: true, force: true });
}
