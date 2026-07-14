import { adminScenario, regularUserScenario } from "../src/test/mocks/runtime";
import {
  expect,
  gotoApp,
  installMountSentinel,
  mountSentinelTriggered,
  test,
} from "./fixtures/convex";

const unresolvedUserScenario = regularUserScenario();
unresolvedUserScenario.loadingQueries = ["users:getCurrentAccess"];

test.describe("regular user admin guard", () => {
  test.use({ scenario: unresolvedUserScenario });

  test("E2E-ADM-01 denies a signed-in non-admin before privileged descendants mount", async ({ page }) => {
    await installMountSentinel(page, "[data-admin-page]");
    await gotoApp(page, "/admin");

    await expect(
      page.getByRole("status", { name: "Checking administrator access" }),
    ).toBeVisible();
    await expect(page.locator("[data-admin-page]")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Admin dashboard" })).toHaveCount(0);
    await expect(page.getByRole("tablist", { name: "Administration sections" })).toHaveCount(0);
    await expect.poll(() => mountSentinelTriggered(page)).toBe(false);

    await page.evaluate(() =>
      window.__ROUTE_LEDGER_TEST_CONTROL__?.resolveQuery(
        "users:getCurrentAccess",
      ),
    );

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Administrator access required",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
    await expect(page.locator("[data-admin-page]")).toHaveCount(0);
    await expect.poll(() => mountSentinelTriggered(page)).toBe(false);
  });
});

test.describe("administrator workspace", () => {
  test.use({ scenario: adminScenario() });

  test("E2E-ADM-02 exposes deterministic metrics and navigation for an admin", async ({ page }) => {
    await gotoApp(page, "/admin");

    await expect(page.getByRole("heading", { level: 1, name: "Admin dashboard" })).toBeVisible();
    await expect(page.locator("[data-admin-page]")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Admin", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText("Total users").locator("..")).toContainText("12");
    await expect(page.getByText("Total lists").locator("..")).toContainText("34");
    await expect(
      page.locator("dt").filter({ hasText: "Templates" }).locator(".."),
    ).toContainText("8");
    await expect(page.getByText("System status").locator("..")).toContainText("Healthy");
    await expect(page.getByRole("tablist", { name: "Administration sections" })).toBeVisible();

    await page.getByRole("button", { name: "Manage templates" }).click();
    await expect(page).toHaveURL(/\/templates$/);
    await expect(page.getByRole("heading", { level: 1, name: "Template library" })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1, name: "Admin dashboard" })).toBeVisible();
  });
});
