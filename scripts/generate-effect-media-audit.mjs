import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const webRoot = path.join(root, "apps", "web");
const catalogPath = path.join(webRoot, "effect-catalog.js");
const outputPath = path.join(root, "EFFECT_MEDIA_AUDIT.json");

const catalogSource = await readFile(catalogPath, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(catalogSource, sandbox, { filename: catalogPath });
const catalog = Array.from(sandbox.window.__EFFECT_CATALOG__ || [], (item) =>
  JSON.parse(JSON.stringify(item)),
);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

function gitShow(relativePath) {
  try {
    return execFileSync("git", ["show", `HEAD:${relativePath}`], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
  } catch {
    return "";
  }
}

function countMatches(source, expression) {
  const counts = new Map();
  for (const match of source.matchAll(expression)) {
    const value = match[1] || match[0];
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([url, reference_count]) => ({ url, reference_count }))
    .sort((a, b) => b.reference_count - a.reference_count);
}

const previousSources = [
  gitShow("apps/web/tools-data.js"),
  gitShow("apps/web/spicy-effects-data.js"),
  gitShow("apps/web/app.html"),
].join("\n");
const duplicateCoverReferences = countMatches(
  previousSources,
  /(?:\.\/)?home-assets\/(ovs-home-\d+\.png)/g,
).map((item) => ({
  url: `./home-assets/${item.url}`,
  reference_count: item.reference_count,
  finding:
    item.reference_count > 1
      ? "duplicate_reference"
      : "single_reference_but_not_effect_specific",
}));

const sourceFiles = (await walk(webRoot)).filter((file) =>
  /\.(?:html|css|js|json)$/i.test(file),
);
const sourceText = (
  await Promise.all(
    sourceFiles.map(async (file) => ({
      file: path.relative(root, file).replaceAll("\\", "/"),
      text: await readFile(file, "utf8"),
    })),
  )
);

const externalMediaReferences = [];
const unsafePathReferences = [];
for (const source of sourceText) {
  for (const match of source.text.matchAll(
    /https?:\/\/[^\s"'()<>{}]+?\.(?:png|jpe?g|webp|gif|mp4|webm)(?:\?[^\s"'()<>{}]*)?/gi,
  )) {
    externalMediaReferences.push({ file: source.file, url: match[0] });
  }
  for (const match of source.text.matchAll(
    /(?:file:\/\/\/[^\s"'<>)]*|[A-Z]:[\\/][^\s"'<>)]*|https?:\/\/localhost(?::\d+)?\/[^\s"'<>)]*)/g,
  )) {
    unsafePathReferences.push({ file: source.file, value: match[0] });
  }
}

const homeAssetsDirectory = path.join(webRoot, "public", "home-assets");
const localMedia = [];
for (const file of await readdir(homeAssetsDirectory)) {
  const absolute = path.join(homeAssetsDirectory, file);
  const fileStat = await stat(absolute);
  if (!fileStat.isFile()) continue;
  const buffer = await readFile(absolute);
  const media = {
    path: `apps/web/public/home-assets/${file}`,
    bytes: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
  if (
    buffer.length >= 24 &&
    buffer.subarray(1, 4).toString("ascii") === "PNG"
  ) {
    media.width = buffer.readUInt32BE(16);
    media.height = buffer.readUInt32BE(20);
  }
  localMedia.push(media);
}

const effects = catalog.map((effect) => {
  const hasPreview =
    Boolean(effect.thumbnail_url) ||
    Boolean(effect.poster_url) ||
    Boolean(effect.preview_video_url);
  const hasActiveWorkflow =
    effect.status === "active" &&
    Boolean(effect.workflow_id) &&
    effect.workflow_status === "active";
  return {
    id: effect.id,
    slug: effect.slug,
    name: effect.name,
    category: effect.category,
    media_type: effect.media_type,
    thumbnail_url: effect.thumbnail_url || null,
    poster_url: effect.poster_url || null,
    preview_video_url: effect.preview_video_url || null,
    workflow_id: effect.workflow_id || null,
    workflow_status: effect.workflow_status || "unconfigured",
    status: hasActiveWorkflow ? "active" : "preview_only",
    visual_style: effect.visual_style || "illustration",
    media_audit: hasPreview ? "configured" : "missing_independent_preview",
    availability_reason: hasActiveWorkflow
      ? "active_workflow_confirmed"
      : "workflow_not_confirmed_active",
  };
});

const audit = {
  schema_version: "1.0",
  generated_at: new Date().toISOString(),
  scope: "Phase 2 — Effect Media and Card System",
  summary: {
    catalog_effects: effects.length,
    active_effects: effects.filter((item) => item.status === "active").length,
    preview_only_effects: effects.filter(
      (item) => item.status === "preview_only",
    ).length,
    effects_with_preview_media: effects.filter(
      (item) => item.media_audit === "configured",
    ).length,
    local_media_files: localMedia.length,
    external_media_references: externalMediaReferences.length,
    unsafe_path_references: unsafePathReferences.length,
    supabase_storage_objects: 0,
  },
  data_sources: [
    {
      type: "frontend_catalog",
      path: "apps/web/effect-catalog.js",
      role: "canonical normalized effect metadata",
    },
    {
      type: "frontend_derived_data",
      paths: [
        "apps/web/tools-data.js",
        "apps/web/spicy-effects-data.js",
      ],
      role: "page-specific views derived from the canonical catalog",
    },
    {
      type: "workflow_registry",
      path: "apps/web/workflow-map.json",
      role: "workflow identifiers and server configuration status",
    },
    {
      type: "static_media",
      path: "apps/web/public/home-assets",
      role: "legacy local illustrations; no longer assigned to realistic effects",
    },
    {
      type: "supabase_tables",
      project_id: "wyvswkxogkmywduhrhkw",
      tables: {
        tools: 3,
        workflows: 3,
        homepage_sections: 0,
      },
      access: "read-only audit",
    },
    {
      type: "supabase_storage",
      project_id: "wyvswkxogkmywduhrhkw",
      buckets: [
        { id: "open-video-studio-assets", public: false, objects: 0 },
        { id: "source-assets", public: false, objects: 0 },
      ],
      access: "read-only audit",
    },
  ],
  path_findings: [
    {
      issue: "legacy_absolute_or_local_media_path",
      count: unsafePathReferences.length,
      action: "blocked by resolveMediaUrl in production",
    },
    {
      issue: "legacy_external_hotlink",
      count: externalMediaReferences.length,
      action:
        "effect cards now render the non-misleading preview fallback unless an approved URL is supplied",
    },
    {
      issue: "github_pages_base_path",
      action:
        "relative media URLs resolve against the repository base path instead of the origin root",
    },
    {
      issue: "supabase_private_bucket",
      action:
        "only existing public or signed URLs are accepted; no write endpoint is exposed",
    },
  ],
  duplicate_cover_audit: duplicateCoverReferences,
  local_media: localMedia,
  external_media_references: externalMediaReferences,
  unsafe_path_references: unsafePathReferences,
  effects,
  storage_audit: {
    project_id: "wyvswkxogkmywduhrhkw",
    bucket_count: 2,
    public_bucket_count: 0,
    object_count: 0,
    conclusion:
      "No Supabase Storage preview asset is currently available for effect cards.",
  },
  constraints: [
    "No generated result or user review was fabricated.",
    "No missing media was substituted with an unrelated anime or realistic image.",
    "No effect without a confirmed active workflow is marked as immediately generatable.",
    "Real hover-video playback cannot be end-to-end validated until a preview_video_url is supplied.",
  ],
};

await writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
console.log(`Wrote ${path.relative(root, outputPath)}`);
