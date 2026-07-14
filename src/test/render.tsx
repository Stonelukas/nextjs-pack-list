import {
  render,
  type RenderOptions as TestingLibraryRenderOptions,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { createMemoryRouter } from "react-router-dom";

import { AppProviders } from "@/app/providers";
import { appRoutes } from "@/app/routes";
import type { RuntimeEnvResult } from "@/lib/env";
import type { Theme } from "@/providers/theme-provider";
import {
  regularUserScenario,
  resetTestRuntime,
  type MockAuthState,
  type TestRuntime,
  type TestScenario,
} from "@/test/mocks/runtime";

const TEST_RUNTIME_CONFIGURATION = {
  status: "configured",
  env: {
    clerkPublishableKey: "pk_test_route_ledger_vitest",
    convexUrl: "https://route-ledger-vitest.convex.cloud",
    appUrl: "http://127.0.0.1:4173",
    sentryDsn: undefined,
  },
} satisfies RuntimeEnvResult;

export interface SharedRenderOptions {
  initialUrl?: string;
  scenario?: TestScenario;
  auth?: MockAuthState;
  convex?: Partial<Omit<TestScenario, "auth">>;
  theme?: Theme;
  legacyStorage?: string | Record<string, string>;
  online?: boolean;
  runtimeConfiguration?: RuntimeEnvResult;
}

function cloneScenario(scenario: TestScenario): TestScenario {
  return JSON.parse(JSON.stringify(scenario)) as TestScenario;
}

export function setTestOnline(online: boolean, notify = true) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });
  if (notify) window.dispatchEvent(new Event(online ? "online" : "offline"));
}

function prepareRuntime(options: SharedRenderOptions): TestRuntime {
  const scenario = cloneScenario(options.scenario ?? regularUserScenario());
  if (options.auth) {
    scenario.auth = cloneScenario({
      ...scenario,
      auth: options.auth,
    }).auth;
  }
  if (options.convex) {
    Object.assign(
      scenario,
      cloneScenario({
        ...scenario,
        ...options.convex,
      }),
    );
  }

  if (options.online !== undefined) setTestOnline(options.online, false);
  if (options.theme) window.localStorage.setItem("pack-list-theme", options.theme);
  if (typeof options.legacyStorage === "string") {
    window.localStorage.setItem("pack-list-storage", options.legacyStorage);
  } else if (options.legacyStorage) {
    for (const [key, value] of Object.entries(options.legacyStorage)) {
      window.localStorage.setItem(key, value);
    }
  }

  return resetTestRuntime(scenario);
}

export function renderWithProviders(
  ui: ReactElement,
  options: SharedRenderOptions &
    Omit<TestingLibraryRenderOptions, "wrapper"> = {},
) {
  const {
    initialUrl = "/",
    scenario,
    auth,
    convex,
    theme,
    legacyStorage,
    online,
    runtimeConfiguration = TEST_RUNTIME_CONFIGURATION,
    ...renderOptions
  } = options;
  const runtime = prepareRuntime({
    initialUrl,
    scenario,
    auth,
    convex,
    theme,
    legacyStorage,
    online,
    runtimeConfiguration,
  });
  const router = createMemoryRouter([{ path: "*", element: ui }], {
    initialEntries: [initialUrl],
  });
  const user = userEvent.setup();
  const result = render(
    <AppProviders
      routerInstance={router}
      runtimeConfiguration={runtimeConfiguration}
    />,
    renderOptions,
  );

  return { ...result, router, runtime, user };
}

export function renderAppRoute(options: SharedRenderOptions = {}) {
  const initialUrl = options.initialUrl ?? "/";
  const runtimeConfiguration =
    options.runtimeConfiguration ?? TEST_RUNTIME_CONFIGURATION;
  const runtime = prepareRuntime(options);
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialUrl],
  });
  const user = userEvent.setup();
  const result = render(
    <AppProviders
      routerInstance={router}
      runtimeConfiguration={runtimeConfiguration}
    />,
  );

  return { ...result, router, runtime, user };
}
