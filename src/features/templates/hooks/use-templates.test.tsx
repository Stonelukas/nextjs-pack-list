// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => {
  const references = {
    getPublicTemplateSummaries: Symbol("getPublicTemplateSummaries"),
    getOwnedTemplateSummaries: Symbol("getOwnedTemplateSummaries"),
    getOwnedTemplateExportPage: Symbol("getOwnedTemplateExportPage"),
    getTemplate: Symbol("getTemplate"),
    getCurrentUser: Symbol("getCurrentUser"),
    applyTemplate: Symbol("applyTemplate"),
    createTemplateFromList: Symbol("createTemplateFromList"),
  };

  return {
    references,
    queryValues: new Map<symbol, unknown>(),
    paginatedValues: new Map<symbol, unknown>(),
    queryCalls: [] as Array<{ reference: symbol; args: unknown }>,
    paginatedCalls: [] as Array<{
      reference: symbol;
      args: unknown;
      options: unknown;
    }>,
    mutations: new Map<symbol, ReturnType<typeof vi.fn>>(),
  };
});

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    templates: {
      getPublicTemplateSummaries: convex.references.getPublicTemplateSummaries,
      getOwnedTemplateSummaries: convex.references.getOwnedTemplateSummaries,
      getOwnedTemplateExportPage: convex.references.getOwnedTemplateExportPage,
      getTemplate: convex.references.getTemplate,
      applyTemplate: convex.references.applyTemplate,
      createTemplateFromList: convex.references.createTemplateFromList,
    },
    users: { getCurrentUser: convex.references.getCurrentUser },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (reference: symbol, args: unknown) => {
    convex.queryCalls.push({ reference, args });
    return convex.queryValues.get(reference);
  },
  usePaginatedQuery: (reference: symbol, args: unknown, options: unknown) => {
    convex.paginatedCalls.push({ reference, args, options });
    return convex.paginatedValues.get(reference);
  },
  useMutation: (reference: symbol) => convex.mutations.get(reference),
}));

import {
  useOwnedTemplateExportData,
  useTemplateDetail,
  useTemplates,
} from "./use-templates";

const userId = "user_123" as Id<"users">;
const publicTemplateId = "template_public" as Id<"templates">;
const ownedTemplateId = "template_owned" as Id<"templates">;
const loadMorePublic = vi.fn();
const loadMoreOwned = vi.fn();
const loadMoreExport = vi.fn();

beforeEach(() => {
  convex.queryValues.clear();
  convex.paginatedValues.clear();
  convex.queryCalls.length = 0;
  convex.paginatedCalls.length = 0;
  convex.mutations.clear();
  loadMorePublic.mockReset();
  loadMoreOwned.mockReset();
  loadMoreExport.mockReset();
  convex.queryValues.set(convex.references.getCurrentUser, {
    _id: userId,
    clerkId: "server-only-clerk-id",
  });
  convex.paginatedValues.set(convex.references.getPublicTemplateSummaries, {
    results: [
      {
        _id: publicTemplateId,
        isPublic: true,
        createdBy: userId,
        name: "Public",
        description: "Public template",
        categoryCount: 2,
        itemCount: 5,
      },
    ],
    status: "CanLoadMore",
    isLoading: false,
    loadMore: loadMorePublic,
  });
  convex.paginatedValues.set(convex.references.getOwnedTemplateSummaries, {
    results: [
      {
        _id: publicTemplateId,
        isPublic: true,
        createdBy: userId,
        name: "Public",
        description: "Public template",
        categoryCount: 2,
        itemCount: 5,
      },
      {
        _id: ownedTemplateId,
        isPublic: false,
        createdBy: userId,
        name: "Private",
        description: "Owned template",
        categoryCount: 1,
        itemCount: 3,
      },
    ],
    status: "Exhausted",
    isLoading: false,
    loadMore: loadMoreOwned,
  });
  convex.paginatedValues.set(convex.references.getOwnedTemplateExportPage, {
    results: [],
    status: "LoadingFirstPage",
    isLoading: true,
    loadMore: loadMoreExport,
  });
  convex.queryValues.set(convex.references.getTemplate, {
    _id: publicTemplateId,
    isPublic: true,
    createdBy: userId,
    name: "Public",
    description: "Public template",
    categoryCount: 2,
    itemCount: 5,
    categories: [],
  });
  convex.mutations.set(
    convex.references.applyTemplate,
    vi.fn().mockResolvedValue("list_created" as Id<"lists">),
  );
  convex.mutations.set(
    convex.references.createTemplateFromList,
    vi.fn().mockResolvedValue("template_created" as Id<"templates">),
  );
});

