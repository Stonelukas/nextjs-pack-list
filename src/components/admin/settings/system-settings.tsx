import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  Database,
  FileText,
  Palette,
  RefreshCw,
  Server,
  Settings,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "../../../../convex/_generated/api";
import { ActionError } from "@/components/feedback/action-error";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { mapError, type UserFacingError } from "@/lib/errors";

interface SystemSettingsValue {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerAccount: number;
    defaultUserRole: "user" | "admin";
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

function ReadOnlySwitch({ checked, id, label, description }: {
  checked: boolean;
  id: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} disabled aria-describedby="unsupported-settings-note" />
    </div>
  );
}

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<UserFacingError | null>(null);
  const { online } = useOnlineStatus();
  const settings = useQuery(api.settings.getSystemSettings, {}) as SystemSettingsValue | undefined;
  const exportData = useQuery(api.settings.exportSystemSettings, {});
  const resetSettings = useMutation(api.settings.resetSystemSettings);

  const handleResetSettings = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    if (!online || resetPending) return;
    setResetPending(true);
    setResetError(null);
    try {
      await resetSettings({});
      toast.success("Stored settings reset to defaults");
      setResetOpen(false);
    } catch (error) {
      setResetError(mapError(error));
    } finally {
      setResetPending(false);
    }
  };

  const handleExportSettings = () => {
    if (!exportData) {
      toast.error("Settings export is still loading");
      return;
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `system-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("Settings exported successfully");
  };

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">System Settings</CardTitle>
          <CardDescription>Loading system configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div data-system-settings-header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Inspect legacy stored configuration.</p>
        </div>
        <div data-system-settings-actions className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <Button variant="outline" onClick={handleExportSettings}>
            <FileText className="mr-2 h-4 w-4" />Export
          </Button>
          <Button
            variant="outline"
            disabled={!online || resetPending}
            aria-describedby={!online ? "system-settings-offline-reason" : undefined}
            onClick={() => {
              setResetError(null);
              setResetOpen(true);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />Reset
          </Button>
        </div>
      </div>

      <div id="unsupported-settings-note" role="note" className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
        <p className="font-semibold">Stored for reference only — not enforced</p>
        <p className="mt-1 text-muted-foreground">
          Clerk controls registration, authentication, two-factor security, CAPTCHA, and sessions. Notifications and branding have no runtime consumer. Compression, caching, CDN, and file limits belong to deployment configuration. These values are read-only until an enforcement path exists.
        </p>
      </div>
      {!online ? <p id="system-settings-offline-reason" className="text-sm text-warning">Reconnect to reset stored system settings.</p> : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList data-system-settings-tabs className="flex h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="general"><Settings className="h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="h-4 w-4" />Appearance</TabsTrigger>
          <TabsTrigger value="performance"><Server className="h-4 w-4" />Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle as="h3">General Configuration</CardTitle><CardDescription>Read-only legacy values.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="siteName">Site Name</Label><Input id="siteName" value={settings.general.siteName} disabled /></div>
                <div className="space-y-2"><Label htmlFor="contactEmail">Contact Email</Label><Input id="contactEmail" value={settings.general.contactEmail} disabled /></div>
              </div>
              <ReadOnlySwitch id="maintenance-mode" label="Maintenance Mode" description="Not connected to routing or Convex access." checked={settings.general.maintenanceMode} />
              <ReadOnlySwitch id="registration-enabled" label="Registration Enabled" description="Registration is managed in Clerk." checked={settings.general.registrationEnabled} />
              <div className="space-y-2"><Label htmlFor="defaultRole">Default User Role</Label><Select disabled value={settings.general.defaultUserRole}><SelectTrigger id="defaultRole"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle as="h3">Security Configuration</CardTitle><CardDescription>Security policy must be configured in Clerk.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <ReadOnlySwitch id="require-two-factor" label="Two-Factor Authentication" description="Not enforced by this application." checked={settings.security.requireTwoFactor} />
              <ReadOnlySwitch id="enable-captcha" label="Enable CAPTCHA" description="Not enforced by this application." checked={settings.security.enableCaptcha} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="passwordMinLength">Minimum Password Length</Label><Input id="passwordMinLength" value={settings.security.passwordMinLength} disabled /></div>
                <div className="space-y-2"><Label htmlFor="sessionTimeout">Session Timeout (hours)</Label><Input id="sessionTimeout" value={settings.security.sessionTimeout} disabled /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle as="h3">Notification Configuration</CardTitle><CardDescription>No notification delivery service consumes these values.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <ReadOnlySwitch id="email-notifications" label="Email Notifications" description="Unsupported." checked={settings.notifications.emailNotifications} />
              <ReadOnlySwitch id="push-notifications" label="Push Notifications" description="Unsupported." checked={settings.notifications.pushNotifications} />
              <ReadOnlySwitch id="admin-alerts" label="Admin Alerts" description="Unsupported." checked={settings.notifications.adminAlerts} />
              <ReadOnlySwitch id="user-welcome-email" label="User Welcome Email" description="Unsupported." checked={settings.notifications.userWelcomeEmail} />
              <ReadOnlySwitch id="system-updates" label="System Updates" description="Unsupported." checked={settings.notifications.systemUpdates} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader><CardTitle as="h3">Appearance Configuration</CardTitle><CardDescription>The runtime theme uses authenticated user preferences instead.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label htmlFor="defaultTheme">Default Theme</Label><Select disabled value={settings.appearance.defaultTheme}><SelectTrigger id="defaultTheme"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent></Select></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="primaryColor">Primary Color</Label><Input id="primaryColor" aria-label="Primary Color hex value" value={settings.appearance.primaryColor} disabled /></div>
                <div className="space-y-2"><Label htmlFor="accentColor">Accent Color</Label><Input id="accentColor" aria-label="Accent Color hex value" value={settings.appearance.accentColor} disabled /></div>
              </div>
              <ReadOnlySwitch id="allow-theme-selection" label="Allow Theme Selection" description="Unsupported system-wide setting." checked={settings.appearance.allowThemeSelection} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader><CardTitle as="h3">Performance Configuration</CardTitle><CardDescription>Configure these settings in hosting and build infrastructure.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <ReadOnlySwitch id="enable-caching" label="Enable Caching" description="Deployment-owned." checked={settings.performance.cacheEnabled} />
              <ReadOnlySwitch id="enable-compression" label="Enable Compression" description="Deployment-owned." checked={settings.performance.compressionEnabled} />
              <ReadOnlySwitch id="enable-cdn" label="Enable CDN" description="Deployment-owned." checked={settings.performance.cdnEnabled} />
              <div data-cache-notice className="rounded-lg border border-border bg-surface-muted p-4">
                <div className="flex items-start gap-2"><Database className="mt-0.5 h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Stored cache duration: {settings.performance.cacheDuration} seconds. This value is not active.</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={resetOpen} onOpenChange={(open) => {
        if (resetPending && !open) return;
        setResetOpen(open);
        if (!open) setResetError(null);
      }}>
        <AlertDialogContent aria-busy={resetPending}>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset stored system settings?</AlertDialogTitle>
            <AlertDialogDescription>
              All stored system settings across general, security, notifications, appearance, and performance will return to defaults. This does not change Clerk or deployment configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetError ? <ActionError error={resetError} /> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={resetPending || !online} onClick={(event) => void handleResetSettings(event)}>
              {resetPending ? "Resetting…" : "Reset all stored settings"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
