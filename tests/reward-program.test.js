import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/202607260003_free_credits_referrals.sql", import.meta.url), "utf8");
const edge = readFileSync(new URL("../supabase/functions/ai/index.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../apps/web/app.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../apps/web/free-coins.html", import.meta.url), "utf8");

test("reward grants are atomic, idempotent, and service-role only", () => {
  assert.match(migration, /create table if not exists public\.reward_claims/);
  assert.match(migration, /unique \(user_id, reward_type, reward_key\)/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /insert into public\.credit_transactions/);
  assert.match(migration, /revoke all on function public\.grant_credit_reward[\s\S]+from authenticated/);
  assert.match(migration, /grant execute on function public\.grant_credit_reward[\s\S]+to service_role/);
});

test("daily, first generation, referral, and share rewards are server verified", () => {
  assert.match(edge, /action === "claim-daily-checkin"/);
  assert.match(edge, /\.in\("status", \["completed", "succeeded"\]\)/);
  assert.match(edge, /grantFirstGenerationReward\(adminClient, userId, jobId\)/);
  assert.match(edge, /reason: "self_referral"/);
  assert.match(edge, /referralRequiresFirstGeneration/);
  assert.match(edge, /confirmPublicShare !== true/);
  assert.match(edge, /daily_cap: config\.shareDailyCap/);
});

test("browser no longer grants task credits locally", () => {
  assert.doesNotMatch(app, /data-claim-task[\s\S]{0,800}state\.credits \+=/);
  assert.match(app, /invokeAi\("claim-daily-checkin"\)/);
  assert.match(app, /invokeAi\("attribute-referral"/);
  assert.match(app, /invokeAi\("reward-program-status"/);
});

test("free credits page explains real states and rules", () => {
  assert.match(page, /签到按 UTC 日期计算/);
  assert.match(page, /有效推荐/);
  assert.match(page, /首次成功生成/);
  assert.match(page, /每日奖励上限 10 积分/);
  assert.doesNotMatch(page, /演示奖励/);
});
