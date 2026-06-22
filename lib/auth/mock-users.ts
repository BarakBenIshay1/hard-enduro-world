import type { AuthUser } from "@/lib/auth/types";

export const mockAdminUsers: AuthUser[] = [
  {
    id: "demo-owner",
    email: "owner@example.com",
    name: "Demo Owner",
    role: "owner",
    provider: "development-fallback",
    lastActiveAt: new Date("2026-06-22T08:00:00.000Z"),
  },
  {
    id: "demo-admin",
    email: "admin@example.com",
    name: "Demo Admin",
    role: "admin",
    provider: "development-fallback",
    lastActiveAt: new Date("2026-06-21T17:30:00.000Z"),
  },
  {
    id: "demo-editor",
    email: "editor@example.com",
    name: "Demo Editor",
    role: "editor",
    provider: "development-fallback",
    lastActiveAt: new Date("2026-06-20T12:15:00.000Z"),
  },
  {
    id: "demo-reviewer",
    email: "reviewer@example.com",
    name: "Demo Reviewer",
    role: "reviewer",
    provider: "development-fallback",
    lastActiveAt: new Date("2026-06-19T09:45:00.000Z"),
  },
  {
    id: "demo-viewer",
    email: "viewer@example.com",
    name: "Demo Viewer",
    role: "viewer",
    provider: "development-fallback",
    lastActiveAt: null,
  },
];
