export type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  isConfigured: boolean;
  hasServiceRoleKey: boolean;
};

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured: Boolean(url && anonKey),
    hasServiceRoleKey: Boolean(url && serviceRoleKey),
  };
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}

export function getSupabaseAuthReadiness() {
  const config = getSupabaseConfig();

  return {
    status: config.isConfigured ? "configured" : "not-configured",
    browserClientReady: config.isConfigured,
    serverClientReady: config.isConfigured,
    serviceRoleReady: config.hasServiceRoleKey,
    googleOAuthPrepared: true,
    emailLoginPrepared: true,
  } as const;
}
