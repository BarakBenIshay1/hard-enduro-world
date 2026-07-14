"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sanitizeAdminRedirect } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithGoogle(formData: FormData) {
  const next = sanitizeAdminRedirect(stringField(formData, "next"));
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    redirect(`/login?error=auth_unavailable&next=${encodeURIComponent(next)}`);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=login_failed&next=${encodeURIComponent(next)}`);
  }

  redirect(data.url);
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
