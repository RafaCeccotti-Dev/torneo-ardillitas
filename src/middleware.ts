import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Vercel-CDN-Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/acreditar/")) {
    const token = pathname.slice("/acreditar/".length);
    const url = request.nextUrl.clone();
    url.pathname = `/plantel/${token}`;
    return noStore(NextResponse.redirect(url, 307));
  }

  if (pathname.startsWith("/plantel/")) {
    return noStore(NextResponse.next());
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/acreditar/:path*", "/plantel/:path*"],
};
