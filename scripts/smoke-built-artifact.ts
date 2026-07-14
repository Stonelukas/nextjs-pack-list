import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const distDirectory = path.join(root, "dist");
const indexPath = path.join(distDirectory, "index.html");
const baseUrl = "http://127.0.0.1:4174";
const deepRoutes = [
  "/",
  "/sign-in/factor-two",
  "/sign-up/verify-email-address",
  "/lists",
  "/lists/not-a-real-id",
  "/lists/not-a-real-id/edit",
  "/templates",
  "/categories",
  "/tags",
  "/settings",
  "/admin",
  "/route-that-does-not-exist",
];
const expectedStaticFiles = [
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/pwa-maskable-512x512.png",
];

const indexBytes = await readFile(indexPath);
const indexHtml = indexBytes.toString("utf8");
if (!indexHtml.includes("Route Ledger") || !indexHtml.includes("/assets/")) {
  throw new Error("dist/index.html is missing the production title or bundled assets");
}

const bundledAssetPaths = [...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)]
  .map((match) => match[1])
  .filter((value, index, values) => values.indexOf(value) === index);
const scriptAsset = bundledAssetPaths.find((assetPath) => assetPath.endsWith(".js"));
const styleAsset = bundledAssetPaths.find((assetPath) => assetPath.endsWith(".css"));
if (!scriptAsset || !styleAsset) {
  throw new Error("Unable to discover hashed JavaScript and CSS assets from dist/index.html");
}

const workboxFiles = (await readdir(distDirectory)).filter((fileName) =>
  /^workbox-[\w-]+\.js$/.test(fileName),
);
if (workboxFiles.length !== 1) {
  throw new Error(
    `Expected exactly one generated Workbox file, found ${workboxFiles.length}`,
  );
}
const workboxPath = `/${workboxFiles[0]}`;

const server = spawn(
  "bun",
  ["run", "preview", "--host", "127.0.0.1", "--port", "4174", "--strictPort"],
  { cwd: root, stdio: "ignore" },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Preview startup is asynchronous.
    }
    await Bun.sleep(100);
  }
  throw new Error("Vite preview did not become ready");
}

function isHtml(bytes: Buffer, contentType: string | null) {
  const prefix = bytes.subarray(0, 256).toString("utf8").toLowerCase();
  return contentType?.includes("text/html") || prefix.includes("<!doctype html");
}

async function fetchBytes(route: string) {
  const response = await fetch(`${baseUrl}${route}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) {
    throw new Error(`Built artifact request failed for ${route}: ${response.status}`);
  }
  return { bytes, contentType: response.headers.get("content-type") };
}

async function assertNonHtmlAsset(
  route: string,
  expectedContentType: RegExp,
) {
  const { bytes, contentType } = await fetchBytes(route);
  if (!contentType || !expectedContentType.test(contentType)) {
    throw new Error(`Unexpected content type for ${route}: ${contentType ?? "missing"}`);
  }
  if (bytes.length === 0 || bytes.equals(indexBytes) || isHtml(bytes, contentType)) {
    throw new Error(`Static asset ${route} resolved to an empty or HTML response`);
  }
  return bytes;
}

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  const exited = await Promise.race([
    new Promise<boolean>((resolve) => server.once("exit", () => resolve(true))),
    Bun.sleep(2_000).then(() => false),
  ]);
  if (!exited && server.exitCode === null) server.kill("SIGKILL");
}

try {
  await waitForServer();

  await assertNonHtmlAsset(scriptAsset, /(?:application|text)\/javascript/i);
  await assertNonHtmlAsset(styleAsset, /text\/css/i);
  const workboxBytes = await assertNonHtmlAsset(
    workboxPath,
    /(?:application|text)\/javascript/i,
  );
  if (!workboxBytes.toString("utf8").includes("workbox")) {
    throw new Error(`${workboxPath} does not contain the generated Workbox runtime`);
  }

  const manifestBytes = await assertNonHtmlAsset(
    "/manifest.webmanifest",
    /application\/(?:manifest\+json|json)/i,
  );
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as {
    name?: string;
    short_name?: string;
    start_url?: string;
    icons?: Array<{ src?: string }>;
  };
  const manifestIconPaths = new Set(manifest.icons?.map((icon) => icon.src));
  if (
    manifest.name !== "Route Ledger" ||
    manifest.short_name !== "Route Ledger" ||
    manifest.start_url !== "/" ||
    !manifestIconPaths.has("/pwa-192x192.png") ||
    !manifestIconPaths.has("/pwa-512x512.png") ||
    !manifestIconPaths.has("/pwa-maskable-512x512.png")
  ) {
    throw new Error("manifest.webmanifest is missing the Route Ledger shell contract");
  }

  const workerBytes = await assertNonHtmlAsset(
    "/sw.js",
    /(?:application|text)\/javascript/i,
  );
  const workboxModuleName = workboxFiles[0].replace(/\.js$/, "");
  if (!workerBytes.toString("utf8").includes(workboxModuleName)) {
    throw new Error("sw.js does not reference the discovered Workbox runtime");
  }

  for (const staticPath of expectedStaticFiles.slice(2)) {
    await assertNonHtmlAsset(staticPath, /^image\//i);
  }

  for (const route of deepRoutes) {
    const { bytes, contentType } = await fetchBytes(route);
    if (!contentType?.includes("text/html") || !bytes.equals(indexBytes)) {
      throw new Error(`Deep route ${route} did not return the byte-identical index shell`);
    }
  }

  console.log(
    [
      "Built artifact smoke passed",
      `hashed assets: ${scriptAsset}, ${styleAsset}`,
      `Workbox: ${workboxPath}`,
      `static shell files: ${expectedStaticFiles.length}`,
      `byte-identical deep routes: ${deepRoutes.length}`,
    ].join("; "),
  );
} finally {
  await stopServer();
}
