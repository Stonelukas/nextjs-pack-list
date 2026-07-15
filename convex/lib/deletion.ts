import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type CleanupLinkedRecordsOptions = {
  contentIds: Iterable<string>;
  listIds?: Iterable<Id<"lists">>;
  deletedModeratorId?: Id<"users">;
};

export async function cleanupLinkedContentBatch(
  ctx: MutationCtx,
  contentId: string,
  limit: number,
): Promise<number> {
  const moderationRecords = await ctx.db
    .query("moderation")
    .withIndex("by_content", (q) => q.eq("contentId", contentId))
    .take(limit);
  const remainingCapacity = Math.max(0, limit - moderationRecords.length);
  const moderationHistory = remainingCapacity
    ? await ctx.db
        .query("moderationHistory")
        .withIndex("by_content", (q) => q.eq("contentId", contentId))
        .take(remainingCapacity)
    : [];
  for (const record of moderationRecords) await ctx.db.delete(record._id);
  for (const entry of moderationHistory) await ctx.db.delete(entry._id);
  return moderationRecords.length + moderationHistory.length;
}

export async function cleanupLinkedRecords(
  ctx: MutationCtx,
  {
    contentIds,
    listIds = [],
    deletedModeratorId,
  }: CleanupLinkedRecordsOptions,
) {
  const contentIdSet = new Set(contentIds);
  const moderationRecords = await ctx.db.query("moderation").collect();
  const moderationHistory = await ctx.db.query("moderationHistory").collect();

  for (const record of moderationRecords) {
    if (contentIdSet.has(record.contentId)) {
      await ctx.db.delete(record._id);
    } else if (
      deletedModeratorId !== undefined &&
      record.moderatorId === deletedModeratorId
    ) {
      await ctx.db.patch(record._id, { moderatorId: undefined });
    }
  }

  for (const entry of moderationHistory) {
    if (contentIdSet.has(entry.contentId)) {
      await ctx.db.delete(entry._id);
    } else if (
      deletedModeratorId !== undefined &&
      entry.moderatorId === deletedModeratorId
    ) {
      await ctx.db.patch(entry._id, { moderatorId: undefined });
    }
  }

  const shares = new Map<Id<"listShares">, true>();
  for (const listId of listIds) {
    const listShares = await ctx.db
      .query("listShares")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();
    for (const share of listShares) shares.set(share._id, true);
  }

  if (deletedModeratorId) {
    const userShares = await Promise.all([
      ctx.db
        .query("listShares")
        .withIndex("by_shared_by", (q) =>
          q.eq("sharedByUserId", deletedModeratorId),
        )
        .collect(),
      ctx.db
        .query("listShares")
        .withIndex("by_shared_with", (q) =>
          q.eq("sharedWithUserId", deletedModeratorId),
        )
        .collect(),
    ]);
    for (const share of userShares.flat()) shares.set(share._id, true);
  }

  for (const shareId of shares.keys()) await ctx.db.delete(shareId);
}
