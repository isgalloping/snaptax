import type { Receipt } from "@/lib/types";

export type ProcessingQueueCallbacks = {
  onActivate: (id: string) => void;
  onBootstrapStale: (ids: string[]) => void;
};

export function collectProcessingIds(
  receipts: { id: string; status: string; pendingUpload?: boolean }[],
) {
  return receipts
    .filter((r) => r.status === "processing" && !r.pendingUpload)
    .map((r) => r.id);
}

export function newestProcessingId(
  receipts: { id: string; status: string; pendingUpload?: boolean; timestamp: Date }[],
): string | null {
  const processing = receipts.filter(
    (r) => r.status === "processing" && !r.pendingUpload,
  );
  if (processing.length === 0) return null;
  return processing.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  )[0].id;
}

/** FIFO queue — only one processing receipt watched at a time. */
export class ProcessingQueue {
  private pending: string[] = [];
  private active: string | null = null;
  private gapTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly callbacks: ProcessingQueueCallbacks) {}

  get activeId(): string | null {
    return this.active;
  }

  hasWork(): boolean {
    return this.active !== null || this.pending.length > 0;
  }

  enqueue(id: string) {
    if (id === this.active || this.pending.includes(id)) return;
    if (!this.active) {
      this.activate(id);
      return;
    }
    this.pending.push(id);
  }

  onSettled(id: string) {
    if (this.active === id) this.active = null;
    this.pending = this.pending.filter((x) => x !== id);
    this.scheduleNext();
  }

  bootstrapFromList(receipts: Receipt[]) {
    const autoId = newestProcessingId(receipts);
    const staleIds = collectProcessingIds(receipts).filter((id) => id !== autoId);
    if (staleIds.length > 0) {
      this.callbacks.onBootstrapStale(staleIds);
    }
    if (autoId) this.enqueue(autoId);
    return { autoId, staleIds };
  }

  clear() {
    if (this.gapTimer) clearTimeout(this.gapTimer);
    this.gapTimer = null;
    this.pending = [];
    this.active = null;
  }

  private activate(id: string) {
    this.active = id;
    this.callbacks.onActivate(id);
  }

  private scheduleNext() {
    if (this.gapTimer) clearTimeout(this.gapTimer);
    if (this.pending.length === 0) return;
    this.gapTimer = setTimeout(() => {
      const next = this.pending.shift();
      if (next) this.activate(next);
    }, 500);
  }
}
