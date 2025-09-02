"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  Clock,
  User,
  FileText,
  Users,
  Folder,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

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

interface ModerationQueueProps {
  onPreviewItem?: (item: ModerationItem) => void;
}

export function ModerationQueue({ onPreviewItem }: ModerationQueueProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "flag" | null;
    item: ModerationItem | null;
  }>({
    open: false,
    action: null,
    item: null,
  });
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [flagSeverity, setFlagSeverity] = useState("medium");

  // Fetch moderation data
  const moderationQueue = useQuery(api.moderation.getModerationQueue, {
    contentType: selectedType === "all" ? undefined : selectedType,
    status: selectedStatus,
  });
  const moderationStats = useQuery(api.moderation.getModerationStats, {});

  // Mutations
  const approveContent = useMutation(api.moderation.approveContent);
  const rejectContent = useMutation(api.moderation.rejectContent);
  const flagContent = useMutation(api.moderation.flagContent);

  const handleAction = (action: "approve" | "reject" | "flag", item: ModerationItem) => {
    setActionDialog({
      open: true,
      action,
      item,
    });
    setModeratorNotes("");
    setRejectionReason("");
    setFlagReason("");
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.action || !actionDialog.item) return;

    try {
      switch (actionDialog.action) {
        case "approve":
          await approveContent({
            contentId: actionDialog.item.id,
            contentType: actionDialog.item.type,
            moderatorNotes,
          });
          toast.success("Content approved successfully");
          break;
        case "reject":
          await rejectContent({
            contentId: actionDialog.item.id,
            contentType: actionDialog.item.type,
            reason: rejectionReason,
            moderatorNotes,
          });
          toast.success("Content rejected");
          break;
        case "flag":
          await flagContent({
            contentId: actionDialog.item.id,
            contentType: actionDialog.item.type,
            flagReason,
            severity: flagSeverity,
            moderatorNotes,
          });
          toast.success("Content flagged for review");
          break;
      }
      setActionDialog({ open: false, action: null, item: null });
    } catch (error) {
      toast.error("Failed to perform action");
      console.error("Moderation action failed:", error);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "list":
        return <FileText className="h-4 w-4" />;
      case "template":
        return <FileText className="h-4 w-4" />;
      case "user_profile":
        return <User className="h-4 w-4" />;
      case "category":
        return <Folder className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "flagged":
        return <Badge variant="outline"><Flag className="h-3 w-3 mr-1" />Flagged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!moderationQueue || !moderationStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
          <CardDescription>Loading moderation queue...</CardDescription>
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
          <h2 className="text-2xl font-bold">Content Moderation</h2>
          <p className="text-muted-foreground">
            Review and manage user-generated content
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationStats.totalPending}</div>
            <p className="text-xs text-muted-foreground">
              {moderationStats.moderationLoad.today} today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lists & Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationStats.pendingByType.lists}</div>
            <p className="text-xs text-muted-foreground">
              {moderationStats.pendingByType.templates} templates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationStats.pendingByType.users}</div>
            <p className="text-xs text-muted-foreground">Profiles to review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationStats.moderationLoad.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Current average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="content-type">Content Type:</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="list">Lists</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
              <SelectItem value="user_profile">User Profiles</SelectItem>
              <SelectItem value="category">Categories</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="status">Status:</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Moderation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>
            {moderationQueue.length} items requiring review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {moderationQueue.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No items pending moderation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moderationQueue.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getContentTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{item.title}</h4>
                          {getStatusBadge(item.status)}
                          <Badge variant="outline" className="text-xs">
                            {item.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {item.author}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                          <span className="flex items-center">
                            <Flag className="h-3 w-3 mr-1" />
                            {item.flaggedReason}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPreviewItem?.(item)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAction("approve", item)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleAction("reject", item)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("flag", item)}
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Flag
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => 
        setActionDialog({ ...actionDialog, open })
      }>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "approve" && "Approve Content"}
              {actionDialog.action === "reject" && "Reject Content"}
              {actionDialog.action === "flag" && "Flag Content"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.item?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.action === "reject" && (
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                    <SelectItem value="spam">Spam or promotional</SelectItem>
                    <SelectItem value="low-quality">Low quality</SelectItem>
                    <SelectItem value="duplicate">Duplicate content</SelectItem>
                    <SelectItem value="guidelines">Violates guidelines</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {actionDialog.action === "flag" && (
              <>
                <div>
                  <Label htmlFor="flag-reason">Flag Reason *</Label>
                  <Select value={flagReason} onValueChange={setFlagReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="needs-review">Needs further review</SelectItem>
                      <SelectItem value="suspicious">Suspicious activity</SelectItem>
                      <SelectItem value="policy-violation">Policy violation</SelectItem>
                      <SelectItem value="user-report">User reported</SelectItem>
                      <SelectItem value="automated-flag">Automated flag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="flag-severity">Severity</Label>
                  <Select value={flagSeverity} onValueChange={setFlagSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="moderator-notes">Moderator Notes</Label>
              <Textarea
                id="moderator-notes"
                placeholder="Add any additional notes..."
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null, item: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                (actionDialog.action === "reject" && !rejectionReason) ||
                (actionDialog.action === "flag" && !flagReason)
              }
            >
              Confirm {actionDialog.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
