import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { AppError } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";
import { STARTER_CREDITS } from "../credits/starterCredits.js";

export type SupabaseGenerationMediaType = "image" | "video";
export type SupabaseOAuthProvider = "google" | "github" | "discord" | "apple";

export interface SupabaseBackendLoopOptions {
  storageBucket: string;
  starterCredits?: number;
}

export interface SupabaseBackendUser {
  id: string;
  email: string;
  displayName: string;
}

export interface SupabaseGenerationResult {
  job: Record<string, unknown>;
  asset: Record<string, unknown>;
}

export class SupabaseMvpBackendLoop {
  private readonly starterCredits: number;

  constructor(
    private readonly client: SupabaseClient,
    private readonly options: SupabaseBackendLoopOptions,
  ) {
    this.starterCredits = options.starterCredits ?? STARTER_CREDITS;
  }

  async signUp(input: { email: string; password: string; displayName: string }): Promise<SupabaseBackendUser> {
    const auth = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { display_name: input.displayName } },
    });
    if (auth.error || !auth.data.user?.id || !auth.data.user.email) {
      throw new AppError("SUPABASE_AUTH_SIGNUP_FAILED", auth.error?.message ?? "Supabase signup failed.", 502);
    }

    const user = {
      id: auth.data.user.id,
      email: auth.data.user.email,
      displayName: input.displayName,
    };
    await this.ensureProfile(user);
    await this.grantStarterCredits(user.id);
    return user;
  }

  async signIn(input: { email: string; password: string }): Promise<{ accessToken: string; user: SupabaseBackendUser }> {
    const auth = await this.client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (auth.error || !auth.data.session?.access_token || !auth.data.user?.id || !auth.data.user.email) {
      throw new AppError("SUPABASE_AUTH_LOGIN_FAILED", auth.error?.message ?? "Supabase login failed.", 401);
    }

    return {
      accessToken: auth.data.session.access_token,
      user: {
        id: auth.data.user.id,
        email: auth.data.user.email,
        displayName: String(auth.data.user.user_metadata?.display_name ?? auth.data.user.email),
      },
    };
  }

  async createOAuthSignInUrl(input: {
    provider: SupabaseOAuthProvider;
    redirectTo?: string;
  }): Promise<{ provider: SupabaseOAuthProvider; url: string }> {
    const auth = await this.client.auth.signInWithOAuth({
      provider: input.provider,
      options: input.redirectTo ? { redirectTo: input.redirectTo } : undefined,
    });
    if (auth.error || !auth.data.url) {
      throw new AppError("SUPABASE_OAUTH_URL_FAILED", auth.error?.message ?? "Supabase OAuth URL creation failed.", 502);
    }
    return {
      provider: input.provider,
      url: auth.data.url,
    };
  }

  async createGenerationJob(input: {
    userId: string;
    mediaType: SupabaseGenerationMediaType;
    prompt: string;
    projectId?: string;
    characterId?: string;
    sourceAssetId?: string;
    provider?: string;
    model?: string;
    aspectRatio?: string;
    resolution?: string;
    durationSeconds?: number;
  }): Promise<Record<string, unknown>> {
    if (!input.prompt.trim()) {
      throw new AppError("GENERATION_PROMPT_REQUIRED", "Prompt is required.");
    }
    const costCredits = estimateCredits(input.mediaType, input.durationSeconds);
    await this.consumeCredits({
      userId: input.userId,
      amount: costCredits,
      sourceType: "generation_job",
      sourceId: "pending",
      operationCategory: `${input.mediaType}_generation`,
      reason: `Queued ${input.mediaType} generation`,
    });

    const timestamp = nowIso();
    const job = {
      id: createId("job"),
      user_id: input.userId,
      media_type: input.mediaType,
      status: "queued",
      project_id: input.projectId ?? null,
      prompt: input.prompt.trim(),
      provider: input.provider ?? "local_api",
      model: input.model ?? (input.mediaType === "image" ? "local-image-v0" : "local-video-v0"),
      aspect_ratio: input.aspectRatio ?? "16:9",
      resolution: input.resolution ?? null,
      duration_seconds: input.durationSeconds ?? null,
      source_asset_id: input.sourceAssetId ?? null,
      character_id: input.characterId ?? null,
      cost_credits: costCredits,
      estimated_cost_cents: input.mediaType === "image" ? costCredits * 3 : costCredits * 5,
      progress: 0,
      safety_status: "pending_review",
      created_at: timestamp,
      updated_at: timestamp,
    };

    const inserted = await this.client.from("generation_jobs").insert(job).select("*").single();
    if (inserted.error) {
      throw new AppError("SUPABASE_GENERATION_JOB_CREATE_FAILED", inserted.error.message, 502);
    }
    await this.client
      .from("credit_transactions")
      .update({ source_id: job.id })
      .eq("user_id", input.userId)
      .eq("source_type", "generation_job")
      .eq("source_id", "pending");
    return inserted.data as Record<string, unknown>;
  }

  async completeFakeWorkerJob(input: {
    userId: string;
    jobId: string;
    displayName?: string;
  }): Promise<SupabaseGenerationResult> {
    const jobResult = await this.client
      .from("generation_jobs")
      .select("*")
      .eq("id", input.jobId)
      .eq("user_id", input.userId)
      .single();
    if (jobResult.error || !jobResult.data) {
      throw new AppError("SUPABASE_GENERATION_JOB_NOT_FOUND", jobResult.error?.message ?? "Generation job not found.", 404);
    }

    const job = jobResult.data as Record<string, any>;
    const assetId = createId("asset");
    const displayName = input.displayName ?? `${job.media_type}-${job.id}.json`;
    const storageKey = `${input.userId}/${assetId}/${displayName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const payload = JSON.stringify({
      simulated: true,
      prompt: job.prompt,
      provider: job.provider,
      model: job.model,
      mediaType: job.media_type,
    });
    const upload = await this.client.storage
      .from(this.options.storageBucket)
      .upload(storageKey, payload, { contentType: "application/json", upsert: false });
    if (upload.error) {
      throw new AppError("SUPABASE_STORAGE_UPLOAD_FAILED", upload.error.message, 502);
    }

    const timestamp = nowIso();
    const asset = {
      id: assetId,
      owner_user_id: input.userId,
      project_id: job.project_id ?? null,
      character_id: job.character_id ?? null,
      generation_job_id: job.id,
      asset_type: job.media_type,
      source_type: "generation",
      storage_key: storageKey,
      display_name: displayName,
      tags_json: "[]",
      metadata_json: JSON.stringify({
        generationJobId: job.id,
        provider: job.provider,
        model: job.model,
        prompt: job.prompt,
        credits: job.cost_credits,
        resolution: job.resolution,
      }),
      processing_status: "ready",
      rights_status: "generated",
      moderation_status: "pending",
      visibility_status: "private",
      created_at: timestamp,
      updated_at: timestamp,
    };
    const assetResult = await this.client.from("media_assets").insert(asset).select("*").single();
    if (assetResult.error) {
      throw new AppError("SUPABASE_ASSET_CREATE_FAILED", assetResult.error.message, 502);
    }

    const completed = await this.client
      .from("generation_jobs")
      .update({ status: "completed", progress: 100, result_asset_id: assetId, completed_at: timestamp, updated_at: timestamp })
      .eq("id", input.jobId)
      .eq("user_id", input.userId)
      .select("*")
      .single();
    if (completed.error) {
      throw new AppError("SUPABASE_GENERATION_COMPLETE_FAILED", completed.error.message, 502);
    }

    return {
      job: completed.data as Record<string, unknown>,
      asset: assetResult.data as Record<string, unknown>,
    };
  }

  async listGallery(userId: string): Promise<Record<string, unknown>[]> {
    const result = await this.client
      .from("media_assets")
      .select("*")
      .eq("owner_user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (result.error) {
      throw new AppError("SUPABASE_GALLERY_LIST_FAILED", result.error.message, 502);
    }
    return result.data as Record<string, unknown>[];
  }

  async listHistory(userId: string): Promise<Record<string, unknown>[]> {
    const result = await this.client
      .from("generation_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (result.error) {
      throw new AppError("SUPABASE_HISTORY_LIST_FAILED", result.error.message, 502);
    }
    return result.data as Record<string, unknown>[];
  }

  async createShareLink(input: { userId: string; assetId: string }): Promise<Record<string, unknown>> {
    const token = randomBytes(18).toString("base64url");
    const timestamp = nowIso();
    await this.client
      .from("media_assets")
      .update({ visibility_status: "public", updated_at: timestamp })
      .eq("id", input.assetId)
      .eq("owner_user_id", input.userId);
    const result = await this.client.from("share_links").insert({
      id: createId("share"),
      owner_user_id: input.userId,
      media_asset_id: input.assetId,
      token,
      visibility_status: "active",
      created_at: timestamp,
    }).select("*").single();
    if (result.error) {
      throw new AppError("SUPABASE_SHARE_CREATE_FAILED", result.error.message, 502);
    }
    return result.data as Record<string, unknown>;
  }

  async getPublicShare(token: string): Promise<Record<string, unknown>> {
    const result = await this.client
      .from("share_links")
      .select("*, media_assets(*)")
      .eq("token", token)
      .eq("visibility_status", "active")
      .single();
    if (result.error) {
      throw new AppError("SUPABASE_SHARE_NOT_FOUND", result.error.message, 404);
    }
    return result.data as Record<string, unknown>;
  }

  private async ensureProfile(user: SupabaseBackendUser): Promise<void> {
    const result = await this.client.from("profiles").upsert({
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      account_status: "active",
      role: "user",
      locale: "en",
      timezone: "UTC",
      onboarding_state: "not_started",
      updated_at: nowIso(),
    }, { onConflict: "id" });
    if (result.error) {
      throw new AppError("SUPABASE_PROFILE_SYNC_FAILED", result.error.message, 502);
    }
  }

  private async grantStarterCredits(userId: string): Promise<void> {
    const existing = await this.client
      .from("credit_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("source_type", "auth_signup")
      .limit(1);
    if (existing.error) {
      throw new AppError("SUPABASE_CREDITS_CHECK_FAILED", existing.error.message, 502);
    }
    if ((existing.data ?? []).length > 0) {
      return;
    }
    await this.recordCreditTransaction({
      userId,
      amount: this.starterCredits,
      balanceImpact: this.starterCredits,
      sourceType: "auth_signup",
      sourceId: userId,
      operationCategory: "grant",
      reason: "Starter credits for new user",
    });
  }

  private async consumeCredits(input: {
    userId: string;
    amount: number;
    sourceType: string;
    sourceId: string;
    operationCategory: string;
    reason: string;
  }): Promise<void> {
    const balance = await this.getBalance(input.userId);
    if (balance < input.amount) {
      throw new AppError("CREDITS_INSUFFICIENT_BALANCE", "Insufficient credits.", 402);
    }
    await this.recordCreditTransaction({
      userId: input.userId,
      amount: input.amount,
      balanceImpact: -input.amount,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      operationCategory: input.operationCategory,
      reason: input.reason,
    });
  }

  private async getBalance(userId: string): Promise<number> {
    const result = await this.client
      .from("credit_transactions")
      .select("balance_impact")
      .eq("user_id", userId)
      .eq("status", "posted");
    if (result.error) {
      throw new AppError("SUPABASE_CREDITS_BALANCE_FAILED", result.error.message, 502);
    }
    return (result.data ?? []).reduce((sum: number, row: any) => sum + Number(row.balance_impact ?? 0), 0);
  }

  private async recordCreditTransaction(input: {
    userId: string;
    amount: number;
    balanceImpact: number;
    sourceType: string;
    sourceId: string;
    operationCategory: string;
    reason: string;
  }): Promise<void> {
    const result = await this.client.from("credit_transactions").insert({
      id: createId("credit"),
      account_id: input.userId,
      user_id: input.userId,
      source_type: input.sourceType,
      source_id: input.sourceId,
      amount: input.amount,
      balance_impact: input.balanceImpact,
      operation_category: input.operationCategory,
      status: "posted",
      reason: input.reason,
      created_at: nowIso(),
    });
    if (result.error) {
      throw new AppError("SUPABASE_CREDITS_RECORD_FAILED", result.error.message, 502);
    }
  }
}

function estimateCredits(mediaType: SupabaseGenerationMediaType, durationSeconds?: number): number {
  if (mediaType === "image") {
    return 8;
  }
  return Math.max(24, Math.ceil((durationSeconds ?? 8) / 4) * 12);
}
