"use client";

import { useState, useMemo } from "react";
import { useConvexStore } from "@/hooks/use-convex-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, TrendingUp, Package, Filter, Search, X } from "lucide-react";
import Link from "next/link";

export default function TagsPage() {
  const { lists, templates } = useConvexStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags from lists and templates
  const allTags = useMemo(() => {
    const tagMap = new Map<string, { count: number; lists: string[]; templates: string[] }>();

    // Process list tags
    lists.forEach((list) => {
      if (list.tags) {
        list.tags.forEach((tag) => {
          const existing = tagMap.get(tag) || { count: 0, lists: [], templates: [] };
          existing.count++;
          existing.lists.push(list.name);
          tagMap.set(tag, existing);
        });
      }
    });

    // Process template tags
    templates.forEach((template) => {
      if (template.tags) {
        template.tags.forEach((tag) => {
          const existing = tagMap.get(tag) || { count: 0, lists: [], templates: [] };
          existing.count++;
          existing.templates.push(template.name);
          tagMap.set(tag, existing);
        });
      }
    });

    return Array.from(tagMap.entries())
      .map(([tag, data]) => ({ tag, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [lists, templates]);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery) return allTags;
    return allTags.filter((item) =>
      item.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTags, searchQuery]);

  // Get lists and templates for selected tag
  const selectedTagData = useMemo(() => {
    if (!selectedTag) return null;
    
    const tagLists = lists.filter((list) => list.tags?.includes(selectedTag));
    const tagTemplates = templates.filter((template) => template.tags?.includes(selectedTag));
    
    return { lists: tagLists, templates: tagTemplates };
  }, [selectedTag, lists, templates]);

  const popularTags = filteredTags.slice(0, 10);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tags</h1>
        <p className="text-muted-foreground mt-2">
          Organize and discover lists and templates by tags
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Tag Filter */}
      {selectedTag && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filtering by tag:</span>
          <Badge variant="secondary">
            {selectedTag}
            <button
              onClick={() => setSelectedTag(null)}
              className="ml-2 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Tags
            </CardTitle>
            <CardDescription>Most frequently used tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((item) => (
                <Button
                  key={item.tag}
                  variant={selectedTag === item.tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(item.tag === selectedTag ? null : item.tag)}
                  className="gap-2"
                >
                  <Tag className="h-3 w-3" />
                  {item.tag}
                  <Badge variant="secondary" className="ml-1 px-1">
                    {item.count}
                  </Badge>
                </Button>
              ))}
            </div>
            {popularTags.length === 0 && (
              <p className="text-sm text-muted-foreground">No tags found</p>
            )}
          </CardContent>
        </Card>

        {/* All Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              All Tags
            </CardTitle>
            <CardDescription>Complete list of available tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredTags.map((item) => (
                <div
                  key={item.tag}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedTag(item.tag === selectedTag ? null : item.tag)}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.tag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.lists.length} lists, {item.templates.length} templates
                    </span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                </div>
              ))}
              {filteredTags.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags match your search
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tagged Items */}
      {selectedTagData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items Tagged with "{selectedTag}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lists">
              <TabsList>
                <TabsTrigger value="lists">
                  Lists ({selectedTagData.lists.length})
                </TabsTrigger>
                <TabsTrigger value="templates">
                  Templates ({selectedTagData.templates.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="lists" className="space-y-2">
                {selectedTagData.lists.map((list) => (
                  <Link key={list.id} href={`/lists/${list.id}`}>
                    <div className="p-3 rounded-lg border hover:bg-muted cursor-pointer">
                      <h4 className="font-medium">{list.name}</h4>
                      {list.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {list.description}
                        </p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {list.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
                {selectedTagData.lists.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No lists with this tag
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-2">
                {selectedTagData.templates.map((template) => (
                  <div key={template.id} className="p-3 rounded-lg border">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {template.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedTagData.templates.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No templates with this tag
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}