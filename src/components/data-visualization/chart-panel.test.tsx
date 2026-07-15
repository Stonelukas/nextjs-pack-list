// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ChartPanel } from "./chart-panel";

afterEach(cleanup);

describe("ChartPanel", () => {
  it("names the figure, exposes a fixed-order legend, and provides a matching table view", async () => {
    const user = userEvent.setup();
    render(
      <ChartPanel
        title="List activity"
        description="Created and packed lists over 30 days."
        legend={[
          { label: "Created", color: "var(--chart-blue)" },
          { label: "Completed", color: "var(--chart-teal)" },
        ]}
        table={
          <table>
            <caption>List activity, 30 days</caption>
            <tbody>
              <tr><th scope="row">Jul 12</th><td>4 created</td><td>2 completed</td></tr>
            </tbody>
          </table>
        }
      >
        <div role="img" aria-label="List activity chart">Chart marks</div>
      </ChartPanel>,
    );

    expect(screen.getByRole("figure")).toHaveAccessibleName("List activity");
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Created",
      "Completed",
    ]);
    const printAlternative = document.querySelector("[data-print-chart-table]");
    expect(printAlternative).toHaveClass("hidden", "print:block");
    expect(printAlternative).toHaveTextContent("List activity, 30 days");
    expect(printAlternative).toHaveTextContent("4 created");
    expect(printAlternative).toHaveTextContent("2 completed");

    await user.click(screen.getByRole("button", { name: "Show List activity table" }));
    expect(screen.getAllByRole("table", { name: "List activity, 30 days" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Show List activity chart" })).toBeInTheDocument();
  });
});
