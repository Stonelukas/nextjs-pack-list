// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Id } from "../../../convex/_generated/dataModel";
import type { TemplateSummary } from "@/features/templates/hooks/use-templates";
import { TemplateCard } from "./template-card";

const sparseTemplate: TemplateSummary = {
  _id: "template-international" as Id<"templates">,
  _creationTime: 1,
  name: "International Travel",
  description: "Comprehensive list for traveling abroad",
  category: undefined,
  difficulty: undefined,
  season: undefined,
  duration: undefined,
  icon: "✈️",
  tags: undefined,
  isPublic: true,
  isOfficial: true,
  categoryCount: 4,
  itemCount: 20,
  usageCount: 0,
  rating: 5,
  createdAt: 1,
  updatedAt: 1,
  isOwned: false,
};

afterEach(cleanup);

describe("TemplateCard", () => {
  it("renders the template icon and pins actions to the bottom for sparse metadata", async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    const onUse = vi.fn();

    render(
      <TemplateCard
        template={sparseTemplate}
        onPreview={onPreview}
        onUse={onUse}
      />,
    );

    const card = screen.getByTestId("template-card");
    const icon = screen.getByTestId("template-icon");
    const footer = screen
      .getByRole("button", { name: "Preview" })
      .closest('[data-slot="card-footer"]');

    expect(card).toHaveClass("h-full");
    expect(icon).toHaveTextContent("✈️");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(footer).toHaveClass("mt-auto");

    await user.click(screen.getByRole("button", { name: "Preview" }));
    await user.click(screen.getByRole("button", { name: "Use template" }));
    expect(onPreview).toHaveBeenCalledWith(sparseTemplate);
    expect(onUse).toHaveBeenCalledWith(sparseTemplate);
  });

  it("renders a consistent fallback icon when a template has no icon", () => {
    render(
      <TemplateCard
        template={{ ...sparseTemplate, _id: "template-custom" as Id<"templates">, icon: undefined }}
        onPreview={vi.fn()}
        onUse={vi.fn()}
      />,
    );

    expect(screen.getByTestId("template-icon")).not.toHaveTextContent("✈️");
    expect(screen.getByTestId("template-icon-fallback")).toBeInTheDocument();
  });
});
