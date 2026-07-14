import type { MutationCtx, QueryCtx } from "../_generated/server";

const GLOBAL_TEMPLATE_STATS_KEY = "global" as const;

export async function readTemplateStats(ctx: QueryCtx | MutationCtx) {
  const stats = await ctx.db
    .query("templateStats")
    .withIndex("by_key", (q) => q.eq("key", GLOBAL_TEMPLATE_STATS_KEY))
    .unique();
  return stats
    ? {
        totalTemplates: stats.totalTemplates,
        totalUsage: stats.totalUsage,
      }
    : { totalTemplates: 0, totalUsage: 0 };
}

export async function replaceTemplateStats(
  ctx: MutationCtx,
  values: { totalTemplates: number; totalUsage: number },
) {
  const existing = await ctx.db
    .query("templateStats")
    .withIndex("by_key", (q) => q.eq("key", GLOBAL_TEMPLATE_STATS_KEY))
    .unique();
  const next = {
    key: GLOBAL_TEMPLATE_STATS_KEY,
    totalTemplates: Math.max(0, values.totalTemplates),
    totalUsage: Math.max(0, values.totalUsage),
    updatedAt: Date.now(),
  };
  if (existing) {
    await ctx.db.patch(existing._id, next);
    return existing._id;
  }
  return ctx.db.insert("templateStats", next);
}

export async function adjustTemplateStats(
  ctx: MutationCtx,
  delta: { totalTemplates?: number; totalUsage?: number },
) {
  const current = await readTemplateStats(ctx);
  return replaceTemplateStats(ctx, {
    totalTemplates: current.totalTemplates + (delta.totalTemplates ?? 0),
    totalUsage: current.totalUsage + (delta.totalUsage ?? 0),
  });
}
