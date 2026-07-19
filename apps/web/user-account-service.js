import { getCurrentUser } from "./auth-service.js";
import { getSupabaseClient } from "./supabase-client.js";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user || user.is_anonymous) throw new Error("AUTH_REQUIRED");
  return user;
}

export async function getCredits() {
  const client = getSupabaseClient();
  const user = await requireUser();
  return client.from("credits").select("credits,updated_at").eq("user_id", user.id).single();
}

export async function debitCredits(amount) {
  const value = Number(amount);
  if (!Number.isInteger(value) || value <= 0) throw new Error("INVALID_CREDIT_AMOUNT");
  const client = getSupabaseClient();
  await requireUser();
  return client.rpc("debit_credits", { p_amount: value });
}

export async function saveUserCreation({ toolId, resultUrl }) {
  const client = getSupabaseClient();
  const user = await requireUser();
  return client
    .from("user_creations")
    .insert({ user_id: user.id, tool_id: String(toolId || ""), result_url: String(resultUrl || "") })
    .select("id,user_id,tool_id,result_url,created_at")
    .single();
}
