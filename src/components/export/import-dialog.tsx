"use client"

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileJson } from "lucide-react";
import { importFromJSON } from "@/lib/export-utils";
import { useConvexStore } from "@/hooks/use-convex-store";
import { useRouter } from "next/navigation";
import { Priority } from "@/types";

interface ImportDialogProps {
  trigger?: React.ReactNode;
}

export function ImportDialog({ trigger }: ImportDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { createList, addCategory, addItem } = useConvexStore();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/json") {
        toast.error("Invalid file type", {
          description: "Please select a JSON file.",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("No file selected", {
        description: "Please select a JSON file to import.",
      });
      return;
    }

    setIsImporting(true);
    try {
      const text = await selectedFile.text();
      const { list: importedList, categories: importedCategories } = importFromJSON(text);

      // Create new list using Convex store
      const newListId = await createList(
        importedList.name || "Imported List",
        importedList.description || "",
        importedList.tags || []
      );

      if (!newListId) {
        throw new Error("Failed to create imported list");
      }

      // Add categories and items
      for (const categoryData of importedCategories) {
        const newCategoryId = await addCategory(newListId, 
          categoryData.name || "Imported Category",
          categoryData.icon || "📦",
          categoryData.icon || "📦",
          0
        );

        // Add items for this category
        if (categoryData.items && Array.isArray(categoryData.items)) {
          for (const itemData of categoryData.items) {
            await addItem(
              newListId, 
              newCategoryId,
              itemData.name || "Imported Item",
              itemData.quantity || 1,
              itemData.priority || Priority.LOW,
              itemData.description || ""
            );
          }
        }
      }

      toast.success("Import successful", {
        description: "Your packing list has been imported successfully.",
      });

      // Navigate to the new list
      router.push(`/lists/${newListId}`);
      
      // Reset dialog state
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : "Failed to import the file. Please check the format and try again.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Packing List</DialogTitle>
          <DialogDescription>
            Import a packing list from a JSON file that was previously exported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select JSON file</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </div>
          </div>

          {selectedFile && (
            <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
              <FileJson className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Note:</p>
            <ul className="space-y-1 ml-4">
              <li>• Only JSON files exported from this app are supported</li>
              <li>• The imported list will be created as a new list</li>
              <li>• All categories and items will be imported</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
          >
            {isImporting ? "Importing..." : "Import List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}