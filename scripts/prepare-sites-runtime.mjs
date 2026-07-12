import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const webBuild = resolve(root, "dist-web");
const runtimeRoot = resolve(root, "dist");
const clientRoot = resolve(runtimeRoot, "client");
const serverEntry = resolve(runtimeRoot, "server", "index.js");
const sourceHosting = resolve(root, ".openai", "hosting.json");
const runtimeHosting = resolve(runtimeRoot, ".openai", "hosting.json");

if (!existsSync(webBuild)) {
  throw new Error("Sites runtime preparation requires the Vite dist-web build.");
}

if (!existsSync(sourceHosting)) {
  throw new Error("Sites runtime preparation requires .openai/hosting.json.");
}

cpSync(webBuild, clientRoot, { recursive: true, force: true });
mkdirSync(dirname(serverEntry), { recursive: true });
mkdirSync(dirname(runtimeHosting), { recursive: true });
writeFileSync(runtimeHosting, readFileSync(sourceHosting));

writeFileSync(
  serverEntry,
  `const fallbackOrigin = "https://jiang289140790-eng.github.io/open-video-studio/";

function fallbackUrl(request) {
  const source = new URL(request.url);
  const relativePath = source.pathname.replace(/^\\/+/, "");
  const target = new URL(relativePath || "index.html", fallbackOrigin);
  target.search = source.search;
  return target;
}

export default {
  async fetch(request, env) {
    if (env?.ASSETS?.fetch) {
      return env.ASSETS.fetch(request);
    }

    return Response.redirect(fallbackUrl(request), 302);
  },
};
`,
  "utf8",
);

console.log("Prepared GPT Sites runtime in dist/.");
