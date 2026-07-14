import type { Locator, Page } from "@playwright/test";

import { legacyZustandJson } from "../src/features/legacy-migration/__fixtures__/legacy-state";
import {
  adminScenario,
  signedInAuth,
  signedOutAuth,
  signedOutScenario,
} from "../src/test/mocks/runtime";
import { expect, gotoApp, test } from "./fixtures/convex";

test.use({ scenario: adminScenario() });

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}

async function expectInsideViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
}

async function expectMinimumTarget(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

test.describe("restored startup surfaces", () => {
  test.use({ authState: signedOutAuth(), scenario: signedOutScenario() });

  test("E2E-RWD-05 @mobile keeps landing, auth, and dashboard inside 390x844 with 44px primary targets", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await gotoApp(page, "/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Everything you need, ready when you are.",
      }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectMinimumTarget(
      page.getByRole("main").getByRole("link", { name: "Create a list" }),
    );
    await expectMinimumTarget(
      page.getByRole("main").getByRole("link", { name: "Sign in" }),
    );

    await gotoApp(page, "/sign-in/factor-two");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectMinimumTarget(
      page.getByRole("button", { name: "Continue as test user" }),
    );

    await page.evaluate(
      (auth) => window.__ROUTE_LEDGER_TEST_CONTROL__?.setAuth(auth),
      signedInAuth(),
    );
    await gotoApp(page, "/");
    await expect(
      page.getByRole("heading", { level: 1, name: "My packing lists" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectMinimumTarget(
      page.getByRole("button", { name: "Create new list" }),
    );
  });
});

test("E2E-RWD-01 exposes the named desktop navigation rail", async ({ page }) => {
  await gotoApp(page, "/");

  const rail = page.getByRole("complementary", { name: "Journey navigation" });
  await expect(rail).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Journey views" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden();

  await page.getByRole("button", { name: "Close navigation rail" }).click();

  await expect(rail).toBeHidden();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation rail" })).toBeVisible();
});

test("E2E-RWD-02 @mobile opens the named mobile menu and moves focus inside", async ({ page }) => {
  await gotoApp(page, "/");

  await expect(
    page.getByRole("complementary", { name: "Journey navigation" }),
  ).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();

  const menu = page.getByRole("button", { name: "Open navigation menu" });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(
    page.locator('button[aria-label="Open navigation menu"]'),
  ).toHaveAttribute("aria-expanded", "true");

  const sheet = page.getByRole("dialog", { name: /Route Ledger/ });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(sheet.getByRole("link", { name: /Admin/ })).toBeVisible();
  await expect
    .poll(() => sheet.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);

  await sheet.getByRole("link", { name: /Templates/ }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/templates$/);
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", {
      name: "Templates",
    }),
  ).toHaveAttribute("aria-current", "page");
});

test("E2E-RWD-03 @mobile prevents horizontal overflow at supported mobile widths", async ({ page }) => {
  for (const width of [393, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ["/", "/lists/list_alpine", "/settings", "/admin"]) {
      await gotoApp(page, path);
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("E2E-RWD-04 @mobile contains dialogs, restores focus, and provides 44px targets", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await gotoApp(page, "/lists/list_alpine");
  await expectMinimumTarget(page.getByRole("link", { name: "Route Ledger home" }));
  await expectMinimumTarget(
    page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", {
      name: "Lists",
    }),
  );

  const categoryHeader = page.locator("[data-category-header]").first();
  const categoryHandle = categoryHeader.locator(
    '[aria-roledescription="sortable"]',
  );
  const itemPrimary = page.locator("[data-item-primary]:visible").first();
  const itemHandle = itemPrimary.locator('[aria-roledescription="sortable"]');
  const itemContainer = itemPrimary.locator("..");
  const packingCheckbox = itemPrimary.getByRole("checkbox");
  const editItem = itemContainer.getByRole("button", { name: "Edit item" });
  const increaseQuantity = itemContainer.getByRole("button", {
    name: /Increase quantity/,
  });

  await expectMinimumTarget(categoryHandle);
  await expectMinimumTarget(
    categoryHeader.getByRole("button", { name: "Toggle category" }),
  );
  await expectMinimumTarget(itemHandle);
  await expectMinimumTarget(packingCheckbox);
  await expectMinimumTarget(editItem);
  await expectMinimumTarget(increaseQuantity);

  await editItem.click();
  const itemDialog = page.getByRole("dialog", { name: "Edit item" });
  await expectMinimumTarget(
    itemDialog.getByRole("combobox", { name: "Priority" }),
  );
  await expectInsideViewport(page, itemDialog);
  await page.keyboard.press("Escape");
  await expect(editItem).toBeFocused();

  await gotoApp(page, "/lists");
  await expectMinimumTarget(
    page.getByRole("combobox", { name: "Sort packing lists" }),
  );

  await gotoApp(page, "/templates");
  const preview = page
    .locator('[data-slot="card"]', { hasText: "Weekend Getaway" })
    .getByRole("button", { name: "Preview" });
  await preview.click();
  const templateDialog = page.getByRole("dialog", { name: "Weekend Getaway" });
  await expectInsideViewport(page, templateDialog);
  await page.keyboard.press("Escape");
  await expect(preview).toBeFocused();

  await page.evaluate(
    (value) => window.localStorage.setItem("pack-list-storage", value),
    legacyZustandJson,
  );
  await gotoApp(page, "/settings");
  await page.getByRole("tab", { name: "Legacy migration" }).click();
  const legacyTrigger = page.getByRole("button", { name: "Review legacy import" });
  await legacyTrigger.click();
  const legacyDialog = page.getByRole("dialog", { name: "Review legacy browser data" });
  await expectInsideViewport(page, legacyDialog);
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Escape");
  await expect(legacyTrigger).toBeFocused();

  await gotoApp(page, "/lists/list_alpine");
  const increase = page
    .getByRole("button", { name: "Increase quantity for Insulated jacket" })
    .first();
  await increase.click();
  await expect(page.getByLabel("Quantity 2").first()).toBeVisible();
});
