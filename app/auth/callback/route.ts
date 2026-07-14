import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthSessionForSupabaseUser, hasPermission } from "@/lib/auth";
import { recordAuthAudit } from "@/lib/auth/audit";
import { buildLoginRedirect, sanitizeAdminRedirect } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setSupabaseSessionCookies } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = sanitizeAdminRedirect(url.searchParams.get("next"));
  const providerError = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (providerError) {
    return NextResponse.redirect(
      new URL(`${buildLoginRedirect(next)}&error=login_failed`, url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`${buildLoginRedirect(next)}&error=expired`, url),
    );
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(
      new URL(`${buildLoginRedirect(next)}&error=auth_unavailable`, url),
    );
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session?.user) {
    return NextResponse.redirect(
      new URL(`${buildLoginRedirect(next)}&error=callback_failed`, url),
    );
  }

  const cookieStore = await cookies();
  setSupabaseSessionCookies(cookieStore, data.session);

  const session = await getAuthSessionForSupabaseUser(data.session.user);

  if (!hasPermission(session, "admin:view")) {
    await recordAuthAudit({
      actorId: session.user?.id,
      actorEmail: session.user?.email,
      action: "login",
      result: "denied",
      route: next,
      reason: "missing-admin-view",
    });

    return NextResponse.redirect(
      new URL(`/access-denied?next=${encodeURIComponent(next)}`, url),
    );
  }

  await recordAuthAudit({
    actorId: session.user?.id,
    actorEmail: session.user?.email,
    action: "login",
    result: "success",
    route: next,
  });

  return NextResponse.redirect(new URL(next, url));
}
