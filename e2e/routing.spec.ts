import {
  TEST_RUNTIME_STORAGE_KEY,
  adminScenario,
  regularUserScenario,
  signedOutAuth,
} from "../src/test/mocks/runtime";
import { expect, gotoApp, test } from "./fixtures/convex";

test.describe("list direct route", () => {
  test.use({ scenario: regularUserScenario() });

  test("E2E-ROUTE-01 loads and reloads a list detail route", async ({ page }) => {
    await gotoApp(page, "/lists/list_alpine");
    await expect(
      page.getByRole("heading", { level: 1, name: "Alpine weekend" }),
    ).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole("heading", { level: 1, name: "Alpine weekend" }),
    ).toBeVisible();
  });
});

test.describe("settings direct route", () => {
  test.use({ scenario: regularUserScenario() });

  test("E2E-ROUTE-02 loads and reloads the settings route", async ({ page }) => {
    await gotoApp(page, "/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  });
});

test.describe("admin direct route", () => {
  test.use({ scenario: adminScenario() });

  test("E2E-ROUTE-03 loads and reloads the guarded admin route", async ({ page }) => {
    await gotoApp(page, "/admin");
    await expect(
      page.getByRole("heading", { level: 1, name: "Admin dashboard" }),
    ).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole("heading", { level: 1, name: "Admin dashboard" }),
    ).toBeVisible();
  });
});

test.describe("signed-out Clerk direct routes", () => {
  test.use({ authState: signedOutAuth() });

  test("E2E-ROUTE-04 loads and reloads nested sign-in and sign-up routes", async ({ page }) => {
    for (const route of [
      { path: "/sign-in/factor-two", heading: "Sign in" },
      { path: "/sign-up/verify-email-address", heading: "Create account" },
    ]) {
      await gotoApp(page, route.path);
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();

      await page.reload();

      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();
    }
  });
});

test("E2E-ROUTE-05 recovers from an unknown route", async ({ page }) => {
  await gotoApp(page, "/removed-next-route");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "This route is not on the itinerary",
    }),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByRole("link", { name: "Return to Route Ledger" })).toBeVisible();
  await page.getByRole("link", { name: "Return to Route Ledger" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("E2E-ROUTE-06 persists a reactive list mutation across refresh", async ({ page }) => {
  await gotoApp(page, "/lists/list_alpine/edit");
  await page.getByLabel("List name").fill("Alpine refresh proof");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.locator("[data-list-detail]").getByRole("heading", {
      level: 1,
      name: "Alpine refresh proof",
    }),
  ).toBeVisible();

  await page.reload();

  await expect(
    page.locator("[data-list-detail]").getByRole("heading", {
      level: 1,
      name: "Alpine refresh proof",
    }),
  ).toBeVisible();
});

test("E2E-ROUTE-07 exposes stable offline UI and disables writes", async ({ page, context }) => {
  await gotoApp(page, "/lists/list_alpine");
  await expect(
    page.locator("[data-list-detail]").getByRole("heading", {
      level: 1,
      name: "Alpine weekend",
    }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));

  await expect(
    page.getByRole("status").filter({
      hasText: "You are offline. Viewing cached pages may work, but changes require a connection.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Reconnect to save changes to this list.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark complete" })).toBeDisabled();
  await expect(
    page.getByRole("checkbox", { name: "Mark Insulated jacket packed" }),
  ).toBeDisabled();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
});

test("E2E-ROUTE-08 handles the deterministic browser install prompt", async ({ page }) => {
  await gotoApp(page, "/");
  await expect(
    page.getByRole("heading", { level: 1, name: "My packing lists" }),
  ).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.installPrompted = "false";
    const event = new Event("beforeinstallprompt", {
      cancelable: true,
    }) as Event & {
      prompt(): Promise<void>;
      userChoice: Promise<{ outcome: "accepted"; platform: string }>;
    };
    Object.defineProperties(event, {
      prompt: {
        value: async () => {
          document.documentElement.dataset.installPrompted = "true";
        },
      },
      userChoice: {
        value: Promise.resolve({ outcome: "accepted", platform: "web" }),
      },
    });
    window.dispatchEvent(event);
  });

  const prompt = page.getByRole("region", { name: "Install Route Ledger" });
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Install app" }).click();

  await expect(prompt).toHaveCount(0);
  await expect
    .poll(() => page.locator("html").getAttribute("data-install-prompted"))
    .toBe("true");
});

const updateScenario = regularUserScenario();
updateScenario.pwa.needRefresh = true;

test.describe("deterministic PWA update", () => {
  test.use({ scenario: updateScenario });

  test("E2E-ROUTE-09 requests activation and reload for an available update", async ({ page }) => {
    await gotoApp(page, "/");
    const update = page.getByRole("region", {
      name: "Application update available",
    });
    await expect(update).toBeVisible();

    await update.getByRole("button", { name: "Update now" }).click();

    await expect(update).toHaveCount(0);
    const pwa = await page.evaluate((storageKey) => {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) throw new Error("Missing deterministic runtime state");
      return (
        JSON.parse(raw) as {
          state: {
            pwa: {
              needRefresh: boolean;
              updateRequested: boolean;
              reloadRequested: boolean;
            };
          };
        }
      ).state.pwa;
    }, TEST_RUNTIME_STORAGE_KEY);
    expect(pwa).toMatchObject({
      needRefresh: false,
      updateRequested: true,
      reloadRequested: true,
    });
  });
});
