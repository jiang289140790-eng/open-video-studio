import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AddressInfo } from "node:net";
import test from "node:test";
import assert from "node:assert/strict";
import {
  PlatformService,
  createMigratedDatabase,
  createMvpApiServer,
} from "../src/index.js";

test("Sprint 2 API supports reusable character, asset, share, search, and generation history loop", async () => {
  const db = createMigratedDatabase();
  const storageRoot = mkdtempSync(join(tmpdir(), "ovs-sprint2-api-"));
  const server = createMvpApiServer(db, { storageRoot });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const signup = await request(baseUrl, "POST", "/auth/signup", {
      email: "sprint2@example.com",
      password: "correct horse battery staple",
      displayName: "Sprint 2 User",
    });
    const token = signup.body.token as string;
    const userId = signup.body.user.id as string;

    const platform = new PlatformService(db);
    const workspace = platform.createWorkspace({
      ownerUserId: userId,
      name: "MVP Studio",
      slug: "mvp-sprint-2",
    });
    const project = platform.createProject({
      workspaceId: workspace.id,
      ownerUserId: userId,
      name: "Reusable Asset Loop",
    });

    await request(baseUrl, "POST", "/credits/purchase", {
      credits: 120,
      amountCents: 1900,
    }, token);

    const reference = await request(baseUrl, "POST", "/assets", {
      projectId: project.id,
      assetType: "image",
      sourceType: "reference",
      displayName: "hero-reference.txt",
      data: "reference image bytes",
      tags: ["hero", "reference"],
      rightsStatus: "owned",
      moderationStatus: "approved",
    }, token);
    assert.equal(reference.status, 200);

    const createdCharacter = await request(baseUrl, "POST", "/characters", {
      name: "Premium Presenter",
      description: "Reusable launch presenter.",
      characterType: "persona",
      referenceAssetId: reference.body.asset.id,
      coverAssetId: reference.body.asset.id,
      tags: ["launch", "presenter"],
      memory: { tone: "calm", wardrobe: "minimal black" },
      consistencyStatus: "locked",
      promptSeed: "premium SaaS presenter",
      safetyStatus: "approved",
    }, token);
    assert.equal(createdCharacter.status, 200);
    assert.equal(createdCharacter.body.character.consistencyStatus, "locked");

    const characterId = createdCharacter.body.character.id as string;
    const updatedCharacter = await request(baseUrl, "PATCH", "/characters", {
      id: characterId,
      tags: ["launch", "presenter", "video"],
      memory: { tone: "calm", wardrobe: "minimal black", lighting: "soft studio" },
    }, token);
    assert.deepEqual(updatedCharacter.body.character.tags, ["launch", "presenter", "video"]);

    const image = await request(baseUrl, "POST", "/generate/image", {
      projectId: project.id,
      characterId,
      sourceAssetId: reference.body.asset.id,
      prompt: "Create a premium SaaS launch frame with a reusable presenter.",
      provider: "local_api",
      model: "local-image-v0",
      aspectRatio: "16:9",
      resolution: "1280x720",
      displayName: "launch-frame.json",
      metadata: { campaign: "mvp" },
    }, token);
    assert.equal(image.status, 200);
    assert.equal(image.body.asset.projectId, project.id);
    assert.equal(image.body.asset.characterId, characterId);
    assert.equal(image.body.asset.generationJobId, image.body.job.id);
    assert.equal(image.body.job.provider, "local_api");
    assert.equal(image.body.job.model, "local-image-v0");

    const approvedImage = await request(baseUrl, "POST", "/assets/review", {
      assetId: image.body.asset.id,
    }, token);
    assert.equal(approvedImage.body.asset.moderationStatus, "approved");

    const video = await request(baseUrl, "POST", "/generate/video", {
      projectId: project.id,
      characterId,
      sourceAssetId: image.body.asset.id,
      prompt: "Animate the launch frame into an eight second teaser.",
      provider: "local_api",
      model: "local-video-v0",
      aspectRatio: "9:16",
      resolution: "1080x1920",
      durationSeconds: 8,
      displayName: "launch-teaser.json",
    }, token);
    assert.equal(video.status, 200);
    assert.equal(video.body.asset.assetType, "video");

    const favorites = await request(baseUrl, "POST", "/assets/favorite", {
      assetId: video.body.asset.id,
      isFavorite: true,
    }, token);
    assert.equal(favorites.body.asset.isFavorite, true);

    const search = await request(
      baseUrl,
      "GET",
      `/assets?projectId=${project.id}&characterId=${characterId}&query=launch&assetType=image`,
      undefined,
      token,
    );
    assert.equal(search.status, 200);
    assert.equal(search.body.assets.length, 1);
    assert.equal(search.body.assets[0].id, image.body.asset.id);

    const share = await request(baseUrl, "POST", "/assets/share", {
      assetId: approvedImage.body.asset.id,
    }, token);
    assert.equal(share.status, 200);
    assert.equal(typeof share.body.share.token, "string");

    const publicShare = await request(baseUrl, "GET", `/share?token=${share.body.share.token}`);
    assert.equal(publicShare.status, 200);
    assert.equal(publicShare.body.asset.id, approvedImage.body.asset.id);

    const history = await request(
      baseUrl,
      "GET",
      `/generation/history?characterId=${characterId}&provider=local_api&status=completed`,
      undefined,
      token,
    );
    assert.equal(history.status, 200);
    assert.equal(history.body.history.length, 2);
    assert.ok(history.body.history.every((job: { estimatedCostCents: number }) => job.estimatedCostCents > 0));
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    rmSync(storageRoot, { recursive: true, force: true });
  }
});

async function request(
  baseUrl: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string,
): Promise<{ status: number; body: any }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}
