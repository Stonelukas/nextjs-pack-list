import {
  useCallback,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";

import { getTestRuntime } from "@/test/mocks/runtime";

function resolveState(
  value: SetStateAction<boolean>,
  current: boolean,
): boolean {
  return typeof value === "function" ? value(current) : value;
}

export function useRegisterSW() {
  const runtime = getTestRuntime();
  const state = useSyncExternalStore(
    runtime.subscribe,
    runtime.getPwaState,
    runtime.getPwaState,
  );
  const setNeedRefresh = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      runtime.setPwaState({
        needRefresh: resolveState(value, runtime.getPwaState().needRefresh),
      });
    },
    [runtime],
  );
  const setOfflineReady = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      runtime.setPwaState({
        offlineReady: resolveState(value, runtime.getPwaState().offlineReady),
      });
    },
    [runtime],
  );
  const updateServiceWorker = useCallback(
    (reloadPage?: boolean) => runtime.requestServiceWorkerUpdate(reloadPage),
    [runtime],
  );

  return {
    needRefresh: [state.needRefresh, setNeedRefresh] as const,
    offlineReady: [state.offlineReady, setOfflineReady] as const,
    updateServiceWorker,
  };
}
