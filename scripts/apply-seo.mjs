import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const webRoot = resolve(root, "apps", "web");
const publicRoot = join(webRoot, "public");
const productionOrigin = "https://luravyn.com";
const githubOrigin = "https://jiang289140790-eng.github.io/open-video-studio";
const today = "2026-07-11";

const locales = [
  { code: "zh-CN", path: "zh", label: "中文" },
  { code: "en", path: "en", label: "English" },
  { code: "ja", path: "ja", label: "日本語" },
  { code: "ko", path: "ko", label: "한국어" },
];

const pages = [
  {
    file: "index.html",
    slug: "",
    priority: "1.0",
    changefreq: "weekly",
    index: true,
    titles: {
      "zh-CN": "Luravyn | AI 视频创作平台",
      en: "Luravyn | AI Video Creation Platform",
      ja: "Luravyn | AI動画制作プラットフォーム",
      ko: "Luravyn | AI 비디오 제작 플랫폼",
    },
    descriptions: {
      "zh-CN": "用一致角色生成 AI 图片、视频、提示词和可复用创作资产。",
      en: "Create AI images, videos, prompts, and reusable creative assets with consistent characters.",
      ja: "一貫したキャラクターでAI画像、動画、プロンプト、再利用可能な制作アセットを作成できます。",
      ko: "일관된 캐릭터로 AI 이미지, 비디오, 프롬프트와 재사용 가능한 창작 자산을 만드세요.",
    },
  },
  {
    file: "gallery.html",
    slug: "gallery",
    priority: "0.9",
    changefreq: "daily",
    index: true,
    titles: {
      "zh-CN": "作品探索 | Luravyn",
      en: "Explore AI Creations | Luravyn",
      ja: "AI作品を探索 | Luravyn",
      ko: "AI 작품 탐색 | Luravyn",
    },
    descriptions: {
      "zh-CN": "探索 AI 图片、视频、角色、提示词和可复用资产示例。",
      en: "Explore AI images, videos, characters, prompts, and reusable asset examples.",
      ja: "AI画像、動画、キャラクター、プロンプト、再利用可能なアセット例を探索できます。",
      ko: "AI 이미지, 비디오, 캐릭터, 프롬프트와 재사용 가능한 자산 예시를 탐색하세요.",
    },
  },
  {
    file: "generate.html",
    slug: "app/generate",
    priority: "0.95",
    changefreq: "weekly",
    index: true,
    titles: {
      "zh-CN": "AI 图片生成器 | Luravyn",
      en: "AI Image Generator | Luravyn",
      ja: "AI画像生成 | Luravyn",
      ko: "AI 이미지 생성기 | Luravyn",
    },
    descriptions: {
      "zh-CN": "输入提示词，选择角色和风格，生成可保存到资产库的 AI 图片。",
      en: "Enter a prompt, choose a character and style, and generate AI images saved to your asset library.",
      ja: "プロンプト、キャラクター、スタイルを選び、アセットライブラリに保存できるAI画像を生成します。",
      ko: "프롬프트, 캐릭터와 스타일을 선택해 자산 라이브러리에 저장되는 AI 이미지를 생성하세요.",
    },
  },
  {
    file: "image-to-video.html",
    slug: "app/image-to-video",
    priority: "0.9",
    changefreq: "weekly",
    index: true,
    titles: {
      "zh-CN": "图片转视频 | Luravyn",
      en: "Image to Video AI | Luravyn",
      ja: "画像から動画へ | Luravyn",
      ko: "이미지 투 비디오 | Luravyn",
    },
    descriptions: {
      "zh-CN": "把参考图片转成 AI 视频，并保留提示词、角色和生成历史。",
      en: "Turn reference images into AI videos while preserving prompts, characters, and generation history.",
      ja: "参照画像をAI動画に変換し、プロンプト、キャラクター、生成履歴を保存します。",
      ko: "참조 이미지를 AI 비디오로 바꾸고 프롬프트, 캐릭터와 생성 기록을 보관하세요.",
    },
  },
  {
    file: "characters.html",
    slug: "app/characters",
    priority: "0.85",
    changefreq: "weekly",
    index: true,
    titles: {
      "zh-CN": "AI 角色管理 | Luravyn",
      en: "AI Character Management | Luravyn",
      ja: "AIキャラクター管理 | Luravyn",
      ko: "AI 캐릭터 관리 | Luravyn",
    },
    descriptions: {
      "zh-CN": "创建和管理可复用 AI 角色、封面、标签、记忆和一致性信号。",
      en: "Create and manage reusable AI characters, covers, tags, memory, and consistency signals.",
      ja: "再利用可能なAIキャラクター、カバー、タグ、記憶、一貫性シグナルを管理します。",
      ko: "재사용 가능한 AI 캐릭터, 커버, 태그, 메모리와 일관성 신호를 관리하세요.",
    },
  },
  {
    file: "pricing.html",
    slug: "pricing",
    priority: "0.85",
    changefreq: "weekly",
    index: true,
    titles: {
      "zh-CN": "购买积分 | Luravyn",
      en: "Buy AI Credits | Luravyn",
      ja: "AIクレジットを購入 | Luravyn",
      ko: "AI 크레딧 구매 | Luravyn",
    },
    descriptions: {
      "zh-CN": "购买 Luravyn 积分，用于 AI 图片、视频、角色和可复用资产生成。",
      en: "Buy Luravyn credits for AI images, videos, characters, and reusable asset generation.",
      ja: "AI画像、動画、キャラクター、再利用可能なアセット生成に使えるLuravynクレジットを購入できます。",
      ko: "AI 이미지, 비디오, 캐릭터와 재사용 가능한 자산 생성에 사용할 Luravyn 크레딧을 구매하세요.",
    },
  },
  {
    file: "free-coins.html",
    slug: "free-coins",
    priority: "0.8",
    changefreq: "weekly",
    index: true,
    titles: {
      "zh-CN": "免费硬币 | Luravyn",
      en: "Free AI Credits | Luravyn",
      ja: "無料AIクレジット | Luravyn",
      ko: "무료 AI 크레딧 | Luravyn",
    },
    descriptions: {
      "zh-CN": "通过每日签到和推荐好友领取免费 AI 创作积分。",
      en: "Earn free AI creation credits through daily check-ins and referrals.",
      ja: "毎日のチェックインと紹介で無料AI制作クレジットを獲得できます。",
      ko: "매일 출석과 추천으로 무료 AI 제작 크레딧을 받으세요.",
    },
  },
  {
    file: "blog.html",
    slug: "blog",
    priority: "0.65",
    changefreq: "weekly",
    index: true,
    titles: {
      "zh-CN": "AI 创作博客 | Luravyn",
      en: "AI Creation Blog | Luravyn",
      ja: "AI制作ブログ | Luravyn",
      ko: "AI 창작 블로그 | Luravyn",
    },
    descriptions: {
      "zh-CN": "阅读 AI 视频、角色一致性、提示词和创作工作流文章。",
      en: "Read about AI video, character consistency, prompts, and creative workflows.",
      ja: "AI動画、キャラクター一貫性、プロンプト、制作ワークフローについて読めます。",
      ko: "AI 비디오, 캐릭터 일관성, 프롬프트와 창작 워크플로를 읽어보세요.",
    },
  },
  {
    file: "terms.html",
    slug: "terms",
    priority: "0.3",
    changefreq: "monthly",
    index: true,
    titles: {
      "zh-CN": "服务条款 | Luravyn",
      en: "Terms of Service | Luravyn",
      ja: "利用規約 | Luravyn",
      ko: "서비스 약관 | Luravyn",
    },
    descriptions: {
      "zh-CN": "查看 Luravyn 服务条款和使用规则。",
      en: "Review Luravyn terms of service and usage rules.",
      ja: "Luravynの利用規約と使用ルールを確認できます。",
      ko: "Luravyn 서비스 약관과 이용 규칙을 확인하세요.",
    },
  },
  {
    file: "privacy.html",
    slug: "privacy",
    priority: "0.3",
    changefreq: "monthly",
    index: true,
    titles: {
      "zh-CN": "隐私政策 | Luravyn",
      en: "Privacy Policy | Luravyn",
      ja: "プライバシーポリシー | Luravyn",
      ko: "개인정보 처리방침 | Luravyn",
    },
    descriptions: {
      "zh-CN": "了解 Luravyn 如何处理账号、资产和生成数据。",
      en: "Learn how Luravyn handles account, asset, and generation data.",
      ja: "Luravynがアカウント、アセット、生成データをどのように扱うかを確認できます。",
      ko: "Luravyn이 계정, 자산과 생성 데이터를 처리하는 방식을 확인하세요.",
    },
  },
  {
    file: "cookie.html",
    slug: "cookie",
    priority: "0.25",
    changefreq: "monthly",
    index: true,
    titles: {
      "zh-CN": "Cookie 政策 | Luravyn",
      en: "Cookie Policy | Luravyn",
      ja: "Cookieポリシー | Luravyn",
      ko: "쿠키 정책 | Luravyn",
    },
    descriptions: {
      "zh-CN": "管理 Luravyn 的 Cookie 偏好和网站体验设置。",
      en: "Manage Luravyn cookie preferences and site experience settings.",
      ja: "LuravynのCookie設定とサイト体験設定を管理できます。",
      ko: "Luravyn 쿠키 환경설정과 사이트 경험 설정을 관리하세요.",
    },
  },
  {
    file: "signin.html",
    slug: "login",
    index: false,
    titles: {
      "zh-CN": "登录 | Luravyn",
      en: "Sign in | Luravyn",
      ja: "ログイン | Luravyn",
      ko: "로그인 | Luravyn",
    },
    descriptions: {
      "zh-CN": "登录 Luravyn 以保存作品、管理积分和复用资产。",
      en: "Sign in to Luravyn to save creations, manage credits, and reuse assets.",
      ja: "作品の保存、クレジット管理、アセット再利用のためにLuravynにログインします。",
      ko: "작품 저장, 크레딧 관리와 자산 재사용을 위해 Luravyn에 로그인하세요.",
    },
  },
];

