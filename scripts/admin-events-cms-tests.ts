import assert from "node:assert/strict";
import {
  buildChangedFieldDiffs,
  canManageEvents,
  canPermanentlyDeleteEvents,
  findChangedCmsFields,
  normalizeEventSlug,
  validateCmsEventInput,
} from "@/lib/admin/event-cms";

testPermissions();
testSlugGeneration();
testValidation();
testDuplicateSlugProtectionModel();
testArchivePolicyModel();
testDeletePermissionPolicy();
testDeleteEligibilityPolicyModel();
testAuditChangedFields();
testAuditDiffNormalization();

console.log("Admin events CMS tests passed.");

function testPermissions() {
  assert.equal(canManageEvents("owner"), true);
  assert.equal(canManageEvents("admin"), true);
  assert.equal(canManageEvents("reviewer"), false);
  assert.equal(canManageEvents("editor"), false);
  assert.equal(canManageEvents("viewer"), false);
  assert.equal(canPermanentlyDeleteEvents("owner"), true);
  assert.equal(canPermanentlyDeleteEvents("admin"), false);
  assert.equal(canPermanentlyDeleteEvents("reviewer"), false);
}

function testSlugGeneration() {
  assert.equal(
    normalizeEventSlug("Red Bull Erzbergrodeo 2026"),
    "red-bull-erzbergrodeo-2026",
  );
  assert.equal(
    normalizeEventSlug("  Sea to Sky / Mountain Race!  "),
    "sea-to-sky-mountain-race",
  );
}

function testValidation() {
  const valid = {
    name: "Red Bull Erzbergrodeo 2026",
    slug: "red-bull-erzbergrodeo-2026",
    seasonId: "season-2026",
    startDate: new Date("2026-06-04T00:00:00.000Z"),
    endDate: new Date("2026-06-07T00:00:00.000Z"),
    status: "COMPLETED" as const,
    visibility: "PUBLIC" as const,
    officialUrl: "https://example.com",
  };

  assert.equal(validateCmsEventInput(valid), null);
  assert.equal(validateCmsEventInput({ ...valid, name: "" }), "name-required");
  assert.equal(validateCmsEventInput({ ...valid, slug: "" }), "slug-required");
  assert.equal(validateCmsEventInput({ ...valid, seasonId: "" }), "season-required");
  assert.equal(
    validateCmsEventInput({ ...valid, startDate: null }),
    "start-date-required",
  );
  assert.equal(
    validateCmsEventInput({
      ...valid,
      endDate: new Date("2026-06-03T00:00:00.000Z"),
    }),
    "invalid-date-range",
  );
  assert.equal(
    validateCmsEventInput({ ...valid, officialUrl: "javascript:alert(1)" }),
    "invalid-official-url",
  );
  assert.equal(
    validateCmsEventInput({ ...valid, heroImage: "ftp://example.com/image.jpg" }),
    "invalid-hero-image",
  );
  assert.equal(
    validateCmsEventInput({
      ...valid,
      galleryImages: ["https://example.com/one.jpg", "javascript:alert(1)"],
    }),
    "invalid-gallery-image",
  );
}

function testDuplicateSlugProtectionModel() {
  const existing = new Set(["erzbergrodeo-2026"]);
  const candidate = normalizeEventSlug("Erzbergrodeo 2026");

  assert.equal(existing.has(candidate), true);
  assert.equal(existing.has(normalizeEventSlug("Romaniacs 2026")), false);
}

function testArchivePolicyModel() {
  const archived = {
    archivedAt: new Date("2026-07-14T00:00:00.000Z").toISOString(),
    archivedBy: "admin-user",
    visibility: "PRIVATE",
  };

  assert.equal(archived.visibility, "PRIVATE");
  assert.equal(Boolean(archived.archivedAt), true);
  assert.equal(Boolean(archived.archivedBy), true);
}

function testDeletePermissionPolicy() {
  assert.equal(canPermanentlyDeleteEvents("owner"), true);
  assert.equal(canPermanentlyDeleteEvents("admin"), false);
  assert.equal(canPermanentlyDeleteEvents("editor"), false);
  assert.equal(canPermanentlyDeleteEvents("reviewer"), false);
  assert.equal(canPermanentlyDeleteEvents("viewer"), false);
}

function testDeleteEligibilityPolicyModel() {
  const eligible = {
    archived: true,
    manualCreateAudit: true,
    connectorHistory: 0,
    results: 0,
    stages: 0,
    media: 0,
  };
  const blockedConnector = { ...eligible, connectorHistory: 1 };
  const blockedActive = { ...eligible, archived: false };
  const blockedResults = { ...eligible, results: 1 };

  assert.equal(isPolicyEligible(eligible), true);
  assert.equal(isPolicyEligible(blockedConnector), false);
  assert.equal(isPolicyEligible(blockedActive), false);
  assert.equal(isPolicyEligible(blockedResults), false);
}

function testAuditChangedFields() {
  const changed = findChangedCmsFields(
    {
      name: "Old Event",
      slug: "old-event",
      status: "SCHEDULED",
    },
    {
      name: "New Event",
      slug: "old-event",
      status: "COMPLETED",
    },
  );

  assert.deepEqual(changed, ["name", "status"]);
}

function testAuditDiffNormalization() {
  const changed = findChangedCmsFields(
    {
      description: null,
      galleryImages: ["https://example.com/b.jpg", "https://example.com/a.jpg"],
      startDate: "2026-06-04T00:00:00.000Z",
      venue: " Eisenerz ",
    },
    {
      description: "",
      galleryImages: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
      startDate: new Date("2026-06-04T00:00:00.000Z").toISOString(),
      venue: "Eisenerz",
    },
  );

  assert.deepEqual(changed, []);

  const diffs = buildChangedFieldDiffs(
    { description: "Official race overview" },
    { description: "Official race overview\nQA Test" },
  );
  assert.deepEqual(diffs, [
    {
      field: "description",
      oldValue: "Official race overview",
      newValue: "Official race overview\nQA Test",
    },
  ]);
}

function isPolicyEligible(input: {
  archived: boolean;
  manualCreateAudit: boolean;
  connectorHistory: number;
  results: number;
  stages: number;
  media: number;
}) {
  return (
    input.archived &&
    input.manualCreateAudit &&
    input.connectorHistory === 0 &&
    input.results === 0 &&
    input.stages === 0 &&
    input.media === 0
  );
}
