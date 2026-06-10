let homeChunkPromise: Promise<
  typeof import("@/components/home/HomeScreen")
> | null = null;
let homeChunkReadyFlag = false;

export function getHomeChunkPromise(): Promise<
  typeof import("@/components/home/HomeScreen")
> {
  if (!homeChunkPromise) {
    homeChunkPromise = import("@/components/home/HomeScreen").then((mod) => {
      homeChunkReadyFlag = true;
      return mod;
    });
  }
  return homeChunkPromise;
}

export function homeChunkReady(): boolean {
  return homeChunkReadyFlag;
}
