import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { join } from "node:path";
import type { SqliteDatabase } from "../db/database.js";
import { AppError } from "../shared/errors.js";
import { AuthService } from "../auth/authService.js";
import { UserRepository } from "../users/userRepository.js";
import { CreditLedger } from "../credits/creditLedger.js";
import { BillingService } from "../billing/billingService.js";
import { StorageService } from "../storage/storageService.js";
import { CharacterService } from "../characters/characterService.js";
import { GenerationService, type GenerationMediaType, type GenerationStatus } from "../generation/generationService.js";
import { GalleryService } from "../gallery/galleryService.js";

type Handler = (context: RequestContext) => Promise<unknown> | unknown;
type AuthenticatedHandler = (context: RequestContext & { user: AuthenticatedUser }) => Promise<unknown> | unknown;

interface RequestContext {
  req: IncomingMessage;
  params: URL;
  body: unknown;
  user?: AuthenticatedUser;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  accountStatus: string;
  role: string;
  locale: string;
  timezone: string;
  onboardingState: string;
  createdAt: string;
  updatedAt: string;
}

export function createMvpApiServer(db: SqliteDatabase, options: { storageRoot?: string } = {}): Server {
  const auth = new AuthService(db);
  const users = new UserRepository(db);
  const credits = new CreditLedger(db);
  const billing = new BillingService(db);
  const storage = new StorageService(db, options.storageRoot ?? join(process.cwd(), ".data", "mvp-storage"));
  const characters = new CharacterService(db, storage);
  const generation = new GenerationService(db, storage);
  const gallery = new GalleryService(db, storage);

  const routes = new Map<string, Handler>([
    ["GET /health", () => ({ status: "ok", service: "open-video-studio-mvp-api" })],
    ["POST /auth/signup", ({ body }) => {
      const input = requireObject(body);
      return auth.signUp({
        email: requireString(input.email, "AUTH_EMAIL_REQUIRED"),
        password: requireString(input.password, "AUTH_PASSWORD_REQUIRED"),
        displayName: requireString(input.displayName, "AUTH_DISPLAY_NAME_REQUIRED"),
      });
    }],
    ["POST /auth/login", ({ body }) => {
      const input = requireObject(body);
      return auth.login({
        email: requireString(input.email, "AUTH_EMAIL_REQUIRED"),
        password: requireString(input.password, "AUTH_PASSWORD_REQUIRED"),
      });
    }],
    ["GET /me", requireAuth(auth, ({ user }) => ({ user }))],
    ["PATCH /me", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      return {
        user: stripPasswordHash(users.updateProfile(user.id, {
          displayName: optionalString(input.displayName),
          avatarUrl: optionalString(input.avatarUrl),
          locale: optionalString(input.locale),
          timezone: optionalString(input.timezone),
          onboardingState: optionalString(input.onboardingState),
        })),
      };
    })],
    ["GET /credits", requireAuth(auth, ({ user }) => ({
      balance: credits.getBalance(user.id),
      transactions: credits.list(user.id),
    }))],
    ["POST /credits/purchase", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      const order = billing.purchaseCredits({
        userId: user.id,
        credits: requireNumber(input.credits, "BILLING_CREDITS_REQUIRED"),
        amountCents: requireNumber(input.amountCents, "BILLING_AMOUNT_REQUIRED"),
        currency: optionalString(input.currency),
        providerReference: optionalString(input.providerReference),
      });
      return {
        order,
        balance: credits.getBalance(user.id),
      };
    })],
    ["GET /orders", requireAuth(auth, ({ user }) => ({ orders: billing.listOrders(user.id) }))],
    ["POST /characters", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      return {
        character: characters.createCharacter({
          ownerUserId: user.id,
          name: requireString(input.name, "CHARACTER_NAME_REQUIRED"),
          description: optionalString(input.description),
          characterType: optionalString(input.characterType),
          referenceAssetId: optionalString(input.referenceAssetId),
          coverAssetId: optionalString(input.coverAssetId),
          tags: optionalStringArray(input.tags),
          memory: optionalRecord(input.memory),
          consistencyStatus: optionalString(input.consistencyStatus),
          promptSeed: optionalString(input.promptSeed),
          rightsStatus: optionalString(input.rightsStatus),
          safetyStatus: optionalString(input.safetyStatus),
          visibilityStatus: optionalString(input.visibilityStatus),
        }),
      };
    })],
    ["GET /characters", requireAuth(auth, ({ user }) => ({ characters: characters.listCharacters(user.id) }))],
    ["GET /characters/profile", requireAuth(auth, ({ params, user }) => ({
      character: characters.getCharacter(requireQueryString(params, "id", "CHARACTER_ID_REQUIRED"), user.id),
    }))],
    ["PATCH /characters", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      return {
        character: characters.updateCharacter(requireString(input.id, "CHARACTER_ID_REQUIRED"), user.id, {
          name: optionalString(input.name),
          description: optionalString(input.description),
          characterType: optionalString(input.characterType),
          referenceAssetId: optionalNullableString(input.referenceAssetId),
          coverAssetId: optionalNullableString(input.coverAssetId),
          tags: optionalStringArray(input.tags),
          memory: optionalRecord(input.memory),
          consistencyStatus: optionalString(input.consistencyStatus),
          promptSeed: optionalString(input.promptSeed),
          rightsStatus: optionalString(input.rightsStatus),
          safetyStatus: optionalString(input.safetyStatus),
          visibilityStatus: optionalString(input.visibilityStatus),
        }),
      };
    })],
    ["POST /assets", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      return {
        asset: storage.saveAsset({
          ownerUserId: user.id,
          projectId: optionalString(input.projectId),
          characterId: optionalString(input.characterId),
          generationJobId: optionalString(input.generationJobId),
          assetType: requireString(input.assetType, "ASSET_TYPE_REQUIRED"),
          sourceType: optionalString(input.sourceType) ?? "upload",
          displayName: requireString(input.displayName, "ASSET_DISPLAY_NAME_REQUIRED"),
          data: requireString(input.data, "ASSET_DATA_REQUIRED"),
          tags: optionalStringArray(input.tags),
          metadata: optionalRecord(input.metadata),
          visibilityStatus: optionalString(input.visibilityStatus),
          processingStatus: optionalString(input.processingStatus),
          rightsStatus: optionalString(input.rightsStatus),
          moderationStatus: optionalString(input.moderationStatus),
          isFavorite: optionalBoolean(input.isFavorite),
        }),
      };
    })],
    ["GET /assets", requireAuth(auth, ({ params, user }) => ({
      assets: gallery.listUserGallery(user.id, assetFiltersFromParams(params)),
    }))],
    ["POST /assets/review", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      return {
        asset: gallery.approveAsset(requireString(input.assetId, "ASSET_ID_REQUIRED"), user.id),
      };
    })],
    ["POST /assets/favorite", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      return {
        asset: gallery.favoriteAsset(
          requireString(input.assetId, "ASSET_ID_REQUIRED"),
          user.id,
          optionalBoolean(input.isFavorite) ?? true,
        ),
      };
    })],
    ["POST /assets/archive", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      return {
        asset: gallery.archiveAsset(requireString(input.assetId, "ASSET_ID_REQUIRED"), user.id),
      };
    })],
    ["POST /assets/share", requireAuth(auth, ({ body, user }) => {
      const input = requireObject(body);
      return {
        share: gallery.shareAsset(requireString(input.assetId, "ASSET_ID_REQUIRED"), user.id),
      };
    })],
    ["GET /share", ({ params }) => gallery.getPublicAsset(requireQueryString(params, "token", "SHARE_TOKEN_REQUIRED"))],
    ["POST /generate/image", requireAuth(auth, ({ body, user }) => completeLocalGeneration(generation, requireObject(body), user.id, "image"))],
    ["POST /generate/video", requireAuth(auth, ({ body, user }) => completeLocalGeneration(generation, requireObject(body), user.id, "video"))],
    ["GET /generation/history", requireAuth(auth, ({ params, user }) => ({
      history: generation.listHistory(user.id, generationFiltersFromParams(params)),
    }))],
  ]);

  return createServer(async (req, res) => {
    try {
      setCorsHeaders(res);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url ?? "/", "http://localhost");
      const routeKey = `${req.method ?? "GET"} ${url.pathname}`;
      const handler = routes.get(routeKey);
      if (!handler) {
        throw new AppError("API_ROUTE_NOT_FOUND", "Route not found.", 404);
      }

      const body = await readJsonBody(req);
      const result = await handler({ req, params: url, body });
      writeJson(res, 200, result ?? { ok: true });
    } catch (error) {
      const appError = normalizeError(error);
      writeJson(res, appError.status, {
        error: {
          code: appError.code,
          message: appError.message,
        },
      });
    }
  });
}

