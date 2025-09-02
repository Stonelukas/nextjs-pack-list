import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

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
    allowedDomains: [],
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

// Get system settings
export const getSystemSettings = query({
  args: {},
  handler: async (ctx) => {
    // Try to get settings from database
    const settings = await ctx.db
      .query("systemSettings")
      .first();
    
    if (!settings) {
      // Return default settings if none exist
      return DEFAULT_SETTINGS;
    }
    
    // Merge with defaults to ensure all fields are present
    return {
      general: { ...DEFAULT_SETTINGS.general, ...settings.general },
      security: { ...DEFAULT_SETTINGS.security, ...settings.security },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...settings.notifications },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...settings.appearance },
      performance: { ...DEFAULT_SETTINGS.performance, ...settings.performance },
    };
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
    const { settings } = args;
    
    // Validate settings
    if (settings.security.passwordMinLength < 6 || settings.security.passwordMinLength > 32) {
      throw new ConvexError("Password minimum length must be between 6 and 32 characters");
    }
    
    if (settings.security.sessionTimeout < 1 || settings.security.sessionTimeout > 168) {
      throw new ConvexError("Session timeout must be between 1 and 168 hours");
    }
    
    if (settings.performance.cacheDuration < 60 || settings.performance.cacheDuration > 86400) {
      throw new ConvexError("Cache duration must be between 60 and 86400 seconds");
    }
    
    if (settings.performance.maxFileSize < 1 || settings.performance.maxFileSize > 100) {
      throw new ConvexError("Max file size must be between 1 and 100 MB");
    }
    
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
    const { section, key } = args;
    
    const settings = await ctx.db
      .query("systemSettings")
      .first();
    
    if (!settings) {
      // Return default value
      return (DEFAULT_SETTINGS as any)[section]?.[key];
    }
    
    return (settings as any)[section]?.[key] || (DEFAULT_SETTINGS as any)[section]?.[key];
  },
});

// Update specific setting value
export const updateSettingValue = mutation({
  args: {
    section: v.string(),
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const { section, key, value } = args;
    
    // Get current settings
    const existingSettings = await ctx.db
      .query("systemSettings")
      .first();
    
    let currentSettings = existingSettings || {
      ...DEFAULT_SETTINGS,
      createdAt: Date.now(),
    };
    
    // Update the specific value
    if (!(currentSettings as any)[section]) {
      (currentSettings as any)[section] = {};
    }
    (currentSettings as any)[section][key] = value;
    (currentSettings as any).updatedAt = Date.now();
    
    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, currentSettings);
    } else {
      await ctx.db.insert("systemSettings", currentSettings);
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
