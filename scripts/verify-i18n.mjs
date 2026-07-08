import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "apps", "web", "app.js");
if (!existsSync(appPath)) fail("apps/web/app.js not found");

const source = readFileSync(appPath, "utf8");
const locales = evaluateConst("I18N_LOCALES");
const coreTerms = evaluateConst("I18N_CORE_TERMS");
const productTerms = evaluateConst("I18N_PRODUCT_TERMS", { I18N_CORE_TERMS: coreTerms });
const messages = evaluateConst("I18N_MESSAGES");
const attributeMessages = evaluateConst("I18N_ATTRIBUTE_MESSAGES");

const expectedLocales = ["zh-CN", "en", "ja", "ko"];
const coverage = {};
const missing = {};
for (const locale of expectedLocales) {
  const dictionary = messages[locale] || {};
  const translated = locale === "zh-CN"
    ? productTerms.length
    : productTerms.filter((term) => dictionary[term]).length;
  coverage[locale] = Math.round((translated / productTerms.length) * 100);
  missing[locale] = locale === "zh-CN" ? [] : productTerms.filter((term) => !dictionary[term]);
}

const attributeCoverage = {};
for (const locale of ["en", "ja", "ko"]) {
  attributeCoverage[locale] = Object.keys(attributeMessages[locale] || {}).length;
}

const report = {
  ok: true,
  localeCount: Object.keys(locales).length,
  expectedLocales,
  coreTermCount: coreTerms.length,
  productTermCount: productTerms.length,
  coverage,
  missing,
  attributeCoverage,
  checks: {
    hasProductTerms: Array.isArray(productTerms) && productTerms.length >= 50,
    localesPresent: expectedLocales.every((locale) => Boolean(locales[locale])),
    coverageThresholdMet: ["en", "ja", "ko"].every((locale) => coverage[locale] >= 95),
    attributesPresent: ["en", "ja", "ko"].every((locale) => attributeCoverage[locale] >= 4),
    runtimeUsesProductCoverage: source.includes("I18N_PRODUCT_TERMS.filter"),
    noMojibakeMarkers: !/(閳|鈶|鈧|脙|鐧诲綍|鍥惧儚|绉垎|浣犳槸|璇疯瘑|銆)/.test(source),
  },
};
report.ok = Object.values(report.checks).every(Boolean);

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;

function evaluateConst(name, context = {}) {
  const expression = extractConstExpression(name);
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);
    return Function(...keys, `return (${expression});`)(...values);
  } catch (error) {
    throw new Error(`Could not evaluate ${name}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

function extractConstExpression(name) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`${name} not found`);
  const expressionStart = start + marker.length;
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let i = expressionStart; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[" || char === "{" || char === "(") depth += 1;
    if (char === "]" || char === "}" || char === ")") depth -= 1;
    if (depth === 0 && char === ";") return source.slice(expressionStart, i);
  }
  throw new Error(`${name} expression is not terminated`);
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, message }, null, 2));
  process.exit(1);
}