const noindexFiles = [
  "dashboard.html",
  "assets.html",
  "history.html",
  "my-creations.html",
  "admin.html",
  "settings.html",
  "accounts.html",
  "campaigns.html",
  "ai-studio.html",
  "pipeline.html",
  "queue.html",
  "calendar.html",
  "analytics.html",
  "publishing.html",
  "automation.html",
  "share.html",
];

for (const page of pages) {
  updateHtmlHead(join(webRoot, page.file), page, page.index);
}
for (const file of noindexFiles) {
  const path = join(webRoot, file);
  if (!exists(path)) continue;
  const fallback = {
    file,
    slug: file.replace(/\.html$/, ""),
    titles: { "zh-CN": titleFromHtml(path), en: titleFromHtml(path), ja: titleFromHtml(path), ko: titleFromHtml(path) },
    descriptions: {
      "zh-CN": "Luravyn 登录后产品页面。",
      en: "A signed-in Luravyn product page.",
      ja: "ログイン後に利用するLuravyn製品ページです。",
      ko: "로그인 후 사용하는 Luravyn 제품 페이지입니다.",
    },
  };
  updateHtmlHead(path, fallback, false);
}
writeRobots();
writeSitemap();
writeLocalizedAliases();

function updateHtmlHead(path, page, shouldIndex) {
  if (!exists(path)) return;
  let html = readFileSync(path, "utf8");
  const title = page.titles["zh-CN"];
  const description = page.descriptions["zh-CN"];
  const canonical = `${productionOrigin}/zh${urlPath(page.slug)}`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceOrInsertMeta(html, "description", description);
  html = removeSeoTags(html);
  const tags = [
    `<link rel="canonical" href="${canonical}">`,
    ...locales.map((locale) => `<link rel="alternate" hreflang="${locale.code}" href="${productionOrigin}/${locale.path}${urlPath(page.slug)}">`),
    `<link rel="alternate" hreflang="x-default" href="${productionOrigin}/en${urlPath(page.slug)}">`,
    `<meta name="robots" content="${shouldIndex ? "index,follow" : "noindex,follow"}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Luravyn">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${productionOrigin}/brand/luravyn-logo-hero.png">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="theme-color" content="#111111">`,
  ].join("\n    ");
  html = html.replace(/(\s*<link rel="stylesheet" href="\.\/styles\.css">)/, `\n    ${tags}$1`);
  writeFileSync(path, html, "utf8");
}

