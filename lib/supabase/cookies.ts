export const supabaseAccessTokenCookie = "sb-access-token";
export const supabaseRefreshTokenCookie = "sb-refresh-token";

export type SupabaseCookieLike = {
  name: string;
  value?: string;
};

export function isSupabaseAuthCookieName(name: string) {
  return (
    (name.startsWith("sb-") && name.endsWith("-auth-token")) ||
    name === "supabase-auth-token" ||
    name === supabaseAccessTokenCookie
  );
}

export function hasSupabaseAuthCookie(authCookies: SupabaseCookieLike[]) {
  return authCookies.some((cookie) => isSupabaseAuthCookieName(cookie.name));
}
