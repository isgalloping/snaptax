import type { GetActorOptions } from "@/lib/auth/getActor";

export const SYNC_EVENTS_ACTOR_OPTIONS = {
  requireWrite: true,
} satisfies GetActorOptions;
