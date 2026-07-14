
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { UserTable } from "./user-table";
import { UserDetails } from "./user-details";
import { UserEditForm } from "./user-edit-form";
import type { AdminUserUpdateResult } from "./user-edit-form";
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
import { toast } from "sonner";
import { ActionError } from "@/components/feedback/action-error";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { mapError, type UserFacingError } from "@/lib/errors";

interface User {
  _id: Id<"users">;
  clerkId: string;
  name: string;
  email?: string;
  imageUrl?: string;
  createdAt?: number;
  updatedAt?: number;
  preferences?: {
    theme: string;
    defaultPriority: string;
    autoSave: boolean;
  };
}

type ViewMode = "table" | "details";

export function UserManagement() {
  const { online } = useOnlineStatus();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<UserFacingError | null>(null);
  const [userOverrides, setUserOverrides] = useState<
    Record<string, AdminUserUpdateResult>
  >({});

  const deleteUser = useMutation(api.users.deleteUser);

  const withLatestUser = (user: User) => {
    const override = userOverrides[user._id];
    if (!override) return user;
    if (
      user.updatedAt !== undefined &&
      override.updatedAt !== undefined &&
      user.updatedAt >= override.updatedAt
    ) {
      setUserOverrides((current) => {
        if (current[user._id] !== override) return current;
        const next = { ...current };
        delete next[user._id];
        return next;
      });
      return user;
    }
    return override;
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(withLatestUser(user));
    setViewMode("details");
  };

  const handleUserEdit = (user: User) => {
    setEditingUser(withLatestUser(user));
    setIsEditFormOpen(true);
  };

  const handleUserDelete = (user: User) => {
    setDeletingUser(withLatestUser(user));
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleBackToTable = () => {
    setViewMode("table");
    setSelectedUser(null);
  };

  const handleEditFromDetails = (user: User) => {
    setEditingUser(withLatestUser(user));
    setIsEditFormOpen(true);
  };

  const handleEditSuccess = (updatedUser: AdminUserUpdateResult) => {
    setUserOverrides((current) => ({
      ...current,
      [updatedUser._id]: updatedUser,
    }));
    setSelectedUser((current) =>
      current && current._id === updatedUser._id ? updatedUser : current,
    );
    setEditingUser(null);
  };

  const handleConfirmDelete = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    if (!deletingUser || deletePending) return;
    if (!online) {
      toast.error("Reconnect before saving changes.");
      return;
    }

    const userToDelete = deletingUser;
    setDeletePending(true);
    setDeleteError(null);
    void Promise.resolve()
      .then(() => deleteUser({ userId: userToDelete._id }))
      .then(
        () => {
          toast.success(`User "${userToDelete.name}" has been deleted`);
          if (viewMode === "details" && selectedUser?._id === userToDelete._id) {
            handleBackToTable();
          }
          setDeletingUser(null);
          setIsDeleteDialogOpen(false);
        },
        (error: unknown) => {
          setDeleteError(mapError(error));
        },
      )
      .then(() => setDeletePending(false));
  };

  const handleCancelDelete = () => {
    if (deletePending) return;
    setDeleteError(null);
    setDeletingUser(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {viewMode === "table" ? (
        <UserTable
          onUserSelect={handleUserSelect}
          onUserEdit={handleUserEdit}
          onUserDelete={handleUserDelete}
        />
      ) : (
        selectedUser && (
          <UserDetails
            userId={selectedUser._id}
            onBack={handleBackToTable}
            onEdit={handleEditFromDetails}
          />
        )
      )}

      {/* Edit User Form */}
      {editingUser && (
        <UserEditForm
          user={editingUser}
          open={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (deletePending && !open) return;
          setIsDeleteDialogOpen(open);
          if (!open) handleCancelDelete();
        }}
      >
        <AlertDialogContent aria-busy={deletePending}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{deletingUser?.name}"? This action cannot be undone.
              All of their lists and data will also be permanently deleted.
              {!online ? (
                <span
                  id="delete-user-offline-reason"
                  className="mt-2 block text-warning"
                >
                  Reconnect to delete this user.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? <ActionError error={deleteError} /> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending} onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={!online || deletePending}
              aria-describedby={!online ? "delete-user-offline-reason" : undefined}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePending ? "Deleting user…" : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
