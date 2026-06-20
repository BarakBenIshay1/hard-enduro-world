import type { MetadataRoute } from "next";
import { allNavigationItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { href: "/", priority: 1 },
    ...allNavigationItems.map((item) => ({
      href: item.href,
      priority: item.href === "/events" ? 0.8 : 0.4,
    })),
  ];

  return staticRoutes.map((route) => ({
    url: new URL(route.href, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: route.href === "/" ? "daily" : "weekly",
    priority: route.priority,
  }));
}
