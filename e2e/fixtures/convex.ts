import { expect, type Page } from "@playwright/test";

import {
  isAllowedHttpRequest,
  regularUserScenario,
  type TestScenario,
} from "../../src/test/mocks/runtime";
import { test as authTest } from "./auth";

export interface ConvexFixtureOptions {
  scenario: TestScenario;
  online: boolean;
}

const allowedConsoleErrors = [/You do not have access to this list/i];

export const test = authTest.extend<ConvexFixtureOptions>({
  scenario: [regularUserScenario(), { option: true }],
  online: [true, { option: true }],
  page: async (
    { authState, baseURL, online, page, scenario },
    providePage,
    testInfo,
  ) => {
    if (!baseURL) throw new Error("Playwright baseURL is required for the network sandbox");
    const appOrigin = new URL(baseURL).origin;
    const seed = structuredClone(scenario);
    seed.auth = structuredClone(authState);
    seed.scenarioId = [
      testInfo.testId,
      `worker-${testInfo.workerIndex}`,
      `retry-${testInfo.retry}`,
      `repeat-${testInfo.repeatEachIndex}`,
    ].join(":");
    const unexpectedNetwork: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    await page.addInitScript(
      ({ runtimeSeed, startOnline }) => {
        window.__ROUTE_LEDGER_TEST_SEED__ = runtimeSeed;
        window.__ROUTE_LEDGER_TEST_BOUNDARY__ = false;
        if (!startOnline) {
          Object.defineProperty(window.navigator, "onLine", {
            configurable: true,
            value: false,
          });
        }
        const disableMotion = () => {
          const style = document.createElement("style");
          style.dataset.routeLedgerTestMotion = "disabled";
          style.textContent = `
            *, *::before, *::after {
              animation-duration: 0.001ms !important;
              animation-delay: 0ms !important;
              transition-duration: 0.001ms !important;
              scroll-behavior: auto !important;
            }
          `;
          document.documentElement.appendChild(style);
        };
        if (document.documentElement) disableMotion();
        else document.addEventListener("DOMContentLoaded", disableMotion, { once: true });
      },
      { runtimeSeed: seed, startOnline: online },
    );

    await page.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (!/^https?:$/.test(requestUrl.protocol)) {
        await route.continue();
        return;
      }
      if (isAllowedHttpRequest(requestUrl.href, appOrigin)) {
        await route.continue();
        return;
      }
      unexpectedNetwork.push(`${requestUrl.origin}${requestUrl.pathname}`);
      await route.abort("blockedbyclient");
    });

    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (!allowedConsoleErrors.some((pattern) => pattern.test(text))) {
        consoleErrors.push(text);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await providePage(page);

    expect(unexpectedNetwork, "unexpected external network requests").toEqual([]);
    expect(consoleErrors, "unexpected browser console errors").toEqual([]);
    expect(pageErrors, "unexpected uncaught browser errors").toEqual([]);
  },
});

export async function installMountSentinel(page: Page, selector: string) {
  await page.addInitScript((targetSelector) => {
    const state = { triggered: false };
    Object.defineProperty(window, "__ROUTE_LEDGER_TEST_MOUNT_SENTINEL__", {
      configurable: true,
      value: state,
    });
    const check = () => {
      if (document.querySelector(targetSelector)) state.triggered = true;
    };
    new MutationObserver(check).observe(document, {
      childList: true,
      subtree: true,
    });
    check();
  }, selector);
}

export function mountSentinelTriggered(page: Page) {
  return page.evaluate(
    () =>
      (
        window as Window & {
          __ROUTE_LEDGER_TEST_MOUNT_SENTINEL__?: { triggered: boolean };
        }
      ).__ROUTE_LEDGER_TEST_MOUNT_SENTINEL__?.triggered ?? false,
  );
}

export async function gotoApp(page: Page, path: string) {
  await page.goto(path, { waitUntil: "commit" });
  const expectedScenarioId = await page.evaluate(
    () => window.__ROUTE_LEDGER_TEST_SEED__?.scenarioId,
  );
  expect(expectedScenarioId, "fixture scenario ID").toEqual(expect.any(String));
  await expect
    .poll(
      () =>
        page.evaluate(
          (scenarioId) => window.__ROUTE_LEDGER_TEST_BOUNDARY__ === scenarioId,
          expectedScenarioId,
        ),
      { message: `activate scenario ${expectedScenarioId}` },
    )
    .toBe(true);
}

export { expect } from "@playwright/test";
