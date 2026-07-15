import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { readTemplateStats } from "./lib/template_stats";

const COMPARISON_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

type MetricChange =
  | {
      status: "available";
      percentage: number;
      formatted: string;
    }
  | {
      status: "unavailable";
      percentage: null;
      formatted: "Unavailable";
      reason: "zero_baseline" | "historical_data_unavailable";
    };

function comparableChange(current: number, prior: number): MetricChange {
  if (prior === 0) {
    return {
      status: "unavailable",
      percentage: null,
      formatted: "Unavailable",
      reason: "zero_baseline",
    };
  }

  const percentage = ((current - prior) / prior) * 100;
  return {
    status: "available",
    percentage,
    formatted: `${percentage >= 0 ? "+" : ""}${percentage.toFixed(1)}%`,
  };
}

const historicalDataUnavailable = (): MetricChange => ({
  status: "unavailable",
  percentage: null,
  formatted: "Unavailable",
  reason: "historical_data_unavailable",
});

// Get user growth analytics over time
export const getUserGrowthAnalytics = query({
  args: {
    days: v.optional(v.number()), // Number of days to look back (default: 30)
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { days = 30 } = args;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const users = await ctx.db.query("users").collect();
    
    // Group users by creation date
    const usersByDate = new Map<string, number>();
    
    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      usersByDate.set(dateKey, 0);
    }
    
    // Count users by date
    users.forEach(user => {
      if (user.createdAt && user.createdAt >= startDate) {
        const date = new Date(user.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        const current = usersByDate.get(dateKey) || 0;
        usersByDate.set(dateKey, current + 1);
      }
    });
    
    // Convert to array and calculate cumulative
    const sortedDates = Array.from(usersByDate.keys()).sort();
    let cumulative = 0;
    
    return sortedDates.map(date => {
      const newUsers = usersByDate.get(date) || 0;
      cumulative += newUsers;
      
      return {
        date,
        newUsers,
        totalUsers: cumulative,
        formattedDate: new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
      };
    }).reverse(); // Most recent first
  },
});

// Get list creation analytics
export const getListAnalytics = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { days = 30 } = args;
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const [regularLists, templateStats] = await Promise.all([
      ctx.db
        .query("lists")
        .withIndex("by_template", (q) => q.eq("isTemplate", false))
        .collect(),
      readTemplateStats(ctx),
    ]);
    
    // Group by date
    const listsByDate = new Map<string, { created: number; completed: number }>();
    
    // Initialize dates
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      listsByDate.set(dateKey, { created: 0, completed: 0 });
    }
    
    // Count list creation
    regularLists.forEach(list => {
      if (list.createdAt && list.createdAt >= startDate) {
        const date = new Date(list.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        const current = listsByDate.get(dateKey);
        if (current) {
          current.created += 1;
        }
      }
    });
    
    // Count list completion
    regularLists.forEach(list => {
      if (list.completedAt && list.completedAt >= startDate) {
        const date = new Date(list.completedAt);
        const dateKey = date.toISOString().split('T')[0];
        const current = listsByDate.get(dateKey);
        if (current) {
          current.completed += 1;
        }
      }
    });
    
    const sortedDates = Array.from(listsByDate.keys()).sort();
    
    return {
      dailyData: sortedDates.map(date => {
        const data = listsByDate.get(date)!;
        return {
          date,
          created: data.created,
          completed: data.completed,
          formattedDate: new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
        };
      }).reverse(),
      summary: {
        totalLists: regularLists.length,
        completedLists: regularLists.filter(l => l.completedAt).length,
        activeLists: regularLists.filter(l => !l.completedAt).length,
        totalTemplates: templateStats.totalTemplates,
      },
    };
  },
});

