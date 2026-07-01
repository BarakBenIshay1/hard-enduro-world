"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe2, Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { NavigationItem } from "@/components/ui/navigation-item";
import { allNavigationItems, primaryNavigation } from "@/config/navigation";
import { cn } from "@/lib/cn";

export function SiteHeader({ hasLiveRace = false }: { hasLiveRace?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
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
          className="hidden items-center gap-0 xl:flex"
        >
          {primaryNavigation.map((item) => (
            <NavigationItem
              key={item.href}
              href={item.href}
              label={item.label}
              showLiveIndicator={hasLiveRace && item.href === "/future-events"}
            />
          ))}
        </nav>

        <div className="hidden items-center gap-2 2xl:flex">
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
            Race Live Center
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
                    showLiveIndicator={hasLiveRace && item.href === "/future-events"}
                  />
                </motion.div>
              ))}
              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <ButtonLink href="/future-events">Race Live Center</ButtonLink>
                <ThemeToggle />
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
