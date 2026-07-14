import { useState } from "react";
import { Download, FileArchive, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLegacyMigration } from "./use-legacy-migration";

function downloadRaw(fileName: string, raw: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function importableSummary(lists: number, templates: number) {
  const listLabel = `${lists} ${lists === 1 ? "list" : "lists"}`;
  const templateLabel = `${templates} ${templates === 1 ? "template" : "templates"}`;
  return `${listLabel} and ${templateLabel} can be imported.`;
}

export interface LegacyImportDialogProps {
  storage?: Storage | null;
}

export function LegacyImportDialog({ storage }: LegacyImportDialogProps) {
  const migration = useLegacyMigration(storage);
  const [confirmedSource, setConfirmedSource] = useState<string | null>(null);
  const { preview, recovery, result } = migration;
  const confirmationKey = preview
    ? JSON.stringify([
        preview.rawSource,
        preview.fingerprint,
        migration.sourceReadState,
      ])
    : null;
  const confirmed =
    confirmationKey !== null && confirmedSource === confirmationKey;

  if (!preview) {
    return (
      <p
        className={
          migration.sourceReadState === "inaccessible"
            ? "text-sm text-destructive"
            : "text-sm text-muted-foreground"
        }
        role={migration.sourceReadState === "inaccessible" ? "alert" : undefined}
      >
        {migration.sourceReadState === "inaccessible"
          ? "Legacy browser storage is inaccessible, so no import or cleanup can run."
          : "The legacy pack-list-storage key is missing in this browser."}
      </p>
    );
  }

  const malformedJson =
    preview.lists.length === 0 &&
    preview.templates.length === 0 &&
    preview.rejected.some((record) => record.path === "$" && typeof record.raw === "string");

  const recoveryButton = recovery ? (
    <Button
      type="button"
      variant="outline"
      onClick={() => downloadRaw(recovery.fileName, recovery.raw)}
    >
      <Download className="mr-2 h-4 w-4" />
      {recovery.fileName.endsWith("-raw.json")
        ? "Download raw recovery copy"
        : "Download recovery copy"}
    </Button>
  ) : null;

  if (!migration.hasImportableData) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          {preview.manualExportRequired
            ? preview.manualExportRequired
            : malformedJson
              ? "Legacy data could not be parsed. Keep the source and download the exact raw recovery copy."
              : "No valid legacy lists or templates can be imported automatically."}
        </p>
        {preview.rejected.length > 0 ? (
          <div>
            <p className="text-sm font-medium">
              {preview.rejected.length} rejected {preview.rejected.length === 1 ? "record" : "records"}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {preview.rejected.map((record, index) => (
                <li key={`${record.path}-${index}`}>
                  <code>{record.path}</code>: {record.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {recoveryButton}
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-4" role="status">
        <p className="text-sm font-medium">
          {result.status === "already_imported"
            ? "This legacy data was already imported."
            : "Legacy data imported successfully."}
        </p>
        <p className="text-sm text-muted-foreground">
          {result.listsImported} lists and {result.templatesImported} templates are stored in Convex.
        </p>
        {migration.sourceRemoved ? (
          <p className="text-sm text-muted-foreground">Legacy source data removed from this browser.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {recoveryButton}
            <Button type="button" variant="destructive" onClick={migration.removeSource}>
              <Trash2 className="mr-2 h-4 w-4" />Delete legacy source data
            </Button>
          </div>
        )}
        {migration.cleanupError ? (
          <p className="text-sm text-destructive">{migration.cleanupError}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {migration.sourceChanged ? (
        <p role="alert" className="text-sm text-destructive">
          {migration.sourceReadState === "missing"
            ? "The legacy source key is missing. This cached preview and recovery copy are preserved, but import and cleanup are blocked."
            : migration.sourceReadState === "inaccessible"
              ? "Legacy browser storage is inaccessible. This cached preview and recovery copy are preserved, but import and cleanup are blocked."
              : "The legacy source changed. Review the refreshed preview before importing or deleting data."}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        {importableSummary(preview.lists.length, preview.templates.length)}
      </p>
      {preview.preferences ? (
        <p className="text-sm text-muted-foreground">
          Supported theme, default priority, and auto-save preferences will also be imported.
        </p>
      ) : null}
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button">
            <FileArchive className="mr-2 h-4 w-4" />Review legacy import
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review legacy browser data</DialogTitle>
            <DialogDescription>
              Only the validated records below will be sent to your authenticated Convex account.
              The browser source is kept until you delete it after confirmed success.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="font-medium">
              {importableSummary(preview.lists.length, preview.templates.length)}
            </p>
            {preview.preferences ? (
              <p className="text-sm text-muted-foreground">
                Valid legacy preferences will merge into your current account; unsupported or invalid fields are listed below and remain in the recovery copy.
              </p>
            ) : null}
            {preview.rejected.length > 0 ? (
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium text-destructive">
                  {preview.rejected.length} rejected {preview.rejected.length === 1 ? "record" : "records"}
                </p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-sm text-muted-foreground">
                  {preview.rejected.map((record, index) => (
                    <li key={`${record.path}-${index}`}>
                      <code>{record.path}</code>: {record.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {recoveryButton}
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id="legacy-import-confirmation"
                checked={confirmed}
                onCheckedChange={(checked) =>
                  setConfirmedSource(checked === true ? confirmationKey : null)
                }
              />
              <Label htmlFor="legacy-import-confirmation" className="leading-5">
                I have reviewed the preview and recovery options and want to import these records.
              </Label>
            </div>
            {migration.error ? (
              <div role="alert" className="rounded-md border border-destructive/50 p-3">
                <p className="font-medium">{migration.error.title}</p>
                <p className="text-sm text-muted-foreground">{migration.error.message}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            {migration.sourceChanged && migration.sourceReadState === "found" ? (
              <Button
                type="button"
                onClick={migration.acknowledgeSourceChange}
              >
                Use refreshed preview
              </Button>
            ) : migration.sourceChanged ? (
              <p className="text-sm text-muted-foreground">
                Restore access to the exact source before continuing. Do not delete the cached recovery copy.
              </p>
            ) : !migration.error || migration.error.retryable ? (
              <Button
                type="button"
                disabled={!confirmed || migration.pending || migration.statusLoading}
                onClick={() => void migration.importLegacyData()}
              >
                {migration.pending
                  ? "Importing…"
                  : migration.error
                    ? "Retry import"
                    : "Import legacy data"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Automatic import cannot retry this payload. Keep the source and use the recovery copy for manual support.
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
