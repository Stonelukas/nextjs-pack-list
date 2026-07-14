import type { Id } from "../../../convex/_generated/dataModel";
import { lazy, Suspense } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useList } from "@/features/lists/hooks/use-list";

const ExportDialog = lazy(async () => {
  const module = await import("@/components/export/export-dialog");
  return { default: module.ExportDialog };
});

interface LazyExportDialogProps {
  listId: Id<"lists">;
  trigger?: React.ReactNode;
}

export function LazyExportDialog({ listId, trigger }: LazyExportDialogProps) {
  const { list } = useList(listId);
  if (!list) return null;
  const categories = [...list.categories].sort((left, right) => left.order - right.order);
  const items = categories.flatMap((category) => category.items);
  return <Suspense fallback={<Button disabled variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Loading…</Button>}><ExportDialog list={list} categories={categories} items={items} trigger={trigger} /></Suspense>;
}
