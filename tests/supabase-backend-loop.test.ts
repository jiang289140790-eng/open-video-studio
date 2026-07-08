import test from "node:test";
import assert from "node:assert/strict";
import { SupabaseMvpBackendLoop } from "../src/index.js";
import { STARTER_CREDITS } from "../src/credits/starterCredits.js";

test("Supabase MVP backend loop signs up, grants credits, generates, stores, lists, and shares", async () => {
  const client = new FakeSupabaseClient();
  const backend = new SupabaseMvpBackendLoop(client as any, {
    storageBucket: "open-video-studio-assets",
  });

  const user = await backend.signUp({
    email: "supabase-loop@example.com",
    password: "correct horse battery staple",
    displayName: "Supabase Loop",
  });
  assert.equal(user.email, "supabase-loop@example.com");
  assert.equal(client.table("profiles").length, 1);
  assert.equal(client.balance(user.id), STARTER_CREDITS);

  const login = await backend.signIn({
    email: "supabase-loop@example.com",
    password: "correct horse battery staple",
  });
  assert.equal(login.user.id, user.id);
  assert.equal(login.accessToken, "test-access-token");

  for (const provider of ["google", "twitter", "discord", "telegram"] as const) {
    const oauth = await backend.createOAuthSignInUrl({
      provider,
      redirectTo: "https://example.com/auth/callback",
    });
    assert.equal(oauth.provider, provider);
    if (provider === "telegram") {
      assert.ok(oauth.url.includes("provider=telegram"));
    } else {
      assert.equal(oauth.url, `https://auth.example.com/${provider}`);
    }
  }

  const job = await backend.createGenerationJob({
    userId: user.id,
    mediaType: "image",
    prompt: "Generate a premium AI video studio hero image.",
    resolution: "1280x720",
  });
  assert.equal(job.status, "queued");
  assert.equal(client.balance(user.id), STARTER_CREDITS - 8);

  const completed = await backend.completeFakeWorkerJob({
    userId: user.id,
    jobId: String(job.id),
    displayName: "hero-frame.json",
  });
  assert.equal(completed.job.status, "completed");
  assert.equal(completed.asset.source_type, "generation");
  assert.equal(client.uploads.length, 1);
  assert.match(client.uploads[0].path, /^test-user-id\/asset_/);

  const gallery = await backend.listGallery(user.id);
  assert.equal(gallery.length, 1);
  assert.equal(gallery[0].id, completed.asset.id);

  const history = await backend.listHistory(user.id);
  assert.equal(history.length, 1);
  assert.equal(history[0].result_asset_id, completed.asset.id);

  const share = await backend.createShareLink({
    userId: user.id,
    assetId: String(completed.asset.id),
  });
  assert.equal(share.visibility_status, "active");

  const publicShare = await backend.getPublicShare(String(share.token));
  assert.equal(publicShare.token, share.token);

  const failingJob = await backend.createGenerationJob({
    userId: user.id,
    mediaType: "video",
    prompt: "Generate a video that will fail safely.",
    durationSeconds: 6,
  });
  assert.equal(client.balance(user.id), STARTER_CREDITS - 8 - 24);
  const failed = await backend.failGenerationJob({
    userId: user.id,
    jobId: String(failingJob.id),
    errorCode: "PROVIDER_TIMEOUT",
    errorMessage: "Provider timed out.",
  });
  assert.equal(failed.status, "failed");
  assert.equal(client.balance(user.id), STARTER_CREDITS - 8);
  await backend.failGenerationJob({
    userId: user.id,
    jobId: String(failingJob.id),
    errorCode: "PROVIDER_TIMEOUT",
    errorMessage: "Provider timed out again.",
  });
  assert.equal(client.balance(user.id), STARTER_CREDITS - 8);
});

class FakeSupabaseClient {
  readonly uploads: Array<{ bucket: string; path: string; body: unknown }> = [];
  private readonly tables = new Map<string, any[]>([
    ["profiles", []],
    ["credit_transactions", []],
    ["generation_jobs", []],
    ["media_assets", []],
    ["share_links", []],
  ]);
  private readonly authUsers = new Map<string, { id: string; email: string; password: string; user_metadata: Record<string, unknown> }>();

