export type CpaPackZipWorkerRequest =
  | { kind: "addFile"; jobId: string; name: string; data: ArrayBuffer }
  | { kind: "finish"; jobId: string }
  | { kind: "abort"; jobId: string };

export type CpaPackZipWorkerResponse =
  | { kind: "added"; jobId: string; name: string }
  | { kind: "ok"; jobId: string; chunks: Uint8Array[] }
  | { kind: "err"; jobId: string; reason: string };
