/// <reference lib="webworker" />

import { createIncrementalZip } from "@/lib/export/incrementalZip";
import type {
  CpaPackZipWorkerRequest,
  CpaPackZipWorkerResponse,
} from "@/lib/workers/cpaPackZipWorkerProtocol";

declare const self: DedicatedWorkerGlobalScope;

const jobs = new Map<string, ReturnType<typeof createIncrementalZip>>();

function respond(message: CpaPackZipWorkerResponse): void {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<CpaPackZipWorkerRequest>) => {
  const msg = event.data;
  if (msg.kind === "abort") {
    jobs.delete(msg.jobId);
    return;
  }

  if (msg.kind === "addFile") {
    let job = jobs.get(msg.jobId);
    if (!job) {
      job = createIncrementalZip();
      jobs.set(msg.jobId, job);
    }
    try {
      job.addStoredFile(msg.name, new Uint8Array(msg.data));
      respond({ kind: "added", jobId: msg.jobId, name: msg.name });
    } catch (err) {
      jobs.delete(msg.jobId);
      respond({
        kind: "err",
        jobId: msg.jobId,
        reason: err instanceof Error ? err.message : "add_file_failed",
      });
    }
    return;
  }

  if (msg.kind === "finish") {
    const job = jobs.get(msg.jobId);
    if (!job) {
      respond({ kind: "err", jobId: msg.jobId, reason: "job_not_found" });
      return;
    }
    jobs.delete(msg.jobId);
    void job.finish().then(
      (chunks) => {
        respond({ kind: "ok", jobId: msg.jobId, chunks });
      },
      (err: Error) => {
        respond({
          kind: "err",
          jobId: msg.jobId,
          reason: err.message || "zip_failed",
        });
      },
    );
  }
};

export {};
