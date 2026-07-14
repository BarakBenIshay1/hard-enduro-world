import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuthAuditInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  result: "success" | "denied" | "failed";
  route?: string | null;
  reason?: string | null;
};

export async function recordAuthAudit(input: AuthAuditInput) {
  try {
    await prisma.dataVersion.create({
      data: {
        entityType: "Auth",
        entityId: input.actorId ?? input.actorEmail ?? "anonymous",
        action: "MANUAL_EDIT",
        previous: Prisma.JsonNull,
        next: {
          action: input.action,
          result: input.result,
          actorEmail: input.actorEmail ?? null,
          route: input.route ?? null,
          reason: input.reason ?? null,
        },
        createdBy: input.actorId ?? null,
      },
    });
  } catch {
    // Authentication should not fail because optional audit logging is unavailable.
  }
}
