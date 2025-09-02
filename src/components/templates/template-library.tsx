"use client"

import { useState, useMemo } from "react";
import { Template, TemplateCategory } from "@/types";
import { useConvexStore } from "@/hooks/use-convex-store";
import { TemplateCard } from "./template-card";
import { TemplatePreviewer } from "./template-previewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid3x3,
  List,
  Sparkles,
  Plus,
  Package,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { searchTemplates, getTemplatesByCategory, getTemplatesBySeason, getTemplatesByDifficulty } from "@/data/default-templates";

interface TemplateLibraryProps {
  onTemplateCreated?: (listId: string) => void;
  className?: string;
}

export function TemplateLibrary({ onTemplateCreated, className }: TemplateLibraryProps) {
  const router = useRouter();
  const { getAllTemplates, applyTemplate } = useConvexStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showOnlyUserTemplates, setShowOnlyUserTemplates] = useState(false);

  const allTemplates = useMemo(() => getAllTemplates(), [getAllTemplates]);

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    let templates = allTemplates;

    // Filter by user templates if needed
    if (showOnlyUserTemplates) {
      templates = templates.filter(t => t.createdBy !== 'system');
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      templates = templates.filter(t => 
        t.tags.includes(selectedCategory as TemplateCategory)
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      templates = templates.filter(t => 
        t.difficulty === selectedDifficulty
      );
    }

    // Season filter
    if (selectedSeason !== "all") {
      templates = templates.filter(t => 
        t.season === selectedSeason || t.season === 'all'
      );
    }

    return templates;
  }, [allTemplates, searchQuery, selectedCategory, selectedDifficulty, selectedSeason, showOnlyUserTemplates]);

  // Group templates by category for display
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, Template[]> = {
      "Your Templates": [],
      "Featured": [],
      "Travel": [],
      "Outdoor": [],
      "Events": [],
      "Business": [],
      "Sports": [],
      "Seasonal": [],
      "Emergency": []
    };

    filteredTemplates.forEach(template => {
      // User templates
      if (template.createdBy !== 'system') {
        groups["Your Templates"].push(template);
      }
      
      // Featured templates
      if (template.isPublic && template.createdBy === 'system') {
        groups["Featured"].push(template);
      }

      // Category-based grouping
      template.tags.forEach(tag => {
        const categoryName = tag.charAt(0).toUpperCase() + tag.slice(1);
        if (groups[categoryName]) {
          groups[categoryName].push(template);
        }
      });
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredTemplates]);

  const handleUseTemplate = async (template: Template, listName: string) => {
    const listId = await applyTemplate(template.id, listName);
    if (listId) {
      toast.success(`Created "${listName}" from template`);
      if (onTemplateCreated) {
        onTemplateCreated(listId);
      } else {
        router.push(`/lists/${listId}`);
      }
    } else {
      toast.error("Failed to create list from template");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setSelectedSeason("all");
    setShowOnlyUserTemplates(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || 
    selectedDifficulty !== "all" || selectedSeason !== "all" || showOnlyUserTemplates;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Template Library</h2>
            <p className="text-muted-foreground">
              Start with a pre-built template or create your own
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value={TemplateCategory.TRAVEL}>Travel</SelectItem>
              <SelectItem value={TemplateCategory.OUTDOOR}>Outdoor</SelectItem>
              <SelectItem value={TemplateCategory.EVENTS}>Events</SelectItem>
              <SelectItem value={TemplateCategory.BUSINESS}>Business</SelectItem>
              <SelectItem value={TemplateCategory.SPORTS}>Sports</SelectItem>
              <SelectItem value={TemplateCategory.SEASONAL}>Seasonal</SelectItem>
              <SelectItem value={TemplateCategory.EMERGENCY}>Emergency</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              <SelectItem value="spring">Spring</SelectItem>
              <SelectItem value="summer">Summer</SelectItem>
              <SelectItem value="fall">Fall</SelectItem>
              <SelectItem value="winter">Winter</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showOnlyUserTemplates ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyUserTemplates(!showOnlyUserTemplates)}
          >
            My Templates
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Count */}
        {hasActiveFilters && (
          <p className="text-sm text-muted-foreground">
            Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? "Try adjusting your filters or search query"
              : "No templates available yet"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([groupName, templates]) => (
            <div key={groupName} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{groupName}</h3>
                <Badge variant="secondary">{templates.length}</Badge>
                {groupName === "Featured" && (
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              
              <div className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-2"
              )}>
                {templates.slice(0, 6).map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={setPreviewTemplate}
                    onUse={(t) => setPreviewTemplate(t)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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