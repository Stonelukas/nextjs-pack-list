"use client";

import { ListOverview } from "@/components/lists/list-overview";
import { useRoleBasedAccess } from "@/hooks/use-role-based-navigation";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";

export default function ListsPage() {
  const { hasPermission } = useRoleBasedAccess();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Check if user has permission to view lists
  const canViewLists = hasPermission("view_lists");

  useEffect(() => {
    if (isLoaded && !canViewLists) {
      // Don't redirect immediately, show access denied message instead
      // This provides better UX than automatic redirects
    }
  }, [isLoaded, canViewLists]);

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show access denied for users without permission
  if (!canViewLists) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to sign in to view and manage your packing lists.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/sign-in?redirect=" + encodeURIComponent("/lists"))}
                className="w-full"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has permission, show the lists page
  return (
    <div className="container mx-auto px-4 py-8">
      <ListOverview />
    </div>
  );
}