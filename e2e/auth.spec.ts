import {
  loadingAuth,
  regularUserScenario,
  signedInAuth,
  signedOutAuth,
  signedOutScenario,
  unavailableAuth,
} from "../src/test/mocks/runtime";
import {
  expect,
  gotoApp,
  installMountSentinel,
  mountSentinelTriggered,
  test,
} from "./fixtures/convex";

test.use({ authState: signedOutAuth(), scenario: signedOutScenario() });

test.describe("unresolved authentication guard", () => {
  test.use({ authState: loadingAuth() });

  test("E2E-AUTH-00 keeps protected descendants unmounted until auth resolves", async ({ page }) => {
    await installMountSentinel(page, "[data-list-detail]");
    await gotoApp(page, "/lists/list_alpine");

    await expect(
      page.getByRole("status", { name: "Checking your session" }),
    ).toBeVisible();
    await expect(page.locator("[data-list-detail]")).toHaveCount(0);
    await expect.poll(() => mountSentinelTriggered(page)).toBe(false);

    await page.evaluate(
      (auth) => window.__ROUTE_LEDGER_TEST_CONTROL__?.setAuth(auth),
      signedOutAuth(),
    );

    await expect(page).toHaveURL(/\/sign-in\?redirect_url=%2Flists%2Flist_alpine$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expect.poll(() => mountSentinelTriggered(page)).toBe(false);
  });
});

test.describe("unresolved public authentication", () => {
  test.use({ authState: unavailableAuth() });

  test("E2E-AUTH-04 keeps the friendly landing visible through timeout and retry", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2025-01-15T12:00:00.000Z") });
    await gotoApp(page, "/");

    const landingHeading = page.getByRole("heading", {
      level: 1,
      name: "Everything you need, ready when you are.",
    });
    await expect(landingHeading).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "A calmer way to get out the door." }),
    ).toBeVisible();
    await expect(page.getByText("Connecting to authentication")).toBeVisible();

    await page.clock.fastForward(10_000);

    await expect(
      page.getByText("Authentication is unavailable right now."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry authentication" })).toBeVisible();
    await expect(landingHeading).toBeVisible();
    await expect(page.getByLabel("Example packing checklist")).toBeVisible();

    await page.getByRole("button", { name: "Retry authentication" }).click();

    await expect(page.getByText("Connecting to authentication")).toBeVisible();
    await expect(
      page.getByText("Authentication is unavailable right now."),
    ).toHaveCount(0);
    await expect(landingHeading).toBeVisible();
  });
});

test("E2E-AUTH-01 routes the public landing Sign in link to the accessible sign-in surface", async ({
  page,
}) => {
  await gotoApp(page, "/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Everything you need, ready when you are." }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("link", { name: "Route Ledger home" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Journey navigation" })).toHaveCount(0);

  const signInLink = page.getByRole("main").getByRole("link", { name: "Sign in" });
  await expect(signInLink).toHaveAttribute("href", "/sign-in");
  await signInLink.click();

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue as test user" })).toBeVisible();
});

test("E2E-AUTH-02 preserves a protected deep link through sign-in", async ({ page }) => {
  await gotoApp(page, "/lists/list_alpine?status=active#manifest");

  await expect(page).toHaveURL(
    /\/sign-in\?redirect_url=%2Flists%2Flist_alpine%3Fstatus%3Dactive%23manifest$/,
  );
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alpine weekend" })).toHaveCount(0);

  await page.getByRole("button", { name: "Continue as test user" }).click();

  await expect(page).toHaveURL(/\/lists\/list_alpine\?status=active#manifest$/);
  await expect(
    page.locator("[data-list-detail]").getByRole("heading", {
      level: 1,
      name: "Alpine weekend",
    }),
  ).toBeVisible();
});

test("E2E-AUTH-03 mounts nested Clerk splat routes directly", async ({ page }) => {
  await gotoApp(page, "/sign-in/factor-two");
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
  await expect(page.getByText("This route is not on the itinerary")).toHaveCount(0);

  await gotoApp(page, "/sign-up/verify-email-address");
  await expect(page.getByRole("heading", { level: 1, name: "Create account" })).toBeVisible();
  await expect(page.getByText("This route is not on the itinerary")).toHaveCount(0);
});

test.describe("signed-in dashboard", () => {
  test.use({ authState: signedInAuth(), scenario: regularUserScenario() });

  test("E2E-AUTH-05 renders the friendly signed-in dashboard hierarchy", async ({
    page,
  }) => {
    await gotoApp(page, "/");

    await expect(
      page.getByRole("heading", { level: 1, name: "My packing lists" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Keep every trip clear, from the first idea to the final check.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Packing lists" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Packing list statistics" }),
    ).toBeVisible();
  });
});
