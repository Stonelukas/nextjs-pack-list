import { convexTest } from "convex-test";
import { Webhook } from "svix";
import { afterEach, describe, expect, it, vi } from "vitest";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const secret = `whsec_${Buffer.from("task-3-webhook-secret").toString("base64")}`;

function createTestBackend() {
  return convexTest(schema, modules);
}

function signedRequestBody(body: string) {
  const messageId = "msg_task_3";
  const timestamp = new Date();
  const signature = new Webhook(secret).sign(messageId, timestamp, body);

  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": messageId,
      "svix-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
      "svix-signature": signature,
    },
    body,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("Clerk webhook", () => {
  it("rejects an invalid Svix signature", async () => {
    vi.stubEnv("CLERK_WEBHOOK_SECRET", secret);
    const t = createTestBackend();
    const request = signedRequestBody(
      JSON.stringify({ type: "user.created", data: { id: "user_invalid" } }),
    );

    await expect(
      t.fetch("/clerk-webhook", {
        ...request,
        headers: {
          ...request.headers,
          "svix-signature": "v1,invalid",
        },
      }),
    ).rejects.toThrow();
  });

  it("creates an admin only from signed public metadata", async () => {
    vi.stubEnv("CLERK_WEBHOOK_SECRET", secret);
    const t = createTestBackend();
    const body = JSON.stringify({
      type: "user.created",
      data: {
        id: "clerk-admin",
        first_name: "Signed",
        last_name: "Admin",
        primary_email_address_id: "email-primary",
        email_addresses: [
          { id: "email-secondary", email_address: "secondary@example.com" },
          { id: "email-primary", email_address: "admin@example.com" },
        ],
        image_url: "https://example.com/admin.png",
        public_metadata: { role: "admin" },
      },
    });

    const response = await t.fetch(
      "/clerk-webhook",
      signedRequestBody(body),
    );
    expect(response.status).toBe(200);

    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", "clerk-admin"))
        .unique(),
    );
    expect(user).toMatchObject({
      name: "Signed Admin",
      email: "admin@example.com",
      role: "admin",
    });
  });

  it("defaults unsupported signed roles to user and deletes through the webhook", async () => {
    vi.useFakeTimers();
    vi.stubEnv("CLERK_WEBHOOK_SECRET", secret);
    const t = createTestBackend();
    const createdBody = JSON.stringify({
      type: "user.created",
      data: {
        id: "clerk-user",
        first_name: "Regular",
        public_metadata: { role: "owner" },
      },
    });

    await t.fetch("/clerk-webhook", signedRequestBody(createdBody));
    const created = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", "clerk-user"))
        .unique(),
    );
    expect(created?.role).toBe("user");

    const deletedBody = JSON.stringify({
      type: "user.deleted",
      data: { id: "clerk-user" },
    });
    await t.fetch("/clerk-webhook", signedRequestBody(deletedBody));
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const deleted = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", "clerk-user"))
        .unique(),
    );
    expect(deleted).toBeNull();
  });
});
