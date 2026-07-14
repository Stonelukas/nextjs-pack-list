import { useQuery } from "convex/react";
import { BarChart3, CheckCircle2, Database, Package, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../../../convex/_generated/api";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";
import { ContentModeration } from "@/components/admin/moderation/content-moderation";
import { SystemSettings } from "@/components/admin/settings/system-settings";
import { UserManagement } from "@/components/admin/users/user-management";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminPage() {
  const navigate = useNavigate();
  const userStats = useQuery(api.users.getUserStats, {});
  const usage = useQuery(api.analytics.getSystemUsageAnalytics, {});
  const metrics = [
    { label: "Total users", value: userStats?.totalUsers ?? 0, detail: `${userStats?.activeUsers ?? 0} active`, icon: Users },
    { label: "Total lists", value: usage?.overview.totalLists ?? 0, detail: `${usage?.overview.completionRate ?? 0}% completion`, icon: Package },
    { label: "Templates", value: usage?.overview.totalTemplates ?? 0, detail: "Canonical records", icon: Database },
    { label: "System status", value: "Healthy", detail: "Authorized operations available", icon: Shield, status: true },
  ];

  return (
    <div data-admin-page className="manifest-frame py-6 md:py-10">
      <PageHeader eyebrow="Operations control / Administrator" title="Admin dashboard" description="Manage users, analytics, moderation, content, and system settings from one compact workspace." actions={<Button variant="outline" onClick={() => window.print()}>Print overview</Button>} />

      <dl className="mb-8 grid grid-cols-2 border-y border-border xl:grid-cols-4">
        {metrics.map(({ detail, icon: Icon, label, status, value }) => (
          <div key={label} className="border-b border-border p-4 last:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0">
            <dt className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground"><Icon className="h-4 w-4" aria-hidden="true" />{label}</dt>
            <dd className="mt-2 flex items-center gap-2 font-display text-3xl font-bold tabular-nums">{status ? <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" /> : null}{value}</dd>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </dl>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="flex h-auto max-w-full flex-wrap overflow-x-auto" aria-label="Administration sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="max-w-3xl"><CardHeader><CardTitle as="h2">System overview</CardTitle><CardDescription>Server-authorized operational shortcuts.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => navigate("/templates")}>Manage templates</Button><Button variant="outline" onClick={() => window.print()}>Print overview</Button></CardContent></Card>
        </TabsContent>
        <TabsContent value="users"><UserManagement /></TabsContent>
        <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
        <TabsContent value="moderation"><ContentModeration /></TabsContent>
        <TabsContent value="content"><Card className="max-w-3xl"><CardHeader><CardTitle as="h2" className="flex items-center gap-2"><BarChart3 className="h-5 w-5" aria-hidden="true" />Content management</CardTitle><CardDescription>Review the template library and moderation queue.</CardDescription></CardHeader><CardContent><Button onClick={() => navigate("/templates")}>Open templates</Button></CardContent></Card></TabsContent>
        <TabsContent value="settings"><SystemSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
