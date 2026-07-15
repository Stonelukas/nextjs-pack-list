import { v } from "convex/values";

export const themeValidator = v.union(
  v.literal("light"),
  v.literal("dark"),
  v.literal("system"),
);

export const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("essential"),
);

export const preferencesValidator = v.object({
  theme: themeValidator,
  defaultPriority: priorityValidator,
  autoSave: v.boolean(),
});

export const defaultPreferences = {
  theme: "system",
  defaultPriority: "medium",
  autoSave: true,
} as const;
