"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Shield,
  Database,
  Mail,
  Globe,
  Lock,
  Bell,
  Palette,
  Server,
  Users,
  FileText,
  Save,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerAccount: number;
    defaultUserRole: string;
  };
  security: {
    passwordMinLength: number;
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableCaptcha: boolean;
    allowedDomains: string[];
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
    userWelcomeEmail: boolean;
    systemUpdates: boolean;
  };
  appearance: {
    defaultTheme: string;
    allowThemeSelection: boolean;
    customLogo: string;
    primaryColor: string;
    accentColor: string;
  };
  performance: {
    cacheEnabled: boolean;
    cacheDuration: number;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    maxFileSize: number;
  };
}

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current settings
  const settings = useQuery(api.settings.getSystemSettings, {});
  
  // Mutations
  const updateSettings = useMutation(api.settings.updateSystemSettings);
  const resetSettings = useMutation(api.settings.resetSystemSettings);
  const exportSettings = useMutation(api.settings.exportSystemSettings);

  // Local state for form data
  const [formData, setFormData] = useState<SystemSettings>({
    general: {
      siteName: settings?.general?.siteName || "Pack List",
      siteDescription: settings?.general?.siteDescription || "Smart Packing List Tracker",
      contactEmail: settings?.general?.contactEmail || "contact@packlistapp.com",
      supportEmail: settings?.general?.supportEmail || "support@packlistapp.com",
      maintenanceMode: settings?.general?.maintenanceMode || false,
      registrationEnabled: settings?.general?.registrationEnabled || true,
      maxUsersPerAccount: settings?.general?.maxUsersPerAccount || 1000,
      defaultUserRole: settings?.general?.defaultUserRole || "user",
    },
    security: {
      passwordMinLength: settings?.security?.passwordMinLength || 8,
      requireTwoFactor: settings?.security?.requireTwoFactor || false,
      sessionTimeout: settings?.security?.sessionTimeout || 24,
      maxLoginAttempts: settings?.security?.maxLoginAttempts || 5,
      enableCaptcha: settings?.security?.enableCaptcha || false,
      allowedDomains: settings?.security?.allowedDomains || [],
    },
    notifications: {
      emailNotifications: settings?.notifications?.emailNotifications || true,
      pushNotifications: settings?.notifications?.pushNotifications || true,
      adminAlerts: settings?.notifications?.adminAlerts || true,
      userWelcomeEmail: settings?.notifications?.userWelcomeEmail || true,
      systemUpdates: settings?.notifications?.systemUpdates || true,
    },
    appearance: {
      defaultTheme: settings?.appearance?.defaultTheme || "system",
      allowThemeSelection: settings?.appearance?.allowThemeSelection || true,
      customLogo: settings?.appearance?.customLogo || "",
      primaryColor: settings?.appearance?.primaryColor || "#0f172a",
      accentColor: settings?.appearance?.accentColor || "#3b82f6",
    },
    performance: {
      cacheEnabled: settings?.performance?.cacheEnabled || true,
      cacheDuration: settings?.performance?.cacheDuration || 3600,
      compressionEnabled: settings?.performance?.compressionEnabled || true,
      cdnEnabled: settings?.performance?.cdnEnabled || false,
      maxFileSize: settings?.performance?.maxFileSize || 10,
    },
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await updateSettings({ settings: formData });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error("Settings save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = async () => {
    setIsLoading(true);
    try {
      await resetSettings({});
      toast.success("Settings reset to defaults");
      // Refresh the page to reload default settings
      window.location.reload();
    } catch (error) {
      toast.error("Failed to reset settings");
      console.error("Settings reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSettings = async () => {
    try {
      const exportData = await exportSettings({});
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `system-settings-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Settings exported successfully");
    } catch (error) {
      toast.error("Failed to export settings");
      console.error("Settings export error:", error);
    }
  };

  const updateFormData = (section: keyof SystemSettings, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Loading system configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">
            Configure application settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <FileText className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Server className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Configuration</CardTitle>
              <CardDescription>
                Basic application settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={formData.general.siteName}
                    onChange={(e) => updateFormData("general", "siteName", e.target.value)}
                    placeholder="Pack List"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.general.contactEmail}
                    onChange={(e) => updateFormData("general", "contactEmail", e.target.value)}
                    placeholder="contact@packlistapp.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={formData.general.siteDescription}
                  onChange={(e) => updateFormData("general", "siteDescription", e.target.value)}
                  placeholder="Smart Packing List Tracker"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={formData.general.supportEmail}
                    onChange={(e) => updateFormData("general", "supportEmail", e.target.value)}
                    placeholder="support@packlistapp.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Max Users Per Account</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={formData.general.maxUsersPerAccount}
                    onChange={(e) => updateFormData("general", "maxUsersPerAccount", parseInt(e.target.value))}
                    min="1"
                    max="10000"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">System Controls</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable access for maintenance
                      </p>
                    </div>
                    <Switch
                      checked={formData.general.maintenanceMode}
                      onCheckedChange={(checked) => updateFormData("general", "maintenanceMode", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Registration Enabled</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register accounts
                      </p>
                    </div>
                    <Switch
                      checked={formData.general.registrationEnabled}
                      onCheckedChange={(checked) => updateFormData("general", "registrationEnabled", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultRole">Default User Role</Label>
                <Select
                  value={formData.general.defaultUserRole}
                  onValueChange={(value) => updateFormData("general", "defaultUserRole", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Manage security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={formData.security.passwordMinLength}
                    onChange={(e) => updateFormData("security", "passwordMinLength", parseInt(e.target.value))}
                    min="6"
                    max="32"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={formData.security.sessionTimeout}
                    onChange={(e) => updateFormData("security", "sessionTimeout", parseInt(e.target.value))}
                    min="1"
                    max="168"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={formData.security.maxLoginAttempts}
                  onChange={(e) => updateFormData("security", "maxLoginAttempts", parseInt(e.target.value))}
                  min="3"
                  max="10"
                />
                <p className="text-sm text-muted-foreground">
                  Number of failed login attempts before account lockout
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Security Features</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for all user accounts
                      </p>
                    </div>
                    <Switch
                      checked={formData.security.requireTwoFactor}
                      onCheckedChange={(checked) => updateFormData("security", "requireTwoFactor", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable CAPTCHA</Label>
                      <p className="text-sm text-muted-foreground">
                        Show CAPTCHA on login and registration forms
                      </p>
                    </div>
                    <Switch
                      checked={formData.security.enableCaptcha}
                      onCheckedChange={(checked) => updateFormData("security", "enableCaptcha", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedDomains">Allowed Email Domains</Label>
                <Textarea
                  id="allowedDomains"
                  value={formData.security.allowedDomains.join("\n")}
                  onChange={(e) => updateFormData("security", "allowedDomains", e.target.value.split("\n").filter(d => d.trim()))}
                  placeholder="example.com&#10;company.org&#10;university.edu"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  One domain per line. Leave empty to allow all domains.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Configuration</CardTitle>
              <CardDescription>
                Manage system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Types</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.emailNotifications}
                      onCheckedChange={(checked) => updateFormData("notifications", "emailNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.pushNotifications}
                      onCheckedChange={(checked) => updateFormData("notifications", "pushNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Admin Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts to administrators
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.adminAlerts}
                      onCheckedChange={(checked) => updateFormData("notifications", "adminAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Welcome Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Send welcome email to new users
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.userWelcomeEmail}
                      onCheckedChange={(checked) => updateFormData("notifications", "userWelcomeEmail", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify about system updates and maintenance
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.systemUpdates}
                      onCheckedChange={(checked) => updateFormData("notifications", "systemUpdates", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Configuration</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultTheme">Default Theme</Label>
                  <Select
                    value={formData.appearance.defaultTheme}
                    onValueChange={(value) => updateFormData("appearance", "defaultTheme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customLogo">Custom Logo URL</Label>
                  <Input
                    id="customLogo"
                    value={formData.appearance.customLogo}
                    onChange={(e) => updateFormData("appearance", "customLogo", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.appearance.primaryColor}
                      onChange={(e) => updateFormData("appearance", "primaryColor", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.appearance.primaryColor}
                      onChange={(e) => updateFormData("appearance", "primaryColor", e.target.value)}
                      placeholder="#0f172a"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.appearance.accentColor}
                      onChange={(e) => updateFormData("appearance", "accentColor", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.appearance.accentColor}
                      onChange={(e) => updateFormData("appearance", "accentColor", e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Theme Selection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to choose their preferred theme
                  </p>
                </div>
                <Switch
                  checked={formData.appearance.allowThemeSelection}
                  onCheckedChange={(checked) => updateFormData("appearance", "allowThemeSelection", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Configuration</CardTitle>
              <CardDescription>
                Optimize application performance and resource usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cacheDuration">Cache Duration (seconds)</Label>
                  <Input
                    id="cacheDuration"
                    type="number"
                    value={formData.performance.cacheDuration}
                    onChange={(e) => updateFormData("performance", "cacheDuration", parseInt(e.target.value))}
                    min="60"
                    max="86400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={formData.performance.maxFileSize}
                    onChange={(e) => updateFormData("performance", "maxFileSize", parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Performance Features</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Caching</Label>
                      <p className="text-sm text-muted-foreground">
                        Cache frequently accessed data for better performance
                      </p>
                    </div>
                    <Switch
                      checked={formData.performance.cacheEnabled}
                      onCheckedChange={(checked) => updateFormData("performance", "cacheEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Compression</Label>
                      <p className="text-sm text-muted-foreground">
                        Compress responses to reduce bandwidth usage
                      </p>
                    </div>
                    <Switch
                      checked={formData.performance.compressionEnabled}
                      onCheckedChange={(checked) => updateFormData("performance", "compressionEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable CDN</Label>
                      <p className="text-sm text-muted-foreground">
                        Use Content Delivery Network for static assets
                      </p>
                    </div>
                    <Switch
                      checked={formData.performance.cdnEnabled}
                      onCheckedChange={(checked) => updateFormData("performance", "cdnEnabled", checked)}
                    />
                  </div>
                </div>
              </div>

              {formData.performance.cacheEnabled && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-900 dark:text-blue-100">
                        Cache Configuration
                      </h5>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Caching is enabled. Data will be cached for {formData.performance.cacheDuration} seconds.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
