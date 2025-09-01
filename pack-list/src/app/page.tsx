"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Package, Plus, Sparkles, CheckCircle, List, Share2 } from "lucide-react";
import { FadeIn, StaggerChildren, SlideIn } from "@/components/animations/fade-in";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <h1 className="text-xl font-bold">Pack List</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <FadeIn className="max-w-3xl mx-auto space-y-6">
          <motion.h2 
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Never Forget Anything Again
          </motion.h2>
          <motion.p 
            className="text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Smart packing lists for every trip, event, and adventure. 
            Organize, track, and share your packing lists with ease.
          </motion.p>
          <motion.div 
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/lists">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Your First List
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline">
                Browse Templates
              </Button>
            </Link>
          </motion.div>
        </FadeIn>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Smart Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose from pre-built templates for common trips like beach vacations, 
                business travel, camping, and more. Customize them to fit your needs.
              </CardDescription>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Track Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visual progress indicators show you exactly what&apos;s packed and what&apos;s left. 
                Priority levels help you focus on essentials first.
              </CardDescription>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Share & Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share lists with travel companions, export to PDF for printing, 
                or save as templates for future trips.
              </CardDescription>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Your Packing Stats</CardTitle>
            <CardDescription>
              Track your packing efficiency over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Lists Created</div>
              </div>
              <div>
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Items Packed</div>
              </div>
              <div>
                <div className="text-3xl font-bold">0%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
          <p className="mt-2">© 2024 Pack List. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}