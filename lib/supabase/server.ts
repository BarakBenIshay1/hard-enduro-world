import { createClient } from "@supabase/supabase-js";
import type { SupportedStorage } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { supabaseCodeVerifierCookie, supabaseStorageKey } from "@/lib/supabase/cookies";

type CookieStorageStore = {
  get(name: string): { value?: string } | undefined;
  set(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      sameSite?: "lax";
      secure?: boolean;
      path?: string;
      maxAge?: number;
    },
  ): unknown;
  delete(name: string): unknown;
};

export function createSupabaseServerClient() {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseCookieServerClient(cookieStore: CookieStorageStore) {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
      storageKey: supabaseStorageKey,
      storage: createCookieStorage(cookieStore),
    },
  });
}

export function createSupabaseServiceRoleClient() {
  const config = getSupabaseConfig();

  if (!config.hasServiceRoleKey) {
    return null;
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createCookieStorage(cookieStore: CookieStorageStore): SupportedStorage {
  return {
    isServer: true,
    getItem(key) {
      return cookieStore.get(key)?.value ?? null;
    },
    setItem(key, value) {
      cookieStore.set(key, value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: key === supabaseCodeVerifierCookie ? 10 * 60 : 60 * 60 * 24 * 30,
      });
    },
    removeItem(key) {
      cookieStore.delete(key);
    },
  };
}
