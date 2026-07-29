/** True while capture UI holds the worker — block auto upload/sync/fetch. */
export function isWorkerSessionActive(state: {
  cameraOpen: boolean;
}): boolean {
  return state.cameraOpen;
}

export type WorkerCatchUpFlags = {
  flushUploads?: boolean;
  flushDeletes?: boolean;
  sync?: boolean;
  reconcile?: boolean;
};

export function mergeWorkerCatchUpFlags(
  current: WorkerCatchUpFlags,
  next: Partial<WorkerCatchUpFlags>,
): WorkerCatchUpFlags {
  return {
    flushUploads: current.flushUploads || next.flushUploads === true,
    flushDeletes: current.flushDeletes || next.flushDeletes === true,
    sync: current.sync || next.sync === true,
    reconcile: current.reconcile || next.reconcile === true,
  };
}

export function hasWorkerCatchUp(flags: WorkerCatchUpFlags): boolean {
  return (
    flags.flushUploads === true ||
    flags.flushDeletes === true ||
    flags.sync === true ||
    flags.reconcile === true
  );
}
