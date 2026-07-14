import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { domainError } from "./lib/errors";

// Default system settings
const DEFAULT_SETTINGS = {
  general: {
    siteName: "Pack List",
    siteDescription: "Smart Packing List Tracker",
    contactEmail: "contact@packlistapp.com",
    supportEmail: "support@packlistapp.com",
    maintenanceMode: false,
    registrationEnabled: true,
    maxUsersPerAccount: 1000,
    defaultUserRole: "user",
  },
  security: {
    passwordMinLength: 8,
    requireTwoFactor: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    enableCaptcha: false,
    allowedDomains: [] as string[],
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    userWelcomeEmail: true,
    systemUpdates: true,
  },
  appearance: {
    defaultTheme: "system",
    allowThemeSelection: true,
    customLogo: "",
    primaryColor: "#0f172a",
    accentColor: "#3b82f6",
  },
  performance: {
    cacheEnabled: true,
    cacheDuration: 3600,
    compressionEnabled: true,
    cdnEnabled: false,
    maxFileSize: 10,
  },
};

type SettingsData = typeof DEFAULT_SETTINGS;
type SettingsSection = keyof SettingsData;
type SettingValue = string | number | boolean | string[];

function isSettingsSection(section: string): section is SettingsSection {
  return section in DEFAULT_SETTINGS;
}

function mergeSettings(
  settings: Partial<SettingsData> | null,
): SettingsData {
  return {
    general: { ...DEFAULT_SETTINGS.general, ...settings?.general },
    security: { ...DEFAULT_SETTINGS.security, ...settings?.security },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...settings?.notifications,
    },
    appearance: { ...DEFAULT_SETTINGS.appearance, ...settings?.appearance },
    performance: {
      ...DEFAULT_SETTINGS.performance,
      ...settings?.performance,
    },
  };
}

function getSetting(
  settings: SettingsData,
  section: string,
  key: string,
): SettingValue | undefined {
  if (!isSettingsSection(section) || !(key in DEFAULT_SETTINGS[section])) {
    return undefined;
  }
  const values = settings[section] as unknown as Record<string, SettingValue>;
  return values[key];
}

function setSetting(
  settings: SettingsData,
  section: string,
  key: string,
  value: SettingValue,
): void {
  if (!isSettingsSection(section) || !(key in DEFAULT_SETTINGS[section])) {
    throw domainError("VALIDATION", `Unknown setting: ${section}.${key}`);
  }
  const defaultValue = getSetting(DEFAULT_SETTINGS, section, key);
  const compatible = Array.isArray(defaultValue)
    ? Array.isArray(value) && value.every((entry) => typeof entry === "string")
    : typeof value === typeof defaultValue;
  if (!compatible) {
    throw domainError(
      "VALIDATION",
      `Invalid value for setting: ${section}.${key}`,
    );
  }
  const values = settings[section] as unknown as Record<string, SettingValue>;
  values[key] = value;
}

function requireIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  message: string,
): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw domainError("VALIDATION", message);
  }
}

function validateSettings(settings: SettingsData): void {
  requireIntegerInRange(
    settings.general.maxUsersPerAccount,
    1,
    10000,
    "Maximum users per account must be an integer between 1 and 10000",
  );
  if (!(["user", "admin"] as const).includes(settings.general.defaultUserRole as "user" | "admin")) {
    throw domainError("VALIDATION", "Default user role must be user or admin");
  }
  requireIntegerInRange(
    settings.security.passwordMinLength,
    6,
    32,
    "Password minimum length must be an integer between 6 and 32 characters",
  );
  requireIntegerInRange(
    settings.security.sessionTimeout,
    1,
    168,
    "Session timeout must be an integer between 1 and 168 hours",
  );
  requireIntegerInRange(
    settings.security.maxLoginAttempts,
    3,
    10,
    "Maximum login attempts must be an integer between 3 and 10",
  );
  if (!(["light", "dark", "system"] as const).includes(settings.appearance.defaultTheme as "light" | "dark" | "system")) {
    throw domainError(
      "VALIDATION",
      "Default theme must be light, dark, or system",
    );
  }
  requireIntegerInRange(
    settings.performance.cacheDuration,
    60,
    86400,
    "Cache duration must be an integer between 60 and 86400 seconds",
  );
  requireIntegerInRange(
    settings.performance.maxFileSize,
    1,
    100,
    "Max file size must be an integer between 1 and 100 MB",
  );
}

// Get system settings
export const getSystemSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    // Try to get settings from database
    const settings = await ctx.db
      .query("systemSettings")
      .first();
    
    if (!settings) {
      // Return default settings if none exist
      return DEFAULT_SETTINGS;
    }
    
    return mergeSettings(settings);
  },
});

