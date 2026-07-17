import {
  Bike,
  BarChart3,
  CalendarDays,
  Calculator,
  ClipboardCheck,
  Database,
  Rocket,
  Factory,
  FileSearch,
  FileText,
  Gauge,
  GitPullRequest,
  LayoutDashboard,
  ListChecks,
  PlaneTakeoff,
  MapPinned,
  PlayCircle,
  ServerCog,
  Settings,
  ShieldCheck,
  UserCog,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Dashboard",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        description: "Operational overview",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Events",
        href: "/admin/events",
        description: "Create and edit events",
        icon: CalendarDays,
      },
      {
        label: "Riders",
        href: "/admin/riders",
        description: "Manage rider profiles",
        icon: Users,
      },
      {
        label: "Teams",
        href: "/admin/teams",
        description: "Manage team data",
        icon: ShieldCheck,
      },
      {
        label: "Manufacturers",
        href: "/admin/manufacturers",
        description: "Factory brands",
        icon: Factory,
      },
      {
        label: "Motorcycles",
        href: "/admin/motorcycles",
        description: "Technical profiles",
        icon: Bike,
      },
      {
        label: "Results",
        href: "/admin/results",
        description: "Race classifications",
        icon: Trophy,
      },
      {
        label: "Stage Results",
        href: "/admin/stage-results",
        description: "Stage classifications",
        icon: ListChecks,
      },
      {
        label: "Scoring Components",
        href: "/admin/result-point-components",
        description: "Point provenance",
        icon: Calculator,
      },
      {
        label: "Standings",
        href: "/admin/standings",
        description: "Points tables",
        icon: ListChecks,
      },
    ],
  },
  {
    label: "Data Management",
    items: [
      {
        label: "Import Review",
        href: "/admin/review",
        description: "Import approvals",
        icon: ClipboardCheck,
      },
      {
        label: "Classifications",
        href: "/admin/classifications",
        description: "Data origin coverage",
        icon: FileSearch,
      },
      {
        label: "Sources",
        href: "/admin/sources",
        description: "Official links",
        icon: Database,
      },
      {
        label: "Regulations",
        href: "/admin/regulations",
        description: "Championship rules",
        icon: FileText,
      },
      {
        label: "Source Map",
        href: "/admin/sources-map",
        description: "Truth rules",
        icon: MapPinned,
      },
      {
        label: "Audit Log",
        href: "/admin/audit",
        description: "Change history",
        icon: FileSearch,
      },
      {
        label: "Imports",
        href: "/admin/imports",
        description: "Run history",
        icon: GitPullRequest,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Calculations",
        href: "/admin/calculations",
        description: "Preview engines",
        icon: Calculator,
      },
      {
        label: "Recalculation",
        href: "/admin/recalculation",
        description: "Stats and records",
        icon: BarChart3,
      },
      {
        label: "Automation",
        href: "/admin/automation",
        description: "Job health",
        icon: PlayCircle,
      },
      {
        label: "Jobs",
        href: "/admin/jobs",
        description: "Job registry",
        icon: Gauge,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        description: "Roles preview",
        icon: UserCog,
      },
      {
        label: "Security",
        href: "/admin/security",
        description: "Access matrix",
        icon: ShieldCheck,
      },
      {
        label: "Settings",
        href: "/admin/settings",
        description: "Roles and system",
        icon: Settings,
      },
      {
        label: "Health",
        href: "/admin/settings",
        description: "System checks",
        icon: Gauge,
      },
      {
        label: "Preflight",
        href: "/admin/preflight",
        description: "Audit and QA",
        icon: PlaneTakeoff,
      },
      {
        label: "Deployment",
        href: "/admin/deployment",
        description: "Launch readiness",
        icon: Rocket,
      },
      {
        label: "System",
        href: "/admin/system",
        description: "Deployment status",
        icon: ServerCog,
      },
    ],
  },
];

export const adminNavItems: AdminNavItem[] = adminNavGroups.flatMap(
  (group) => group.items,
);
