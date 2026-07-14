// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { dashboardResult, refs } = vi.hoisted(() => ({
  refs: {
    userGrowth: Symbol("userGrowth"),
    lists: Symbol("lists"),
    usage: Symbol("usage"),
    templates: Symbol("templates"),
    dashboard: Symbol("dashboard"),
  },
  dashboardResult: {
    realTime: { activeUsers: 3, onlineNow: 0, listsToday: 2, completionsToday: 1 },
    trends: {
      newUsersToday: 1,
      newUsersWeek: 4,
      newListsWeek: 5,
      growthRate: "33.3" as string,
      growth: {
        status: "available" as "available" | "unavailable",
        percentage: 33.3 as number | null,
        formatted: "+33.3%",
        reason: undefined as "zero_baseline" | undefined,
      },
    },
  },
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    analytics: {
      getUserGrowthAnalytics: refs.userGrowth,
      getListAnalytics: refs.lists,
      getSystemUsageAnalytics: refs.usage,
      getTemplateAnalytics: refs.templates,
      getDashboardMetrics: refs.dashboard,
    },
  },
}));
vi.mock("convex/react", () => ({
  useQuery: (reference: symbol) => {
    if (reference === refs.userGrowth) return [];
    if (reference === refs.lists) return { dailyData: [] };
    if (reference === refs.templates) return { popularTemplates: [] };
    if (reference === refs.dashboard) return dashboardResult;
    return {
      userActivity: { high: 1, medium: 1, low: 1, inactive: 2 },
      overview: { completionRate: 50 },
    };
  },
}));
vi.mock("recharts", () => ({
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Cell: () => null,
  Line: () => null,
  LineChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import { AnalyticsDashboard } from "./analytics-dashboard";

beforeEach(() => {
  dashboardResult.trends.growthRate = "33.3";
  dashboardResult.trends.growth = {
    status: "available",
    percentage: 33.3,
    formatted: "+33.3%",
    reason: undefined,
  };
});

afterEach(cleanup);

describe("AnalyticsDashboard", () => {
  it("describes reactive live updates instead of offering a timer-only refresh", () => {
    render(<AnalyticsDashboard />);

    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    expect(screen.getByText(/updates live from convex/i)).toBeInTheDocument();
    expect(screen.getByText("Users with at least one list")).toBeInTheDocument();
    expect(screen.queryByText(/online now/i)).not.toBeInTheDocument();
  });

  it("renders zero-baseline user growth as unavailable instead of 100 percent", () => {
    dashboardResult.trends.growthRate = "100.0";
    dashboardResult.trends.growth = {
      status: "unavailable",
      percentage: null,
      formatted: "Unavailable",
      reason: "zero_baseline",
    };

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText(/percentage growth requires registrations in the prior 7-day period/i)).toBeInTheDocument();
    expect(screen.queryByText(/100(?:\.0)?%/)).not.toBeInTheDocument();
  });
});
