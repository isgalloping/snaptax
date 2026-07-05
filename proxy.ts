import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { securityHeaders } from "@/lib/security/headers";
import { isAutomatedSecurityProbe } from "@/lib/security/probePaths";

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  if (isAutomatedSecurityProbe(request.nextUrl.pathname)) {
    return withSecurityHeaders(new NextResponse(null, { status: 404 }));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
