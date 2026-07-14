import "@testing-library/jest-dom/vitest";

import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { clearTestRuntime } from "@/test/mocks/runtime";

configure({ asyncUtilTimeout: 10_000 });

class TestStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

class TestRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly signal: AbortSignal;
  readonly body: BodyInit | null;

  constructor(input: RequestInfo | URL, init: RequestInit = {}) {
    this.url =
      typeof input === "string" || input instanceof URL
        ? String(input)
        : input.url;
    this.method = init.method ?? (typeof input === "object" && "method" in input ? input.method : "GET");
    this.headers = new Headers(init.headers ?? (typeof input === "object" && "headers" in input ? input.headers : undefined));
    this.signal = init.signal ?? new AbortController().signal;
    this.body = init.body ?? null;
  }

  clone() {
    return new TestRequest(this.url, {
      method: this.method,
      headers: this.headers,
      signal: this.signal,
      body: this.body,
    });
  }
}

class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const testLocalStorage = new TestStorage();
const testSessionStorage = new TestStorage();

function installStorage(name: "localStorage" | "sessionStorage", storage: Storage) {
  Object.defineProperty(window, name, {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: storage,
  });
}

if (typeof window !== "undefined") {
  installStorage("localStorage", testLocalStorage);
  installStorage("sessionStorage", testSessionStorage);
}

function createMatchMedia(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
}

beforeEach(() => {
  if (typeof window === "undefined") return;
  installStorage("localStorage", testLocalStorage);
  installStorage("sessionStorage", testSessionStorage);
  Object.defineProperty(globalThis, "Request", {
    configurable: true,
    writable: true,
    value: TestRequest,
  });
  Object.defineProperty(window, "Request", {
    configurable: true,
    writable: true,
    value: TestRequest,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn(createMatchMedia),
  });
  Object.defineProperty(window, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: TestResizeObserver,
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: TestResizeObserver,
  });
  if (!("PointerEvent" in window)) {
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      writable: true,
      value: MouseEvent,
    });
  }
  Object.defineProperties(HTMLElement.prototype, {
    scrollIntoView: {
      configurable: true,
      writable: true,
      value: vi.fn(),
    },
    hasPointerCapture: {
      configurable: true,
      writable: true,
      value: vi.fn(() => false),
    },
    setPointerCapture: {
      configurable: true,
      writable: true,
      value: vi.fn(),
    },
    releasePointerCapture: {
      configurable: true,
      writable: true,
      value: vi.fn(),
    },
  });
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
});

afterEach(() => {
  clearTestRuntime();
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    cleanup();
    try {
      window.localStorage?.clear();
      window.sessionStorage?.clear();
    } catch {
      // Individual storage-denied tests intentionally replace these accessors.
    }
    testLocalStorage.clear();
    testSessionStorage.clear();
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.style.removeProperty("color-scheme");
  }
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
