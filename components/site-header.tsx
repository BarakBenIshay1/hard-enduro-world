"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe2, Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { NavigationItem } from "@/components/ui/navigation-item";
import {
  allNavigationItems,
  megaNavigation,
  primaryNavigation,
} from "@/config/navigation";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsMegaOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition duration-300",
        isScrolled
          ? "border-b border-border bg-surface/[0.92] text-foreground shadow-[0_18px_70px_hsl(0_0%_0%/0.18)] backdrop-blur-xl"
          : "border-b border-white/10 bg-black/[0.14] text-white backdrop-blur-sm",
      )}
    >
      <Container className="flex h-20 items-center justify-between gap-5">
        <Logo />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 xl:flex"
        >
          {primaryNavigation.map((item) => (
            <NavigationItem key={item.href} href={item.href} label={item.label} />
          ))}
          <button
            type="button"
            onClick={() => setIsMegaOpen((current) => !current)}
            aria-expanded={isMegaOpen}
            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-current/70 transition hover:bg-surface-muted hover:text-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            More
            <ChevronDown
              className={cn("h-4 w-4 transition", isMegaOpen && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            aria-label="Search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface/70 text-current transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Language selector"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface/70 px-3 text-sm font-semibold text-current transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Globe2 className="h-4 w-4" />
            EN
          </button>
          <ThemeToggle />
          <ButtonLink href="/future-events" className="h-10">
            Next Event
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface/70 text-current lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </Container>

      <AnimatePresence>
        {isMegaOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="hidden border-t border-border bg-surface/[0.96] text-foreground shadow-[0_24px_80px_hsl(0_0%_0%/0.2)] backdrop-blur-xl xl:block"
          >
            <Container className="grid grid-cols-5 gap-6 py-7">
              {megaNavigation.map((group) => (
                <div key={group.label}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                    {group.label}
                  </p>
                  <div className="grid gap-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-md p-3 transition hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <span className="font-semibold">{item.label}</span>
                        <span className="mt-1 block text-sm text-foreground/56">
                          {item.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-surface text-foreground lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex h-20 items-center justify-between border-b border-border px-5">
              <Logo />
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <motion.nav
              aria-label="Mobile navigation"
              className="grid max-h-[calc(100vh-80px)] gap-1 overflow-y-auto px-5 py-6"
              initial="closed"
              animate="open"
              variants={{
                open: { transition: { staggerChildren: 0.025 } },
                closed: {},
              }}
            >
              {allNavigationItems.map((item) => (
                <motion.div
                  key={item.href}
                  variants={{
                    open: { opacity: 1, x: 0 },
                    closed: { opacity: 0, x: -12 },
                  }}
                >
                  <NavigationItem
                    href={item.href}
                    label={item.label}
                    onClick={() => setIsMobileOpen(false)}
                  />
                </motion.div>
              ))}
              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <ButtonLink href="/future-events">Next Event</ButtonLink>
                <ThemeToggle />
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
