
import { useMemo, useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MoreHorizontal,
  Search,
  Mail,
  Shield,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const USER_PAGE_SIZE = 50;

interface User {
  _id: Id<"users">;
  clerkId: string;
  name: string;
  email?: string;
  imageUrl?: string;
  role?: "user" | "admin";
  createdAt?: number;
  updatedAt?: number;
  preferences?: {
    theme: string;
    defaultPriority: string;
    autoSave: boolean;
  };
}

interface UserTableProps {
  onUserSelect?: (user: User) => void;
  onUserEdit?: (user: User) => void;
  onUserDelete?: (user: User) => void;
}

export function UserTable({ onUserSelect, onUserEdit, onUserDelete }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const { results: users, status, loadMore } = usePaginatedQuery(
    api.users.getAllUsers,
    {},
    { initialNumItems: USER_PAGE_SIZE },
  );
  const isLoading = status === "LoadingFirstPage";
  const hasMore = status === "CanLoadMore" || status === "LoadingMore";

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const handleUserAction = (action: string, user: User) => {
    switch (action) {
      case "view":
        onUserSelect?.(user);
        break;
      case "edit":
        onUserEdit?.(user);
        break;
      case "delete":
        onUserDelete?.(user);
        break;
      default:
        break;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserRole = (user: User) =>
    user.role === "admin" ? "admin" : "user";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">User Management</CardTitle>
          <CardDescription>Loading users...</CardDescription>
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
    <div className="space-y-4">
      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <div data-user-table-toolbar className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle as="h2">Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </div>
            <div className="flex w-full items-center sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  aria-label="Search users"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table aria-label="User accounts">
              <TableCaption className="sr-only">Manage user accounts and permissions</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {searchTerm ? "No users found matching your search." : "No users found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const isCurrentUser = currentUser?._id === user._id;
                    const deleteDisabled = !currentUser || isCurrentUser;
                    return (
                    <TableRow key={user._id}>
                      <TableHead scope="row" className="h-auto py-4 text-foreground">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.imageUrl} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.clerkId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableHead>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user.email || "No email"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getUserRole(user) === "admin" ? "default" : "secondary"}>
                          {getUserRole(user) === "admin" && <Shield className="h-3 w-3 mr-1" />}
                          {getUserRole(user)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.createdAt
                          ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {user.updatedAt
                          ? formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleUserAction("view", user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUserAction("edit", user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleUserAction("delete", user)}
                              disabled={deleteDisabled}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {isCurrentUser ? "Delete current account" : "Delete User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              {users.length} users loaded. Search filters the users loaded so far.
            </p>
            {hasMore ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => loadMore(USER_PAGE_SIZE)}
                disabled={status === "LoadingMore"}
              >
                {status === "LoadingMore" ? "Loading more users…" : "Load more users"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
