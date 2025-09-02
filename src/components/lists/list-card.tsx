"use client"

import { useState } from "react";
import { List } from "@/types";
import { useConvexStore } from "@/hooks/use-convex-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Copy, Download, MoreVertical, Package, Trash2, Edit, Save } from "lucide-react";
import { format } from "date-fns";
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

interface ListCardProps {
  list: List;
  onClick?: () => void;
  onEdit?: () => void;
}

export function ListCard({ list, onClick, onEdit }: ListCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteList, duplicateList, saveAsTemplate, getListProgress } = useConvexStore();
  
  // Use _id for Convex documents, fallback to id for compatibility
  const listId = (list as any)._id || list.id;
  const stats = getListProgress(listId);
  const completionPercentage = stats?.completionPercentage || 0;
  const totalItems = stats?.totalItems || 0;
  const packedItems = stats?.packedItems || 0;

  const handleDelete = () => {
    deleteList(listId);
    toast.success("List deleted successfully");
    setShowDeleteDialog(false);
  };

  const handleDuplicate = () => {
    const newListId = duplicateList(listId);
    if (newListId) {
      toast.success("List duplicated successfully");
    }
  };

  const handleSaveAsTemplate = () => {
    const templateId = saveAsTemplate(
      listId,
      `${list.name} Template`,
      `Template based on ${list.name}`,
      false
    );
    if (templateId) {
      toast.success("List saved as template");
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info("Export feature coming soon!");
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{list.name}</CardTitle>
              {list.description && (
                <CardDescription className="line-clamp-2">
                  {list.description}
                </CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate();
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleSaveAsTemplate();
                }}>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleExport();
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="space-y-3">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{totalItems} items</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{packedItems} packed</span>
              </div>
            </div>

            {/* Tags */}
            {list.tags && list.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {list.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {list.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{list.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3 pb-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Created {format(new Date(list.createdAt), "MMM d, yyyy")}</span>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{list.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}