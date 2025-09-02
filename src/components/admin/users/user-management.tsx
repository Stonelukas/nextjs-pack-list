"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { UserTable } from "./user-table";
import { UserDetails } from "./user-details";
import { UserEditForm } from "./user-edit-form";
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
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteUser = useMutation(api.users.deleteUser);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setViewMode("details");
  };

  const handleUserEdit = (user: User) => {
    setEditingUser(user);
    setIsEditFormOpen(true);
  };

  const handleUserDelete = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleBackToTable = () => {
    setViewMode("table");
    setSelectedUser(null);
  };

  const handleEditFromDetails = () => {
    if (selectedUser) {
      setEditingUser(selectedUser);
      setIsEditFormOpen(true);
    }
  };

  const handleEditSuccess = () => {
    // Refresh the view if we're in details mode
    if (viewMode === "details" && selectedUser && editingUser) {
      setSelectedUser({ ...selectedUser, ...editingUser });
    }
    setEditingUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await deleteUser({ userId: deletingUser._id });
      toast.success(`User "${deletingUser.name}" has been deleted`);
      
      // If we're viewing the deleted user's details, go back to table
      if (viewMode === "details" && selectedUser?._id === deletingUser._id) {
        handleBackToTable();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeletingUser(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCancelDelete = () => {
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{deletingUser?.name}"? This action cannot be undone.
              All of their lists and data will also be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
