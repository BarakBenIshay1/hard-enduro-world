import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hardenduroworld.com"),
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  );
}
