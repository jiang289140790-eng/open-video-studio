import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const webRoot = join(root, "apps", "web");
const publicRoot = join(webRoot, "public");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function readPublic(path: string) {
  return readFileSync(join(publicRoot, path), "utf8");
}

describe("SEO and localized static routes", () => {
  it("ships generated sitemap, robots, and the repeatable SEO generator", () => {
    assert.equal(existsSync(join(root, "scripts", "apply-seo.mjs")), true);
    assert.equal(existsSync(join(publicRoot, "sitemap.xml")), true);
    assert.equal(existsSync(join(publicRoot, "robots.txt")), true);

    const sitemap = readPublic("sitemap.xml");
    assert.ok(sitemap.includes("https://luravyn.com/zh/"));
    assert.ok(sitemap.includes("https://luravyn.com/en/"));
    assert.ok(sitemap.includes("https://luravyn.com/ja/"));
    assert.ok(sitemap.includes("https://luravyn.com/ko/"));
    assert.ok(sitemap.includes('hreflang="x-default"'));

    const robots = readPublic("robots.txt");
    assert.ok(robots.includes("Sitemap: https://luravyn.com/sitemap.xml"));
    assert.ok(robots.includes("Disallow: /admin.html"));
    assert.ok(robots.includes("Disallow: /dashboard.html"));
  });

  it("adds canonical, hreflang, and robots metadata to public and private pages", () => {
    for (const page of ["index.html", "gallery.html", "generate.html", "pricing.html"]) {
      const html = read(`apps/web/${page}`);
      assert.ok(html.includes('rel="canonical"'), `${page} should define canonical`);
      assert.ok(html.includes('hreflang="zh-CN"'), `${page} should define zh-CN hreflang`);
      assert.ok(html.includes('hreflang="en"'), `${page} should define en hreflang`);
      assert.ok(html.includes('hreflang="ja"'), `${page} should define ja hreflang`);
      assert.ok(html.includes('hreflang="ko"'), `${page} should define ko hreflang`);
      assert.ok(html.includes('property="og:title"'), `${page} should define Open Graph title`);
    }

    for (const page of ["dashboard.html", "assets.html", "history.html", "admin.html"]) {
      const html = read(`apps/web/${page}`);
      assert.ok(html.includes('name="robots" content="noindex,follow"'), `${page} should stay noindex`);
    }
  });

  it("creates localized alias pages for indexed public routes", () => {
    const localeRouteCount = new Map<string, number>();
    for (const locale of ["zh", "en", "ja", "ko"]) {
      const localeRoot = join(publicRoot, locale);
      assert.equal(existsSync(localeRoot), true, `${locale} alias root should exist`);
      const files = readdirSync(localeRoot, { recursive: true }).filter((entry) => String(entry).endsWith("index.html"));
      localeRouteCount.set(locale, files.length);
      assert.ok(files.length >= 10, `${locale} should expose the public SEO route set`);
    }

    assert.ok((localeRouteCount.get("zh") ?? 0) >= (localeRouteCount.get("en") ?? 0));
    assert.equal(localeRouteCount.get("en"), localeRouteCount.get("ja"));
    assert.equal(localeRouteCount.get("en"), localeRouteCount.get("ko"));

    const englishGenerate = readPublic("en/app/generate/index.html");
    assert.ok(englishGenerate.includes('lang="en"'));
    assert.ok(englishGenerate.includes('rel="canonical" href="https://luravyn.com/en/app/generate/"'));
    assert.ok(englishGenerate.includes("AI Image Generator"));
  });
});

describe("mobile visual safety", () => {
  it("keeps narrow viewports from overflowing key product surfaces", () => {
    const styles = read("apps/web/styles.css");
    for (const expected of [
      "@media (max-width: 720px)",
      "body.tool-layout .studio-shell",
      "width: calc(100vw - 28px)",
      ".studio-panel { width: 100%; padding: 18px; }",
      ".dashboard-grid .wide { grid-column: auto; }",
      ".dashboard-row button",
      '.creative-preview[data-preview-ratio="9:16"]',
      '.generated-output-player[data-generated-ratio="9:16"]',
      "min-height: min(62vh, 560px)",
      "375px",
      "390px",
      "412px",
      "768px",
    ]) {
      assert.ok(styles.includes(expected), `styles should include mobile guard: ${expected}`);
    }
  });
});
