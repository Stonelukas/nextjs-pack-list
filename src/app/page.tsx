"use client";

import { ListOverview } from "@/components/lists/list-overview";
import { useUser } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Shield, Zap, Cloud } from "lucide-react";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Smart Packing List Tracker
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Never forget anything again. Create, organize, and track your packing lists 
              with ease. Access your lists from anywhere with cloud sync.
            </p>
            <div className="flex gap-4 justify-center">
              <SignInButton mode="modal">
                <Button size="lg" className="font-semibold">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="lg" variant="outline" className="font-semibold">
                  Sign Up Free
                </Button>
              </SignUpButton>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card className="border-muted">
              <CardHeader>
                <Package className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Smart Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize items by categories with color coding and priority levels
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader>
                <Cloud className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Cloud Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access your lists from any device with real-time synchronization
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader>
                <Zap className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Quick Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Start with pre-made templates for common trips and activities
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader>
                <Shield className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Private & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your data is encrypted and only accessible to you
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 p-8 bg-muted/30 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of users who never forget their essentials
            </p>
            <SignUpButton mode="modal">
              <Button size="lg" className="font-semibold">
                Create Your First List
              </Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ListOverview />
    </div>
  );
}