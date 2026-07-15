import type { UserIdentity } from "convex/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { domainError } from "./errors";

type AuthCtx = QueryCtx | MutationCtx;

export async function requireIdentity(ctx: AuthCtx): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw domainError("UNAUTHENTICATED", "Authentication is required");
  }

  return identity;
}

export async function requireCurrentUser(ctx: AuthCtx): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx);
  const users = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (query) => query.eq("clerkId", identity.subject))
    .take(2);

  if (users.length === 0) {
    throw domainError("NOT_FOUND", "Authenticated user record was not found");
  }

  if (users.length > 1) {
    throw domainError(
      "VALIDATION",
      "Multiple user records exist for the authenticated identity",
    );
  }

  return users[0];
}

export async function requireAdmin(ctx: AuthCtx): Promise<Doc<"users">> {
  const user = await requireCurrentUser(ctx);

  if (user.role !== "admin") {
    throw domainError("FORBIDDEN", "Administrator access is required");
  }

  return user;
}
