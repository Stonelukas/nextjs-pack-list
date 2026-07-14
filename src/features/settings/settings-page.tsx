import { UserProfile, useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { Download, FileArchive, Palette, Settings2, Upload, User } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ImportDialog } from "@/components/export/import-dialog";
import { ActionError } from "@/components/feedback/action-error";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clerkAppearance } from "@/features/auth/clerk-appearance";
import { LegacyImportDialog } from "@/features/legacy-migration/legacy-import-dialog";
import { useListExportData } from "@/features/lists/hooks/use-lists";
import {
  usePreferences,
  type UserPreferences,
} from "@/features/settings/hooks/use-preferences";
import { useOwnedTemplateExportData } from "@/features/templates/hooks/use-templates";
import { useTheme } from "@/providers/theme-provider";

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  defaultPriority: "medium",
  autoSave: true,
};

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadJson(fileName: string, value: unknown) {
  downloadBlob(
    fileName,
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
}

export function SettingsPage() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const { lists, loading: listsLoading } = useListExportData();
  const {
    loading: templatesLoading,
    templates: ownedTemplates,
  } = useOwnedTemplateExportData();
  const {
    error,
    loading,
    pending,
    preferences,
    updatePreferences,
  } = usePreferences();
  const { setTheme, theme } = useTheme();
  const [draftOverrides, setDraftOverrides] = useState<
    Partial<UserPreferences>
  >({});
  const resolvedPreferences = loading
    ? null
    : (preferences ?? DEFAULT_PREFERENCES);
  const draft = resolvedPreferences
    ? { ...resolvedPreferences, ...draftOverrides }
    : null;

  const updateDraft = (
    updater: (current: UserPreferences) => UserPreferences,
  ) => {
    if (!draft) return;
    setDraftOverrides((current) => updater({ ...draft, ...current }));
  };
  const requestedSection = searchParams.get("section");
  const initialSection = ["profile", "preferences", "appearance", "data", "migration"].includes(
    requestedSection ?? "",
  )
    ? requestedSection!
    : "profile";
  const accountDataLoading =
    loading ||
    draft === null ||
    listsLoading ||
    templatesLoading ||
    lists === undefined ||
    ownedTemplates === undefined;

  const savePreferences = async () => {
    if (loading || draft === null) return;
    const saved = await updatePreferences(draft);
    if (saved) {
      setTheme(draft.theme);
      toast.success("Preferences saved");
    }
  };

  const exportAccountData = () => {
    if (accountDataLoading) return;
    downloadJson(
      `route-ledger-export-${new Date().toISOString().slice(0, 10)}.json`,
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        user: user
          ? {
              id: user.id,
              name: user.fullName,
              email: user.primaryEmailAddress?.emailAddress,
            }
          : null,
        preferences: draft,
        lists,
        templates: ownedTemplates,
      },
    );
    toast.success("Account data exported");
  };

  return (
    <div className="overview-frame py-6 md:py-10">
      <PageHeader
        eyebrow="Account manifest / Preferences"
        title="Settings"
        description="Manage your account, packing defaults, appearance, data, and legacy recovery in one place."
      />

      <Tabs defaultValue={initialSection} className="space-y-6">

        <TabsList className="flex h-auto max-w-full flex-wrap overflow-x-auto" aria-label="Settings sections">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="preferences"><Settings2 className="mr-2 h-4 w-4" />Preferences</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" />Appearance</TabsTrigger>
          <TabsTrigger value="data"><Download className="mr-2 h-4 w-4" />Data</TabsTrigger>
          <TabsTrigger value="migration"><FileArchive className="mr-2 h-4 w-4" />Legacy migration</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Profile and security</CardTitle>
              <CardDescription>
                Manage profile details, email addresses, password, passkeys, and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-auto">
              <UserProfile appearance={clerkAppearance} routing="hash" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Application preferences</CardTitle>
              <CardDescription>Saved to your authenticated Convex user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? <p className="text-muted-foreground">Loading preferences…</p> : null}
              <div className="space-y-2">
                <Label htmlFor="default-priority">Default item priority</Label>
                <Select
                  value={draft?.defaultPriority ?? DEFAULT_PREFERENCES.defaultPriority}
                  disabled={loading || draft === null || pending}
                  onValueChange={(value: UserPreferences["defaultPriority"]) =>
                    updateDraft((current) => ({ ...current, defaultPriority: value }))
                  }
                >
                  <SelectTrigger id="default-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="essential">Essential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Changes are saved only when you activate Save preferences.
              </p>
              {error ? <ActionError error={error} id="preferences-error" /> : null}
              <Button
                onClick={savePreferences}
                disabled={loading || draft === null || pending}
                aria-describedby={error ? "preferences-error" : undefined}
              >
                {pending ? "Saving…" : "Save preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Appearance</CardTitle>
              <CardDescription>Choose light, dark, or system appearance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ThemeToggle
                mode="select"
                value={draft?.theme ?? theme}
                disabled={loading || draft === null || pending}
                onThemeChange={(value) => updateDraft((current) => ({ ...current, theme: value }))}
              />
              <p className="text-sm text-muted-foreground">
                Theme changes apply immediately. Save preferences to sync the choice.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Import and export</CardTitle>
              <CardDescription>
                Download your current Convex data or import an exported packing list.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={exportAccountData}
                disabled={accountDataLoading}
              >
                <Download className="mr-2 h-4 w-4" />Export my data
              </Button>
              <ImportDialog
                trigger={
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />Import list
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Legacy browser data</CardTitle>
              <CardDescription>
                Preview and import supported Zustand data into your authenticated account.
                Rejected records remain available in the recovery copy, and browser source
                data is never removed before confirmed persistence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LegacyImportDialog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
