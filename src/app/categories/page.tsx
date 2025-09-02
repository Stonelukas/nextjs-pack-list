"use client";

import { useState, useMemo } from "react";
import { useConvexStore } from "@/hooks/use-convex-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Folder, 
  Search, 
  Package, 
  TrendingUp, 
  BarChart3, 
  Filter,
  ChevronRight,
  CheckCircle2,
  Circle,
  Star
} from "lucide-react";
import Link from "next/link";
import { Priority } from "@/types";

export default function CategoriesPage() {
  const { lists } = useConvexStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extract all categories with their statistics
  const allCategories = useMemo(() => {
    const categoryMap = new Map<string, {
      name: string;
      count: number;
      totalItems: number;
      packedItems: number;
      lists: Array<{ id: string; name: string }>;
      colors: Set<string>;
      icons: Set<string>;
    }>();

    lists.forEach((list) => {
      list.categories?.forEach((category) => {
        const key = category.name.toLowerCase();
        const existing = categoryMap.get(key) || {
          name: category.name,
          count: 0,
          totalItems: 0,
          packedItems: 0,
          lists: [],
          colors: new Set(),
          icons: new Set(),
        };

        existing.count++;
        existing.lists.push({ id: list.id, name: list.name });
        
        if (category.color) existing.colors.add(category.color);
        if (category.icon) existing.icons.add(category.icon);
        
        // Count items
        const items = category.items || [];
        existing.totalItems += items.length;
        existing.packedItems += items.filter(item => item.packed).length;
        
        categoryMap.set(key, existing);
      });
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count);
  }, [lists]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return allCategories;
    return allCategories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allCategories, searchQuery]);

  // Get most popular categories
  const popularCategories = filteredCategories.slice(0, 10);

  // Calculate overall statistics
  const statistics = useMemo(() => {
    const stats = {
      totalCategories: allCategories.length,
      totalItems: allCategories.reduce((sum, cat) => sum + cat.totalItems, 0),
      packedItems: allCategories.reduce((sum, cat) => sum + cat.packedItems, 0),
      avgItemsPerCategory: 0,
    };
    
    if (stats.totalCategories > 0) {
      stats.avgItemsPerCategory = Math.round(stats.totalItems / stats.totalCategories);
    }
    
    return stats;
  }, [allCategories]);

  // Get details for selected category
  const selectedCategoryData = useMemo(() => {
    if (!selectedCategory) return null;
    
    const category = allCategories.find(
      cat => cat.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    
    if (!category) return null;
    
    // Get all items from this category across lists
    const items: Array<{
      name: string;
      packed: boolean;
      priority: Priority;
      quantity: number;
      listName: string;
      listId: string;
    }> = [];
    
    lists.forEach((list) => {
      const cat = list.categories?.find(
        c => c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      
      if (cat?.items) {
        cat.items.forEach(item => {
          items.push({
            ...item,
            listName: list.name,
            listId: list.id,
          });
        });
      }
    });
    
    return { ...category, items };
  }, [selectedCategory, allCategories, lists]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground mt-2">
          Manage and explore categories across all your packing lists
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalCategories}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Packed Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.packedItems}</div>
            <Progress 
              value={(statistics.packedItems / statistics.totalItems) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Items/Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.avgItemsPerCategory}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Categories
            </CardTitle>
            <CardDescription>Most frequently used categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {popularCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(
                    category.name === selectedCategory ? null : category.name
                  )}
                  className="w-full p-3 rounded-lg border hover:bg-muted text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{category.count} lists</Badge>
                      <Badge variant="outline">{category.totalItems} items</Badge>
                    </div>
                  </div>
                  {category.totalItems > 0 && (
                    <Progress 
                      value={(category.packedItems / category.totalItems) * 100} 
                      className="mt-2 h-1" 
                    />
                  )}
                </button>
              ))}
              {popularCategories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No categories found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              All Categories
            </CardTitle>
            <CardDescription>Complete category inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {filteredCategories.map((category) => (
                <div
                  key={category.name}
                  onClick={() => setSelectedCategory(
                    category.name === selectedCategory ? null : category.name
                  )}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span>{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{category.totalItems}</span>
                    <Package className="h-3 w-3" />
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No categories match your search
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Category Details */}
      {selectedCategoryData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Category: {selectedCategoryData.name}
            </CardTitle>
            <CardDescription>
              Used in {selectedCategoryData.count} lists with {selectedCategoryData.totalItems} total items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items">
                  Items ({selectedCategoryData.items.length})
                </TabsTrigger>
                <TabsTrigger value="lists">
                  Lists ({selectedCategoryData.lists.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="items" className="space-y-2">
                {selectedCategoryData.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {item.packed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                          {item.priority === Priority.ESSENTIAL && (
                            <Star className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <Link 
                          href={`/lists/${item.listId}`}
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          from {item.listName}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedCategoryData.items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items in this category
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="lists" className="space-y-2">
                {selectedCategoryData.lists.map((list) => (
                  <Link key={list.id} href={`/lists/${list.id}`}>
                    <div className="p-3 rounded-lg border hover:bg-muted cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{list.name}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}