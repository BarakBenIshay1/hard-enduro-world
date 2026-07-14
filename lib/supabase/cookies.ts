export const supabaseAccessTokenCookie = "sb-access-token";
export const supabaseRefreshTokenCookie = "sb-refresh-token";
export const supabaseStorageKey = "hew-supabase-auth";
export const supabaseCodeVerifierCookie = `${supabaseStorageKey}-code-verifier`;

export type SupabaseCookieLike = {
  name: string;
  value?: string;
};

export function isSupabaseAuthCookieName(name: string) {
  return (
    (name.startsWith("sb-") && name.endsWith("-auth-token")) ||
    name === "supabase-auth-token" ||
    name === supabaseAccessTokenCookie ||
    name === supabaseStorageKey
  );
}

export function hasSupabaseAuthCookie(authCookies: SupabaseCookieLike[]) {
  return authCookies.some((cookie) => isSupabaseAuthCookieName(cookie.name));
}
