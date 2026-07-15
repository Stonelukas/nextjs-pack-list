import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

type ClerkUserData = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{ id?: string; email_address?: string }>;
  image_url?: string;
  public_metadata?: { role?: unknown };
};

type ClerkWebhookEvent = {
  type: string;
  data: ClerkUserData;
};

const http = httpRouter();

function parseClerkEvent(value: unknown): ClerkWebhookEvent {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    typeof value.type !== "string" ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null
  ) {
    throw new Error("Invalid Clerk webhook payload");
  }
  return value as ClerkWebhookEvent;
}

function mapClerkUser(data: ClerkUserData) {
  if (!data.id) throw new Error("Clerk user event is missing an id");
  const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
  const primaryEmail = data.email_addresses?.find(
    (email) => email.id === data.primary_email_address_id,
  )?.email_address;
  return {
    clerkId: data.id,
    name: fullName || "Anonymous User",
    email: primaryEmail ?? data.email_addresses?.[0]?.email_address,
    imageUrl: data.image_url,
    role: data.public_metadata?.role === "admin" ? ("admin" as const) : ("user" as const),
  };
}

const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateClerkWebhook(request);

  switch (event.type) {
    case "user.created":
    case "user.updated":
      await ctx.runMutation(internal.users.upsertFromClerk, mapClerkUser(event.data));
      break;
    case "user.deleted":
      if (!event.data.id) throw new Error("Deleted Clerk user is missing an id");
      await ctx.runMutation(internal.users.deleteFromClerk, {
        clerkId: event.data.id,
      });
      break;
  }

  return new Response(null, { status: 200 });
});

async function validateClerkWebhook(
  request: Request,
): Promise<ClerkWebhookEvent> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing svix headers");
  }

  const body = await request.text();
  const verified = new Webhook(webhookSecret).verify(body, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  });
  return parseClerkEvent(verified);
}

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

export default http;
