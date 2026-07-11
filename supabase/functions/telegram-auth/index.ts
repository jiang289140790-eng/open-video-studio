import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_FIELDS = ["id", "first_name", "last_name", "username", "photo_url", "auth_date"];
const DEFAULT_SESSION_MAX_AGE_SECONDS = 86400;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = readEnv();
    const requestUrl = new URL(req.url);
    const authData = readTelegramAuthData(requestUrl.searchParams);

    await verifyTelegramAuth(authData, env.telegramBotToken, env.maxAgeSeconds);

    const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const telegramId = authData.get("id") || "";
    const username = authData.get("username") || "";
    const firstName = authData.get("first_name") || "";
    const lastName = authData.get("last_name") || "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || username || `Telegram ${telegramId}`;
    const email = `telegram-${telegramId}@telegram.luravyn.local`;
    const redirectTo = normalizeRedirect(requestUrl.searchParams.get("next") || "", env.allowedRedirectOrigins, env.defaultRedirectTo);

    const created = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        avatar_url: authData.get("photo_url") || "",
        telegram_id: telegramId,
        telegram_username: username,
        auth_provider: "telegram",
      },
      app_metadata: {
        provider: "telegram",
        providers: ["telegram"],
      },
    });

    if (created.error && !/already|registered|exists/i.test(created.error.message)) {
      throw new Error(`Telegram user provisioning failed: ${created.error.message}`);
    }

    const link = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo,
        data: {
          display_name: displayName,
          avatar_url: authData.get("photo_url") || "",
          telegram_id: telegramId,
          telegram_username: username,
          auth_provider: "telegram",
        },
      },
    });

    const actionLink = link.data?.properties?.action_link;
    if (link.error || !actionLink) {
      throw new Error(`Telegram session link failed: ${link.error?.message || "missing action link"}`);
    }

    return Response.redirect(actionLink, 302);
  } catch (error) {
    return json({
      error: {
        code: "TELEGRAM_AUTH_FAILED",
        message: error instanceof Error ? error.message : "Telegram auth failed.",
      },
    }, 401);
  }
});

function readEnv() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  const defaultRedirectTo = Deno.env.get("APP_URL")
    ? `${trimSlash(Deno.env.get("APP_URL") || "")}/dashboard.html`
    : "https://jiang289140790-eng.github.io/open-video-studio/dashboard.html";
  const allowedRedirectOrigins = (Deno.env.get("AUTH_ALLOWED_REDIRECT_ORIGINS") || [
    "https://jiang289140790-eng.github.io",
    "https://luravyn.com",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:4174",
    "http://localhost:4173",
  ].join(",")).split(",").map((item) => item.trim()).filter(Boolean);
  const maxAgeSeconds = Number(Deno.env.get("TELEGRAM_AUTH_MAX_AGE_SECONDS") || DEFAULT_SESSION_MAX_AGE_SECONDS);

  if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured.");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  if (!telegramBotToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  return { supabaseUrl, serviceRoleKey, telegramBotToken, defaultRedirectTo, allowedRedirectOrigins, maxAgeSeconds };
}

function readTelegramAuthData(params: URLSearchParams) {
  const data = new URLSearchParams();
  for (const key of TELEGRAM_FIELDS) {
    const value = params.get(key);
    if (value) data.set(key, value);
  }
  const hash = params.get("hash") || "";
  if (!data.get("id") || !data.get("auth_date") || !hash) {
    throw new Error("Telegram login data is incomplete.");
  }
  data.set("hash", hash);
  return data;
}

async function verifyTelegramAuth(data: URLSearchParams, botToken: string, maxAgeSeconds: number) {
  const authDate = Number(data.get("auth_date") || "0");
  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new Error("Telegram auth_date is invalid.");
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds < -300 || ageSeconds > maxAgeSeconds) {
    throw new Error("Telegram login data is expired.");
  }

  const expectedHash = data.get("hash") || "";
  const checkString = TELEGRAM_FIELDS
    .filter((key) => data.get(key))
    .sort()
    .map((key) => `${key}=${data.get(key)}`)
    .join("\n");
  const secretKey = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(botToken));
  const hmacKey = await crypto.subtle.importKey("raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(checkString));
  const actualHash = toHex(signature);
  if (!constantTimeEqual(actualHash, expectedHash)) {
    throw new Error("Telegram signature is invalid.");
  }
}

function normalizeRedirect(value: string, allowedOrigins: string[], fallback: string) {
  try {
    const url = new URL(value || fallback);
    if (allowedOrigins.some((origin) => url.origin === origin || `${url.origin}${url.pathname}`.startsWith(origin))) {
      return url.toString();
    }
  } catch {
    // fall through to fallback
  }
  return fallback;
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

function trimSlash(value: string) {
  return value.replace(/\/$/, "");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
