
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";

const userEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  preferences: z.object({
    theme: z.enum(["light", "dark", "system"]),
    defaultPriority: z.enum(["low", "medium", "high", "essential"]),
    autoSave: z.boolean(),
  }),
});

export type UserEditFormData = z.infer<typeof userEditSchema>;
export type AdminUserUpdateResult = FunctionReturnType<
  typeof api.users.updateUser
>;

interface User {
  _id: Id<"users">;
  clerkId: string;
  name: string;
  email?: string;
  imageUrl?: string;
  preferences?: {
    theme: string;
    defaultPriority: string;
    autoSave: boolean;
  };
}

interface UserEditFormProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedUser: AdminUserUpdateResult) => void;
}

export function UserEditForm({ user, open, onOpenChange, onSuccess }: UserEditFormProps) {
  const { online } = useOnlineStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateUser = useMutation(api.users.updateUser);

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name,
      email: user.email || "",
      preferences: {
        theme: (user.preferences?.theme as "light" | "dark" | "system") || "system",
        defaultPriority: (user.preferences?.defaultPriority as UserEditFormData["preferences"]["defaultPriority"]) || "medium",
        autoSave: user.preferences?.autoSave ?? true,
      },
    },
  });

  const onSubmit = async (data: UserEditFormData) => {
    if (!online) {
      toast.error("Reconnect before saving changes.");
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedUser = await updateUser({
        userId: user._id,
        updates: {
          name: data.name,
          email: data.email || undefined,
          preferences: data.preferences,
        },
      });

      toast.success("User updated successfully");
      onSuccess?.(updatedUser);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and preferences. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Basic Information</h4>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty if no email is provided
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* User Preferences */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">User Preferences</h4>
                
                <FormField
                  control={form.control}
                  name="preferences.theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Preference</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferences.defaultPriority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger aria-label="Default Priority">
                            <SelectValue placeholder="Select default priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="essential">Essential</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* User Info Display */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-medium">System Information</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-mono text-xs">{user.clerkId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Internal ID:</span>
                    <span className="font-mono text-xs">{user._id}</span>
                  </div>
                </div>
              </div>
            </div>

            {!online ? (
              <p id="edit-user-offline-reason" className="text-sm text-warning">
                Reconnect to update this user.
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !online}
                aria-describedby={!online ? "edit-user-offline-reason" : undefined}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
