
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
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

export type ModerationItem = FunctionReturnType<
  typeof api.moderation.getModerationQueue
>["page"][number];

interface ContentPreviewProps {
  item: ModerationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentPreview({ item, open, onOpenChange }: ContentPreviewProps) {
  // Fetch moderation history for the item
  const moderationHistory = useQuery(api.moderation.getModerationHistory,
    item ? { contentId: item.id, contentType: item.type } : "skip"
  );

  // Fetch automated flags for the content
  const automatedFlags = useQuery(api.moderation.getAutomatedFlags,
    item ? { content: JSON.stringify(item.content), contentType: item.type } : "skip"
  );

  if (!item) {
    return null;
  }

  const renderContentDetails = () => {
    switch (item.type) {
      case "list":
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
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{item.content.completedAt ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "template":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Template Details</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{item.content.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visibility:</span>
                  <span>{item.content.isPublic ? "Public" : "Private"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{item.content.category || "Uncategorized"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span>{item.content.difficulty || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="text-right max-w-xs truncate">
                    {item.content.description || "No description"}
                  </span>
                </div>
              </div>
            </div>
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
      
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-danger";
      case "medium":
        return "text-warning";
      case "low":
        return "text-primary";
      default:
        return "text-muted-foreground";
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
                  <CardTitle as="h3" className="text-lg">{item.title}</CardTitle>
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
              <CardTitle as="h3">Content Details</CardTitle>
            </CardHeader>
            <CardContent>
              {renderContentDetails()}
            </CardContent>
          </Card>

          {/* Automated Flags */}
          {automatedFlags && automatedFlags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle as="h3" className="flex items-center space-x-2">
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
                <CardTitle as="h3">Moderation History</CardTitle>
                <CardDescription>
                  Timeline of moderation actions for this content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moderationHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {entry.action === "approved" && <CheckCircle className="h-4 w-4 text-success" />}
                        {entry.action === "rejected" && <AlertTriangle className="h-4 w-4 text-danger" />}
                        {entry.action === "flagged" && <Flag className="h-4 w-4 text-warning" />}
                        {entry.action === "submitted" && <Clock className="h-4 w-4 text-primary" />}
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
