import { createIncrementalZip } from "@/lib/export/incrementalZip";
import type {
  CpaPackZipWorkerRequest,
  CpaPackZipWorkerResponse,
} from "@/lib/workers/cpaPackZipWorkerProtocol";

export type CpaPackZipSession = {
  addStoredFile: (name: string, data: Uint8Array) => Promise<void>;
  finish: () => Promise<Uint8Array[]>;
  abort: () => void;
};

const WORKER_FINISH_TIMEOUT_MS = 120_000;
const WORKER_ADD_TIMEOUT_MS = 30_000;

let worker: Worker | null = null;

function shouldUseCpaPackZipWorker(): boolean {
  if (typeof Worker === "undefined") return false;
  if (process.env.NEXT_PUBLIC_CPA_PACK_MAIN_THREAD === "1") return false;
  return true;
}

function getCpaPackZipWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL("../workers/cpaPackZipWorker.ts", import.meta.url),
    );
  }
  return worker;
}

function waitForWorkerJobMessage(
  jobId: string,
  predicate: (message: CpaPackZipWorkerResponse) => boolean,
  timeoutMs: number,
  timeoutReason: string,
): Promise<CpaPackZipWorkerResponse> {
  return new Promise((resolve, reject) => {
    const w = getCpaPackZipWorker();
    const onMessage = (event: MessageEvent<CpaPackZipWorkerResponse>) => {
      const data = event.data;
      if (data.jobId !== jobId) return;
      if (data.kind === "err") {
        cleanup();
        reject(new Error(data.reason));
        return;
      }
      if (predicate(data)) {
        cleanup();
        resolve(data);
      }
    };
    const timer = globalThis.setTimeout(() => {
      cleanup();
      reject(new Error(timeoutReason));
    }, timeoutMs);
    const cleanup = () => {
      globalThis.clearTimeout(timer);
      w.removeEventListener("message", onMessage);
    };
    w.addEventListener("message", onMessage);
  });
}

function runWorkerAddFile(
  jobId: string,
  name: string,
  data: Uint8Array,
): Promise<void> {
  const copy = data.slice();
  const req: CpaPackZipWorkerRequest = {
    kind: "addFile",
    jobId,
    name,
    data: copy.buffer,
  };
  getCpaPackZipWorker().postMessage(req, [copy.buffer]);
  return waitForWorkerJobMessage(
    jobId,
    (message) => message.kind === "added" && message.name === name,
    WORKER_ADD_TIMEOUT_MS,
    "cpa_pack_zip_add_timeout",
  ).then(() => undefined);
}

function runWorkerFinish(jobId: string): Promise<Uint8Array[]> {
  getCpaPackZipWorker().postMessage({ kind: "finish", jobId });
  return waitForWorkerJobMessage(
    jobId,
    (message) => message.kind === "ok",
    WORKER_FINISH_TIMEOUT_MS,
    "cpa_pack_zip_timeout",
  ).then((message) => (message.kind === "ok" ? message.chunks : []));
}

function createMainThreadSession(): CpaPackZipSession {
  const zip = createIncrementalZip();
  return {
    async addStoredFile(name, data) {
      zip.addStoredFile(name, data);
    },
    finish() {
      return zip.finish();
    },
    abort() {},
  };
}

function createWorkerSession(jobId: string): CpaPackZipSession {
  const w = getCpaPackZipWorker();
  return {
    addStoredFile(name, data) {
      return runWorkerAddFile(jobId, name, data);
    },
    finish() {
      return runWorkerFinish(jobId);
    },
    abort() {
      w.postMessage({ kind: "abort", jobId });
    },
  };
}

/** Offload fflate ZIP assembly to a Web Worker when available. */
export function startCpaPackZipSession(): CpaPackZipSession {
  if (!shouldUseCpaPackZipWorker()) {
    return createMainThreadSession();
  }
  const jobId = crypto.randomUUID();
  return createWorkerSession(jobId);
}

/** Test-only: reset singleton worker between tests. */
export function resetCpaPackZipWorkerForTests(): void {
  worker?.terminate();
  worker = null;
}

export function cpaPackZipUsesWorkerForTests(): boolean {
  return shouldUseCpaPackZipWorker();
}
