import { z } from "zod";

/** Client proof of possession for a rotated Ghost cookie (HMAC token). */
export const orphanGhostPossessionSchema = z.object({
  ghostId: z.string().min(1),
  token: z.string().min(1),
});

export const orphanGhostsBodyField = z
  .array(orphanGhostPossessionSchema)
  .max(20)
  .default([]);
