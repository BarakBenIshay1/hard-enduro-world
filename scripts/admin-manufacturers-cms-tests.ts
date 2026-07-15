import assert from "node:assert/strict";
import {
  canManageManufacturers,
  canPermanentlyDeleteManufacturers,
  manufacturerStatuses,
  normalizeManufacturerSlug,
  validateManufacturerInput,
} from "@/lib/admin/manufacturer-cms";
import {
  buildAdminMediaObjectPath,
  isAdminMediaUploadRequest,
} from "@/lib/admin/media-upload";

testPermissions();
testSlugGeneration();
testValidation();
testUploadPath();
testPublicVisibilityPolicy();
testDeleteEligibilityPolicyModel();

console.log("Admin manufacturers CMS tests passed.");

function testPermissions() {
  assert.equal(canManageManufacturers("owner"), true);
  assert.equal(canManageManufacturers("admin"), true);
  assert.equal(canManageManufacturers("reviewer"), false);
  assert.equal(canPermanentlyDeleteManufacturers("owner"), true);
  assert.equal(canPermanentlyDeleteManufacturers("admin"), false);
}

function testSlugGeneration() {
  assert.equal(normalizeManufacturerSlug("TM Racing"), "tm-racing");
  assert.equal(normalizeManufacturerSlug("  GASGAS Factory  "), "gasgas-factory");
}

function testValidation() {
  const valid = {
    name: "KTM",
    slug: "ktm",
    foundedYear: 1934,
    websiteUrl: "https://example.com",
    logoUrl: "https://example.com/logo.png",
    visibility: "PUBLIC" as const,
    status: "ACTIVE" as const,
  };

  assert.equal(validateManufacturerInput(valid), null);
  assert.equal(validateManufacturerInput({ ...valid, name: "" }), "name-required");
  assert.equal(validateManufacturerInput({ ...valid, slug: "" }), "slug-required");
  assert.equal(
    validateManufacturerInput({ ...valid, websiteUrl: "javascript:alert(1)" }),
    "invalid-website-url",
  );
  assert.equal(
    validateManufacturerInput({ ...valid, logoUrl: "ftp://example.com/logo.png" }),
    "invalid-logo-url",
  );
  assert.equal(
    validateManufacturerInput({ ...valid, foundedYear: 1200 }),
    "invalid-founded-year",
  );
  assert.deepEqual(manufacturerStatuses, ["ACTIVE", "HISTORIC", "INACTIVE"]);
}

function testUploadPath() {
  assert.equal(isAdminMediaUploadRequest("POST", "/admin/manufacturers/media"), true);
  assert.equal(
    buildAdminMediaObjectPath({
      entityType: "manufacturers",
      entityId: "clxmanufacturer123",
      slot: "logo",
      fileName: "../Factory Logo.png",
      extension: "png",
      uniqueId: "abc-123",
    }),
    "manufacturers/clxmanufacturer123/logo/factory-logo-abc-123.png",
  );
}

function testPublicVisibilityPolicy() {
  assert.equal(isPublicManufacturerVisible("PUBLIC", null), true);
  assert.equal(isPublicManufacturerVisible("DRAFT", null), false);
  assert.equal(isPublicManufacturerVisible("PRIVATE", null), false);
  assert.equal(isPublicManufacturerVisible("PUBLIC", "2026-07-15T00:00:00.000Z"), false);
}

function testDeleteEligibilityPolicyModel() {
  const eligible = {
    archived: true,
    manualCreateAudit: true,
    motorcycles: 0,
    results: 0,
    stageResults: 0,
    careerSeasons: 0,
    seasonStats: 0,
    teams: 0,
    sourceLinks: 0,
  };

  assert.equal(isPolicyEligible(eligible), true);
  assert.equal(isPolicyEligible({ ...eligible, archived: false }), false);
  assert.equal(isPolicyEligible({ ...eligible, manualCreateAudit: false }), false);
  assert.equal(isPolicyEligible({ ...eligible, motorcycles: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, results: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, teams: 1 }), false);
}

function isPublicManufacturerVisible(
  visibility: "PUBLIC" | "DRAFT" | "PRIVATE",
  archivedAt: string | null,
) {
  return visibility === "PUBLIC" && !archivedAt;
}

function isPolicyEligible(input: {
  archived: boolean;
  manualCreateAudit: boolean;
  motorcycles: number;
  results: number;
  stageResults: number;
  careerSeasons: number;
  seasonStats: number;
  teams: number;
  sourceLinks: number;
}) {
  return (
    input.archived &&
    input.manualCreateAudit &&
    input.motorcycles === 0 &&
    input.results === 0 &&
    input.stageResults === 0 &&
    input.careerSeasons === 0 &&
    input.seasonStats === 0 &&
    input.teams === 0 &&
    input.sourceLinks === 0
  );
}
