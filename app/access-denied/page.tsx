import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";
import { logout } from "@/app/logout/actions";
import { getAuthSession } from "@/lib/auth";
import { recordAuthAudit } from "@/lib/auth/audit";
import { buildLoginRedirect, sanitizeAdminRedirect } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Access Denied | Hard Enduro World",
  description: "Admin access denied.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type PageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function AccessDeniedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = sanitizeAdminRedirect(params?.next);
  const session = await getAuthSession();

  if (!session.isAuthenticated) {
    redirect(buildLoginRedirect(next));
  }

  await recordAuthAudit({
    actorId: session.user?.id,
    actorEmail: session.user?.email,
    action: "authorization",
    result: "denied",
    route: next,
    reason: "insufficient-admin-access",
  });

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-16">
        <Card className="w-full p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
            <LockKeyhole className="h-6 w-6 text-red-300" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
            403 Access Denied
          </p>
          <h1 className="mt-3 text-4xl font-black">Admin access is not available.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/[0.66]">
            You are signed in, but this account is not authorized to view the Hard Enduro
            World administration area.
          </p>

          <div className="mt-6 grid gap-3 rounded-md border border-border bg-surface-muted p-4 text-sm md:grid-cols-2">
            <Info label="Email" value={session.user?.email ?? "Unavailable"} />
            <Info label="Role" value={session.role} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Return to homepage
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-gold"
              >
                Logout
              </button>
            </form>
          </div>
        </Card>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.42]">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
