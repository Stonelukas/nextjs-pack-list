"use client"

import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { useConvexStore } from "@/hooks/use-convex-store";

const ExportDialog = dynamic(
  () => import('@/components/export/export-dialog').then(mod => mod.ExportDialog),
  { 
    loading: () => <Button disabled variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Loading...</Button>,
    ssr: false 
  }
);

interface LazyExportDialogProps {
  listId: string;
  trigger?: React.ReactNode;
}

export function LazyExportDialog({ listId, trigger }: LazyExportDialogProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { lists } = useConvexStore();
  const list = lists.find((l) => l._id === listId || l.id === listId);
  
  if (!list) return null;
  
  const listCategories = [...list.categories].sort((a, b) => a.order - b.order);
  const listItems = listCategories.flatMap(category => category.items || []);

  if (!isLoaded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsLoaded(true)}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    );
  }

  return <ExportDialog list={list} categories={listCategories} items={listItems} trigger={trigger} />;
}