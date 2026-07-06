import { AddressInfo } from "node:net";
import test from "node:test";
import assert from "node:assert/strict";
import { createMigratedDatabase, createMvpApiServer } from "../src/index.js";

test("MVP API supports auth, profile, credits, purchase, and orders", async () => {
  const db = createMigratedDatabase();
  const server = createMvpApiServer(db);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const signup = await request(baseUrl, "POST", "/auth/signup", {
      email: "api-user@example.com",
      password: "correct horse battery staple",
      displayName: "API User",
    });
    assert.equal(signup.status, 200);
    assert.equal(signup.body.user.email, "api-user@example.com");
    assert.equal(typeof signup.body.token, "string");

    const token = signup.body.token as string;
    const me = await request(baseUrl, "GET", "/me", undefined, token);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.displayName, "API User");

    const profile = await request(baseUrl, "PATCH", "/me", {
      displayName: "MVP Producer",
      timezone: "Asia/Shanghai",
      onboardingState: "mvp_ready",
    }, token);
    assert.equal(profile.status, 200);
    assert.equal(profile.body.user.displayName, "MVP Producer");
    assert.equal(profile.body.user.onboardingState, "mvp_ready");

    const initialCredits = await request(baseUrl, "GET", "/credits", undefined, token);
    assert.equal(initialCredits.status, 200);
    assert.equal(initialCredits.body.balance, 0);

    const purchase = await request(baseUrl, "POST", "/credits/purchase", {
      credits: 100,
      amountCents: 1900,
      providerReference: "local_test_checkout",
    }, token);
    assert.equal(purchase.status, 200);
    assert.equal(purchase.body.balance, 100);
    assert.equal(purchase.body.order.status, "completed");

    const credits = await request(baseUrl, "GET", "/credits", undefined, token);
    assert.equal(credits.body.balance, 100);
    assert.equal(credits.body.transactions.length, 1);

    const orders = await request(baseUrl, "GET", "/orders", undefined, token);
    assert.equal(orders.status, 200);
    assert.equal(orders.body.orders.length, 1);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("MVP API rejects protected routes without bearer token", async () => {
  const db = createMigratedDatabase();
  const server = createMvpApiServer(db);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await request(baseUrl, "GET", "/me");
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "AUTH_TOKEN_REQUIRED");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
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
