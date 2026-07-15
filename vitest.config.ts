import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, defineProject } from "vitest/config";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(rootDirectory, "src");
const clerkMock = path.resolve(sourceDirectory, "test/mocks/clerk.tsx");
const convexMock = path.resolve(sourceDirectory, "test/mocks/convex.ts");

const clientAliases = [
  { find: "@", replacement: sourceDirectory },
  { find: /^@clerk\/clerk-react$/, replacement: clerkMock },
  { find: /^convex\/react-clerk$/, replacement: convexMock },
  { find: /^convex\/react$/, replacement: convexMock },
  {
    find: /^virtual:pwa-register\/react$/,
    replacement: path.resolve(sourceDirectory, "test/mocks/pwa-register.ts"),
  },
];

export default defineConfig({
  test: {
    maxWorkers: 1,
    projects: [
      defineProject({
        resolve: { alias: clientAliases },
        test: {
          name: "client",
          environment: "jsdom",
          environmentOptions: {
            jsdom: { url: "http://127.0.0.1:4173/" },
          },
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["./src/test/setup.ts"],
          restoreMocks: true,
          testTimeout: 15_000,
        },
      }),
      defineProject({
        resolve: {
          alias: [{ find: "@", replacement: sourceDirectory }],
        },
        test: {
          name: "convex",
          environment: "node",
          include: ["convex/*.test.ts", "convex/**/*.test.ts"],
        },
      }),
    ],
  },
});
