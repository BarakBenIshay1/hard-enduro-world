import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { canAccessAdmin, getAdminAccessContext } from "@/lib/admin/access";
import { sanitizeAdminRedirect } from "@/lib/auth/redirects";
import { signInWithGoogle } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Admin Login | Hard Enduro World",
  description: "Secure administrator login for Hard Enduro World.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type PageProps = {
  searchParams?: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = sanitizeAdminRedirect(params?.next);
  const access = await getAdminAccessContext();

  if (access.isAuthenticated && canAccessAdmin(access, "admin:view")) {
    redirect(next);
  }

  if (access.isAuthenticated) {
    redirect(`/access-denied?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Admin Access
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight lg:text-6xl">
              Authorized administrators only.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/[0.68]">
              The public Hard Enduro World website remains open to everyone. This sign-in
              area is only for internal source review, imports, audits, and
              administration.
            </p>
          </div>

          <Card className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
              <ShieldCheck className="h-6 w-6 text-accent" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-black">Sign in with Supabase</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/[0.64]">
              Continue with the configured Google account. Access is granted only after
              Supabase authentication and server-side role verification.
            </p>

            {params?.error ? <LoginError code={params.error} /> : null}

            <form action={signInWithGoogle} className="mt-6">
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-5 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-gold focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
              >
                Continue with Google
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm">
              <Link
                href="/"
                className="font-semibold text-foreground/[0.62] hover:text-accent"
              >
                Return to public site
              </Link>
              <span className="text-xs uppercase tracking-[0.16em] text-foreground/[0.42]">
                Protected
              </span>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function LoginError({ code }: { code: string }) {
  const message =
    code === "auth_unavailable"
      ? "Authentication is not configured for this deployment."
      : code === "callback_failed"
        ? "The sign-in link could not be completed. Please try again."
        : code === "expired"
          ? "The sign-in session expired. Please sign in again."
          : "Sign-in could not be completed. Please try again.";

  return (
    <div className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
      {message}
    </div>
  );
}
