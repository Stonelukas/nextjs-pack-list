import {
  Fragment,
  createElement,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  OptionalRestArgsOrSkip,
  PaginatedQueryArgs,
  PaginatedQueryReference,
  ReactMutation,
  UsePaginatedQueryReturnType,
} from "convex/react";
import {
  getFunctionName,
  type FunctionArgs,
  type FunctionReference,
} from "convex/server";

import { getTestRuntime } from "@/test/mocks/runtime";

export class ConvexReactClient {
  readonly address: string;

  constructor(address: string) {
    this.address = address;
  }

  close() {}
}

interface ProviderProps {
  children: ReactNode;
  client?: ConvexReactClient;
  useAuth?: () => unknown;
}

export function ConvexProviderWithClerk({ children }: ProviderProps) {
  getTestRuntime();
  return createElement(Fragment, null, children);
}

export function ConvexProvider({ children }: ProviderProps) {
  getTestRuntime();
  return createElement(Fragment, null, children);
}

export function useQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: OptionalRestArgsOrSkip<Query>
): Query["_returnType"] | undefined {
  const runtime = getTestRuntime();
  const queryArgs = args[0];
  const name = getFunctionName(query);
  return useSyncExternalStore(
    runtime.subscribe,
    () =>
      queryArgs === "skip"
        ? undefined
        : (runtime.query(name, queryArgs ?? {}) as Query["_returnType"] | undefined),
    () =>
      queryArgs === "skip"
        ? undefined
        : (runtime.query(name, queryArgs ?? {}) as Query["_returnType"] | undefined),
  );
}

export function usePaginatedQuery<Query extends PaginatedQueryReference>(
  query: Query,
  args: PaginatedQueryArgs<Query> | "skip",
  options: { initialNumItems: number },
): UsePaginatedQueryReturnType<Query> {
  const runtime = getTestRuntime();
  const name = getFunctionName(query);
  const result = useSyncExternalStore(
    runtime.subscribe,
    () =>
      args === "skip"
        ? undefined
        : runtime.query(name, {
            ...args,
            paginationOpts: {
              numItems: options.initialNumItems,
              cursor: null,
            },
          }),
    () =>
      args === "skip"
        ? undefined
        : runtime.query(name, {
            ...args,
            paginationOpts: {
              numItems: options.initialNumItems,
              cursor: null,
            },
          }),
  ) as
    | {
        page: Query["_returnType"]["page"];
        isDone: boolean;
      }
    | undefined;

  if (!result) {
    return {
      results: [],
      status: "LoadingFirstPage",
      isLoading: true,
      loadMore: () => undefined,
    } as UsePaginatedQueryReturnType<Query>;
  }

  return {
    results: result.page,
    status: result.isDone ? "Exhausted" : "CanLoadMore",
    isLoading: false,
    loadMore: () => undefined,
  } as UsePaginatedQueryReturnType<Query>;
}

export function useConvexAuth() {
  const runtime = getTestRuntime();
  useSyncExternalStore(runtime.subscribe, runtime.getVersion, runtime.getVersion);
  const auth = runtime.getState().auth;
  return {
    isLoading: !auth.isLoaded,
    isAuthenticated: auth.isLoaded && auth.isSignedIn,
  };
}

export function useMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
): ReactMutation<Mutation> {
  const runtime = getTestRuntime();
  const name = getFunctionName(mutation);
  const invoke = useCallback(
    (args: FunctionArgs<Mutation>) =>
      runtime.mutate(name, args) as Promise<Mutation["_returnType"]>,
    [name, runtime],
  ) as ReactMutation<Mutation>;
  invoke.withOptimisticUpdate = () => invoke;
  return invoke;
}

export function useConvex() {
  return {
    query: (reference: FunctionReference<"query">, args?: unknown) =>
      Promise.resolve(getTestRuntime().query(getFunctionName(reference), args ?? {})),
    mutation: (reference: FunctionReference<"mutation">, args?: unknown) =>
      getTestRuntime().mutate(getFunctionName(reference), args ?? {}),
  };
}
