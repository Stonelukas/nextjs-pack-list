// @vitest-environment node

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceRoot = fileURLToPath(new URL("../", import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    if (/\.(test|backup)\./.test(entry.name)) return [];
    return [path];
  });
}

function retainedSource() {
  return sourceFiles(sourceRoot)
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

describe("Task 6 retained source contracts", () => {
  it("contains no Next navigation imports or compatibility-store consumers", () => {
    const source = retainedSource();

    expect(source).not.toMatch(/from ["']next\/(link|navigation|dynamic)["']/);
    expect(source).not.toContain("use-convex-store");
  });

  it("contains no top-level use client directives", () => {
    expect(retainedSource()).not.toMatch(
      /^[\t ]*["']use client["'];?[\t ]*$/m,
    );
  });

  it("does not call Convex functions that were internalized during hardening", () => {
    const source = retainedSource();

    expect(source).not.toMatch(/api\.templates\.seedTemplates/);
    expect(source).not.toMatch(/api\.moderation\.createTestContent/);
    expect(source).not.toMatch(
      /api\.users\.(upsertFromClerk|deleteFromClerk)/,
    );
  });

  it("preserves branded Convex list IDs at retained component boundaries", () => {
    const source = retainedSource();

    expect(source).not.toContain("useOptimizedList(listId: string)");
    expect(source).not.toContain("onTemplateCreated?: (listId: string)");
    expect(source).not.toContain("generateOwnerListLink(listId: string)");
  });

  it("keeps legacy list template flags out of retained client models", () => {
    const listModel = readFileSync(`${sourceRoot}/features/lists/list-model.ts`, "utf8");
    const listOverview = readFileSync(
      `${sourceRoot}/components/lists/list-overview.tsx`,
      "utf8",
    );
    const sharedTypes = readFileSync(`${sourceRoot}/types/index.ts`, "utf8");

    expect(listModel).not.toContain("isTemplate");
    expect(listOverview).not.toContain("isTemplate");
    expect(sharedTypes).not.toContain("isTemplate: boolean");
  });
});