function requireAuth(auth: AuthService, handler: AuthenticatedHandler): Handler {
  return (context) => {
    const token = getBearerToken(context.req);
    const user = auth.authenticate(token);
    return handler({ ...context, user });
  };
}

function getBearerToken(req: IncomingMessage): string {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("AUTH_TOKEN_REQUIRED", "Bearer token is required.", 401);
  }
  return header.slice("Bearer ".length);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD") {
    return {};
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new AppError("API_INVALID_JSON", "Request body must be valid JSON.");
  }
}

function writeJson(res: ServerResponse, status: number, value: unknown): void {
  setCorsHeaders(res);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, authorization");
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError("API_INTERNAL_ERROR", error.message, 500);
  }
  return new AppError("API_INTERNAL_ERROR", "Internal error.", 500);
}

function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("API_OBJECT_REQUIRED", "Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(code, "Required string value is missing.");
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  return optionalString(value);
}

function requireNumber(value: unknown, code: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AppError(code, "Required numeric value is missing.");
  }
  return value;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new AppError("API_STRING_ARRAY_REQUIRED", "Expected a list of strings.");
  }
  return value;
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("API_OBJECT_REQUIRED", "Expected an object value.");
  }
  return value as Record<string, unknown>;
}

function requireQueryString(url: URL, name: string, code: string): string {
  const value = url.searchParams.get(name);
  if (!value?.trim()) {
    throw new AppError(code, "Required query value is missing.");
  }
  return value;
}

