"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useConvexStore } from "@/hooks/use-convex-store";
import { UserManagement } from "@/components/admin/users/user-management";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";
import { ContentModeration } from "@/components/admin/moderation/content-moderation";
import { SystemSettings } from "@/components/admin/settings/system-settings";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Users, Package, Settings, BarChart3, Shield, Database, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { lists, templates, user: convexUser } = useConvexStore();
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch admin statistics
  const userStats = useQuery(api.users.getUserStats, {});
  const allUsers = useQuery(api.users.getAllUsers, {});

  // Moderation functions
  const initializeModerationRecords = useMutation(api.moderation.initializeModerationRecords);
  const cleanupDuplicateModerationRecords = useMutation(api.moderation.cleanupDuplicateModerationRecords);
  const createTestModerationContent = useMutation(api.moderation.createTestModerationContent);

  // Simple admin check - in production, use proper role management
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      // Check if user email is admin
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const adminCheck = userEmail === "stonelukas@pm.me" || userEmail?.includes("admin");
      setIsAdmin(adminCheck);

      if (!adminCheck) {
        toast.error("Access denied. Admin privileges required.");
        router.push("/");
      }
    }
  }, [user, isLoaded, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access the admin dashboard.</p>
          <SignInButton mode="modal">
            <Button>Sign In</Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Shield className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          <Button onClick={() => router.push("/")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your application, users, and content from one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userStats?.activeUsers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lists</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lists.filter(l => !l.isTemplate).length}</div>
            <p className="text-xs text-muted-foreground">
              {lists.filter(l => !l.isTemplate && l.completedAt).length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Available templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                Monitor your application's health and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Quick Actions</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/seed-templates")}
                    >
                      Seed Templates
                    </Button>
                    <Button variant="outline">Export Data</Button>
                    <Button variant="outline">View Logs</Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          toast.info("Initializing moderation records...");
                          const result = await initializeModerationRecords({});
                          toast.success(`Created ${result.created} moderation records`);
                        } catch (error) {
                          toast.error("Failed to initialize moderation records");
                          console.error("Moderation initialization error:", error);
                        }
                      }}
                    >
                      Init Moderation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          toast.info("Creating test content...");
                          const result = await createTestModerationContent({});
                          toast.success(`Created ${result.created} test items`);
                        } catch (error) {
                          toast.error("Failed to create test content");
                          console.error("Test content creation error:", error);
                        }
                      }}
                    >
                      Create Test Content
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          toast.info("Cleaning up duplicates...");
                          const result = await cleanupDuplicateModerationRecords({});
                          toast.success(`Removed ${result.removed} duplicate records`);
                        } catch (error) {
                          toast.error("Failed to cleanup duplicates");
                          console.error("Cleanup error:", error);
                        }
                      }}
                    >
                      Cleanup Duplicates
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <ContentModeration />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Manage templates and user-generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Templates</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {templates.length} templates available
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/templates")}
                  >
                    Manage Templates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}