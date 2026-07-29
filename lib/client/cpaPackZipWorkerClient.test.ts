import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  resetCpaPackZipWorkerForTests,
  startCpaPackZipSession,
} from "@/lib/client/cpaPackZipWorkerClient";
import type {
  CpaPackZipWorkerRequest,
  CpaPackZipWorkerResponse,
} from "@/lib/workers/cpaPackZipWorkerProtocol";

type WorkerListener = (event: MessageEvent<CpaPackZipWorkerResponse>) => void;

const originalWorker = globalThis.Worker;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const originalMainThreadFlag = process.env.NEXT_PUBLIC_CPA_PACK_MAIN_THREAD;

class ImmediateAckWorker {
  private listeners = new Set<WorkerListener>();
  messages: CpaPackZipWorkerRequest[] = [];

  addEventListener(type: string, listener: WorkerListener): void {
    if (type === "message") this.listeners.add(listener);
  }

  removeEventListener(type: string, listener: WorkerListener): void {
    if (type === "message") this.listeners.delete(listener);
  }

  postMessage(message: CpaPackZipWorkerRequest): void {
    this.messages.push(message);
    if (message.kind === "addFile") {
      this.dispatch({ kind: "added", jobId: message.jobId, name: message.name });
      return;
    }
    if (message.kind === "finish") {
      this.dispatch({ kind: "ok", jobId: message.jobId, chunks: [] });
    }
  }

  terminate(): void {
    this.listeners.clear();
  }

  private dispatch(response: CpaPackZipWorkerResponse): void {
    const event = { data: response } as MessageEvent<CpaPackZipWorkerResponse>;
    for (const listener of this.listeners) listener(event);
  }
}

describe("startCpaPackZipSession", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CPA_PACK_MAIN_THREAD;
    Object.defineProperty(globalThis, "Worker", {
      configurable: true,
      value: ImmediateAckWorker,
    });
    Object.defineProperty(globalThis, "setTimeout", {
      configurable: true,
      value: ((handler: TimerHandler) => {
        return setImmediate(() => {
          if (typeof handler === "function") handler();
        });
      }) as typeof globalThis.setTimeout,
    });
    Object.defineProperty(globalThis, "clearTimeout", {
      configurable: true,
      value: ((handle: NodeJS.Immediate) => {
        clearImmediate(handle);
      }) as unknown as typeof globalThis.clearTimeout,
    });
    resetCpaPackZipWorkerForTests();
  });

  afterEach(() => {
    resetCpaPackZipWorkerForTests();
    if (originalMainThreadFlag === undefined) {
      delete process.env.NEXT_PUBLIC_CPA_PACK_MAIN_THREAD;
    } else {
      process.env.NEXT_PUBLIC_CPA_PACK_MAIN_THREAD = originalMainThreadFlag;
    }
    Object.defineProperty(globalThis, "Worker", {
      configurable: true,
      value: originalWorker,
    });
    Object.defineProperty(globalThis, "setTimeout", {
      configurable: true,
      value: originalSetTimeout,
    });
    Object.defineProperty(globalThis, "clearTimeout", {
      configurable: true,
      value: originalClearTimeout,
    });
  });

  it("does not miss an immediate worker add-file acknowledgement", async () => {
    const session = startCpaPackZipSession();

    await session.addStoredFile("audit/receipt.jpg", new Uint8Array([1, 2, 3]));

    const chunks = await session.finish();
    assert.deepEqual(chunks, []);
  });
});
