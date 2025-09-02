import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

const http = httpRouter();

// Clerk webhook handler
const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateClerkWebhook(request);
  
  switch (event.type) {
    case "user.created":
      await ctx.runMutation(api.users.createUser, {
        clerkId: event.data.id,
        name: `${event.data.first_name || ""} ${event.data.last_name || ""}`.trim() || "Anonymous User",
        email: event.data.email_addresses?.[0]?.email_address,
        imageUrl: event.data.image_url,
      });
      break;
      
    case "user.updated":
      await ctx.runMutation(api.users.updateUserFromWebhook, {
        clerkId: event.data.id,
        name: `${event.data.first_name || ""} ${event.data.last_name || ""}`.trim() || "Anonymous User",
        email: event.data.email_addresses?.[0]?.email_address,
        imageUrl: event.data.image_url,
      });
      break;

    case "user.deleted":
      await ctx.runMutation(api.users.deleteUserFromWebhook, {
        clerkId: event.data.id || "",
      });
      break;
  }
  
  return new Response(null, {
    status: 200,
  });
});

async function validateClerkWebhook(request: Request): Promise<WebhookEvent> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
  }
  
  const svix_id = request.headers.get("svix-id");
  const svix_timestamp = request.headers.get("svix-timestamp");
  const svix_signature = request.headers.get("svix-signature");
  
  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error("Missing svix headers");
  }
  
  const body = await request.text();
  const wh = new Webhook(webhookSecret);
  
  return wh.verify(body, {
    "svix-id": svix_id,
    "svix-timestamp": svix_timestamp,
    "svix-signature": svix_signature,
  }) as WebhookEvent;
}

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

export default http;
