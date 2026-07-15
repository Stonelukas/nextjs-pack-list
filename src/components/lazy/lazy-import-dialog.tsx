import { lazy, Suspense } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

const ImportDialog = lazy(async () => {
  const module = await import("@/components/export/import-dialog");
  return { default: module.ImportDialog };
});

interface LazyImportDialogProps {
  trigger?: React.ReactNode;
}

export function LazyImportDialog({ trigger }: LazyImportDialogProps) {
  return <Suspense fallback={<Button disabled variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" />Loading…</Button>}><ImportDialog trigger={trigger} /></Suspense>;
}
