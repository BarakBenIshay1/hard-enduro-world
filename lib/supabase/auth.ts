import { cookies } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { Session, User } from "@supabase/supabase-js";
import type { AuthStatus } from "@/lib/auth/types";
import { getSupabaseAuthReadiness, getSupabaseConfig } from "@/lib/supabase/config";
import {
  isSupabaseAuthCookieName,
  supabaseAccessTokenCookie,
  supabaseRefreshTokenCookie,
} from "@/lib/supabase/cookies";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parsePossibleToken(value: string) {
  const decoded = decodeURIComponent(value);

  try {
    const parsed = JSON.parse(decoded) as
      | string
      | [string, string]
      | { access_token?: string; currentSession?: { access_token?: string } };

    if (typeof parsed === "string") {
      return parsed;
    }

    if (Array.isArray(parsed)) {
      return parsed[0] ?? null;
    }

    return parsed.access_token ?? parsed.currentSession?.access_token ?? null;
  } catch {
    return decoded;
  }
}

export async function getSupabaseAccessTokenFromCookies() {
  const cookieStore = await cookies();
  const authCookie = cookieStore
    .getAll()
    .find((cookie) => isSupabaseAuthCookieName(cookie.name));

  if (!authCookie?.value) {
    return null;
  }

  return parsePossibleToken(authCookie.value);
}

export async function getSupabaseUserFromRequest(): Promise<{
  status: AuthStatus;
  user: User | null;
  error: string | null;
}> {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return {
      status: "not-configured",
      user: null,
      error: null,
    };
  }

  const accessToken = await getSupabaseAccessTokenFromCookies();

  if (!accessToken) {
    return {
      status: "configured",
      user: null,
      error: null,
    };
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "not-configured",
      user: null,
      error: null,
    };
  }

  const { data, error } = await supabase.auth.getUser(accessToken);

  return {
    status: error ? "error" : "configured",
    user: data.user ?? null,
    error: error?.message ?? null,
  };
}

export function setSupabaseSessionCookies(
  cookieStore: Pick<ReadonlyRequestCookies, "set">,
  session: Session,
) {
  const secure = process.env.NODE_ENV === "production";
  const maxAge = Math.max(session.expires_in ?? 3600, 60);

  cookieStore.set(supabaseAccessTokenCookie, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });

  cookieStore.set(supabaseRefreshTokenCookie, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSupabaseSessionCookies(
  cookieStore: Pick<ReadonlyRequestCookies, "delete">,
) {
  cookieStore.delete(supabaseAccessTokenCookie);
  cookieStore.delete(supabaseRefreshTokenCookie);
  cookieStore.delete("supabase-auth-token");
}

export { getSupabaseAuthReadiness };
