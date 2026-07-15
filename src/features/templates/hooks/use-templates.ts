import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  useAsyncActionState,
  type AsyncActionOptions,
} from "@/features/shared/async-action-state";

const TEMPLATE_PAGE_SIZE = 50;
const TEMPLATE_EXPORT_PAGE_SIZE = 5;

export type TemplateSummary = FunctionReturnType<
  typeof api.templates.getPublicTemplateSummaries
>["page"][number];
export type TemplateWithCategories = FunctionReturnType<
  typeof api.templates.getTemplate
>;
export type OwnedTemplateExport = FunctionReturnType<
  typeof api.templates.getOwnedTemplateExportPage
>["page"][number];
export type ApplyTemplateInput = FunctionArgs<
  typeof api.templates.applyTemplate
>;
export type CreateTemplateFromListInput = FunctionArgs<
  typeof api.templates.createTemplateFromList
>;

export function useTemplateDetail(
  templateId: Id<"templates"> | null | undefined,
) {
  const template = useQuery(
    api.templates.getTemplate,
    templateId ? { templateId } : "skip",
  );
  return {
    template,
    loading: templateId != null && template === undefined,
  };
}

export function useOwnedTemplateExportData(): {
  templates: OwnedTemplateExport[] | undefined;
  loading: boolean;
} {
  const currentUser = useQuery(api.users.getCurrentUser);
  const { results, status, loadMore } = usePaginatedQuery(
    api.templates.getOwnedTemplateExportPage,
    currentUser ? {} : "skip",
    { initialNumItems: TEMPLATE_EXPORT_PAGE_SIZE },
  );
  const requestedResultCount = useRef(-1);

  useEffect(() => {
    if (
      currentUser &&
      status === "CanLoadMore" &&
      requestedResultCount.current !== results.length
    ) {
      requestedResultCount.current = results.length;
      loadMore(TEMPLATE_EXPORT_PAGE_SIZE);
    }
    if (status === "Exhausted") requestedResultCount.current = -1;
  }, [currentUser, loadMore, results.length, status]);

  if (currentUser === null) return { templates: [], loading: false };
  const loading = currentUser === undefined || status !== "Exhausted";
  return { templates: loading ? undefined : results, loading };
}

export function useTemplates() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const publicQuery = usePaginatedQuery(
    api.templates.getPublicTemplateSummaries,
    {},
    { initialNumItems: TEMPLATE_PAGE_SIZE },
  );
  const ownedQuery = usePaginatedQuery(
    api.templates.getOwnedTemplateSummaries,
    currentUser ? {} : "skip",
    { initialNumItems: TEMPLATE_PAGE_SIZE },
  );
  const applyTemplateMutation = useMutation(api.templates.applyTemplate);
  const createTemplateFromListMutation = useMutation(
    api.templates.createTemplateFromList,
  );
  const { pending, error, resetError, runAction } = useAsyncActionState();

  const templates = useMemo(() => {
    const templatesById = new Map<Id<"templates">, TemplateSummary>();
    for (const template of publicQuery.results) {
      templatesById.set(template._id, template);
    }
    for (const template of ownedQuery.results) {
      templatesById.set(template._id, template);
    }
    return [...templatesById.values()];
  }, [ownedQuery.results, publicQuery.results]);

  const loadMore = useCallback(() => {
    if (publicQuery.status === "CanLoadMore") {
      publicQuery.loadMore(TEMPLATE_PAGE_SIZE);
    }
    if (ownedQuery.status === "CanLoadMore") {
      ownedQuery.loadMore(TEMPLATE_PAGE_SIZE);
    }
  }, [ownedQuery, publicQuery]);

  const applyTemplate = useCallback(
    (input: ApplyTemplateInput, options?: AsyncActionOptions) =>
      runAction(() => applyTemplateMutation(input), options),
    [applyTemplateMutation, runAction],
  );
  const createTemplateFromList = useCallback(
    (input: CreateTemplateFromListInput, options?: AsyncActionOptions) =>
      runAction(() => createTemplateFromListMutation(input), options),
    [runAction, createTemplateFromListMutation],
  );

  const ownedLoading =
    currentUser !== null && ownedQuery.status === "LoadingFirstPage";

  return {
    templates,
    publicTemplates: publicQuery.results,
    ownedTemplates: ownedQuery.results,
    loading:
      currentUser === undefined ||
      publicQuery.status === "LoadingFirstPage" ||
      ownedLoading,
    loadingMore:
      publicQuery.status === "LoadingMore" ||
      ownedQuery.status === "LoadingMore",
    canLoadMore:
      publicQuery.status === "CanLoadMore" ||
      ownedQuery.status === "CanLoadMore",
    loadMore,
    pending,
    error,
    resetError,
    applyTemplate,
    createTemplateFromList,
  };
}