function optionalQueryString(url: URL, name: string): string | undefined {
  const value = url.searchParams.get(name);
  return value?.trim() ? value : undefined;
}

function optionalQueryBoolean(url: URL, name: string): boolean | undefined {
  const value = url.searchParams.get(name);
  if (value === null) {
    return undefined;
  }
  return value === "true";
}

function optionalQueryTags(url: URL): string[] | undefined {
  const value = optionalQueryString(url, "tags");
  return value ? value.split(",").map((tag) => tag.trim()).filter(Boolean) : undefined;
}

function assetFiltersFromParams(params: URL): Parameters<GalleryService["listUserGallery"]>[1] {
  return {
    projectId: optionalQueryString(params, "projectId"),
    characterId: optionalQueryString(params, "characterId"),
    assetType: optionalQueryString(params, "assetType"),
    sourceType: optionalQueryString(params, "sourceType"),
    visibilityStatus: optionalQueryString(params, "visibilityStatus"),
    processingStatus: optionalQueryString(params, "processingStatus"),
    moderationStatus: optionalQueryString(params, "moderationStatus"),
    favorite: optionalQueryBoolean(params, "favorite"),
    query: optionalQueryString(params, "query"),
    tags: optionalQueryTags(params),
  };
}

function generationFiltersFromParams(params: URL): Parameters<GenerationService["listHistory"]>[1] {
  return {
    projectId: optionalQueryString(params, "projectId"),
    characterId: optionalQueryString(params, "characterId"),
    mediaType: optionalQueryString(params, "mediaType") as GenerationMediaType | undefined,
    status: optionalQueryString(params, "status") as GenerationStatus | undefined,
    provider: optionalQueryString(params, "provider"),
    model: optionalQueryString(params, "model"),
    query: optionalQueryString(params, "query"),
  };
}

function completeLocalGeneration(
  generation: GenerationService,
  input: Record<string, unknown>,
  userId: string,
  mediaType: GenerationMediaType,
): ReturnType<GenerationService["completeJob"]> {
  const job = generation.enqueue({
    userId,
    projectId: optionalString(input.projectId),
    mediaType,
    prompt: requireString(input.prompt, "GENERATION_PROMPT_REQUIRED"),
    provider: optionalString(input.provider),
    model: optionalString(input.model),
    aspectRatio: optionalString(input.aspectRatio),
    resolution: optionalString(input.resolution),
    durationSeconds: typeof input.durationSeconds === "number" ? input.durationSeconds : undefined,
    sourceAssetId: optionalString(input.sourceAssetId),
    characterId: optionalString(input.characterId),
  });
  generation.startJob(job.id, userId);
  return generation.completeJob({
    jobId: job.id,
    userId,
    data: JSON.stringify({
      prompt: job.prompt,
      mediaType,
      provider: job.provider,
      model: job.model,
      simulated: true,
    }),
    displayName: optionalString(input.displayName) ?? `${mediaType}-${job.id}.json`,
    metadata: optionalRecord(input.metadata),
  });
}

function stripPasswordHash(user: ReturnType<UserRepository["getById"]>): AuthenticatedUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
