import {
  fetchReceiptByIdIfExists,
  fetchReceiptList,
  triggerReceiptProcess,
  type ApiReceipt,
} from "@/lib/client/receiptApi";

export type ProcessingWatcherCallbacks = {
  onReceiptUpdate: (receipt: ApiReceipt) => void;
  onReceiptStuck: (id: string) => void;
  /** Fired after processing settles; consumer re-reads local season summary. */
  onSummaryRefresh?: () => void;
  getWriteBudget: (id: string) => number;
  onWriteFailure: (id: string) => void;
};

export type ProcessingWatcherDeps = {
  fetchReceipt?: (id: string) => Promise<ApiReceipt | null>;
  fetchList?: () => ReturnType<typeof fetchReceiptList>;
  triggerProcess?: typeof triggerReceiptProcess;
};

/** Polls one active processing receipt by id; pauses when UI is busy. */
export class ProcessingReceiptWatcher {
  private activeId: string | null = null;
  private pollAttempts = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private resumeTimer: ReturnType<typeof setTimeout> | null = null;
  private tickInFlight = false;
  private paused = false;
  private readonly fetchReceipt: (id: string) => Promise<ApiReceipt | null>;
  private readonly fetchList: () => ReturnType<typeof fetchReceiptList>;
  private readonly triggerProcess: typeof triggerReceiptProcess;

  constructor(
    private readonly callbacks: ProcessingWatcherCallbacks,
    deps: ProcessingWatcherDeps = {},
    private readonly intervalMs = 3000,
    private readonly processAfterAttempts = 6,
    private readonly resumeDebounceMs = 1000,
  ) {
    this.fetchReceipt = deps.fetchReceipt ?? fetchReceiptByIdIfExists;
    this.fetchList = deps.fetchList ?? fetchReceiptList;
    this.triggerProcess = deps.triggerProcess ?? triggerReceiptProcess;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  watch(id: string) {
    if (this.activeId !== id) {
      this.pollAttempts = 0;
    }
    this.activeId = id;
    if (!this.paused) this.ensureInterval();
  }

  unwatch(id: string) {
    if (this.activeId !== id) return;
    this.activeId = null;
    this.pollAttempts = 0;
    this.stopInterval();
  }

  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (this.resumeTimer) {
      clearTimeout(this.resumeTimer);
      this.resumeTimer = null;
    }
    if (paused) {
      this.stopInterval();
      return;
    }
    if (this.activeId) {
      this.resumeTimer = setTimeout(() => {
        this.resumeTimer = null;
        if (!this.paused && this.activeId) {
          this.ensureInterval();
          void this.tick();
        }
      }, this.resumeDebounceMs);
    }
  }

  /** User-initiated retry — one poll even while paused. */
  tickOnce() {
    return this.tick({ bypassPause: true });
  }

  /** Clear active watch without tearing down callbacks (e.g. settings clear data). */
  reset() {
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
    this.resumeTimer = null;
    this.stopInterval();
    this.activeId = null;
    this.pollAttempts = 0;
  }

  dispose() {
    this.reset();
  }

  private ensureInterval() {
    if (this.paused || !this.activeId || this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
  }

  private stopInterval() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(opts?: { bypassPause?: boolean }) {
    if (this.tickInFlight || !this.activeId) return;
    if (this.paused && !opts?.bypassPause) return;

    const id = this.activeId;
    this.tickInFlight = true;
    try {
      const receipt = await this.fetchReceipt(id);
      if (!receipt) {
        this.unwatch(id);
        return;
      }

      if (receipt.status !== "processing") {
        this.callbacks.onReceiptUpdate(receipt);
        this.unwatch(id);
        this.callbacks.onSummaryRefresh?.();
        return;
      }

      this.pollAttempts += 1;

      const shouldTryProcess =
        this.pollAttempts >= this.processAfterAttempts &&
        this.pollAttempts % this.processAfterAttempts === 0;

      if (shouldTryProcess && this.callbacks.getWriteBudget(id) > 0) {
        const result = await this.triggerProcess(id);
        if (result.ok === false) {
          if (result.reason === "not_found") {
            this.unwatch(id);
            return;
          }
          this.callbacks.onWriteFailure(id);
          if (this.callbacks.getWriteBudget(id) <= 0) {
            this.callbacks.onReceiptStuck(id);
            this.unwatch(id);
          }
        }
      }
    } catch {
      // retry on next interval
    } finally {
      this.tickInFlight = false;
    }
  }
}

export {
  collectProcessingIds,
  newestProcessingId,
} from "@/lib/client/processingQueue";
