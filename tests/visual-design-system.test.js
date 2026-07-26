import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../apps/web/styles.css", import.meta.url), "utf8");
const designSystem = readFileSync(new URL("../apps/web/design-system.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../apps/web/app.js", import.meta.url), "utf8");
const effectCards = readFileSync(new URL("../apps/web/effect-card-system.js", import.meta.url), "utf8");

test("semantic design tokens cover colors, spacing, shape and layout", () => {
  [
    "--color-background",
    "--color-surface",
    "--color-surface-elevated",
    "--color-border",
    "--color-text-primary",
    "--color-text-secondary",
    "--color-primary",
    "--color-primary-hover",
    "--color-success",
    "--color-warning",
    "--color-danger",
    "--space-4",
    "--radius-md",
    "--shadow-md",
    "--content-width",
    "--header-height",
    "--sidebar-width"
  ].forEach((token) => assert.match(css, new RegExp(token.replace("-", "\\-"))));
});

test("consumer components share one final visual layer", () => {
  assert.match(css, /Phase 11 — Luravyn consumer visual design system/);
  assert.match(css, /body\.consumer-app-page[\s\S]*\.effect-card/);
  assert.match(css, /body\.consumer-app-page[\s\S]*\.consumer-creation-card/);
  assert.match(css, /body\.consumer-app-page[\s\S]*\.credit-plan-card/);
  assert.match(css, /body\.consumer-app-page[\s\S]*\.modal-sheet/);
  assert.match(css, /body\.consumer-app-page[\s\S]*\.site-toast/);
});

test("responsive system includes mobile, tablet, desktop and wide behavior", () => {
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /@media \(min-width: 640px\) and \(max-width: 1023px\)/);
  assert.match(css, /@media \(min-width: 1440px\)/);
  assert.match(css, /overflow-x: clip/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test("accessibility layer manages focus and form errors", () => {
  assert.match(designSystem, /event\.key === "Escape"/);
  assert.match(designSystem, /event\.key !== "Tab"/);
  assert.match(designSystem, /aria-describedby/);
  assert.match(designSystem, /aria-invalid/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(app, /setupVisualDesignSystem\(\)/);
});

test("anime and illustration are explicit content styles", () => {
  assert.match(effectCards, /visual_style === "anime"/);
  assert.match(effectCards, /visual_style === "illustration"/);
  assert.match(css, /effect-card--anime/);
  assert.match(css, /effect-card__badge--illustration/);
});
