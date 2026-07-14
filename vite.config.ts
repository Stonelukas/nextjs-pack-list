import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { validateVitePublicEnv } from "./src/lib/build-env";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(rootDirectory, "src");

export function createViteConfig(
  { command, isPreview, mode }: ConfigEnv,
  buildEnvironment?: Record<string, string | undefined>,
): UserConfig {
  const e2eMode = mode === "e2e";
  if (e2eMode && (command !== "serve" || isPreview)) {
    throw new Error(
      "The Vite e2e test boundary is development server only and cannot be used for production builds or previews",
    );
  }
  if (e2eMode && process.env.ROUTE_LEDGER_E2E !== "1") {
    throw new Error(
      "Vite e2e mode requires the server-only ROUTE_LEDGER_E2E=1 flag",
    );
  }
  if (command === "build") {
    validateVitePublicEnv(
      buildEnvironment ?? loadEnv(mode, rootDirectory, "VITE_"),
      { mode },
    );
  }

  const aliases = [
    { find: "@", replacement: sourceDirectory },
    ...(e2eMode
      ? [
          {
            find: /^@clerk\/clerk-react$/,
            replacement: path.resolve(sourceDirectory, "test/mocks/clerk.tsx"),
          },
          {
            find: /^convex\/react-clerk$/,
            replacement: path.resolve(sourceDirectory, "test/mocks/convex.ts"),
          },
          {
            find: /^convex\/react$/,
            replacement: path.resolve(sourceDirectory, "test/mocks/convex.ts"),
          },
          {
            find: /^virtual:pwa-register\/react$/,
            replacement: path.resolve(
              sourceDirectory,
              "test/mocks/pwa-register.ts",
            ),
          },
          {
            find: /^@vercel\/analytics\/react$/,
            replacement: path.resolve(
              sourceDirectory,
              "test/mocks/vercel-observability.tsx",
            ),
          },
          {
            find: /^@vercel\/speed-insights\/react$/,
            replacement: path.resolve(
              sourceDirectory,
              "test/mocks/vercel-observability.tsx",
            ),
          },
        ]
      : []),
  ];

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-maskable-512x512.png",
        ],
        manifest: {
          name: "Route Ledger",
          short_name: "Route Ledger",
          description:
            "Build clear packing manifests and track what is ready for every journey.",
          theme_color: "#2457d6",
          background_color: "#f3f6f5",
          display: "standalone",
          orientation: "any",
          scope: "/",
          start_url: "/",
          categories: ["travel", "productivity", "utilities"],
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          skipWaiting: false,
          globPatterns: ["**/*.{js,css,html,woff,woff2}"],
          navigateFallback: "/index.html",
          runtimeCaching: [],
        },
      }),
    ],
    resolve: { alias: aliases },
  };
}

export default defineConfig(createViteConfig);
