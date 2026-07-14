import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { hasLiveRaceEvent } from "@/db/navigation";
import { getPublicAdminShortcutForRequest } from "@/lib/admin/public-shortcut";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hardenduroworld.com"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Hard Enduro World",
    template: "%s | Hard Enduro World",
  },
  description:
    "A production-grade knowledge base for Hard Enduro World Championship seasons, events, riders, motorcycles, results, timing, and records.",
  openGraph: {
    title: "Hard Enduro World",
    description: "The definitive Hard Enduro World Championship data platform.",
    type: "website",
    url: "https://hardenduroworld.com",
    siteName: "Hard Enduro World",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hard Enduro World",
    description: "The definitive Hard Enduro World Championship data platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [hasLiveRace, adminShortcut] = await Promise.all([
    hasLiveRaceEvent(),
    getPublicAdminShortcutForRequest(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <SiteHeader hasLiveRace={hasLiveRace} adminShortcut={adminShortcut} />
          <PageTransition>{children}</PageTransition>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
