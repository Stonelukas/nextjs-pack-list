import { useMutation, useQuery } from "convex/react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../../../convex/_generated/api";
import { useAsyncActionState } from "@/features/shared/async-action-state";
import {
  createLegacyRecovery,
  inspectLegacyStorage,
  LEGACY_STORAGE_KEY,
  readLegacySource,
  type LegacySourceRead,
} from "./legacy-storage";

export const LEGACY_ARCHIVE_KEY = "pack-list-storage:legacy-import:v1" as const;

type LegacyImportInput = FunctionArgs<typeof api.migrations.importLegacyData>;
export type LegacyImportResult = FunctionReturnType<
  typeof api.migrations.importLegacyData
>;

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sourceUnavailableError(state: "missing" | "inaccessible") {
  return {
    data: {
      code: "VALIDATION",
      message:
        state === "missing"
          ? "The legacy source key is now missing. The cached preview and recovery copy were preserved, but import and cleanup are blocked."
          : "Legacy browser storage is inaccessible. The cached preview and recovery copy were preserved, but import and cleanup are blocked.",
    },
  };
}

function sourceChangedError() {
  return {
    data: {
      code: "VALIDATION",
      message:
        "The legacy source changed after this preview was created. Review the refreshed preview before importing or deleting data.",
    },
  };
}

export function useLegacyMigration(providedStorage?: Storage | null) {
  const storage = useMemo(
    () => providedStorage ?? getBrowserStorage(),
    [providedStorage],
  );
  const initialSource = useMemo<LegacySourceRead>(
    () => (storage ? readLegacySource(storage) : { state: "inaccessible" }),
    [storage],
  );
  const [preview, setPreview] = useState(() =>
    initialSource.state === "found" && storage
      ? inspectLegacyStorage(storage)
      : null,
  );
  const [sourceReadState, setSourceReadState] = useState<LegacySourceRead["state"]>(
    initialSource.state,
  );
  const hasImportableData =
    preview !== null &&
    preview.manualExportRequired === undefined &&
    (preview.lists.length + preview.templates.length > 0 ||
      preview.preferences !== undefined);
  const [sourceChanged, setSourceChanged] = useState(false);
  const status = useQuery(
    api.migrations.getLegacyImportStatus,
    hasImportableData && preview && !sourceChanged
      ? {
          sourceKey: preview.sourceKey,
          fingerprint: preview.fingerprint,
        }
      : "skip",
  );
  const importMutation = useMutation(api.migrations.importLegacyData);
  const { pending, error, resetError, runAction } = useAsyncActionState();
  const [result, setResult] = useState<LegacyImportResult | null>(null);
  const [sourceRemoved, setSourceRemoved] = useState(false);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const effectiveResult = sourceChanged ? null : result ?? status ?? null;

  useEffect(() => {
    if (!effectiveResult || !preview || !storage) return;
    try {
      storage.setItem(
        LEGACY_ARCHIVE_KEY,
        JSON.stringify({
          sourceKey: preview.sourceKey,
          fingerprint: preview.fingerprint,
          status: effectiveResult.status,
          listsImported: effectiveResult.listsImported,
          templatesImported: effectiveResult.templatesImported,
          confirmedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Server persistence is authoritative. A denied browser-storage write must
      // not turn a confirmed import into a failed import.
    }
  }, [effectiveResult, preview, storage]);

  const importLegacyData = useCallback(async () => {
    if (!preview || !hasImportableData || !storage) return undefined;
    const source = readLegacySource(storage);
    setSourceReadState(source.state);
    if (source.state !== "found") {
      setResult(null);
      setSourceRemoved(false);
      setSourceChanged(true);
      return runAction(() => Promise.reject(sourceUnavailableError(source.state)));
    }
    if (source.raw !== preview.rawSource) {
      setPreview(inspectLegacyStorage(storage));
      setResult(null);
      setSourceRemoved(false);
      setSourceChanged(true);
      return runAction(() => Promise.reject(sourceChangedError()));
    }
    const input: LegacyImportInput = {
      sourceKey: preview.sourceKey,
      fingerprint: preview.fingerprint,
      lists: preview.lists,
      templates: preview.templates,
      preferences: preview.preferences,
    };
    const imported = await runAction(() => importMutation(input));
    if (imported) setResult(imported);
    return imported;
  }, [hasImportableData, importMutation, preview, runAction, storage]);

  const removeSource = useCallback(() => {
    if (!effectiveResult || !preview || !storage) return false;
    setCleanupError(null);
    const source = readLegacySource(storage);
    setSourceReadState(source.state);
    if (source.state !== "found") {
      setCleanupError(
        source.state === "missing"
          ? "The imported data is safe in Convex, but the legacy source key is now missing. The cached recovery snapshot was preserved and cleanup is blocked."
          : "The imported data is safe in Convex, but legacy browser storage is inaccessible. The cached recovery snapshot was preserved and cleanup is blocked.",
      );
      setResult(null);
      setSourceRemoved(false);
      setSourceChanged(true);
      return false;
    }
    if (source.raw !== preview.rawSource) {
      setCleanupError(
        "The legacy source changed after import. Review the refreshed preview; newer browser data was not deleted.",
      );
      setPreview(inspectLegacyStorage(storage));
      setResult(null);
      setSourceRemoved(false);
      setSourceChanged(true);
      return false;
    }
    try {
      storage.removeItem(LEGACY_STORAGE_KEY);
      setSourceRemoved(true);
      return true;
    } catch {
      setCleanupError(
        "The imported data is safe in Convex, but this browser blocked source cleanup.",
      );
      return false;
    }
  }, [effectiveResult, preview, storage]);

  const acknowledgeSourceChange = useCallback(() => {
    if (sourceReadState !== "found") return;
    setSourceChanged(false);
    setCleanupError(null);
    resetError();
  }, [resetError, sourceReadState]);

  return {
    preview,
    recovery: preview ? createLegacyRecovery(preview.rawSource) : null,
    hasImportableData,
    statusLoading: hasImportableData && !sourceChanged && status === undefined,
    result: effectiveResult,
    sourceChanged,
    sourceReadState,
    acknowledgeSourceChange,
    pending,
    error,
    resetError,
    importLegacyData,
    removeSource,
    sourceRemoved,
    cleanupError,
  };
}
