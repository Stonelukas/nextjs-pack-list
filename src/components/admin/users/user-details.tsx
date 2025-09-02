"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Shield,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface UserDetailsProps {
  userId: Id<"users">;
  onBack?: () => void;
  onEdit?: () => void;
}

export function UserDetails({ userId, onBack, onEdit }: UserDetailsProps) {
  const userDetails = useQuery(api.users.getUserDetails, { userId });
  const userActivity = useQuery(api.users.getUserActivity, { userId, limit: 10 });

  if (userDetails === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading User Details...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Not Found</CardTitle>
          <CardDescription>The requested user could not be found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { user, stats, recentLists } = userDetails;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserRole = (user: any) => {
    if (user.email?.includes("admin") || user.email === "stonelukas@pm.me") {
      return "admin";
    }
    return "user";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "list_created":
        return <Package className="h-4 w-4" />;
      case "list_completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityDescription = (activity: any) => {
    switch (activity.type) {
      case "list_created":
        return `Created list "${activity.data.listName}"`;
      case "list_completed":
        return `Completed list "${activity.data.listName}"`;
      default:
        return "Unknown activity";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Details</h1>
            <p className="text-muted-foreground">View and manage user information</p>
          </div>
        </div>
        <Button onClick={onEdit}>
          <Settings className="mr-2 h-4 w-4" />
          Edit User
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.imageUrl} alt={user.name} />
                <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={getUserRole(user) === "admin" ? "default" : "secondary"}>
                    {getUserRole(user) === "admin" && <Shield className="h-3 w-3 mr-1" />}
                    {getUserRole(user)}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email || "No email provided"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground font-mono">{user.clerkId}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {user.createdAt
                      ? format(new Date(user.createdAt), "PPP")
                      : "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Active</p>
                  <p className="text-sm text-muted-foreground">
                    {user.updatedAt
                      ? formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              <div className="text-center p-4 border rounded-lg">
                <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{stats.totalLists}</div>
                <div className="text-sm text-muted-foreground">Total Lists</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{stats.completedLists}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{stats.templateLists}</div>
                <div className="text-sm text-muted-foreground">Templates</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{stats.activeLists}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Lists */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Lists</CardTitle>
            <CardDescription>User's most recently updated lists</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No lists created yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentLists.map((list: any) => (
                  <div key={list._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{list.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {list.updatedAt
                            ? formatDistanceToNow(new Date(list.updatedAt), { addSuffix: true })
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {list.isTemplate && (
                        <Badge variant="outline" className="text-xs">Template</Badge>
                      )}
                      {list.completedAt && (
                        <Badge variant="secondary" className="text-xs">Completed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>User's recent actions and events</CardDescription>
          </CardHeader>
          <CardContent>
            {!userActivity || userActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {userActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {getActivityDescription(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Preferences */}
      {user.preferences && (
        <Card>
          <CardHeader>
            <CardTitle>User Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user.preferences.theme}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Default Priority</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user.preferences.defaultPriority}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Auto Save</p>
                <p className="text-sm text-muted-foreground">
                  {user.preferences.autoSave ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
