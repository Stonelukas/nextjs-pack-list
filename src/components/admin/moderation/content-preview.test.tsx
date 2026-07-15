// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    moderation: {
      getModerationHistory: Symbol("history"),
      getAutomatedFlags: Symbol("flags"),
    },
  },
}));
vi.mock("convex/react", () => ({ useQuery: () => [] }));

import { ContentPreview, type ModerationItem } from "./content-preview";

afterEach(cleanup);

describe("ContentPreview", () => {
  it("renders canonical template fields without legacy list flags", () => {
    const item = {
      id: "template-1",
      moderationId: "moderation-1",
      type: "template",
      title: "Business trip",
      description: "Work route",
      content: {
        name: "Business trip",
        description: "Work route",
        isPublic: true,
        category: "business",
        difficulty: "intermediate",
      },
      author: "Avery",
      authorId: "user-1",
      createdAt: Date.now(),
      status: "pending",
      flaggedReason: "Review",
    } as ModerationItem;

    render(<ContentPreview item={item} open onOpenChange={vi.fn()} />);

    expect(screen.getByText("Template Details")).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("business")).toBeInTheDocument();
    expect(screen.queryByText("Is Template:")).not.toBeInTheDocument();
    expect(screen.queryByText("Completed:")).not.toBeInTheDocument();
  });
});
