"use client"

import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";

const ImportDialog = dynamic(
  () => import('@/components/export/import-dialog').then(mod => mod.ImportDialog),
  { 
    loading: () => <Button disabled variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" />Loading...</Button>,
    ssr: false 
  }
);

interface LazyImportDialogProps {
  trigger?: React.ReactNode;
}

export function LazyImportDialog({ trigger }: LazyImportDialogProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsLoaded(true)}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
    );
  }

  return <ImportDialog trigger={trigger} />;
}