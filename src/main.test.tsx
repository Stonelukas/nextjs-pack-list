import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createRootSpy, initializeSentrySpy, renderSpy } = vi.hoisted(() => {
  const renderSpy = vi.fn();
  return {
    createRootSpy: vi.fn(() => ({ render: renderSpy })),
    initializeSentrySpy: vi.fn(),
    renderSpy,
  };
});

vi.mock("react-dom/client", () => ({ createRoot: createRootSpy }));
vi.mock("@/app/App", () => ({ App: () => null }));
vi.mock("@/lib/env", () => ({
  runtimeEnv: {
    status: "unconfigured",
    issues: [
      {
        key: "VITE_CLERK_PUBLISHABLE_KEY",
        message: "Missing required environment variable",
      },
    ],
  },
}));
vi.mock("@/lib/monitoring/sentry", () => ({
  initializeSentry: initializeSentrySpy,
}));

beforeEach(() => {
  const rootElement = document.createElement("div");
  rootElement.id = "root";
  document.body.append(rootElement);
});

afterEach(() => {
  document.getElementById("root")?.remove();
});

describe("application entry point", () => {
  it("always mounts React when runtime configuration is unavailable", async () => {
    await import("./main");

    expect(initializeSentrySpy).toHaveBeenCalledWith(undefined);
    expect(createRootSpy).toHaveBeenCalledWith(document.getElementById("root"));
    expect(renderSpy).toHaveBeenCalledOnce();
  });
});
