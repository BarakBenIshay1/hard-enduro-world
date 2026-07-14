"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { recordAuthAudit } from "@/lib/auth/audit";
import { clearSupabaseSessionCookies } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logout() {
  const session = await getAuthSession();
  const supabase = createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }

  const cookieStore = await cookies();
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
