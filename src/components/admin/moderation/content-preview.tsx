"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Calendar,
  FileText,
  Flag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ModerationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  content: any;
  author: string;
  authorId: string | null;
  createdAt: number;
  status: string;
  flaggedReason: string;
}

interface ContentPreviewProps {
  item: ModerationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentPreview({ item, open, onOpenChange }: ContentPreviewProps) {
  // Fetch moderation history for the item
  const moderationHistory = item ? useQuery(api.moderation.getModerationHistory, {
    contentId: item.id,
    contentType: item.type,
  }) : undefined;

  // Fetch automated flags for the content
  const automatedFlags = item ? useQuery(api.moderation.getAutomatedFlags, {
    content: JSON.stringify(item.content),
    contentType: item.type,
  }) : undefined;

  if (!item) {
    return null;
  }

  const renderContentDetails = () => {
    switch (item.type) {
      case "list":
      case "template":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">List Details</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{item.content.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="text-right max-w-xs truncate">
                    {item.content.description || "No description"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Is Template:</span>
                  <span>{item.content.isTemplate ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{item.content.completedAt ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
            {item.content.description && (
              <div>
                <h4 className="font-medium mb-2">Full Description</h4>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {item.content.description}
                </div>
              </div>
            )}
          </div>
        );
      
      case "user_profile":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">User Profile Details</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{item.content.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{item.content.email || "No email"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clerk ID:</span>
                  <span className="font-mono text-xs">{item.content.clerkId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Image URL:</span>
                  <span className="text-xs truncate max-w-xs">
                    {item.content.imageUrl || "No image"}
                  </span>
                </div>
              </div>
            </div>
            {item.content.preferences && (
              <div>
                <h4 className="font-medium mb-2">User Preferences</h4>
                <div className="p-3 bg-muted rounded-md text-sm">
                  <div className="grid gap-1">
                    <div>Theme: {item.content.preferences.theme}</div>
                    <div>Default Priority: {item.content.preferences.defaultPriority}</div>
                    <div>Auto Save: {item.content.preferences.autoSave ? "Enabled" : "Disabled"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case "category":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Category Details</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{item.content.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: item.content.color }}
                    />
                    <span>{item.content.color}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Icon:</span>
                  <span>{item.content.icon || "No icon"}</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-3 bg-muted rounded-md text-sm">
            <pre>{JSON.stringify(item.content, null, 2)}</pre>
          </div>
        );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <Flag className="h-4 w-4" />;
      case "low":
        return <Eye className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Content Preview</span>
          </DialogTitle>
          <DialogDescription>
            Review content details and moderation information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                  <Badge variant="secondary">{item.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Author:</span> {item.author}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Created:</span>{" "}
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Flagged:</span> {item.flaggedReason}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Date:</span>{" "}
                    {format(new Date(item.createdAt), "PPP")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent>
              {renderContentDetails()}
            </CardContent>
          </Card>

          {/* Automated Flags */}
          {automatedFlags && automatedFlags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Automated Flags</span>
                </CardTitle>
                <CardDescription>
                  System-detected issues with this content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {automatedFlags.map((flag, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className={getSeverityColor(flag.severity)}>
                        {getSeverityIcon(flag.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{flag.reason}</span>
                          <Badge variant="outline" className={getSeverityColor(flag.severity)}>
                            {flag.severity}
                          </Badge>
                        </div>
                        {flag.details && (
                          <p className="text-sm text-muted-foreground">{flag.details}</p>
                        )}
                        {flag.keyword && (
                          <p className="text-sm text-muted-foreground">
                            Keyword: "{flag.keyword}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Moderation History */}
          {moderationHistory && moderationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Moderation History</CardTitle>
                <CardDescription>
                  Timeline of moderation actions for this content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moderationHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {entry.action === "approved" && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {entry.action === "rejected" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        {entry.action === "flagged" && <Flag className="h-4 w-4 text-yellow-600" />}
                        {entry.action === "submitted" && <Clock className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium capitalize">{entry.action}</span>
                          <span className="text-sm text-muted-foreground">
                            by {entry.moderator}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
