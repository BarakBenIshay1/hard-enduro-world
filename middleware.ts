import { NextResponse, type NextRequest } from "next/server";
import { buildLoginRedirect } from "@/lib/auth/redirects";
import { isAdminMediaUploadRequest } from "@/lib/admin/media-upload";
import { hasSupabaseAuthCookie } from "@/lib/supabase/cookies";

export function middleware(request: NextRequest) {
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!hasSupabaseAuthCookie(request.cookies.getAll())) {
    if (isAdminMediaUploadRequest(request.method, request.nextUrl.pathname)) {
      return NextResponse.json(
        { error: "session-expired", message: "Session expired. Please sign in again." },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL(buildLoginRedirect(requestedPath), request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-request-url", requestedPath);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