function replaceOrInsertMeta(html, name, content) {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `<meta name="${name}" content="${escaped}">`);
  }
  return html.replace(/<title>[\s\S]*?<\/title>/i, (match) => `${match}\n    <meta name="${name}" content="${escaped}">`);
}

function removeSeoTags(html) {
  return html
    .replace(/\s*<link rel="canonical"[^>]*>/gi, "")
    .replace(/\s*<link rel="alternate"[^>]*>/gi, "")
    .replace(/\s*<meta name="robots"[^>]*>/gi, "")
    .replace(/\s*<meta property="og:[^"]+"[^>]*>/gi, "")
    .replace(/\s*<meta name="twitter:[^"]+"[^>]*>/gi, "")
    .replace(/\s*<meta name="theme-color"[^>]*>/gi, "");
}

function writeRobots() {
  const content = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin.html",
    "Disallow: /dashboard.html",
    "Disallow: /assets.html",
    "Disallow: /history.html",
    "Disallow: /my-creations.html",
    "Disallow: /settings.html",
    "Disallow: /accounts.html",
    "Disallow: /zh/admin/",
    "Disallow: /zh/dashboard/",
    "Disallow: /zh/assets/",
    "Disallow: /zh/history/",
    "Disallow: /zh/my-creations/",
    "Disallow: /zh/settings/",
    "Disallow: /zh/accounts/",
    "",
    `Sitemap: ${productionOrigin}/sitemap.xml`,
    `Sitemap: ${githubOrigin}/sitemap.xml`,
    "",
  ].join("\n");
  writeFileSync(join(publicRoot, "robots.txt"), content, "utf8");
}

