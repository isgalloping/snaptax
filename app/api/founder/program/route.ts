import { NextResponse } from "next/server";
import { getActor } from "@/lib/auth/getActor";
import { getFounderProgramState } from "@/lib/server/founderProgram";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { mapErrorToResponse } from "@/lib/api/errors";

export const GET = withRequestLog("api.entitlement", async (request, _context) => {
  try {
    const actor = await getActor(request);
    const userId = actor.kind === "user" ? actor.userId : undefined;
    const state = await getFounderProgramState(userId);
    return NextResponse.json(state);
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
