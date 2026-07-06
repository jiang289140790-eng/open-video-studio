import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const webRoot = join(process.cwd(), "apps", "web");

const requiredPages = [
  "index.html",
  "gallery.html",
  "generate.html",
  "characters.html",
  "assets.html",
  "history.html",
  "dashboard.html",
  "pricing.html",
  "signin.html",
  "share.html"
];

function readPage(file: string): string {
  return readFileSync(join(webRoot, file), "utf8");
}

describe("MVP static frontend", () => {
  it("contains every required product surface", () => {
    for (const page of requiredPages) {
      const pagePath = join(webRoot, page);
      assert.equal(existsSync(pagePath), true, `${page} should exist`);
      const html = readPage(page);
      assert.match(html, /<title>.+<\/title>/);
      assert.ok(html.includes("./styles.css"), `${page} should reference shared styles`);
    }
  });

  it("keeps required commercial navigation items available", () => {
    const combined = requiredPages.map(readPage).join("\n");
    for (const item of ["Explore", "Generate", "Characters", "Assets", "Pricing", "Dashboard", "History", "Credits", "Account"]) {
      assert.ok(combined.includes(item), `navigation should include ${item}`);
    }
  });

  it("contains required conversion CTAs", () => {
    const combined = requiredPages.map(readPage).join("\n");
    for (const cta of ["Start creating", "Generate your first scene", "Create character", "Quick generate", "Choose Studio", "Generate similar"]) {
      assert.ok(combined.includes(cta), `CTA should exist: ${cta}`);
    }
  });

  it("contains visual-first gallery and dashboard sections", () => {
    const gallery = readPage("gallery.html");
    const dashboard = readPage("dashboard.html");
    assert.ok(gallery.includes("masonry-gallery"));
    assert.ok(gallery.includes("Trending"));
    assert.ok(gallery.includes("Generate Similar"));
    assert.ok(gallery.includes("Copy Prompt"));
    assert.ok(gallery.includes("Share"));
    assert.ok(dashboard.includes("Credit"));
    assert.ok(dashboard.includes("Recent generations"));
    assert.ok(dashboard.includes("Active jobs"));
    assert.ok(dashboard.includes("Saved characters"));
    assert.ok(dashboard.includes("Share links"));
  });

  it("preserves premium AI SaaS positioning over internal-tool language", () => {
    const combined = requiredPages.map(readPage).join("\n");
    assert.ok(combined.includes("premium AI creation platform"));
    assert.ok(combined.includes("Explore what you can create"));
    assert.ok(combined.includes("Create AI videos with consistent characters"));
    assert.ok(combined.includes("Start generating free"));
    assert.ok(combined.includes("Generate Studio"));
    assert.ok(combined.includes("Character selector"));
    assert.equal(combined.includes("PAGE-003"), false);
    assert.equal(combined.includes("internal engineering"), false);
    assert.equal(combined.includes("Fake worker"), false);
  });

  it("keeps static product files ASCII-safe to avoid encoding mojibake", () => {
    const staticFiles = [...requiredPages, "styles.css", "app.js"];
    for (const file of staticFiles) {
      const content = readPage(file);
      assert.equal(/[^\x00-\x7F]/.test(content), false, `${file} should not contain non-ASCII text`);
      assert.equal(/鈥|⑩|€|�|Â|Ã/.test(content), false, `${file} should not contain mojibake markers`);
    }
  });
});
