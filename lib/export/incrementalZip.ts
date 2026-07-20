import { Zip, ZipPassThrough } from "fflate";

export type IncrementalZip = {
  addStoredFile: (name: string, data: Uint8Array) => void;
  finish: () => Promise<Uint8Array[]>;
};

/** Streaming ZIP builder (fflate); returns segment chunks for `new Blob(chunks)`. */
export function createIncrementalZip(): IncrementalZip {
  const chunks: Uint8Array[] = [];
  let resolveDone!: (chunks: Uint8Array[]) => void;
  let rejectDone!: (err: Error) => void;
  const done = new Promise<Uint8Array[]>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const zip = new Zip((err, chunk, final) => {
    if (err) {
      rejectDone(err);
      return;
    }
    if (chunk) chunks.push(chunk);
    if (final) resolveDone(chunks);
  });

  return {
    addStoredFile(name: string, data: Uint8Array) {
      const entry = new ZipPassThrough(name);
      zip.add(entry);
      entry.push(data, true);
    },
    finish() {
      zip.end();
      return done;
    },
  };
}
