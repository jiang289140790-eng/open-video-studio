import { cp, copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("apps/web");
const out = resolve("dist-web");
await mkdir(out, { recursive: true });
for (const file of ["styles.css", "app.js", "favicon.png"]) {
  await copyFile(resolve(root, file), resolve(out, file));
}
for (const dir of ["brand", "home-assets"]) {
  await cp(resolve(root, dir), resolve(out, dir), { recursive: true, force: true });
}
