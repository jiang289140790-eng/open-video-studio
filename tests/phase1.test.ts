import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  AppError,
  AuthService,
  CreditLedger,
  StorageService,
  createMigratedDatabase,
} from "../src/index.js";

test("authentication creates users, logs in, authenticates sessions, and rejects invalid passwords", () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);

  const signup = auth.signUp({
    email: "Creator@Example.com",
    password: "correct horse battery staple",
    displayName: "Creator",
  });

  assert.equal(signup.user.email, "creator@example.com");
  assert.ok(signup.token.length > 20);
  assert.equal("passwordHash" in signup.user, false);

  const login = auth.login({
    email: "creator@example.com",
    password: "correct horse battery staple",
  });
  assert.equal(login.user.id, signup.user.id);

  const authenticated = auth.authenticate(login.token);
  assert.equal(authenticated.id, signup.user.id);

  assert.throws(
    () => auth.login({ email: "creator@example.com", password: "wrong password" }),
    (error) => error instanceof AppError && error.code === "AUTH_INVALID_CREDENTIALS",
  );
});

test("credit ledger grants, consumes, prevents overdraft, and records balance", () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);
  const session = auth.signUp({
    email: "billing@example.com",
    password: "correct horse battery staple",
    displayName: "Billing User",
  });
  const ledger = new CreditLedger(db);

  ledger.grant({
    accountId: session.user.id,
    userId: session.user.id,
    amount: 100,
    sourceType: "promotion",
    reason: "Initial test grant",
  });
  assert.equal(ledger.getBalance(session.user.id), 100);

  ledger.consume({
    accountId: session.user.id,
    userId: session.user.id,
    amount: 35,
    sourceType: "generation",
    sourceId: "job_test",
    operationCategory: "image_generation",
    reason: "Generated image",
  });
  assert.equal(ledger.getBalance(session.user.id), 65);
  assert.equal(ledger.list(session.user.id).length, 2);

  assert.throws(
    () => ledger.consume({
      accountId: session.user.id,
      userId: session.user.id,
      amount: 100,
      sourceType: "generation",
      operationCategory: "video_generation",
      reason: "Too expensive",
    }),
    (error) => error instanceof AppError && error.code === "CREDITS_INSUFFICIENT_BALANCE",
  );
});

test("storage persists media metadata and enforces owner access", () => {
  const db = createMigratedDatabase();
  const auth = new AuthService(db);
  const owner = auth.signUp({
    email: "owner@example.com",
    password: "correct horse battery staple",
    displayName: "Owner",
  });
  const other = auth.signUp({
    email: "other@example.com",
    password: "correct horse battery staple",
    displayName: "Other",
  });

  const root = mkdtempSync(join(tmpdir(), "ovs-storage-"));
  try {
    const storage = new StorageService(db, root);
    const asset = storage.saveAsset({
      ownerUserId: owner.user.id,
      assetType: "image",
      sourceType: "upload",
      displayName: "hero image.png",
      data: "fake image bytes",
      metadata: { width: 1280, height: 720 },
      rightsStatus: "owned",
      moderationStatus: "approved",
    });

    assert.equal(asset.ownerUserId, owner.user.id);
    assert.equal(asset.displayName, "hero image.png");
    assert.equal(asset.metadata.width, 1280);
    assert.equal(asset.rightsStatus, "owned");

    const loaded = storage.getAsset(asset.id, owner.user.id);
    assert.equal(loaded.storageKey, asset.storageKey);

    assert.throws(
      () => storage.getAsset(asset.id, other.user.id),
      (error) => error instanceof AppError && error.code === "STORAGE_ASSET_FORBIDDEN",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
