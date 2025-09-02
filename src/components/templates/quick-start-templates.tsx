"use client"

import { useState } from "react";
import { Template } from "@/types";
import { useConvexStore } from "@/hooks/use-convex-store";
import { useRouter } from "next/navigation";
import { defaultTemplates } from "@/data/default-templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  ArrowRight, 
  Sparkles,
  Package,
  Clock,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TemplatePreviewer } from "./template-previewer";

interface QuickStartTemplatesProps {
  className?: string;
  maxTemplates?: number;
}

export function QuickStartTemplates({ 
  className,
  maxTemplates = 6 
}: QuickStartTemplatesProps) {
  const router = useRouter();
  const { applyTemplate } = useConvexStore();
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Get featured templates
  const featuredTemplates = defaultTemplates
    .filter(t => t.isPublic)
    .slice(0, maxTemplates);

  const handleUseTemplate = async (template: Template, listName: string) => {
    const listId = await applyTemplate(template.id, listName);
    if (listId) {
      toast.success(`Created "${listName}" from template`);
      router.push(`/lists/${listId}`);
    } else {
      toast.error("Failed to create list from template");
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return "text-green-600 dark:text-green-400";
      case 'intermediate':
        return "text-yellow-600 dark:text-yellow-400";
      case 'advanced':
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Quick Start Templates</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/templates")}
          className="gap-1"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {featuredTemplates.map((template) => {
          const totalItems = template.categories.reduce((sum, cat) => sum + cat.items.length, 0);
          
          return (
            <Card 
              key={template.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setPreviewTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{template.icon || "📦"}</span>
                    <span className="line-clamp-1">{template.name}</span>
                  </CardTitle>
                  {template.difficulty && (
                    <Badge variant="outline" className={cn("text-xs", getDifficultyColor(template.difficulty))}>
                      {template.difficulty}
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{totalItems} items</span>
                    </div>
                    {template.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{template.duration}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(template);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Template Preview Dialog */}
      <TemplatePreviewer
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUseTemplate}
      />
    </div>
  );
}