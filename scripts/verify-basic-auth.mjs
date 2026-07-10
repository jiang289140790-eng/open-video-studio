import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

const report = {
  ok: false,
  endpoint: supabaseUrl,
  configured: Boolean(supabaseUrl && anonKey && serviceRoleKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(anonKey) && !isPlaceholder(serviceRoleKey)),
  register: { ok: false, publicSignupOk: false, fallbackAdminCreated: false, userId: "", needsEmailConfirmation: false, error: "" },
  login: { ok: false, session: false, error: "" },
  restore: { ok: false, userReadable: false, error: "" },
  logout: { ok: false, sessionCleared: false, error: "" },
  cleanupComplete: false,
  error: "",
};

if (!report.configured) {
  report.error = "missing_supabase_environment";
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const userClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const email = `ovs-auth-${suffix}@openvideostudio.app`;
const password = `Auth-${crypto.randomUUID()}!`;
let userId = "";

try {
  const signup = await userClient.auth.signUp({
    email,
    password,
    options: { data: { display_name: "OVS Auth Verify" } },
  });
  if (!signup.error && signup.data.user?.id) {
    userId = signup.data.user.id;
    report.register.publicSignupOk = true;
    report.register.ok = true;
    report.register.userId = userId;
    report.register.needsEmailConfirmation = !signup.data.session;
  } else {
    report.register.error = signup.error?.message || "sign_up_failed";
    const created = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "OVS Auth Verify" },
    });
    if (created.error || !created.data.user?.id) {
      throw new Error(`${report.register.error}; admin fallback failed: ${created.error?.message || "create_user_failed"}`);
    }
    userId = created.data.user.id;
    report.register.fallbackAdminCreated = true;
    report.register.ok = true;
    report.register.userId = userId;
  }

  if (report.register.needsEmailConfirmation) {
    const confirmed = await adminClient.auth.admin.updateUserById(userId, { email_confirm: true });
    if (confirmed.error) throw new Error(`email confirmation failed: ${confirmed.error.message}`);
  }

  const login = await userClient.auth.signInWithPassword({ email, password });
  if (login.error || !login.data.session?.access_token) {
    report.login.error = login.error?.message || "password_login_failed";
    throw new Error(report.login.error);
  }
  report.login.ok = true;
  report.login.session = true;

  const session = await userClient.auth.getSession();
  const user = await userClient.auth.getUser();
  report.restore.ok = Boolean(session.data.session?.access_token && user.data.user?.id === userId);
  report.restore.userReadable = Boolean(user.data.user?.id === userId);
  if (!report.restore.ok) throw new Error(user.error?.message || session.error?.message || "session_restore_failed");

  const signedOut = await userClient.auth.signOut();
  if (signedOut.error) {
    report.logout.error = signedOut.error.message;
    throw new Error(signedOut.error.message);
  }
  const afterLogout = await userClient.auth.getSession();
  report.logout.ok = !afterLogout.data.session;
  report.logout.sessionCleared = !afterLogout.data.session;

  report.ok = report.register.ok && report.login.ok && report.restore.ok && report.logout.ok;
} catch (error) {
  report.error = error instanceof Error ? error.message : "basic_auth_verification_failed";
} finally {
  report.cleanupComplete = await cleanup(userId).catch((error) => {
    report.error = `${report.error || "cleanup_failed"}; cleanup: ${error instanceof Error ? error.message : String(error)}`;
    return false;
  });
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok && report.cleanupComplete ? 0 : 1);

async function cleanup(id) {
  if (!id) return true;
  await adminClient.from("profiles").delete().eq("id", id);
  await adminClient.auth.admin.deleteUser(id);
  return true;
}

function loadEnv(path) {
  const output = { ...process.env };
  if (!existsSync(path)) return output;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    output[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return output;
}

function isPlaceholder(value = "") {
  return /your-|placeholder|example|change-me/i.test(String(value));
}
