
import { useRef, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { ModerationItem } from "./content-preview";
import { ActionError } from "@/components/feedback/action-error";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { mapError, type UserFacingError } from "@/lib/errors";

interface ModerationQueueProps {
  onPreviewItem?: (item: ModerationItem) => void;
}

export function ModerationQueue({ onPreviewItem }: ModerationQueueProps) {
  const { online } = useOnlineStatus();
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
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<UserFacingError | null>(null);
  const actionGuard = useRef(false);

  // Fetch moderation data
  const moderationQuery = usePaginatedQuery(
    api.moderation.getModerationQueue,
    {
      contentType: selectedType === "all" ? undefined : selectedType,
      status: selectedStatus,
    },
    { initialNumItems: 50 },
  );
  const moderationQueue = moderationQuery.results;
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
    setActionError(null);
  };

  const handleConfirmAction = async () => {
    if (
      actionGuard.current ||
      !actionDialog.action ||
      !actionDialog.item
    ) {
      return;
    }
    if (!online) {
      toast.error("Reconnect before saving changes.");
      return;
    }

    actionGuard.current = true;
    setActionPending(true);
    setActionError(null);
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
      setActionError(mapError(error));
    } finally {
      actionGuard.current = false;
      setActionPending(false);
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

  if (
    moderationQuery.status === "LoadingFirstPage" ||
    !moderationStats
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">Content Moderation</CardTitle>
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
          {!online ? (
            <p id="moderation-offline-reason" className="mt-1 text-sm text-warning">
              Reconnect to approve, reject, or flag content.
            </p>
          ) : null}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle as="h3" className="text-sm font-medium">Total Pending</CardTitle>
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
            <CardTitle as="h3" className="text-sm font-medium">Lists & Templates</CardTitle>
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
            <CardTitle as="h3" className="text-sm font-medium">User Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationStats.pendingByType.users}</div>
            <p className="text-xs text-muted-foreground">Profiles to review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle as="h3" className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moderationStats.moderationLoad.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Current average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div data-moderation-filters className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid gap-1.5 sm:min-w-48">
          <Label htmlFor="content-type">Content Type:</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger id="content-type" className="w-full">
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
        <div className="grid gap-1.5 sm:min-w-40">
          <Label htmlFor="status">Status:</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger id="status" className="w-full">
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
          <CardTitle as="h3">Moderation Queue</CardTitle>
          <CardDescription>
            {moderationQueue.length} loaded items requiring review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {moderationQueue.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No items pending moderation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moderationQueue.map((item) => (
                <div key={item.moderationId} className="border rounded-lg p-4 space-y-3">
                  <div data-moderation-item className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start space-x-3">
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
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
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
                    <div data-moderation-actions className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full lg:w-auto"
                        onClick={() => onPreviewItem?.(item)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full lg:w-auto"
                        onClick={() => handleAction("approve", item)}
                        disabled={!online}
                        aria-describedby={!online ? "moderation-offline-reason" : undefined}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full lg:w-auto"
                        onClick={() => handleAction("reject", item)}
                        disabled={!online}
                        aria-describedby={!online ? "moderation-offline-reason" : undefined}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full lg:w-auto"
                        onClick={() => handleAction("flag", item)}
                        disabled={!online}
                        aria-describedby={!online ? "moderation-offline-reason" : undefined}
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
          {moderationQuery.status === "CanLoadMore" ||
          moderationQuery.status === "LoadingMore" ? (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                disabled={moderationQuery.status === "LoadingMore"}
                aria-busy={moderationQuery.status === "LoadingMore"}
                onClick={() => moderationQuery.loadMore(50)}
              >
                {moderationQuery.status === "LoadingMore"
                  ? "Loading moderation items…"
                  : "Load more moderation items"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (actionPending) return;
          setActionDialog({ ...actionDialog, open });
          if (!open) setActionError(null);
        }}
      >
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
                  <SelectTrigger id="rejection-reason">
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
                    <SelectTrigger id="flag-reason">
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
                    <SelectTrigger id="flag-severity">
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
          {actionError ? <ActionError error={actionError} id="moderation-action-error" /> : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={actionPending}
              onClick={() => setActionDialog({ open: false, action: null, item: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                !online ||
                actionPending ||
                (actionDialog.action === "reject" && !rejectionReason) ||
                (actionDialog.action === "flag" && !flagReason)
              }
              aria-describedby={
                actionError
                  ? "moderation-action-error"
                  : !online
                    ? "moderation-offline-reason"
                    : undefined
              }
              aria-busy={actionPending}
            >
              Confirm {actionDialog.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
