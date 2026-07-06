import { NextResponse } from "next/server";

/**
 * Same-origin association so navigations from marketing (`/`) to the PWA entry
 * (`/app`) can be captured by an installed app. Manifest `id` is `/app`.
 */
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const manifestId = `${origin}/app`;

  return NextResponse.json(
    {
      [manifestId]: {
        scope: "/",
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
