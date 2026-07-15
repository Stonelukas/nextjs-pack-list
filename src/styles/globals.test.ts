// @vitest-environment node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("./globals.css", import.meta.url)), "utf8");

describe("global accessibility and semantic color contracts", () => {
  it("uses Geist with IBM Plex Mono and restrained Graphite surface tokens", () => {
    expect(css).toContain('--font-sans: "Geist Variable"');
    expect(css).toContain('--font-display: "Geist Variable"');
    expect(css).toContain('--font-mono: "IBM Plex Mono"');
    expect(css).not.toContain('@import "@fontsource/barlow-condensed');
    expect(css).toContain('@import "@fontsource/ibm-plex-mono');
    expect(css).toContain("--radius: 0.625rem;");
    expect(css).toContain("--shadow-card:");
    expect(css).toContain("--shadow-card-hover:");
    expect(css).toContain("--shadow-dialog:");
  });

  it("defines matching semantic foregrounds in both themes", () => {
    expect(css).toContain("--success-foreground:");
    expect(css).toContain("--warning-foreground:");
    expect(css).toContain("--danger-foreground:");
    expect(css.match(/--success-foreground:/g)).toHaveLength(2);
    expect(css.match(/--warning-foreground:/g)).toHaveLength(2);
    expect(css.match(/--danger-foreground:/g)).toHaveLength(2);
  });

  it("keeps shared page headers printable while hiding only the application header", () => {
    expect(css).toContain(".app-header");
    expect(css).not.toContain("header:not([data-print-header])");
  });

  it("preserves progress extent in forced colors for both progress implementations", () => {
    expect(css).toContain('[data-slot="progress-track"]');
    expect(css).toContain('[data-slot="progress-indicator"]');
    expect(css).toContain("background: Highlight !important");
    expect(css).toContain("border-color: CanvasText !important");
  });
});