  readonly auth = {
    signUp: async (input: { email: string; password: string; options?: { data?: Record<string, unknown> } }) => {
      const user = {
        id: "test-user-id",
        email: input.email,
        password: input.password,
        user_metadata: input.options?.data ?? {},
      };
      this.authUsers.set(input.email, user);
      return { data: { user }, error: null };
    },
    signInWithPassword: async (input: { email: string; password: string }) => {
      const user = this.authUsers.get(input.email);
      if (!user || user.password !== input.password) {
        return { data: { user: null, session: null }, error: { message: "Invalid credentials" } };
      }
      return {
        data: { user, session: { access_token: "test-access-token" } },
        error: null,
      };
    },
    signInWithOAuth: async (input: { provider: string; options?: { redirectTo?: string } }) => ({
      data: { url: `https://auth.example.com/${input.provider}` },
      error: null,
    }),
  };

  readonly storage = {
    from: (bucket: string) => ({
      upload: async (path: string, body: unknown) => {
        this.uploads.push({ bucket, path, body });
        return { data: { path }, error: null };
      },
    }),
  };

  from(tableName: string): FakeQuery {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Unknown table ${tableName}`);
    }
    return new FakeQuery(table);
  }

  table(name: string): any[] {
    return this.tables.get(name) ?? [];
  }

  balance(userId: string): number {
    return this.table("credit_transactions")
      .filter((row) => row.user_id === userId && row.status === "posted")
      .reduce((sum, row) => sum + Number(row.balance_impact), 0);
  }
}

class FakeQuery {
  private action: "select" | "insert" | "update" | "upsert" = "select";
  private payload: any;
  private filters: Array<(row: any) => boolean> = [];
  private singleResult = false;
  private maxRows?: number;
  private orderKey?: string;
  private orderAscending = true;

  constructor(private readonly table: any[]) {}

  insert(payload: any): this {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  upsert(payload: any): this {
    this.action = "upsert";
    this.payload = payload;
    return this;
  }

  update(payload: any): this {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  select(_columns = "*"): this {
    this.action = this.action === "select" ? "select" : this.action;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push((row) => value === null ? row[column] == null : row[column] === value);
    return this;
  }

  limit(count: number): this {
    this.maxRows = count;
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    this.orderKey = column;
    this.orderAscending = options.ascending ?? true;
    return this;
  }

  single(): Promise<{ data: any; error: null }> {
    this.singleResult = true;
    return this.execute();
  }

  then<TResult1 = { data: any; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<{ data: any; error: null }> {
    if (this.action === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      this.table.push(...rows.map((row) => ({ ...row })));
      return { data: this.singleResult ? rows[0] : rows, error: null };
    }
    if (this.action === "upsert") {
      const existing = this.table.find((row) => row.id === this.payload.id);
      if (existing) {
        Object.assign(existing, this.payload);
      } else {
        this.table.push({ ...this.payload });
      }
      return { data: this.payload, error: null };
    }
    if (this.action === "update") {
      const rows = this.filteredRows();
      for (const row of rows) {
        Object.assign(row, this.payload);
      }
      return { data: this.singleResult ? rows[0] : rows, error: null };
    }
    const rows = this.filteredRows();
    return { data: this.singleResult ? rows[0] : rows, error: null };
  }

  private filteredRows(): any[] {
    let rows = this.filters.reduce((current, filter) => current.filter(filter), [...this.table]);
    if (this.orderKey) {
      rows = rows.sort((left, right) => {
        const comparison = String(left[this.orderKey!] ?? "").localeCompare(String(right[this.orderKey!] ?? ""));
        return this.orderAscending ? comparison : -comparison;
      });
    }
    if (typeof this.maxRows === "number") {
      rows = rows.slice(0, this.maxRows);
    }
    return rows;
  }
}
