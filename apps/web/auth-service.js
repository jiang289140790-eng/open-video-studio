import { PRODUCTION_SITE_URL, getSupabaseClient, isSupabaseConfigured, supabase } from "./supabase-client.js";

const PROVIDERS = new Set(["google", "discord", "x"]);

function normalizeProvider(provider) {
  const normalized = String(provider || "").trim().toLowerCase();
  if (normalized === "twitter") return "x";
  if (!PROVIDERS.has(normalized)) throw new Error(`Unsupported OAuth provider: ${normalized || "unknown"}`);
  return normalized;
}

export function getProductionRedirectUrl(returnTarget = "app.html") {
  const productionBase = new URL(PRODUCTION_SITE_URL);
  let candidate;
  try {
    candidate = new URL(String(returnTarget || "app.html"), productionBase);
  } catch {
    candidate = new URL("app.html", productionBase);
  }
  if (candidate.origin !== productionBase.origin || !candidate.pathname.startsWith(productionBase.pathname)) {
    return new URL("app.html", productionBase).href;
  }
  return candidate.href;
}

export async function loginWithProvider(provider, returnTarget = "app.html") {
  const client = getSupabaseClient();
  return client.auth.signInWithOAuth({
    provider: normalizeProvider(provider),
    options: { redirectTo: getProductionRedirectUrl(returnTarget) }
  });
}

export function loginGoogle(returnTarget) {
  return loginWithProvider("google", returnTarget);
}

export function loginDiscord(returnTarget) {
  return loginWithProvider("discord", returnTarget);
}

export function loginTwitter(returnTarget) {
  return loginWithProvider("x", returnTarget);
}

export async function logout() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut({ scope: "local" });
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user || null;
}

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session || null;
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: null } };
  return supabase.auth.onAuthStateChange(callback);
}

export { isSupabaseConfigured };

if (typeof window !== "undefined") {
  window.openVideoStudioAuth = Object.freeze({
    loginGoogle,
    loginDiscord,
    loginTwitter,
    logout,
    getCurrentUser,
    getSession
  });
}
