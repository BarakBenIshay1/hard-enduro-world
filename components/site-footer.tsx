import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Championship",
    links: [
      { label: "Events", href: "/events" },
      { label: "Standings", href: "/standings" },
      { label: "Records", href: "/records" },
      { label: "History", href: "/history" },
    ],
  },
  {
    title: "Media",
    links: [
      { label: "Gallery", href: "/gallery" },
      { label: "Videos", href: "/videos" },
      { label: "News", href: "/news" },
      { label: "Sponsors", href: "/sponsors" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-black text-white">
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-md text-sm leading-6 text-white/58">
            A premium data foundation for Hard Enduro seasons, events, timing, and
            championship history.
          </p>
          <div className="mt-6 flex gap-2">
            {["X", "IG", "YT"].map((item) => (
              <Link
                key={item}
                href="/contact"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.14] text-xs font-bold text-white/[0.64] transition hover:border-accent hover:text-accent"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 lg:col-span-2">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
                {group.title}
              </h2>
              <div className="mt-4 grid gap-2">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-white/58 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>

      <Container className="border-t border-white/10 py-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-white">
              <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
              Newsletter
            </h2>
            <p className="mt-2 text-sm text-white/54">
              Newsletter capture placeholder for future race alerts and releases.
            </p>
          </div>
          <form className="flex gap-2" aria-label="Newsletter placeholder">
            <input
              type="email"
              placeholder="Email address"
              className="min-w-0 flex-1 rounded-md border border-white/[0.14] bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              disabled
            />
            <Button type="button" disabled className="opacity-70">
              Soon
            </Button>
          </form>
        </div>
        <p className="mt-8 text-xs text-white/42">
          © {new Date().getFullYear()} Hard Enduro World. Independent data platform.
        </p>
      </Container>
    </footer>
  );
}
