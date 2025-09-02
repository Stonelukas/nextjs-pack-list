"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { 
  Settings, 
  Globe, 
  Zap, 
  Package, 
  SortAsc,
  Eye,
  Keyboard,
  Save,
  RotateCcw
} from "lucide-react";
import Link from "next/link";
import { Priority } from "@/types";

export default function PreferencesPage() {
  // Default preferences
  const [preferences, setPreferences] = useState({
    language: "en",
    defaultPriority: Priority.MEDIUM,
    autoSave: true,
    defaultView: "grid",
    itemsPerPage: 20,
    showCompletedLists: true,
    enableAnimations: true,
    enableKeyboardShortcuts: true,
    defaultSortOrder: "newest",
    compactMode: false,
    showProgressBars: true,
    confirmDelete: true,
    autoExpandCategories: false,
    defaultQuantity: 1,
  });

  const handleSavePreferences = () => {
    // In a real app, this would save to backend
    localStorage.setItem("user-preferences", JSON.stringify(preferences));
    toast.success("Preferences saved successfully");
  };

  const handleResetDefaults = () => {
    const defaults = {
      language: "en",
      defaultPriority: Priority.MEDIUM,
      autoSave: true,
      defaultView: "grid",
      itemsPerPage: 20,
      showCompletedLists: true,
      enableAnimations: true,
      enableKeyboardShortcuts: true,
      defaultSortOrder: "newest",
      compactMode: false,
      showProgressBars: true,
      confirmDelete: true,
      autoExpandCategories: false,
      defaultQuantity: 1,
    };
    setPreferences(defaults);
    toast.info("Preferences reset to defaults");
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/settings" className="text-sm text-muted-foreground hover:underline">
          ← Back to Settings
        </Link>
        <h1 className="text-3xl font-bold mt-2">Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize your Pack List experience
        </p>
      </div>

      <div className="space-y-6">
        {/* General Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Preferences
            </CardTitle>
            <CardDescription>
              Configure general application behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => setPreferences({ ...preferences, language: value })}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSave">Auto-save changes</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save changes as you make them
                </p>
              </div>
              <Switch
                id="autoSave"
                checked={preferences.autoSave}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, autoSave: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="confirmDelete">Confirm before deleting</Label>
                <p className="text-sm text-muted-foreground">
                  Show confirmation dialog before deleting items
                </p>
              </div>
              <Switch
                id="confirmDelete"
                checked={preferences.confirmDelete}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, confirmDelete: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* List Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              List Preferences
            </CardTitle>
            <CardDescription>
              Default settings for lists and items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="defaultPriority">Default Item Priority</Label>
              <Select
                value={preferences.defaultPriority}
                onValueChange={(value) => 
                  setPreferences({ ...preferences, defaultPriority: value as Priority })
                }
              >
                <SelectTrigger id="defaultPriority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Priority.LOW}>Low</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={Priority.HIGH}>High</SelectItem>
                  <SelectItem value={Priority.ESSENTIAL}>Essential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultQuantity">Default Item Quantity</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="defaultQuantity"
                  min={1}
                  max={10}
                  step={1}
                  value={[preferences.defaultQuantity]}
                  onValueChange={(value) => 
                    setPreferences({ ...preferences, defaultQuantity: value[0] })
                  }
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {preferences.defaultQuantity}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoExpandCategories">Auto-expand categories</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically expand all categories when viewing a list
                </p>
              </div>
              <Switch
                id="autoExpandCategories"
                checked={preferences.autoExpandCategories}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, autoExpandCategories: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showCompletedLists">Show completed lists</Label>
                <p className="text-sm text-muted-foreground">
                  Display lists that are fully packed
                </p>
              </div>
              <Switch
                id="showCompletedLists"
                checked={preferences.showCompletedLists}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, showCompletedLists: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Display Preferences
            </CardTitle>
            <CardDescription>
              Customize how content is displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Default View</Label>
              <RadioGroup
                value={preferences.defaultView}
                onValueChange={(value) => 
                  setPreferences({ ...preferences, defaultView: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grid" id="grid" />
                  <Label htmlFor="grid">Grid View</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="list" id="list" />
                  <Label htmlFor="list">List View</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" id="compact" />
                  <Label htmlFor="compact">Compact View</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemsPerPage">Items per page</Label>
              <Select
                value={preferences.itemsPerPage.toString()}
                onValueChange={(value) => 
                  setPreferences({ ...preferences, itemsPerPage: parseInt(value) })
                }
              >
                <SelectTrigger id="itemsPerPage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="20">20 items</SelectItem>
                  <SelectItem value="50">50 items</SelectItem>
                  <SelectItem value="100">100 items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showProgressBars">Show progress bars</Label>
                <p className="text-sm text-muted-foreground">
                  Display visual progress indicators
                </p>
              </div>
              <Switch
                id="showProgressBars"
                checked={preferences.showProgressBars}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, showProgressBars: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compactMode">Compact mode</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce spacing and use smaller fonts
                </p>
              </div>
              <Switch
                id="compactMode"
                checked={preferences.compactMode}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, compactMode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>
              Optimize application performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableAnimations">Enable animations</Label>
                <p className="text-sm text-muted-foreground">
                  Show smooth transitions and animations
                </p>
              </div>
              <Switch
                id="enableAnimations"
                checked={preferences.enableAnimations}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, enableAnimations: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableKeyboardShortcuts">Keyboard shortcuts</Label>
                <p className="text-sm text-muted-foreground">
                  Enable keyboard shortcuts for quick actions
                </p>
              </div>
              <Switch
                id="enableKeyboardShortcuts"
                checked={preferences.enableKeyboardShortcuts}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, enableKeyboardShortcuts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Sorting Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SortAsc className="h-5 w-5" />
              Sorting & Organization
            </CardTitle>
            <CardDescription>
              Default sorting and organization options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="defaultSortOrder">Default sort order</Label>
              <Select
                value={preferences.defaultSortOrder}
                onValueChange={(value) => 
                  setPreferences({ ...preferences, defaultSortOrder: value })
                }
              >
                <SelectTrigger id="defaultSortOrder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="priority">By priority</SelectItem>
                  <SelectItem value="completion">By completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleSavePreferences} className="flex-1 md:flex-initial">
            <Save className="mr-2 h-4 w-4" />
            Save Preferences
          </Button>
          <Button variant="outline" onClick={handleResetDefaults}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}