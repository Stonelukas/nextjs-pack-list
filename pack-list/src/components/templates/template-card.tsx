"use client"

import { Template, TemplateCategory } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Plus, 
  Clock, 
  Users, 
  Layers, 
  Package,
  Sparkles,
  Calendar,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
  className?: string;
}

export function TemplateCard({
  template,
  onPreview,
  onUse,
  className
}: TemplateCardProps) {
  const getCategoryColor = (tag: string) => {
    switch (tag) {
      case TemplateCategory.TRAVEL:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case TemplateCategory.OUTDOOR:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case TemplateCategory.EVENTS:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case TemplateCategory.SEASONAL:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case TemplateCategory.BUSINESS:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case TemplateCategory.SPORTS:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case TemplateCategory.EMERGENCY:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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

  const getSeasonIcon = (season?: string) => {
    switch (season) {
      case 'spring':
        return "🌸";
      case 'summer':
        return "☀️";
      case 'fall':
        return "🍂";
      case 'winter':
        return "❄️";
      default:
        return "📅";
    }
  };

  // Calculate total items in template
  const totalItems = template.categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{template.icon || "📦"}</span>
              <span>{template.name}</span>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          {template.isPublic && (
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn("text-xs", getCategoryColor(tag))}
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>{template.categories.length} categories</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{totalItems} items</span>
          </div>
          {template.duration && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{template.duration}</span>
            </div>
          )}
          {template.usageCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{template.usageCount} uses</span>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-4 text-sm">
          {template.difficulty && (
            <div className="flex items-center gap-1">
              <Target className={cn("h-4 w-4", getDifficultyColor(template.difficulty))} />
              <span className={getDifficultyColor(template.difficulty)}>
                {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
              </span>
            </div>
          )}
          {template.season && template.season !== 'all' && (
            <div className="flex items-center gap-1">
              <span>{getSeasonIcon(template.season)}</span>
              <span className="text-muted-foreground">
                {template.season.charAt(0).toUpperCase() + template.season.slice(1)}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPreview(template)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <Button
          size="sm"
          onClick={() => onUse(template)}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}