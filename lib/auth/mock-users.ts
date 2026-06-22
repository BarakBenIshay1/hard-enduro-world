import type { AuthUser } from "@/lib/auth/types";

export const mockAdminUsers: AuthUser[] = [
  {
    id: "mock-owner",
    email: "owner@example.com",
    name: "Demo Owner",
    role: "owner",
    provider: "mock",
    lastActiveAt: new Date("2026-06-22T08:00:00.000Z"),
  },
  {
    id: "mock-admin",
    email: "admin@example.com",
    name: "Demo Admin",
    role: "admin",
    provider: "mock",
    lastActiveAt: new Date("2026-06-21T17:30:00.000Z"),
  },
  {
    id: "mock-editor",
    email: "editor@example.com",
    name: "Demo Editor",
    role: "editor",
    provider: "mock",
    lastActiveAt: new Date("2026-06-20T12:15:00.000Z"),
  },
  {
    id: "mock-reviewer",
    email: "reviewer@example.com",
    name: "Demo Reviewer",
    role: "reviewer",
    provider: "mock",
    lastActiveAt: new Date("2026-06-19T09:45:00.000Z"),
  },
  {
    id: "mock-viewer",
    email: "viewer@example.com",
    name: "Demo Viewer",
    role: "viewer",
    provider: "mock",
    lastActiveAt: null,
  },
];
