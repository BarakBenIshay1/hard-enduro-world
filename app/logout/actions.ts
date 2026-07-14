"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { recordAuthAudit } from "@/lib/auth/audit";
import { clearSupabaseSessionCookies } from "@/lib/supabase/auth";
import { createSupabaseCookieServerClient } from "@/lib/supabase/server";

export async function logout() {
  const session = await getAuthSession();
  const cookieStore = await cookies();
  const supabase = createSupabaseCookieServerClient(cookieStore);

  if (supabase) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Local cookie cleanup below is the authoritative logout behavior for this app.
    }
  }

  clearSupabaseSessionCookies(cookieStore);

  if (session.user) {
    await recordAuthAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "logout",
      result: "success",
      route: "/logout",
    });
  }

  redirect("/");
}
