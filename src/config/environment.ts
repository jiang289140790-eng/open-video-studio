import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface AppEnvironment {
  nodeEnv: string;
  appUrl: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseStorageBucket: string;
  supabaseServiceRoleKey?: string;
}

export function loadEnvironment(filePath?: string): AppEnvironment {
  const parsed = filePath ? parseEnvFile(filePath) : {};
  const value = (key: string, fallback = "") => parsed[key] ?? process.env[key] ?? fallback;

  return {
    nodeEnv: value("NODE_ENV", "development"),
    appUrl: value("APP_URL", "http://127.0.0.1:4173"),
    supabaseUrl: emptyToUndefined(value("SUPABASE_URL")),
    supabaseAnonKey: emptyToUndefined(value("SUPABASE_ANON_KEY")),
    supabaseStorageBucket: value("SUPABASE_STORAGE_BUCKET", "open-video-studio-assets"),
    supabaseServiceRoleKey: emptyToUndefined(value("SUPABASE_SERVICE_ROLE_KEY")),
  };
}

export function loadLocalEnvironment(): AppEnvironment {
  const localPath = resolve(process.cwd(), ".env.local");
  return loadEnvironment(existsSync(localPath) ? localPath : undefined);
}

function parseEnvFile(filePath: string): Record<string, string> {
  const output: Record<string, string> = {};
  if (!existsSync(filePath)) {
    return output;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    output[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return output;
}

function emptyToUndefined(value: string): string | undefined {
  return value.trim() ? value.trim() : undefined;
}