// Update system settings
export const updateSystemSettings = mutation({
  args: {
    settings: v.object({
      general: v.object({
        siteName: v.string(),
        siteDescription: v.string(),
        contactEmail: v.string(),
        supportEmail: v.string(),
        maintenanceMode: v.boolean(),
        registrationEnabled: v.boolean(),
        maxUsersPerAccount: v.number(),
        defaultUserRole: v.string(),
      }),
      security: v.object({
        passwordMinLength: v.number(),
        requireTwoFactor: v.boolean(),
        sessionTimeout: v.number(),
        maxLoginAttempts: v.number(),
        enableCaptcha: v.boolean(),
        allowedDomains: v.array(v.string()),
      }),
      notifications: v.object({
        emailNotifications: v.boolean(),
        pushNotifications: v.boolean(),
        adminAlerts: v.boolean(),
        userWelcomeEmail: v.boolean(),
        systemUpdates: v.boolean(),
      }),
      appearance: v.object({
        defaultTheme: v.string(),
        allowThemeSelection: v.boolean(),
        customLogo: v.string(),
        primaryColor: v.string(),
        accentColor: v.string(),
      }),
      performance: v.object({
        cacheEnabled: v.boolean(),
        cacheDuration: v.number(),
        compressionEnabled: v.boolean(),
        cdnEnabled: v.boolean(),
        maxFileSize: v.number(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { settings } = args;
    
    validateSettings(settings);
    
    // Check if settings record exists
    const existingSettings = await ctx.db
      .query("systemSettings")
      .first();
    
    const settingsData = {
      ...settings,
      updatedAt: Date.now(),
    };
    
    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, settingsData);
    } else {
      // Create new settings record
      await ctx.db.insert("systemSettings", {
        ...settingsData,
        createdAt: Date.now(),
      });
    }
    
    // Log the settings update
    console.log("System settings updated:", {
      timestamp: new Date().toISOString(),
      updatedSections: Object.keys(settings),
    });
    
    return {
      success: true,
      message: "Settings updated successfully",
      timestamp: Date.now(),
    };
  },
});

// Reset settings to defaults
export const resetSystemSettings = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    // Check if settings record exists
    const existingSettings = await ctx.db
      .query("systemSettings")
      .first();
    
    const defaultSettingsData = {
      ...DEFAULT_SETTINGS,
      updatedAt: Date.now(),
    };
    
    if (existingSettings) {
      // Update existing settings with defaults
      await ctx.db.patch(existingSettings._id, defaultSettingsData);
    } else {
      // Create new settings record with defaults
      await ctx.db.insert("systemSettings", {
        ...defaultSettingsData,
        createdAt: Date.now(),
      });
    }
    
    console.log("System settings reset to defaults:", {
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: true,
      message: "Settings reset to defaults",
      settings: DEFAULT_SETTINGS,
      timestamp: Date.now(),
    };
  },
});

// Export settings for backup
export const exportSystemSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const settings = await ctx.db
      .query("systemSettings")
      .first();
    
    const exportData = {
      settings: settings || DEFAULT_SETTINGS,
      exportedAt: new Date().toISOString(),
      version: "1.0",
      application: "Pack List",
    };
    
    console.log("System settings exported:", {
      timestamp: new Date().toISOString(),
    });
    
    return exportData;
  },
});

// Get specific setting value
export const getSettingValue = query({
  args: {
    section: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { section, key } = args;
    
    const settings = await ctx.db
      .query("systemSettings")
      .first();
    
    const currentSettings = mergeSettings(settings);
    return getSetting(currentSettings, section, key);
  },
});

// Update specific setting value
export const updateSettingValue = mutation({
  args: {
    section: v.string(),
    key: v.string(),
    value: v.union(
      v.string(),
      v.number(),
      v.boolean(),
      v.array(v.string()),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { section, key, value } = args;
    
    const existingSettings = await ctx.db.query("systemSettings").first();
    const currentSettings = mergeSettings(existingSettings);
    setSetting(currentSettings, section, key, value);
    validateSettings(currentSettings);
    const settingsData = { ...currentSettings, updatedAt: Date.now() };

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, settingsData);
    } else {
      await ctx.db.insert("systemSettings", {
        ...settingsData,
        createdAt: Date.now(),
      });
    }
    
    console.log(`Setting updated: ${section}.${key} = ${value}`);
    
    return {
      success: true,
      message: `Setting ${section}.${key} updated`,
      value,
      timestamp: Date.now(),
    };
  },
});
