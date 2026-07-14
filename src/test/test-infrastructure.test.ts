import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderAppRoute } from "@/test/render";
import * as runtimeModule from "@/test/mocks/runtime";
import {
  FIXED_EPOCH,
  clearTestRuntime,
  createDomainError,
  createTestRuntime,
  getTestRuntime,
  regularUserScenario,
  signedOutScenario,
} from "@/test/mocks/runtime";
import type { RuntimeEnvResult } from "@/lib/env";

const unconfiguredRuntime = {
  status: "unconfigured",
  issues: [
    {
      key: "VITE_CLERK_PUBLISHABLE_KEY",
      message: "Missing required environment variable",
    },
  ],
} satisfies RuntimeEnvResult;

describe("Task 10 shared test runtime", () => {
  it("TI-01 returns only owned lists and visible templates", () => {
    const runtime = createTestRuntime(regularUserScenario());

    const lists = runtime.query("lists:getListSummaries", {
      paginationOpts: { numItems: 50, cursor: null },
    }) as {
      page: Array<{ _id: string }>;
    };
    const publicTemplates = runtime.query(
      "templates:getPublicTemplateSummaries",
      { paginationOpts: { numItems: 50, cursor: null } },
    ) as {
      page: Array<{ _id: string; categoryCount: number; itemCount: number }>;
    };
    const ownedTemplates = runtime.query(
      "templates:getOwnedTemplateSummaries",
      { paginationOpts: { numItems: 50, cursor: null } },
    ) as {
      page: Array<{ _id: string; categoryCount: number; itemCount: number }>;
    };

    expect(lists.page.map((list) => list._id)).toEqual([
      "list_completed",
      "list_alpine",
    ]);
    expect(publicTemplates.page).toEqual([
      expect.objectContaining({
        _id: "template_weekend",
        categoryCount: 2,
        itemCount: 3,
      }),
    ]);
    expect(ownedTemplates.page).toEqual([
      expect.objectContaining({
        _id: "template_conference",
        categoryCount: 1,
        itemCount: 1,
      }),
    ]);
    expect(publicTemplates.page[0]).not.toHaveProperty("categories");
    expect(ownedTemplates.page[0]).not.toHaveProperty("categories");
  });

  it("TI-02 publishes one atomic mutation and caches query snapshots", async () => {
    const runtime = createTestRuntime(regularUserScenario());
    const first = runtime.query("lists:getList", { listId: "list_alpine" });
    const second = runtime.query("lists:getList", { listId: "list_alpine" });
    const listener = vi.fn();
    const unsubscribe = runtime.subscribe(listener);

    await runtime.mutate("lists:updateList", {
      listId: "list_alpine",
      name: "Alpine weekend revised",
    });

    const updated = runtime.query("lists:getList", {
      listId: "list_alpine",
    }) as { description?: string; name: string };
    unsubscribe();

    expect(second).toBe(first);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(updated).not.toBe(first);
    expect(updated).toMatchObject({
      name: "Alpine weekend revised",
      description: "Cold-weather packing manifest",
    });
  });

  it("TI-02B preserves omitted item fields during a quantity-only patch", async () => {
    const runtime = createTestRuntime(regularUserScenario());

    await runtime.mutate("lists:updateItem", {
      itemId: "item_jacket",
      description: "Weatherproof outer layer",
      notes: "Keep near the top of the bag",
      weight: 1.4,
      tags: ["outerwear", "winter"],
      priority: "high",
    });
    await runtime.mutate("lists:updateItem", {
      itemId: "item_jacket",
      quantity: 2,
    });

    const list = runtime.query("lists:getList", {
      listId: "list_alpine",
    }) as {
      categories: Array<{
        items: Array<{
          _id: string;
          description?: string;
          notes?: string;
          priority: string;
          quantity: number;
          tags?: string[];
          weight?: number;
        }>;
      }>;
    };
    const item = list.categories
      .flatMap((category) => category.items)
      .find((candidate) => candidate._id === "item_jacket");

    expect(item).toMatchObject({
      quantity: 2,
      description: "Weatherproof outer layer",
      notes: "Keep near the top of the bag",
      weight: 1.4,
      tags: ["outerwear", "winter"],
      priority: "high",
    });
  });

  it("TI-02C uses the Convex default duplicate name and clears template/public flags", async () => {
    const scenario = regularUserScenario();
    const source = scenario.lists.find((list) => list._id === "list_alpine");
    expect(source).toBeDefined();
    if (!source) throw new Error("Expected the Alpine source list fixture");
    source.isTemplate = true;
    source.isPublic = true;
    const runtime = createTestRuntime(scenario);

    const duplicateId = await runtime.mutate("lists:duplicateList", {
      listId: source._id,
    });
    const duplicate = runtime.query("lists:getList", {
      listId: duplicateId,
    });
    const stored = runtime
      .getState()
      .lists.find((list) => list._id === duplicateId);

    expect(duplicate).toMatchObject({ name: "Copy of Alpine weekend" });
    expect(duplicate).not.toHaveProperty("isTemplate");
    expect(duplicate).not.toHaveProperty("isPublic");
    expect(stored).toMatchObject({ isTemplate: false, isPublic: false });
  });

  it("TI-02D honors an explicit duplicate name and clears template/public flags", async () => {
    const scenario = regularUserScenario();
    const source = scenario.lists.find((list) => list._id === "list_alpine");
    expect(source).toBeDefined();
    if (!source) throw new Error("Expected the Alpine source list fixture");
    source.isTemplate = true;
    source.isPublic = true;
    const runtime = createTestRuntime(scenario);

    const duplicateId = await runtime.mutate("lists:duplicateList", {
      listId: source._id,
      newName: "Custom alpine copy",
    });
    const duplicate = runtime.query("lists:getList", {
      listId: duplicateId,
    });
    const stored = runtime
      .getState()
      .lists.find((list) => list._id === duplicateId);

    expect(duplicate).toMatchObject({ name: "Custom alpine copy" });
    expect(duplicate).not.toHaveProperty("isTemplate");
    expect(duplicate).not.toHaveProperty("isPublic");
    expect(stored).toMatchObject({ isTemplate: false, isPublic: false });
  });

  it("TI-03 generates monotonic IDs and restores session state", async () => {
    const runtime = createTestRuntime(regularUserScenario(), {
      storage: window.sessionStorage,
    });

    const firstId = await runtime.mutate("lists:createList", {
      name: "First deterministic list",
      tags: [],
    });
    const secondId = await runtime.mutate("lists:createList", {
      name: "Second deterministic list",
      tags: [],
    });
    const restored = createTestRuntime(undefined, {
      storage: window.sessionStorage,
    });
    const lists = restored.query("lists:getListSummaries", {
      paginationOpts: { numItems: 50, cursor: null },
    }) as {
      page: Array<{ _id: string; createdAt: number }>;
    };

    expect(firstId).toBe("list_101");
    expect(secondId).toBe("list_102");
    expect(lists.page.find((list) => list._id === firstId)?.createdAt).toBe(
      FIXED_EPOCH + 1,
    );
    expect(lists.page.find((list) => list._id === secondId)?.createdAt).toBe(
      FIXED_EPOCH + 2,
    );
  });

  it("TI-04 rejects unsupported function names", () => {
    const runtime = createTestRuntime(regularUserScenario());

    expect(() => runtime.query("unknown:query", {})).toThrow(
      "Unsupported test query: unknown:query",
    );
  });

  it("TI-05 replays explicit loading and domain errors", () => {
    const scenario = regularUserScenario();
    scenario.loadingQueries = ["lists:getListSummaries"];
    scenario.queryErrors = {
      "lists:getList": createDomainError(
        "FORBIDDEN",
        "This list belongs to another user",
      ),
    };
    const runtime = createTestRuntime(scenario);

    expect(runtime.query("lists:getListSummaries", {})).toBeUndefined();
    expect(() =>
      runtime.query("lists:getList", { listId: "list_foreign" }),
    ).toThrow(
      expect.objectContaining({
        data: expect.objectContaining({ code: "FORBIDDEN" }),
      }),
    );
  });

  it("TI-06 renders the real signed-out route tree", async () => {
    const rendered = renderAppRoute({
      initialUrl: "/",
      scenario: signedOutScenario(),
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Everything you need, ready when you are.",
      }, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /sign in/i }).length).toBeGreaterThan(0);
    expect(rendered.router.state.location.pathname).toBe("/");
    expect(rendered.user).toBeDefined();
  }, 10_000);

  it("TI-06A honors the production unconfigured-runtime provider branch", async () => {
    const rendered = renderAppRoute({
      initialUrl: "/",
      scenario: signedOutScenario(),
      runtimeConfiguration: unconfiguredRuntime,
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Everything you need, ready when you are.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry authentication" }),
    ).toBeVisible();
    expect(screen.getByText("Authentication is unavailable right now.")).toBeVisible();
    expect(rendered.router.state.location.pathname).toBe("/");
  });

  it("TI-06B mounts the production provider order through theme sync and routing", async () => {
    const scenario = regularUserScenario();
    scenario.users[0].preferences.theme = "dark";

    const rendered = renderAppRoute({
      initialUrl: "/",
      scenario,
      theme: "light",
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "My packing lists" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(rendered.router.state.location.pathname).toBe("/");
  });

  it("TI-06C exposes unresolved auth input without projecting final readiness", () => {
    const unavailableAuth = (
      runtimeModule as typeof runtimeModule & {
        unavailableAuth?: () => ReturnType<typeof regularUserScenario>["auth"];
      }
    ).unavailableAuth;

    expect(unavailableAuth).toEqual(expect.any(Function));
    expect(unavailableAuth!()).toEqual({
      isLoaded: false,
      isSignedIn: false,
      user: null,
    });
  });

  it("TI-07 drives the real update prompt through reactive service-worker state", async () => {
    const scenario = regularUserScenario();
    scenario.pwa = {
      needRefresh: true,
      offlineReady: false,
      updateRequested: false,
      reloadRequested: false,
    };
    const { runtime, user } = renderAppRoute({
      initialUrl: "/lists",
      scenario,
    });

    expect(
      await screen.findByRole("region", {
        name: "Application update available",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update now" }));

    await waitFor(() => {
      expect(runtime.getPwaState()).toEqual({
        needRefresh: false,
        offlineReady: false,
        updateRequested: true,
        reloadRequested: true,
      });
    });
    expect(
      screen.queryByRole("region", { name: "Application update available" }),
    ).not.toBeInTheDocument();
  });

  it("TI-08 renders deterministic offline state before protected pages mount", async () => {
    const { user } = renderAppRoute({
      initialUrl: "/lists/new",
      scenario: regularUserScenario(),
      online: false,
    });

    const offlineMessage = await screen.findByText(
      /You are offline\. Viewing cached pages may work/i,
    );
    expect(offlineMessage.closest('[role="status"]')).toBeInTheDocument();
    await user.type(screen.getByLabelText("List name"), "Offline draft");
    expect(screen.getByRole("button", { name: "Create list" })).toBeDisabled();
  });

  it("TI-09 explicitly resolves a deterministic loading query", () => {
    const scenario = regularUserScenario();
    scenario.loadingQueries = ["users:getCurrentAccess"];
    const runtime = createTestRuntime(scenario);
    const controllableRuntime = runtime as typeof runtime & {
      resolveQuery(name: string): void;
    };

    expect(runtime.query("users:getCurrentAccess", {})).toBeUndefined();
    expect(controllableRuntime.resolveQuery).toEqual(expect.any(Function));

    controllableRuntime.resolveQuery("users:getCurrentAccess");

    expect(runtime.query("users:getCurrentAccess", {})).toEqual({
      authenticated: true,
      role: "user",
    });
  });

  it("TI-10 rejects a browser bootstrap without an explicit seed or persisted state", () => {
    clearTestRuntime();
    window.sessionStorage.clear();
    delete window.__ROUTE_LEDGER_TEST_SEED__;
    delete window.__ROUTE_LEDGER_TEST_BOUNDARY__;

    expect(() => getTestRuntime()).toThrow(/explicit scenario seed or persisted state/i);
    expect(window.__ROUTE_LEDGER_TEST_BOUNDARY__).toBeUndefined();
  });

  it("TI-11 persists the requested scenario ID across runtime restoration", () => {
    const scenario = Object.assign(regularUserScenario(), {
      scenarioId: "test-infrastructure:nonce-11",
    });
    const runtime = createTestRuntime(scenario, {
      storage: window.sessionStorage,
    }) as ReturnType<typeof createTestRuntime> & { getScenarioId(): string };
    const restored = createTestRuntime(undefined, {
      storage: window.sessionStorage,
    }) as ReturnType<typeof createTestRuntime> & { getScenarioId(): string };

    expect(runtime.getScenarioId).toEqual(expect.any(Function));
    expect(restored.getScenarioId).toEqual(expect.any(Function));
    expect(runtime.getScenarioId()).toBe("test-infrastructure:nonce-11");
    expect(restored.getScenarioId()).toBe("test-infrastructure:nonce-11");
  });

  it("TI-12 allows only the configured application origin through the HTTP sandbox", () => {
    const isAllowedHttpRequest = (
      runtimeModule as typeof runtimeModule & {
        isAllowedHttpRequest?: (requestUrl: string, appOrigin: string) => boolean;
      }
    ).isAllowedHttpRequest;

    expect(isAllowedHttpRequest).toEqual(expect.any(Function));
    expect(
      isAllowedHttpRequest!(
        "http://127.0.0.1:4173/src/main.tsx",
        "http://127.0.0.1:4173",
      ),
    ).toBe(true);
    expect(
      isAllowedHttpRequest!(
        "http://127.0.0.1:8787/debug",
        "http://127.0.0.1:4173",
      ),
    ).toBe(false);
    expect(
      isAllowedHttpRequest!(
        "http://localhost:4173/",
        "http://127.0.0.1:4173",
      ),
    ).toBe(false);
    expect(
      isAllowedHttpRequest!(
        "https://example.com/telemetry",
        "http://127.0.0.1:4173",
      ),
    ).toBe(false);
  });
});