function writeSitemap() {
  const entries = pages.filter((page) => page.index).flatMap((page) => {
    return locales.map((locale) => {
      const loc = `${productionOrigin}/${locale.path}${urlPath(page.slug)}`;
      const alternates = locales.map((alternate) => {
        return `    <xhtml:link rel="alternate" hreflang="${alternate.code}" href="${productionOrigin}/${alternate.path}${urlPath(page.slug)}" />`;
      }).join("\n");
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        alternates,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${productionOrigin}/en${urlPath(page.slug)}" />`,
        "  </url>",
      ].join("\n");
    });
  }).join("\n");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    entries,
    "</urlset>",
    "",
  ].join("\n");
  writeFileSync(join(publicRoot, "sitemap.xml"), xml, "utf8");
}

function writeLocalizedAliases() {
  for (const locale of locales) {
    for (const page of pages) {
      const dir = page.slug ? join(publicRoot, locale.path, ...page.slug.split("/")) : join(publicRoot, locale.path);
      mkdirSync(dir, { recursive: true });
      const target = relativeTarget(locale.path, page.file, page.slug);
      const title = page.titles[locale.code];
      const description = page.descriptions[locale.code];
      const canonical = `${productionOrigin}/${locale.path}${urlPath(page.slug)}`;
      const html = [
        "<!doctype html>",
        `<html lang="${locale.code}" data-target="${target}" data-locale="${locale.code}">`,
        "  <head>",
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        `    <title>${escapeHtml(title)}</title>`,
        `    <meta name="description" content="${escapeHtml(description)}">`,
        `    <link rel="canonical" href="${canonical}">`,
        ...locales.map((alternate) => `    <link rel="alternate" hreflang="${alternate.code}" href="${productionOrigin}/${alternate.path}${urlPath(page.slug)}">`),
        `    <link rel="alternate" hreflang="x-default" href="${productionOrigin}/en${urlPath(page.slug)}">`,
        `    <meta name="robots" content="${page.index ? "index,follow" : "noindex,follow"}">`,
        '    <link rel="icon" type="image/png" href="/favicon.png">',
        `    <meta http-equiv="refresh" content="0; url=${target}">`,
        "  </head>",
        "  <body>",
        `    <a href="${target}">${escapeHtml(entryText(locale.code))}</a>`,
        `    <script src="${redirectPath(page.slug)}"></script>`,
        "  </body>",
        "</html>",
        "",
      ].join("\n");
      writeFileSync(join(dir, "index.html"), html, "utf8");
    }
  }
}

function relativeTarget(localePath, file, slug) {
  const depth = slug ? slug.split("/").length : 0;
  const prefix = "../".repeat(depth + 1);
  return `${prefix}${file}`;
}

function redirectPath(slug) {
  const depth = slug ? slug.split("/").length : 0;
  return `${"../".repeat(depth)}redirect.js`;
}

function urlPath(slug) {
  return slug ? `/${slug}/` : "/";
}

function exists(path) {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}

function titleFromHtml(path) {
  const html = readFileSync(path, "utf8");
  return html.match(/<title>(.*?)<\/title>/i)?.[1] || "Luravyn";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function entryText(locale) {
  if (locale === "zh-CN") return "进入 Luravyn";
  if (locale === "ja") return "Luravyn を開く";
  if (locale === "ko") return "Luravyn 열기";
  return "Open Luravyn";
}
