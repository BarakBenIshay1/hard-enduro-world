import {
  Bike,
  CalendarDays,
  ClipboardCheck,
  Database,
  Factory,
  FileSearch,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
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

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    description: "Operational overview",
    icon: LayoutDashboard,
  },
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
    label: "Standings",
    href: "/admin/standings",
    description: "Points tables",
    icon: ListChecks,
  },
  {
    label: "Sources",
    href: "/admin/sources",
    description: "Official links",
    icon: Database,
  },
  {
    label: "Review",
    href: "/admin/review",
    description: "Import approvals",
    icon: ClipboardCheck,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    description: "Roles and system",
    icon: Settings,
  },
  {
    label: "Audit Ready",
    href: "/admin/review",
    description: "History placeholder",
    icon: FileSearch,
  },
  {
    label: "Health",
    href: "/admin/settings",
    description: "System checks",
    icon: Gauge,
  },
];
