export type RouteExposure = "admin-protected" | "public";

export type RouteSeoStatus = "no-index" | "seo-indexable";

export type RouteKind = "admin" | "connector-admin" | "dynamic" | "public";

export type RouteInventoryItem = {
  path: string;
  label: string;
  kind: RouteKind;
  exposure: RouteExposure;
  seoStatus: RouteSeoStatus;
  notes: string;
};

export const routeInventory: RouteInventoryItem[] = [
  {
    path: "/",
    label: "Homepage",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Public flagship homepage.",
  },
  {
    path: "/events",
    label: "Events",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Approved event records only.",
  },
  {
    path: "/events/[slug]",
    label: "Event detail",
    kind: "dynamic",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Dynamic metadata per approved event.",
  },
  {
    path: "/riders",
    label: "Riders",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Approved rider records and seeded data.",
  },
  {
    path: "/riders/[slug]",
    label: "Rider detail",
    kind: "dynamic",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Dynamic metadata per approved rider.",
  },
  {
    path: "/teams",
    label: "Teams",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Approved team records.",
  },
  {
    path: "/teams/[slug]",
    label: "Team detail",
    kind: "dynamic",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Dynamic metadata per approved team.",
  },
  {
    path: "/manufacturers",
    label: "Manufacturers",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Approved manufacturer records.",
  },
  {
    path: "/manufacturers/[slug]",
    label: "Manufacturer detail",
    kind: "dynamic",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Dynamic metadata per approved manufacturer.",
  },
  {
    path: "/motorcycles",
    label: "Motorcycles",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Approved motorcycle records.",
  },
  {
    path: "/motorcycles/[slug]",
    label: "Motorcycle detail",
    kind: "dynamic",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Dynamic metadata per approved motorcycle.",
  },
  {
    path: "/standings",
    label: "Standings",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Current approved/demo standings only.",
  },
  {
    path: "/results",
    label: "Results",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Connector previews do not update this route.",
  },
  {
    path: "/statistics",
    label: "Statistics",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Current approved/demo calculations only.",
  },
  {
    path: "/records",
    label: "Records",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Current approved/demo record data only.",
  },
  {
    path: "/history",
    label: "History",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Season archive index.",
  },
  {
    path: "/history/[year]",
    label: "Season history",
    kind: "dynamic",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Dynamic season pages.",
  },
  {
    path: "/videos",
    label: "Videos",
    kind: "public",
    exposure: "public",
    seoStatus: "seo-indexable",
    notes: "Approved/import-ready video records only.",
  },
  {
    path: "/admin",
    label: "Admin dashboard",
    kind: "admin",
    exposure: "admin-protected",
    seoStatus: "no-index",
    notes: "Protected by Supabase session when configured.",
  },
  {
    path: "/admin/jobs/[id]",
    label: "Connector job detail",
    kind: "connector-admin",
    exposure: "admin-protected",
    seoStatus: "no-index",
    notes: "Connector previews and review-required details.",
  },
  {
    path: "/admin/preflight",
    label: "Preflight",
    kind: "admin",
    exposure: "admin-protected",
    seoStatus: "no-index",
    notes: "Pre-deployment audit and route inventory.",
  },
  {
    path: "/admin/*",
    label: "Admin sections",
    kind: "admin",
    exposure: "admin-protected",
    seoStatus: "no-index",
    notes: "Sources, audit, review, automation, deployment, users, security, settings.",
  },
];

export function getRouteInventorySummary() {
  return {
    total: routeInventory.length,
    publicRoutes: routeInventory.filter((route) => route.exposure === "public").length,
    adminProtectedRoutes: routeInventory.filter(
      (route) => route.exposure === "admin-protected",
    ).length,
    noIndexRoutes: routeInventory.filter((route) => route.seoStatus === "no-index")
      .length,
    seoIndexableRoutes: routeInventory.filter(
      (route) => route.seoStatus === "seo-indexable",
    ).length,
    dynamicRoutes: routeInventory.filter((route) => route.kind === "dynamic").length,
  };
}
