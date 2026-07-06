import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AppError,
  createSupabaseBrowserClient,
  getSupabaseConnectionStatus,
  loadEnvironment,
} from "../src/index.js";

test("environment loader reads Supabase variables without committing secrets", () => {
  const dir = mkdtempSync(join(tmpdir(), "ovs-env-"));
  try {
    const path = join(dir, ".env.local");
    writeFileSync(path, [
      "NODE_ENV=test",
      "APP_URL=http://localhost:4173",
      "SUPABASE_URL=https://project-ref.supabase.co",
      "SUPABASE_ANON_KEY=test-anon-key",
      "SUPABASE_STORAGE_BUCKET=ovs-assets",
    ].join("\n"));

    const env = loadEnvironment(path);
    assert.equal(env.nodeEnv, "test");
    assert.equal(env.supabaseUrl, "https://project-ref.supabase.co");
    assert.equal(env.supabaseAnonKey, "test-anon-key");
    assert.equal(env.supabaseStorageBucket, "ovs-assets");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Supabase status reports missing placeholders instead of pretending to connect", () => {
  const status = getSupabaseConnectionStatus({
    nodeEnv: "test",
    appUrl: "http://localhost",
    supabaseUrl: "https://your-project-ref.supabase.co",
    supabaseAnonKey: "your-supabase-anon-key",
    supabaseStorageBucket: "open-video-studio-assets",
  });

  assert.equal(status.configured, false);
  assert.deepEqual(status.missing, ["SUPABASE_URL", "SUPABASE_ANON_KEY"]);
});

test("Supabase client creation rejects missing configuration", () => {
  assert.throws(
    () => createSupabaseBrowserClient({
      nodeEnv: "test",
      appUrl: "http://localhost",
      supabaseStorageBucket: "open-video-studio-assets",
    }),
    (error) => error instanceof AppError && error.code === "SUPABASE_CONFIG_MISSING",
  );
});
