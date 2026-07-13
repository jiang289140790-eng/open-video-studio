import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, process.argv[2] || ".data/comfyui-workflows/autodl-v888");
const output = resolve(root, process.argv[3] || ".data/comfyui-headless-bundle");
const manifestPath = join(root, "templates", "comfyui-headless", "workflow-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

if (!existsSync(source)) {
  throw new Error(`Workflow source directory does not exist: ${source}`);
}

const candidates = new Map();
for (const entry of await import("node:fs/promises").then(({ readdir }) => readdir(source))) {
  if (!entry.toLowerCase().endsWith(".json")) continue;
  const id = entry.match(/^([A-Z]\d{2})/)?.[1];
  if (id) candidates.set(id, entry);
}

const sourceWorkflows = manifest.workflows.filter((workflow) => workflow.source !== "template");
const missing = sourceWorkflows.filter((workflow) => !candidates.has(workflow.id)).map((workflow) => workflow.id);
if (missing.length) throw new Error(`Missing workflow exports: ${missing.join(", ")}`);

rmSync(output, { recursive: true, force: true });
mkdirSync(join(output, "workflows"), { recursive: true });
cpSync(join(root, "templates", "comfyui-headless"), join(output, "runtime"), { recursive: true });
const copied = [];
for (const workflow of manifest.workflows.filter((entry) => entry.source === "template")) {
  const filename = workflow.filename || `${workflow.id}.json`;
  const sourcePath = join(root, "templates", "comfyui-headless", "workflows", filename);
  if (!existsSync(sourcePath)) throw new Error(`Missing template workflow: ${filename}`);
  const parsed = JSON.parse(readFileSync(sourcePath, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${filename} is not a ComfyUI API object workflow`);
  }
  cpSync(sourcePath, join(output, "workflows", filename));
  copied.push({ id: workflow.id, source: "template", target: filename });
}
for (const workflow of sourceWorkflows) {
  const filename = candidates.get(workflow.id);
  const parsed = JSON.parse(readFileSync(join(source, filename), "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${filename} is not a ComfyUI API object workflow`);
  }
  const target = `${workflow.id}.json`;
  writeFileSync(join(output, "workflows", target), JSON.stringify(parsed), "utf8");
  copied.push({ id: workflow.id, source: basename(filename), target });
}

writeFileSync(join(output, "bundle-manifest.json"), JSON.stringify({ createdAt: new Date().toISOString(), copied }, null, 2), "utf8");
console.log(`Prepared private headless bundle at ${output} with ${copied.length} workflows.`);