describe("useTemplates", () => {
  it("combines paginated public and owned summaries without duplicating owned public templates", () => {
    const { result } = renderHook(() => useTemplates());

    expect(result.current.publicTemplates.map((template) => template._id)).toEqual([
      publicTemplateId,
    ]);
    expect(result.current.ownedTemplates.map((template) => template._id)).toEqual([
      publicTemplateId,
      ownedTemplateId,
    ]);
    expect(result.current.templates.map((template) => template._id)).toEqual([
      publicTemplateId,
      ownedTemplateId,
    ]);
    expect(result.current.templates[0]).toMatchObject({
      categoryCount: 2,
      itemCount: 5,
    });
    expect(result.current.templates[0]).not.toHaveProperty("categories");
    expect(convex.paginatedCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reference: convex.references.getPublicTemplateSummaries,
          args: {},
          options: { initialNumItems: 50 },
        }),
        expect.objectContaining({
          reference: convex.references.getOwnedTemplateSummaries,
          args: {},
          options: { initialNumItems: 50 },
        }),
      ]),
    );
  });

  it("loads more bounded summary pages without sending client identity", () => {
    const { result } = renderHook(() => useTemplates());

    act(() => result.current.loadMore());

    expect(loadMorePublic).toHaveBeenCalledWith(50);
    expect(loadMoreOwned).not.toHaveBeenCalled();
    expect(convex.paginatedCalls).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ args: expect.objectContaining({ clerkId: expect.anything() }) }),
      ]),
    );
  });

  it("passes template IDs unchanged and never sends a Clerk ID", async () => {
    const applyTemplate = convex.mutations.get(convex.references.applyTemplate)!;
    const { result } = renderHook(() => useTemplates());

    await act(async () => {
      await result.current.applyTemplate({
        templateId: publicTemplateId,
        listName: "Summer trip",
      });
    });

    expect(applyTemplate).toHaveBeenCalledWith({
      templateId: publicTemplateId,
      listName: "Summer trip",
    });
    expect(applyTemplate.mock.calls[0]?.[0]).not.toHaveProperty("clerkId");
  });
});

describe("useOwnedTemplateExportData", () => {
  it("loads owner-scoped export pages until the query is exhausted", async () => {
    convex.paginatedValues.set(convex.references.getOwnedTemplateExportPage, {
      results: [{ _id: ownedTemplateId, categories: [] }],
      status: "CanLoadMore",
      isLoading: false,
      loadMore: loadMoreExport,
    });

    const { result } = renderHook(() => useOwnedTemplateExportData());

    expect(result.current).toEqual({ templates: undefined, loading: true });
    await waitFor(() => expect(loadMoreExport).toHaveBeenCalledWith(5));
    expect(convex.paginatedCalls).toContainEqual({
      reference: convex.references.getOwnedTemplateExportPage,
      args: {},
      options: { initialNumItems: 5 },
    });
  });

  it("returns full nested owner templates only after every page resolves", () => {
    const exported = [
      {
        _id: ownedTemplateId,
        name: "Private",
        categories: [
          { name: "Documents", items: [{ name: "Passport" }] },
        ],
      },
    ];
    convex.paginatedValues.set(convex.references.getOwnedTemplateExportPage, {
      results: exported,
      status: "Exhausted",
      isLoading: false,
      loadMore: loadMoreExport,
    });

    const { result } = renderHook(() => useOwnedTemplateExportData());

    expect(result.current).toEqual({ templates: exported, loading: false });
  });
});

describe("useTemplateDetail", () => {
  it("loads one authorized template detail by branded ID and skips without an ID", () => {
    const detail = renderHook(() => useTemplateDetail(publicTemplateId));
    expect(detail.result.current.template).toMatchObject({
      _id: publicTemplateId,
      categories: [],
    });
    expect(convex.queryCalls).toContainEqual({
      reference: convex.references.getTemplate,
      args: { templateId: publicTemplateId },
    });

    convex.queryCalls.length = 0;
    renderHook(() => useTemplateDetail(null));
    expect(convex.queryCalls).toContainEqual({
      reference: convex.references.getTemplate,
      args: "skip",
    });
    expect(convex.queryCalls[0]?.args).not.toEqual(
      expect.objectContaining({ clerkId: expect.anything() }),
    );
  });
});
