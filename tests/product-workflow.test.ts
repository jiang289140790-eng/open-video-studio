import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  AuthService,
  BillingService,
  CharacterService,
  CreditLedger,
  GalleryService,
  GenerationService,
  StorageService,
  UserRepository,
  createMigratedDatabase,
} from "../src/index.js";
import { STARTER_CREDITS } from "../src/credits/starterCredits.js";

test("one user can register, buy credits, generate, store, review, share, and inspect history", () => {
  const db = createMigratedDatabase();
  const storageRoot = mkdtempSync(join(tmpdir(), "ovs-workflow-"));

  try {
    const auth = new AuthService(db);
    const users = new UserRepository(db);
    const credits = new CreditLedger(db);
    const billing = new BillingService(db);
    const storage = new StorageService(db, storageRoot);
    const characters = new CharacterService(db, storage);
    const generation = new GenerationService(db, storage);
    const gallery = new GalleryService(db, storage);

    const session = auth.signUp({
      email: "workflow@example.com",
      password: "correct horse battery staple",
      displayName: "Workflow User",
    });
    const user = users.updateProfile(session.user.id, {
      displayName: "Workflow Producer",
      onboardingState: "generation_ready",
      timezone: "Asia/Shanghai",
    });
    assert.equal(user.displayName, "Workflow Producer");
    assert.equal(user.onboardingState, "generation_ready");

    const order = billing.purchaseCredits({
      userId: user.id,
      credits: 120,
      amountCents: 1900,
      providerReference: "local_checkout_test",
    });
    assert.equal(order.status, "completed");
    assert.equal(credits.getBalance(user.id), STARTER_CREDITS + 120);

    const reference = storage.saveAsset({
      ownerUserId: user.id,
      assetType: "image",
      sourceType: "upload",
      displayName: "brand-reference.txt",
      data: "reference bytes",
      rightsStatus: "owned",
      moderationStatus: "approved",
    });
    const character = characters.createCharacter({
      ownerUserId: user.id,
      name: "Studio Presenter",
      description: "Approved presenter for campaign drafts.",
      referenceAssetId: reference.id,
      promptSeed: "calm professional presenter",
      rightsStatus: "owned",
      safetyStatus: "approved",
    });

    const imageJob = generation.enqueue({
      userId: user.id,
      mediaType: "image",
      prompt: "Create a product launch concept frame for a premium AI video studio.",
      aspectRatio: "16:9",
      sourceAssetId: reference.id,
      characterId: character.id,
    });
    assert.equal(imageJob.status, "queued");
    assert.equal(imageJob.costCredits, 8);
    assert.equal(credits.getBalance(user.id), STARTER_CREDITS + 112);

    generation.startJob(imageJob.id, user.id);
    const imageResult = generation.completeJob({
      jobId: imageJob.id,
      userId: user.id,
      data: "generated image output",
      displayName: "launch-frame.txt",
      metadata: { width: 1280, height: 720 },
    });
    assert.equal(imageResult.job.status, "completed");
    assert.equal(imageResult.asset.moderationStatus, "pending");

    const approvedAsset = gallery.approveAsset(imageResult.asset.id, user.id);
    assert.equal(approvedAsset.moderationStatus, "approved");

    const share = gallery.shareAsset(approvedAsset.id, user.id);
    const publicAsset = gallery.getPublicAsset(share.token);
    assert.equal(publicAsset.asset.id, approvedAsset.id);
    assert.equal(publicAsset.asset.visibilityStatus, "public");

    const videoJob = generation.enqueue({
      userId: user.id,
      mediaType: "video",
      prompt: "Turn the approved launch frame into an 8 second campaign teaser.",
      aspectRatio: "9:16",
      durationSeconds: 8,
      sourceAssetId: approvedAsset.id,
      characterId: character.id,
    });
    assert.equal(videoJob.costCredits, 24);
    assert.equal(credits.getBalance(user.id), STARTER_CREDITS + 88);

    generation.startJob(videoJob.id, user.id);
    const videoResult = generation.completeJob({
      jobId: videoJob.id,
      userId: user.id,
      data: "generated video output",
      displayName: "launch-teaser.txt",
      metadata: { durationSeconds: 8, aspectRatio: "9:16" },
    });
    assert.equal(videoResult.job.status, "completed");

    const history = generation.listHistory(user.id);
    assert.equal(history.length, 2);
    assert.equal(history[0].mediaType, "video");

    const galleryItems = gallery.listUserGallery(user.id);
    assert.equal(galleryItems.length, 3);
    assert.ok(galleryItems.some((asset) => asset.id === approvedAsset.id));
    assert.equal(billing.listOrders(user.id).length, 1);
    assert.equal(characters.listCharacters(user.id).length, 1);
  } finally {
    rmSync(storageRoot, { recursive: true, force: true });
  }
});
