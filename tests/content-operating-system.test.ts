import test from "node:test";
import assert from "node:assert/strict";
import {
  AuthService,
  ContentOperatingService,
  PlatformService,
  createMigratedDatabase,
} from "../src/index.js";

test("AI content operating system creates campaign, studio draft, pipeline, variants, and queue", () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);
  const platform = new PlatformService(db);
  const content = new ContentOperatingService(db);

  const creator = auth.signUp({
    email: "content-operator@example.com",
    password: "correct horse battery staple",
    displayName: "Content Operator",
  });

  const workspace = platform.createWorkspace({
    ownerUserId: creator.user.id,
    name: "Content Studio",
  });
  const project = platform.createProject({
    workspaceId: workspace.id,
    ownerUserId: creator.user.id,
    name: "Reusable Launch Campaign",
  });

  const campaign = content.createCampaign({
    actorUserId: creator.user.id,
    workspaceId: workspace.id,
    projectId: project.id,
    name: "Creator Growth Loop",
    goal: "traffic",
    niche: "AI video creators",
    targetAudience: "solo creators and small studios",
    platforms: ["X", "TikTok", "YouTube Shorts", "Pinterest"],
    connectedAccounts: ["demo-x-account"],
    contentStyle: "dark premium creator platform",
    postingFrequency: "daily",
    cta: "Start generating free",
    targetUrl: "https://example.com/open-video-studio",
    status: "active",
  });

  assert.equal(campaign.status, "active");
  assert.deepEqual(campaign.platforms, ["X", "TikTok", "YouTube Shorts", "Pinterest"]);

  const idea = content.createContentItem({
    actorUserId: creator.user.id,
    campaignId: campaign.id,
    title: "Turn one prompt into a full content pack",
    topic: "Reusable AI video assets",
  });
  assert.equal(idea.stage, "idea");

  const draft = content.generateStudioDraft({
    actorUserId: creator.user.id,
    contentItemId: idea.id,
  });
  assert.equal(draft.stage, "caption");
  assert.equal(draft.reviewStatus, "needs_review");
  assert.match(draft.script, /Hook:/);
  assert.match(draft.prompt, /Premium|premium|creator/i);
  assert.ok(draft.hashtags.includes("AIContent"));

  const review = content.moveContentStage({
    actorUserId: creator.user.id,
    contentItemId: draft.id,
    toStage: "review",
    reason: "Ready for human review.",
  });
  assert.equal(review.stage, "review");
  assert.equal(review.reviewStatus, "needs_review");

  const variants = content.createPlatformVariants({
    actorUserId: creator.user.id,
    contentItemId: review.id,
  });
  assert.equal(variants.length, 4);
  assert.ok(variants.some((variant) => variant.platform === "TikTok" && variant.mediaFormat === "vertical_video_9_16"));

  const scheduled = content.scheduleVariant({
    actorUserId: creator.user.id,
    variantId: variants[0].id,
    scheduledAt: "2026-07-09T09:00:00.000Z",
  });
  assert.equal(scheduled.queueStatus, "scheduled");
  assert.equal(scheduled.contentItemId, review.id);

  const queue = content.listQueue({ actorUserId: creator.user.id, status: "scheduled" });
  assert.equal(queue.length, 1);
  assert.equal(queue[0].platformVariantId, variants[0].id);

  const rows = db.prepare("SELECT to_stage FROM content_pipeline_events WHERE content_item_id = ? ORDER BY created_at ASC").all(review.id) as Array<{ to_stage: string }>;
  assert.ok(rows.map((row) => row.to_stage).includes("scheduled"));
});
