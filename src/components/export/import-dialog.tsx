import { useRef, useState } from "react";
import { FileJson, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListActions } from "@/features/lists/hooks/use-list-actions";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { mapError, type UserFacingError } from "@/lib/errors";
import { importFromJSON } from "@/lib/export-utils";

interface ImportDialogProps {
  trigger?: React.ReactNode;
}

export function ImportDialog({ trigger }: ImportDialogProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<UserFacingError | null>(null);
  const { importList } = useListActions();
  const { online } = useOnlineStatus();

  const handleImport = async () => {
    if (!file || !online) return;
    setImporting(true);
    setImportError(null);
    try {
      const imported = importFromJSON(await file.text());
      const listId = await importList(imported, { rethrow: true });
      if (!listId) throw new Error("List import did not create a list");
      toast.success("Packing list imported");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      navigate(`/lists/${listId}`);
    } catch (error) {
      const mappedError = mapError(error);
      setImportError(mappedError);
      toast.error(mappedError.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" data-import-trigger>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import packing list</DialogTitle>
          <DialogDescription>
            Import a JSON file previously exported by this app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">JSON file</Label>
            <Input
              id="file-upload"
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) {
                  setFile(selected);
                  setImportError(null);
                }
              }}
              disabled={importing}
            />
          </div>
          {file ? (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
              <FileJson className="h-8 w-8" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          ) : null}
          {importError ? (
            <div role="alert" className="text-sm text-destructive">
              <p className="font-semibold">{importError.title}</p>
              <p>{importError.message}</p>
            </div>
          ) : null}
          {!online ? (
            <p
              id="import-list-offline-reason"
              role="status"
              aria-live="polite"
              className="text-sm text-warning"
            >
              Reconnect to import this list.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            onClick={() => void handleImport()}
            disabled={!file || importing || !online}
            aria-describedby={!online ? "import-list-offline-reason" : undefined}
          >
            {importing ? "Importing…" : "Import list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
