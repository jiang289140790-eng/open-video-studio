import type { SqliteDatabase } from "../db/database.js";
import { AuditLog } from "../audit/auditLog.js";
import { PlatformService } from "../platform/platformService.js";
import { AppError, assertNonEmpty } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type CampaignGoal = "traffic" | "followers" | "sales" | "leads" | "awareness";
export type ContentStage = "idea" | "research" | "script" | "prompt" | "asset" | "caption" | "review" | "scheduled" | "published" | "analyzed";
export type ReviewStatus = "draft" | "needs_review" | "approved" | "rejected" | "scheduled" | "published" | "failed";
export type QueueStatus = "today" | "tomorrow" | "this_week" | "scheduled" | "failed" | "needs_review" | "published";

export interface Campaign {
  id: string;
  workspaceId: string;
  projectId: string;
  ownerUserId: string;
  name: string;
  goal: CampaignGoal;
  niche: string;
  targetAudience: string;
  platforms: string[];
  connectedAccounts: string[];
  contentStyle: string;
  postingFrequency: string;
  cta: string;
  targetUrl: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItem {
  id: string;
  campaignId: string;
  workspaceId: string;
  projectId: string;
  ownerUserId: string;
  characterId?: string;
  title: string;
  topic: string;
  researchNotes: string;
  script: string;
  prompt: string;
  caption: string;
  hashtags: string[];
  translations: Record<string, string>;
  cta: string;
  stage: ContentStage;
  reviewStatus: ReviewStatus;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  publishedAt?: string;
}

export interface PlatformVariant {
  id: string;
  contentItemId: string;
  platform: string;
  caption: string;
  hashtags: string[];
  cta: string;
  mediaFormat: string;
  status: ReviewStatus;
  connectedAccountId?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishingQueueItem {
  id: string;
  contentItemId: string;
  platformVariantId: string;
  userId: string;
  queueStatus: QueueStatus;
  scheduledAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignRow {
  id: string;
  workspace_id: string;
  project_id: string;
  owner_user_id: string;
  name: string;
  goal: CampaignGoal;
  niche: string;
  target_audience: string;
  platforms_json: string;
  connected_accounts_json: string;
  content_style: string;
  posting_frequency: string;
  cta: string;
  target_url: string;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

interface ContentItemRow {
  id: string;
  campaign_id: string;
  workspace_id: string;
  project_id: string;
  owner_user_id: string;
  character_id: string | null;
  title: string;
  topic: string;
  research_notes: string;
  script: string;
  prompt: string;
  caption: string;
  hashtags_json: string;
  translation_json: string;
  cta: string;
  stage: ContentStage;
  review_status: ReviewStatus;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  scheduled_at: string | null;
  published_at: string | null;
}

interface PlatformVariantRow {
  id: string;
  content_item_id: string;
  platform: string;
  caption: string;
  hashtags_json: string;
  cta: string;
  media_format: string;
  status: ReviewStatus;
  connected_account_id: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface QueueRow {
  id: string;
  content_item_id: string;
  platform_variant_id: string;
  user_id: string;
  queue_status: QueueStatus;
  scheduled_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const stages: ContentStage[] = ["idea", "research", "script", "prompt", "asset", "caption", "review", "scheduled", "published", "analyzed"];
const validGoals: CampaignGoal[] = ["traffic", "followers", "sales", "leads", "awareness"];

export class ContentOperatingService {
  private readonly audit: AuditLog;
  private readonly platform: PlatformService;

  constructor(private readonly db: SqliteDatabase) {
    this.audit = new AuditLog(db);
    this.platform = new PlatformService(db);
  }

  createCampaign(input: {
    actorUserId: string;
    workspaceId: string;
    projectId: string;
    name: string;
    goal: CampaignGoal;
    niche?: string;
    targetAudience?: string;
    platforms?: string[];
    connectedAccounts?: string[];
    contentStyle?: string;
    postingFrequency?: string;
    cta?: string;
    targetUrl?: string;
    status?: CampaignStatus;
  }): Campaign {
    assertNonEmpty(input.name, "CAMPAIGN_NAME_REQUIRED", "Campaign name is required.");
    if (!validGoals.includes(input.goal)) {
      throw new AppError("CAMPAIGN_GOAL_INVALID", "Campaign goal is invalid.");
    }
    const project = this.platform.assertProjectAccess(input.projectId, input.actorUserId, true);
    if (project.workspaceId !== input.workspaceId) {
      throw new AppError("PROJECT_WORKSPACE_MISMATCH", "Project does not belong to workspace.", 400);
    }

    const timestamp = nowIso();
    const id = createId("campaign");
    this.db.prepare(`
      INSERT INTO campaigns (
        id, workspace_id, project_id, owner_user_id, name, goal, niche, target_audience,
        platforms_json, connected_accounts_json, content_style, posting_frequency,
        cta, target_url, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.workspaceId,
      input.projectId,
      input.actorUserId,
      input.name.trim(),
      input.goal,
      input.niche ?? "",
      input.targetAudience ?? "",
      JSON.stringify(input.platforms ?? []),
      JSON.stringify(input.connectedAccounts ?? []),
      input.contentStyle ?? "",
      input.postingFrequency ?? "",
      input.cta ?? "",
      input.targetUrl ?? "",
      input.status ?? "draft",
      timestamp,
      timestamp,
    );

    this.audit.record({
      actorType: "user",
      actorId: input.actorUserId,
      action: "campaign.created",
      targetType: "campaign",
      targetId: id,
      outcome: "success",
      riskClassification: "medium",
      metadata: { workspaceId: input.workspaceId, projectId: input.projectId },
    });

    return this.getCampaign(id, input.actorUserId);
  }

  createContentItem(input: {
    actorUserId: string;
    campaignId: string;
    title: string;
    topic?: string;
    characterId?: string;
  }): ContentItem {
    const campaign = this.getCampaign(input.campaignId, input.actorUserId, true);
    assertNonEmpty(input.title, "CONTENT_TITLE_REQUIRED", "Content title is required.");
    const timestamp = nowIso();
    const id = createId("content");
    this.db.prepare(`
      INSERT INTO content_items (
        id, campaign_id, workspace_id, project_id, owner_user_id, character_id,
        title, topic, cta, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      campaign.id,
      campaign.workspaceId,
      campaign.projectId,
      input.actorUserId,
      input.characterId ?? null,
      input.title.trim(),
      input.topic ?? input.title,
      campaign.cta,
      timestamp,
      timestamp,
    );
    this.recordPipelineEvent(id, input.actorUserId, null, "idea", "Created content item.");
    return this.getContentItem(id, input.actorUserId);
  }

  generateStudioDraft(input: { actorUserId: string; contentItemId: string }): ContentItem {
    const item = this.getContentItem(input.contentItemId, input.actorUserId, true);
    const campaign = this.getCampaign(item.campaignId, input.actorUserId);
    const hashtags = buildHashtags(campaign, item);
    const script = `Hook: ${item.topic}. Problem: creators need reusable content systems. Solution: ${campaign.name} turns one campaign idea into platform-ready AI assets. CTA: ${campaign.cta || "Start creating today."}`;
    const prompt = `${campaign.contentStyle || "Premium creator-focused"} scene for ${campaign.targetAudience || "digital creators"} about ${item.topic}. Include consistent character direction, reusable assets, thumbnail-safe composition, and short-form video framing.`;
    const caption = `${item.topic} made reusable for ${campaign.platforms.join(", ") || "social channels"}. ${campaign.cta || "Create your next asset."}`;
    const research = `Mock research: focus on ${campaign.niche || "AI content creation"}, audience pain points, visual hooks, and conversion intent.`;
    return this.updateContentFields(input.actorUserId, item.id, {
      researchNotes: research,
      script,
      prompt,
      caption,
      hashtags,
      translations: { zh: caption, en: caption },
      stage: "caption",
      reviewStatus: "needs_review",
    });
  }

  moveContentStage(input: { actorUserId: string; contentItemId: string; toStage: ContentStage; reason?: string }): ContentItem {
    if (!stages.includes(input.toStage)) {
      throw new AppError("CONTENT_STAGE_INVALID", "Content stage is invalid.");
    }
    const item = this.getContentItem(input.contentItemId, input.actorUserId, true);
    const timestamp = nowIso();
    this.db.prepare(`
      UPDATE content_items
      SET stage = ?, review_status = ?, updated_at = ?
      WHERE id = ?
    `).run(input.toStage, reviewStatusForStage(input.toStage), timestamp, item.id);
    this.recordPipelineEvent(item.id, input.actorUserId, item.stage, input.toStage, input.reason ?? "");
    return this.getContentItem(item.id, input.actorUserId);
  }

  createPlatformVariants(input: { actorUserId: string; contentItemId: string; platforms?: string[] }): PlatformVariant[] {
    const item = this.getContentItem(input.contentItemId, input.actorUserId, true);
    const campaign = this.getCampaign(item.campaignId, input.actorUserId);
    const platforms = input.platforms?.length ? input.platforms : campaign.platforms;
    if (platforms.length === 0) {
      throw new AppError("PLATFORMS_REQUIRED", "At least one platform is required.");
    }
    const timestamp = nowIso();
    for (const platform of platforms) {
      const id = createId("variant");
      const format = platformFormat(platform);
      this.db.prepare(`
        INSERT INTO platform_post_variants (
          id, content_item_id, platform, caption, hashtags_json, cta, media_format, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'needs_review', ?, ?)
      `).run(
        id,
        item.id,
        platform,
        adaptCaption(item.caption, platform),
        JSON.stringify(item.hashtags),
        item.cta,
        format,
        timestamp,
        timestamp,
      );
    }
    this.audit.record({
      actorType: "user",
      actorId: input.actorUserId,
      action: "content.platform_variants_created",
      targetType: "content_item",
      targetId: item.id,
      outcome: "success",
      metadata: { platforms },
    });
    return this.listPlatformVariants(item.id, input.actorUserId);
  }

  scheduleVariant(input: { actorUserId: string; variantId: string; scheduledAt: string }): PublishingQueueItem {
    const variant = this.getVariant(input.variantId);
    const item = this.getContentItem(variant.contentItemId, input.actorUserId, true);
    const timestamp = nowIso();
    const queueId = createId("queue");
    this.db.prepare(`
      UPDATE platform_post_variants
      SET status = 'scheduled', scheduled_at = ?, updated_at = ?
      WHERE id = ?
    `).run(input.scheduledAt, timestamp, variant.id);
    this.db.prepare(`
      INSERT INTO publishing_queue (
        id, content_item_id, platform_variant_id, user_id, queue_status, scheduled_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)
    `).run(queueId, item.id, variant.id, input.actorUserId, input.scheduledAt, timestamp, timestamp);
    this.moveContentStage({ actorUserId: input.actorUserId, contentItemId: item.id, toStage: "scheduled", reason: "Scheduled platform variant." });
    return this.getQueueItem(queueId);
  }

  listQueue(input: { actorUserId: string; status?: QueueStatus }): PublishingQueueItem[] {
    const rows = this.db.prepare(`
      SELECT q.*
      FROM publishing_queue q
      JOIN content_items ci ON ci.id = q.content_item_id
      WHERE q.user_id = ? AND (? IS NULL OR q.queue_status = ?)
      ORDER BY q.scheduled_at ASC, q.created_at DESC
    `).all(input.actorUserId, input.status ?? null, input.status ?? null) as unknown as QueueRow[];
    return rows.map(mapQueueItem);
  }

  listContentItems(campaignId: string, actorUserId: string): ContentItem[] {
    this.getCampaign(campaignId, actorUserId);
    const rows = this.db.prepare(`
      SELECT *
      FROM content_items
      WHERE campaign_id = ? AND archived_at IS NULL
      ORDER BY updated_at DESC
    `).all(campaignId) as unknown as ContentItemRow[];
    return rows.map(mapContentItem);
  }

  private getCampaign(id: string, actorUserId: string, write = false): Campaign {
    const row = this.db.prepare("SELECT * FROM campaigns WHERE id = ? AND archived_at IS NULL").get(id) as CampaignRow | undefined;
    if (!row) {
      throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found.", 404);
    }
    this.platform.assertProjectAccess(row.project_id, actorUserId, write);
    return mapCampaign(row);
  }

  private getContentItem(id: string, actorUserId: string, write = false): ContentItem {
    const row = this.db.prepare("SELECT * FROM content_items WHERE id = ? AND archived_at IS NULL").get(id) as ContentItemRow | undefined;
    if (!row) {
      throw new AppError("CONTENT_ITEM_NOT_FOUND", "Content item not found.", 404);
    }
    this.platform.assertProjectAccess(row.project_id, actorUserId, write);
    return mapContentItem(row);
  }

  private updateContentFields(actorUserId: string, id: string, fields: {
    researchNotes: string;
    script: string;
    prompt: string;
    caption: string;
    hashtags: string[];
    translations: Record<string, string>;
    stage: ContentStage;
    reviewStatus: ReviewStatus;
  }): ContentItem {
    const item = this.getContentItem(id, actorUserId, true);
    const timestamp = nowIso();
    this.db.prepare(`
      UPDATE content_items
      SET research_notes = ?, script = ?, prompt = ?, caption = ?, hashtags_json = ?,
        translation_json = ?, stage = ?, review_status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      fields.researchNotes,
      fields.script,
      fields.prompt,
      fields.caption,
      JSON.stringify(fields.hashtags),
      JSON.stringify(fields.translations),
      fields.stage,
      fields.reviewStatus,
      timestamp,
      id,
    );
    this.recordPipelineEvent(id, actorUserId, item.stage, fields.stage, "AI Studio generated mock content package.");
    return this.getContentItem(id, actorUserId);
  }

  private listPlatformVariants(contentItemId: string, actorUserId: string): PlatformVariant[] {
    this.getContentItem(contentItemId, actorUserId);
    const rows = this.db.prepare("SELECT * FROM platform_post_variants WHERE content_item_id = ? ORDER BY created_at DESC")
      .all(contentItemId) as unknown as PlatformVariantRow[];
    return rows.map(mapVariant);
  }

  private getVariant(id: string): PlatformVariant {
    const row = this.db.prepare("SELECT * FROM platform_post_variants WHERE id = ?").get(id) as PlatformVariantRow | undefined;
    if (!row) {
      throw new AppError("PLATFORM_VARIANT_NOT_FOUND", "Platform variant not found.", 404);
    }
    return mapVariant(row);
  }

  private getQueueItem(id: string): PublishingQueueItem {
    const row = this.db.prepare("SELECT * FROM publishing_queue WHERE id = ?").get(id) as QueueRow | undefined;
    if (!row) {
      throw new AppError("QUEUE_ITEM_NOT_FOUND", "Queue item not found.", 404);
    }
    return mapQueueItem(row);
  }

  private recordPipelineEvent(contentItemId: string, actorUserId: string, fromStage: ContentStage | null, toStage: ContentStage, reason: string): void {
    this.db.prepare(`
      INSERT INTO content_pipeline_events (id, content_item_id, actor_user_id, from_stage, to_stage, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(createId("pipeevt"), contentItemId, actorUserId, fromStage, toStage, reason, nowIso());
  }
}

function mapCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    goal: row.goal,
    niche: row.niche,
    targetAudience: row.target_audience,
    platforms: parseJsonArray(row.platforms_json),
    connectedAccounts: parseJsonArray(row.connected_accounts_json),
    contentStyle: row.content_style,
    postingFrequency: row.posting_frequency,
    cta: row.cta,
    targetUrl: row.target_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    ownerUserId: row.owner_user_id,
    characterId: row.character_id ?? undefined,
    title: row.title,
    topic: row.topic,
    researchNotes: row.research_notes,
    script: row.script,
    prompt: row.prompt,
    caption: row.caption,
    hashtags: parseJsonArray(row.hashtags_json),
    translations: parseJsonObject(row.translation_json),
    cta: row.cta,
    stage: row.stage,
    reviewStatus: row.review_status,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduledAt: row.scheduled_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
  };
}

function mapVariant(row: PlatformVariantRow): PlatformVariant {
  return {
    id: row.id,
    contentItemId: row.content_item_id,
    platform: row.platform,
    caption: row.caption,
    hashtags: parseJsonArray(row.hashtags_json),
    cta: row.cta,
    mediaFormat: row.media_format,
    status: row.status,
    connectedAccountId: row.connected_account_id ?? undefined,
    scheduledAt: row.scheduled_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQueueItem(row: QueueRow): PublishingQueueItem {
  return {
    id: row.id,
    contentItemId: row.content_item_id,
    platformVariantId: row.platform_variant_id,
    userId: row.user_id,
    queueStatus: row.queue_status,
    scheduledAt: row.scheduled_at ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function buildHashtags(campaign: Campaign, item: ContentItem): string[] {
  const raw = ["AIContent", "OpenVideoStudio", campaign.niche, campaign.goal, item.topic];
  return raw
    .flatMap((value) => value.split(/\s+/))
    .map((value) => value.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .slice(0, 8);
}

function reviewStatusForStage(stage: ContentStage): ReviewStatus {
  if (stage === "review") return "needs_review";
  if (stage === "scheduled") return "scheduled";
  if (stage === "published") return "published";
  if (stage === "analyzed") return "published";
  return "draft";
}

function platformFormat(platform: string): string {
  const normalized = platform.toLowerCase();
  if (["tiktok", "youtube shorts", "instagram"].includes(normalized)) return "vertical_video_9_16";
  if (["x", "reddit", "telegram", "facebook"].includes(normalized)) return "image_or_video_with_caption";
  if (normalized === "pinterest") return "vertical_pin_2_3";
  return "multi_format";
}

function adaptCaption(caption: string, platform: string): string {
  const suffix = platform.toLowerCase() === "x" ? " Keep it short, punchy, and clickable." : ` Optimized for ${platform}.`;
  return `${caption}${suffix}`;
}
