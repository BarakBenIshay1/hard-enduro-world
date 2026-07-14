import { createHash } from "node:crypto";
import {
  Prisma,
  type ConnectorReviewApplicationStatus,
  type EventStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";

type PrismaTransaction = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
type PrismaExecutor = typeof prisma | PrismaTransaction;

export type ConnectorReviewApplyInput = {
  reviewItemId: string;
  expectedApplicationStatus: ConnectorReviewApplicationStatus;
  expectedApplicationVersion: number;
  actor: Pick<AuthUser, "id" | "email" | "name">;
  note?: string | null;
};

export type ConnectorReviewApplyResult =
  | {
      ok: true;
      reviewItemId: string;
      eventId: string;
      status: "APPLIED";
      message: string;
    }
  | {
      ok: false;
      code: "already-applied" | "conflict" | "invalid" | "not-found" | "unsupported";
      message: string;
    };

type ReviewForApplication = NonNullable<
  Awaited<ReturnType<typeof loadReviewForApplication>>
>;

type ApplicationContext = {
  review: ReviewForApplication;
  changedFields: string[];
  proposed: Record<string, unknown>;
  current: Record<string, unknown> | null;
};

export type ConnectorReviewApplicationPolicyInput = {
  reviewStatus: string;
  applicationStatus: string;
  suggestedAction: string;
  changedFields: string[];
  proposedValues: Record<string, unknown> | null;
};

export type ConnectorReviewApplicationPolicyResult =
  | { ok: true; eventStatus?: EventStatus }
  | { ok: false; reason: string };

const allowedProposalFields = new Set([
  "sourceEventId",
  "seasonYear",
  "eventName",
  "slugCandidate",
  "country",
  "countryCode",
  "location",
  "venue",
  "startDate",
  "endDate",
  "startDatePrecision",
  "endDatePrecision",
  "officialUrl",
  "raceStatusCandidate",
]);

const allowedChangedFields = new Set([
  "event",
  "name",
  "slug",
  "country",
  "countryCode",
  "location",
  "venue",
  "startDate",
  "endDate",
  "officialUrl",
  "status",
]);

const countryCodeAliases: Record<string, string> = {
  FRA: "FR",
  PRT: "PT",
  USA: "US",
  TUR: "TR",
  LSO: "LS",
  ITA: "IT",
  ESP: "ES",
  SWE: "SE",
};

export async function applyConnectorReviewItem(
  input: ConnectorReviewApplyInput,
): Promise<ConnectorReviewApplyResult> {
  try {
    return await applyConnectorReviewItemTransaction(input);
  } catch (error) {
    await markApplicationFailed(input, sanitizeError(error));
    return {
      ok: false,
      code: "invalid",
      message: sanitizeError(error),
    };
  }
}

export function validateConnectorReviewApplicationPolicy(
  input: ConnectorReviewApplicationPolicyInput,
): ConnectorReviewApplicationPolicyResult {
  if (input.reviewStatus !== "APPROVED") {
    return { ok: false, reason: "Only APPROVED review items can be applied." };
  }
  if (!["NOT_APPLIED", "APPLY_FAILED"].includes(input.applicationStatus)) {
    return { ok: false, reason: "Review item is not in an applyable state." };
  }
  if (input.suggestedAction === "SOURCE_REMOVED") {
    return { ok: false, reason: "SOURCE_REMOVED cannot be applied." };
  }
  if (input.suggestedAction === "MANUAL_REVIEW") {
    return { ok: false, reason: "MANUAL_REVIEW cannot be directly applied." };
  }
  if (!input.proposedValues) {
    return { ok: false, reason: "Proposal payload is missing." };
  }
  for (const field of Object.keys(input.proposedValues)) {
    if (!allowedProposalFields.has(field)) {
      return { ok: false, reason: `Unsupported proposal field: ${field}` };
    }
  }
  for (const field of input.changedFields) {
    if (!allowedChangedFields.has(field)) {
      return { ok: false, reason: `Unsupported changed field: ${field}` };
    }
  }

  try {
    const status = getString(input.proposedValues, "raceStatusCandidate");
    return { ok: true, eventStatus: status ? mapEventStatus(status) : undefined };
  } catch (error) {
    return { ok: false, reason: sanitizeError(error) };
  }
}

async function applyConnectorReviewItemTransaction(
  input: ConnectorReviewApplyInput,
): Promise<ConnectorReviewApplyResult> {
  return prisma.$transaction(
    async (tx) => {
      const review = await loadReviewForApplication(input.reviewItemId, tx);
      if (!review) return failure("not-found", "Review item was not found.");

      if (review.reviewStatus !== "APPROVED") {
        return failure("invalid", "Only APPROVED review items can be applied.");
      }

      if (review.applicationStatus === "APPLIED") {
        return failure("already-applied", "This review item has already been applied.");
      }

      if (
        !["NOT_APPLIED", "APPLY_FAILED"].includes(review.applicationStatus) ||
        review.applicationStatus !== input.expectedApplicationStatus ||
        review.applicationVersion !== input.expectedApplicationVersion
      ) {
        return failure("conflict", "Application state changed. Reload before applying.");
      }

      const locked = await tx.connectorReviewItem.updateMany({
        where: {
          id: review.id,
          reviewStatus: "APPROVED",
          applicationStatus: input.expectedApplicationStatus,
          applicationVersion: input.expectedApplicationVersion,
        },
        data: {
          applicationStatus: "APPLYING",
          applicationAttemptCount: { increment: 1 },
          applicationError: null,
          applicationVersion: { increment: 1 },
        },
      });

      if (locked.count !== 1) {
        return failure("conflict", "Application state changed. Reload before applying.");
      }

      const context = buildApplicationContext(review);
      validateApplicationContext(context);

      if (review.suggestedAction === "SOURCE_REMOVED") {
        throw new Error(
          "SOURCE_REMOVED cannot be applied until a safe removal policy exists.",
        );
      }
      if (review.suggestedAction === "MANUAL_REVIEW") {
        throw new Error("MANUAL_REVIEW cannot be directly applied.");
      }

      const previousEventState =
        review.suggestedAction === "UPDATE_EVENT"
          ? await loadCurrentEventForUpdate(context, tx)
          : null;
      const expectedChecksum = createStableChecksum(previousEventState ?? null);

      let event;
      if (review.suggestedAction === "NEW_EVENT") {
        event = await createEventFromReview(context, tx);
      } else if (review.suggestedAction === "UPDATE_EVENT") {
        event = await updateEventFromReview(context, previousEventState, tx);
      } else {
        throw new Error(`Unsupported review action: ${review.suggestedAction}`);
      }

      const resultingEventState = toAuditedEventState(event);
      const resultingChecksum = createStableChecksum(resultingEventState);
      const appliedAt = new Date();

      await tx.connectorReviewItem.update({
        where: { id: review.id },
        data: {
          applicationStatus: "APPLIED",
          appliedAt,
          appliedByUserId: input.actor.id,
          appliedByUserEmail: input.actor.email,
          applicationNote: input.note?.trim() || null,
          applicationError: null,
          appliedEventId: event.id,
          expectedCurrentStateChecksum: expectedChecksum,
          resultingEventStateChecksum: resultingChecksum,
          applicationVersion: { increment: 1 },
        },
      });

      await tx.dataVersion.create({
        data: {
          entityType: "Event",
          entityId: event.id,
          action: review.suggestedAction === "NEW_EVENT" ? "CREATE" : "UPDATE",
          previous: (previousEventState ?? null) as Prisma.InputJsonValue,
          next: resultingEventState as Prisma.InputJsonValue,
          sourceUrl: getString(context.proposed, "officialUrl"),
          createdBy: input.actor.id,
        },
      });

      await tx.dataVersion.create({
        data: {
          entityType: "ConnectorReviewItem",
          entityId: review.id,
          action: "MANUAL_EDIT",
          previous: {
            applicationStatus: input.expectedApplicationStatus,
            applicationVersion: input.expectedApplicationVersion,
          },
          next: {
            applicationStatus: "APPLIED",
            appliedEventId: event.id,
            appliedByUserId: input.actor.id,
            appliedByUserEmail: input.actor.email,
            appliedAt: appliedAt.toISOString(),
            changedFields: context.changedFields,
            suggestedAction: review.suggestedAction,
          },
          sourceUrl: getString(context.proposed, "officialUrl"),
          createdBy: input.actor.id,
        },
      });

      return {
        ok: true,
        reviewItemId: review.id,
        eventId: event.id,
        status: "APPLIED",
        message: "Approved review item was applied to one Event record.",
      };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
}

async function markApplicationFailed(input: ConnectorReviewApplyInput, message: string) {
  await prisma.$transaction(async (tx) => {
    await tx.connectorReviewItem.updateMany({
      where: {
        id: input.reviewItemId,
        reviewStatus: "APPROVED",
      },
      data: {
        applicationStatus: "APPLY_FAILED",
        applicationError: message,
        applicationAttemptCount: { increment: 1 },
        applicationVersion: { increment: 1 },
      },
    });

    await tx.dataVersion.create({
      data: {
        entityType: "ConnectorReviewItem",
        entityId: input.reviewItemId,
        action: "MANUAL_EDIT",
        previous: {
          applicationStatus: input.expectedApplicationStatus,
        },
        next: {
          applicationStatus: "APPLY_FAILED",
          failureReason: message,
        },
        createdBy: input.actor.id,
      },
    });
  });
}

async function loadReviewForApplication(id: string, client: PrismaExecutor) {
  return client.connectorReviewItem.findUnique({
    where: { id },
    include: {
      snapshot: true,
    },
  });
}

function buildApplicationContext(review: ReviewForApplication): ApplicationContext {
  const proposed = toRecord(review.proposedValues);
  return {
    review,
    changedFields: review.changedFields,
    proposed,
    current: toNullableRecord(review.currentValues),
  };
}

function validateApplicationContext(context: ApplicationContext) {
  if (!context.review.snapshot) throw new Error("Source snapshot is missing.");
  if (!context.proposed) throw new Error("Proposal payload is missing.");

  for (const field of Object.keys(context.proposed)) {
    if (!allowedProposalFields.has(field)) {
      throw new Error(`Unsupported proposal field: ${field}`);
    }
  }

  for (const field of context.changedFields) {
    if (!allowedChangedFields.has(field)) {
      throw new Error(`Unsupported changed field: ${field}`);
    }
  }

  if (
    context.review.suggestedAction === "UPDATE_EVENT" &&
    !context.review.currentEventId
  ) {
    throw new Error("UPDATE_EVENT requires a matched current Event id.");
  }
}

async function createEventFromReview(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const slug = requiredString(context.proposed, "slugCandidate");
  const sourceEventId = getString(context.proposed, "sourceEventId");
  const seasonYear = requiredNumber(context.proposed, "seasonYear");
  const [season, country, duplicateSlug, duplicateSourceEvent] = await Promise.all([
    client.season.findUnique({ where: { year: seasonYear } }),
    resolveCountry(context.proposed, client),
    client.event.findUnique({ where: { slug } }),
    sourceEventId
      ? client.connectorReviewItem.findFirst({
          where: {
            sourceEventId,
            applicationStatus: "APPLIED",
            appliedEventId: { not: null },
          },
        })
      : Promise.resolve(null),
  ]);

  if (!season) throw new Error(`Season ${seasonYear} does not exist.`);
  if (!country) throw new Error("Country could not be resolved safely.");
  if (duplicateSlug) throw new Error(`Event slug already exists: ${slug}`);
  if (duplicateSourceEvent?.appliedEventId) {
    throw new Error("This source event was already applied to an Event.");
  }

  return client.event.create({
    data: {
      seasonId: season.id,
      countryId: country.id,
      name: requiredString(context.proposed, "eventName"),
      slug,
      city: getString(context.proposed, "location"),
      venue: getString(context.proposed, "venue"),
      startDate: requiredDate(context.proposed, "startDate"),
      endDate: optionalDate(context.proposed, "endDate"),
      status: mapEventStatus(getString(context.proposed, "raceStatusCandidate")),
      officialUrl: validateUrl(getString(context.proposed, "officialUrl")),
    },
  });
}

async function updateEventFromReview(
  context: ApplicationContext,
  previousEventState: Record<string, unknown> | null,
  client: PrismaExecutor,
) {
  if (!previousEventState) throw new Error("Current Event state is missing.");

  const expected = context.current;
  if (!expected) throw new Error("Approved expected current values are missing.");

  for (const field of context.changedFields) {
    const eventField = toEventField(field);
    if (
      eventField &&
      !valuesEqual(
        previousEventState[eventField],
        getExpectedCurrentValue(expected, eventField),
      )
    ) {
      throw new Error(
        `Stale Event state for ${eventField}. Regenerate review before applying.`,
      );
    }
  }

  const data = await buildEventUpdateData(context, client);

  return client.event.update({
    where: { id: context.review.currentEventId! },
    data,
  });
}

async function loadCurrentEventForUpdate(
  context: ApplicationContext,
  client: PrismaExecutor,
) {
  const event = await client.event.findUnique({
    where: { id: context.review.currentEventId ?? "" },
    include: {
      country: true,
      season: true,
    },
  });

  if (!event) throw new Error("Matched Event no longer exists.");
  return toAuditedEventState(event);
}

async function buildEventUpdateData(context: ApplicationContext, client: PrismaExecutor) {
  const data: Prisma.EventUpdateInput = {};
  const uniqueFields = new Set(context.changedFields.map(toEventField).filter(Boolean));

  for (const field of uniqueFields) {
    if (field === "name") data.name = requiredString(context.proposed, "eventName");
    if (field === "slug") {
      const slug = requiredString(context.proposed, "slugCandidate");
      const existing = await client.event.findUnique({ where: { slug } });
      if (existing && existing.id !== context.review.currentEventId) {
        throw new Error(`Event slug already exists: ${slug}`);
      }
      data.slug = slug;
    }
    if (field === "city") data.city = getString(context.proposed, "location");
    if (field === "venue") data.venue = getString(context.proposed, "venue");
    if (field === "startDate")
      data.startDate = requiredDate(context.proposed, "startDate");
    if (field === "endDate") data.endDate = optionalDate(context.proposed, "endDate");
    if (field === "officialUrl") {
      data.officialUrl = validateUrl(getString(context.proposed, "officialUrl"));
    }
    if (field === "status") {
      data.status = mapEventStatus(getString(context.proposed, "raceStatusCandidate"));
    }
    if (field === "country") {
      const country = await resolveCountry(context.proposed, client);
      if (!country) throw new Error("Country could not be resolved safely.");
      data.country = { connect: { id: country.id } };
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No supported Event fields were approved for application.");
  }

  return data;
}

function toEventField(field: string) {
  const map: Record<string, string> = {
    event: "",
    name: "name",
    eventName: "name",
    slug: "slug",
    slugCandidate: "slug",
    location: "city",
    venue: "venue",
    startDate: "startDate",
    endDate: "endDate",
    officialUrl: "officialUrl",
    status: "status",
    raceStatusCandidate: "status",
    country: "country",
    countryCode: "country",
  };
  return map[field] ?? null;
}

function getExpectedCurrentValue(expected: Record<string, unknown>, eventField: string) {
  const map: Record<string, string[]> = {
    name: ["name", "eventName"],
    slug: ["slug", "slugCandidate"],
    city: ["city", "location"],
    venue: ["venue"],
    startDate: ["startDate"],
    endDate: ["endDate"],
    officialUrl: ["officialUrl"],
    status: ["status", "raceStatusCandidate"],
    country: ["country"],
  };
  for (const key of map[eventField] ?? [eventField]) {
    if (key in expected) return expected[key];
  }
  return undefined;
}

async function resolveCountry(proposed: Record<string, unknown>, client: PrismaExecutor) {
  const rawCode = getString(proposed, "countryCode");
  const rawName = getString(proposed, "country");
  const code = rawCode ? (countryCodeAliases[rawCode] ?? rawCode).toUpperCase() : null;

  if (code) {
    const country = await client.country.findUnique({ where: { isoCode: code } });
    if (country) return country;
  }

  if (!rawName) return null;
  const countries = await client.country.findMany({
    where: {
      name: {
        equals: normalizeCountryName(rawName),
        mode: "insensitive",
      },
    },
  });

  return countries.length === 1 ? countries[0] : null;
}

function normalizeCountryName(name: string) {
  if (name.toLowerCase() === "türkiye") return "Turkey";
  if (name.toLowerCase() === "united states") return "United States";
  return name;
}

function mapEventStatus(status: string | null): EventStatus {
  if (status === "Race Completed") return "COMPLETED";
  if (status === "Coming Soon") return "SCHEDULED";
  if (status === "Live Now") return "LIVE";
  if (status === "Cancelled" || status === "Canceled") return "CANCELLED";
  throw new Error(`Unsupported event status: ${status ?? "missing"}`);
}

function toAuditedEventState(event: {
  id: string;
  name: string;
  slug: string;
  season?: { year: number } | null;
  country?: { id: string; name: string; isoCode: string } | null;
  countryId?: string | null;
  city: string | null;
  venue: string | null;
  startDate: Date;
  endDate: Date | null;
  status: EventStatus;
  officialUrl: string | null;
}) {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    seasonYear: event.season?.year,
    countryId: event.countryId ?? event.country?.id ?? null,
    country: event.country?.name ?? null,
    countryCode: event.country?.isoCode ?? null,
    city: event.city,
    venue: event.venue,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    status: event.status,
    officialUrl: event.officialUrl,
  };
}

function toRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected object payload.");
  }
  return value as Record<string, unknown>;
}

function toNullableRecord(value: unknown) {
  if (!value) return null;
  return toRecord(value);
}

function requiredString(value: Record<string, unknown>, key: string) {
  const field = getString(value, key);
  if (!field) throw new Error(`Missing required field: ${key}`);
  return field;
}

function requiredNumber(value: Record<string, unknown>, key: string) {
  const field = value[key];
  if (typeof field !== "number") throw new Error(`Missing required field: ${key}`);
  return field;
}

function getString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function requiredDate(value: Record<string, unknown>, key: string) {
  const field = requiredString(value, key);
  const date = new Date(field);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date field: ${key}`);
  return date;
}

function optionalDate(value: Record<string, unknown>, key: string) {
  const field = getString(value, key);
  if (!field) return null;
  const date = new Date(field);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date field: ${key}`);
  return date;
}

function validateUrl(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).toString();
  } catch {
    throw new Error("Invalid official URL.");
  }
}

function valuesEqual(left: unknown, right: unknown) {
  return createStableChecksum(left ?? null) === createStableChecksum(right ?? null);
}

function createStableChecksum(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Application failed.";
  return message.replace(/postgresql:\/\/\S+/gi, "[redacted-database-url]");
}

function failure(
  code: Exclude<ConnectorReviewApplyResult, { ok: true }>["code"],
  message: string,
): ConnectorReviewApplyResult {
  return { ok: false, code, message };
}
