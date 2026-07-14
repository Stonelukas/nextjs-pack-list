// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const convex = vi.hoisted(() => ({
  queue: Symbol("queue"),
  stats: Symbol("stats"),
  approve: Symbol("approve"),
  reject: Symbol("reject"),
  flag: Symbol("flag"),
  approveMutation: vi.fn(),
  rejectMutation: vi.fn(),
  flagMutation: vi.fn(),
  loadMore: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    moderation: {
      getModerationQueue: convex.queue,
      getModerationStats: convex.stats,
      approveContent: convex.approve,
      rejectContent: convex.reject,
      flagContent: convex.flag,
    },
  },
}));
vi.mock("convex/react", () => ({
  usePaginatedQuery: () => ({
    results: [
      {
        id: "content-1",
        moderationId: "moderation-1",
        type: "list",
        title: "Weekend route",
        description: "Review this manifest",
        author: "Avery",
        authorId: "user-1",
        createdAt: Date.now(),
        status: "pending",
        flaggedReason: "User report",
        content: { name: "Weekend route" },
      },
    ],
    status: "CanLoadMore",
    loadMore: convex.loadMore,
  }),
  useQuery: () => ({
    totalPending: 1,
    pendingByType: { lists: 1, templates: 0, users: 0 },
    moderationLoad: { today: 1, avgResponseTime: "4m" },
  }),
  useMutation: (reference: symbol) => {
    if (reference === convex.approve) return convex.approveMutation;
    if (reference === convex.reject) return convex.rejectMutation;
    return convex.flagMutation;
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ModerationQueue } from "./moderation-queue";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    releasePointerCapture: { configurable: true, value: () => undefined },
    setPointerCapture: { configurable: true, value: () => undefined },
    scrollIntoView: { configurable: true, value: () => undefined },
  });
  convex.approveMutation.mockReset().mockResolvedValue(undefined);
  convex.rejectMutation.mockReset().mockResolvedValue(undefined);
  convex.flagMutation.mockReset().mockResolvedValue(undefined);
  convex.loadMore.mockReset();
});

afterEach(cleanup);

describe("ModerationQueue", () => {
  it("associates visible filter labels with comboboxes and uses responsive groups", () => {
    const { container } = render(<ModerationQueue />);

    expect(screen.getByRole("combobox", { name: "Content Type:" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status:" })).toBeInTheDocument();
    expect(container.querySelector("[data-moderation-filters]")).toHaveClass("flex-col", "sm:flex-row");
    expect(container.querySelector("[data-moderation-item]")).toHaveClass("flex-col", "lg:flex-row");
    expect(container.querySelector("[data-moderation-actions]")).toHaveClass("grid-cols-2", "lg:flex");
  });

  it("associates rejection and flag dialog selects with their visible labels", async () => {
    const user = userEvent.setup();
    render(<ModerationQueue />);

    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(screen.getByRole("combobox", { name: "Rejection Reason *" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("button", { name: "Flag" }));
    expect(screen.getByRole("combobox", { name: "Flag Reason *" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Severity" })).toBeInTheDocument();
  });

  it("loads another moderation page on demand", async () => {
    const user = userEvent.setup();
    render(<ModerationQueue />);

    await user.click(screen.getByRole("button", { name: "Load more moderation items" }));

    expect(convex.loadMore).toHaveBeenCalledWith(50);
  });

  it("guards a pending moderation confirmation against repeated submission", async () => {
    const user = userEvent.setup();
    const approval = deferred<void>();
    convex.approveMutation.mockReturnValue(approval.promise);
    render(<ModerationQueue />);

    await user.click(screen.getByRole("button", { name: "Approve" }));
    const confirm = screen.getByRole("button", { name: "Confirm approve" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(convex.approveMutation).toHaveBeenCalledTimes(1);
    expect(confirm).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    approval.resolve();
  });
});
