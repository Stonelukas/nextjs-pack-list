import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Edit,
  MoreVertical,
  Package,
  Save,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useListActions } from "@/features/lists/hooks/use-list-actions";
import { calculateListProgress } from "@/features/lists/list-model";
import type { ListSummary } from "@/features/lists/types";
import { useTemplates } from "@/features/templates/hooks/use-templates";
import { mapError } from "@/lib/errors";

interface ListCardProps {
  list: ListSummary;
  onEdit?: () => void;
}

export function ListCard({ list, onEdit }: ListCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    deleteList,
    duplicateList,
    markListCompleted,
    markListIncomplete,
  } = useListActions();
  const { createTemplateFromList } = useTemplates();
  const progress = calculateListProgress(list);

  const reportActionFailure = (caughtError: unknown) => {
    const error = mapError(caughtError);
    toast.error(error.title, { description: error.message });
  };

  const handleDelete = async () => {
    try {
      const deleted = await deleteList(
        { listId: list._id },
        { rethrow: true },
      );
      if (!deleted) return;
      toast.success("List deleted successfully");
      setShowDeleteDialog(false);
    } catch (caughtError) {
      reportActionFailure(caughtError);
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicatedId = await duplicateList(
        { listId: list._id },
        { rethrow: true },
      );
      if (duplicatedId) toast.success("List duplicated successfully");
    } catch (caughtError) {
      reportActionFailure(caughtError);
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      const templateId = await createTemplateFromList(
        {
          listId: list._id,
          name: `${list.name} Template`,
          description: `Template based on ${list.name}`,
          isPublic: false,
        },
        { rethrow: true },
      );
      if (templateId) toast.success("List saved as template");
    } catch (caughtError) {
      reportActionFailure(caughtError);
    }
  };

  const handleToggleCompletion = async () => {
    try {
      const result = list.completedAt
        ? await markListIncomplete(
            { listId: list._id },
            { rethrow: true },
          )
        : await markListCompleted(
            { listId: list._id },
            { rethrow: true },
          );
      if (result) {
        toast.success(list.completedAt ? "List reopened" : "List completed");
      }
    } catch (caughtError) {
      reportActionFailure(caughtError);
    }
  };

  return (
    <>
      <Card className="group relative cursor-pointer overflow-hidden border-border transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]">
        <Link
          to={`/lists/${list._id}`}
          aria-label={`Open ${list.name}`}
          className="absolute inset-0 z-0 rounded-xl"
        />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle as="h2" className="text-lg">{list.name}</CardTitle>
                {list.completedAt ? (
                  <Badge variant="outline" className="border-success/40 text-success"><CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />Completed</Badge>
                ) : null}
              </div>
              {list.description ? <CardDescription className="line-clamp-2">{list.description}</CardDescription> : null}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                <Button variant="ghost" size="icon" className="relative z-10"><MoreVertical className="h-4 w-4" /><span className="sr-only">List actions</span></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onEdit?.(); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={(event) => { event.stopPropagation(); void handleDuplicate(); }}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                <DropdownMenuItem onClick={(event) => { event.stopPropagation(); void handleSaveAsTemplate(); }}><Save className="mr-2 h-4 w-4" />Save as template</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(event) => { event.stopPropagation(); void handleToggleCompletion(); }}><CheckCircle2 className="mr-2 h-4 w-4" />{list.completedAt ? "Mark incomplete" : "Mark complete"}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={(event) => { event.stopPropagation(); setShowDeleteDialog(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progress</span><span>{progress.completionPercentage}%</span></div>
            <Progress
              value={progress.completionPercentage}
              aria-label={`${list.name} packing progress`}
              className="h-2"
            />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1"><Package className="h-4 w-4 text-muted-foreground" />{progress.totalItems} items</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" />{progress.packedItems} packed</span>
          </div>
          <div className="flex flex-wrap gap-1">{(list.tags ?? []).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>
        </CardContent>
        <CardFooter className="border-t pb-3 pt-3 text-sm text-muted-foreground">
          <Calendar className="mr-1 h-4 w-4" aria-hidden="true" />Created {format(new Date(list.createdAt ?? list._creationTime), "MMM d, yyyy")}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete list</AlertDialogTitle><AlertDialogDescription>Delete “{list.name}” and all of its categories and items? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={(event) => { event.preventDefault(); void handleDelete(); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