// Get system usage analytics
export const getSystemUsageAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [users, regularLists, categories, items, templateStats] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db
          .query("lists")
          .withIndex("by_template", (q) => q.eq("isTemplate", false))
          .collect(),
        ctx.db.query("categories").collect(),
        ctx.db.query("items").collect(),
        readTemplateStats(ctx),
      ]);
    
    // Calculate user activity levels
    const userActivity = users.map(user => {
      const userLists = regularLists.filter(l => l.userId === user._id);
      const completedLists = userLists.filter(l => l.completedAt);
      
      return {
        userId: user._id,
        totalLists: userLists.length,
        completedLists: completedLists.length,
        activityLevel: userLists.length === 0 ? 'inactive' : 
                      userLists.length <= 2 ? 'low' :
                      userLists.length <= 5 ? 'medium' : 'high',
      };
    });
    
    const activityDistribution = {
      inactive: userActivity.filter(u => u.activityLevel === 'inactive').length,
      low: userActivity.filter(u => u.activityLevel === 'low').length,
      medium: userActivity.filter(u => u.activityLevel === 'medium').length,
      high: userActivity.filter(u => u.activityLevel === 'high').length,
    };
    
    // Calculate lifetime overview values.
    const completionRate = regularLists.length > 0
      ? (regularLists.filter(l => l.completedAt).length / regularLists.length) * 100
      : 0;

    const avgItemsPerList = regularLists.length > 0
      ? items.length / regularLists.length
      : 0;

    // Top-metric changes compare adjacent seven-day periods. The completion
    // metric compares completion rates for the lists created in each period.
    const now = Date.now();
    const currentPeriodStart = now - COMPARISON_PERIOD_MS;
    const priorPeriodStart = now - (2 * COMPARISON_PERIOD_MS);
    const isCurrentPeriod = (timestamp?: number) =>
      timestamp !== undefined && timestamp >= currentPeriodStart;
    const isPriorPeriod = (timestamp?: number) =>
      timestamp !== undefined && timestamp >= priorPeriodStart && timestamp < currentPeriodStart;
    const currentLists = regularLists.filter((list) => isCurrentPeriod(list.createdAt));
    const priorLists = regularLists.filter((list) => isPriorPeriod(list.createdAt));
    const currentActiveUsers = new Set(currentLists.map((list) => list.userId)).size;
    const priorActiveUsers = new Set(priorLists.map((list) => list.userId)).size;
    const periodCompletionRate = (periodLists: typeof regularLists) =>
      periodLists.length > 0
        ? (periodLists.filter((list) => list.completedAt !== undefined).length / periodLists.length) * 100
        : 0;
    const currentCompletionRate = periodCompletionRate(currentLists);
    const priorCompletionRate = periodCompletionRate(priorLists);
    const totalTemplateUsage = templateStats.totalUsage;

    return {
      overview: {
        totalUsers: users.length,
        totalLists: regularLists.length,
        totalTemplates: templateStats.totalTemplates,
        totalCategories: categories.length,
        totalItems: items.length,
        completionRate: Math.round(completionRate * 100) / 100,
        avgItemsPerList: Math.round(avgItemsPerList * 100) / 100,
      },
      userActivity: activityDistribution,
      topMetrics: [
        {
          name: "Active Users",
          value: currentActiveUsers,
          change: comparableChange(currentActiveUsers, priorActiveUsers),
        },
        {
          name: "Lists Created",
          value: currentLists.length,
          change: comparableChange(currentLists.length, priorLists.length),
        },
        {
          name: "Completion Rate",
          value: `${Math.round(currentCompletionRate)}%`,
          change: comparableChange(currentCompletionRate, priorCompletionRate),
        },
        {
          name: "Templates Used",
          value: totalTemplateUsage,
          change: historicalDataUnavailable(),
        },
      ],
    };
  },
});

// Get popular templates analytics
export const getTemplateAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [templates, templateStats] = await Promise.all([
      ctx.db.query("templates").withIndex("by_usage").order("desc").take(10),
      readTemplateStats(ctx),
    ]);
    const popularTemplates = templates.map((template) => ({
      id: template._id,
      name: template.name,
      description: template.description,
      usageCount: template.usageCount ?? 0,
      createdAt: template.createdAt,
    }));

    return {
      popularTemplates,
      totalTemplates: templateStats.totalTemplates,
      totalUsage: templateStats.totalUsage,
      averageUsage:
        templateStats.totalTemplates > 0
          ? templateStats.totalUsage / templateStats.totalTemplates
          : 0,
    };
  },
});

// Get real-time dashboard metrics
export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [users, regularLists] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db
        .query("lists")
        .withIndex("by_template", (q) => q.eq("isTemplate", false))
        .collect(),
    ]);

    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

    // Recent activity
    const recentUsers = users.filter(u => u.createdAt && u.createdAt >= dayAgo).length;
    const recentLists = regularLists.filter(l => l.createdAt && l.createdAt >= dayAgo).length;
    const recentCompletions = regularLists.filter(l => l.completedAt && l.completedAt >= dayAgo).length;
    
    // Weekly activity
    const weeklyUsers = users.filter(u => u.createdAt && u.createdAt >= weekAgo).length;
    const priorWeeklyUsers = users.filter(
      (user) => user.createdAt && user.createdAt >= twoWeeksAgo && user.createdAt < weekAgo,
    ).length;
    const weeklyLists = regularLists.filter(l => l.createdAt && l.createdAt >= weekAgo).length;
    const activeUsers = new Set(regularLists.map((list) => list.userId)).size;
    const growth = comparableChange(weeklyUsers, priorWeeklyUsers);

    return {
      realTime: {
        activeUsers,
        // Kept at zero for backward compatibility until a real presence contract exists.
        onlineNow: 0,
        listsToday: recentLists,
        completionsToday: recentCompletions,
      },
      trends: {
        newUsersToday: recentUsers,
        newUsersWeek: weeklyUsers,
        newListsToday: recentLists,
        newListsWeek: weeklyLists,
        /** @deprecated Use `growth`; `"0.0"` is only an unavailable compatibility sentinel. */
        growthRate: growth.status === "available" ? growth.percentage.toFixed(1) : "0.0",
        growth,
      },
    };
  },
});
