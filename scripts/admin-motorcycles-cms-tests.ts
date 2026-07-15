import assert from "node:assert/strict";
import {
  buildMotorcycleSlug,
  canManageMotorcycles,
  canPermanentlyDeleteMotorcycles,
  motorcycleStatuses,
  normalizeMotorcycleSlug,
  validateMotorcycleInput,
} from "@/lib/admin/motorcycle-cms";
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

console.log("Admin motorcycles CMS tests passed.");

function testPermissions() {
  assert.equal(canManageMotorcycles("owner"), true);
  assert.equal(canManageMotorcycles("admin"), true);
  assert.equal(canManageMotorcycles("reviewer"), false);
  assert.equal(canPermanentlyDeleteMotorcycles("owner"), true);
  assert.equal(canPermanentlyDeleteMotorcycles("admin"), false);
}

function testSlugGeneration() {
  assert.equal(normalizeMotorcycleSlug("KTM 300 EXC 2026"), "ktm-300-exc-2026");
  assert.equal(
    buildMotorcycleSlug({
      manufacturerName: "Husqvarna",
      model: "TE 300",
      year: 2026,
    }),
    "husqvarna-te-300-2026",
  );
}

function testValidation() {
  const valid = {
    manufacturerId: "clxmanufacturer123",
    model: "300 EXC",
    slug: "ktm-300-exc-2026",
    year: 2026,
    engineCc: 293,
    strokeType: "TWO_STROKE" as const,
    weightKg: 104.5,
    horsepower: 54,
    torqueNm: 46,
    fuelCapacityL: 9,
    heroImage: "https://example.com/bike.jpg",
    visibility: "PUBLIC" as const,
    status: "ACTIVE" as const,
  };

  assert.equal(validateMotorcycleInput(valid), null);
  assert.equal(
    validateMotorcycleInput({ ...valid, manufacturerId: "" }),
    "manufacturer-required",
  );
  assert.equal(validateMotorcycleInput({ ...valid, model: "" }), "model-required");
  assert.equal(validateMotorcycleInput({ ...valid, slug: "" }), "slug-required");
  assert.equal(
    validateMotorcycleInput({ ...valid, heroImage: "javascript:alert(1)" }),
    "invalid-hero-image",
  );
  assert.equal(validateMotorcycleInput({ ...valid, year: 1900 }), "invalid-model-year");
  assert.equal(validateMotorcycleInput({ ...valid, engineCc: -1 }), "invalid-engine");
  assert.equal(validateMotorcycleInput({ ...valid, weightKg: -1 }), "invalid-weight");
  assert.equal(validateMotorcycleInput({ ...valid, horsepower: -1 }), "invalid-power");
  assert.equal(validateMotorcycleInput({ ...valid, torqueNm: -1 }), "invalid-torque");
  assert.equal(
    validateMotorcycleInput({ ...valid, fuelCapacityL: -1 }),
    "invalid-fuel-capacity",
  );
  assert.deepEqual(motorcycleStatuses, ["ACTIVE", "HISTORIC", "INACTIVE"]);
}

function testUploadPath() {
  assert.equal(isAdminMediaUploadRequest("POST", "/admin/motorcycles/media"), true);
  assert.equal(
    buildAdminMediaObjectPath({
      entityType: "motorcycles",
      entityId: "clxmotorcycle123",
      slot: "hero",
      fileName: "../Factory Bike.png",
      extension: "png",
      uniqueId: "abc-123",
    }),
    "motorcycles/clxmotorcycle123/hero/factory-bike-abc-123.png",
  );
}

function testPublicVisibilityPolicy() {
  assert.equal(isPublicMotorcycleVisible("PUBLIC", null), true);
  assert.equal(isPublicMotorcycleVisible("DRAFT", null), false);
  assert.equal(isPublicMotorcycleVisible("PRIVATE", null), false);
  assert.equal(isPublicMotorcycleVisible("PUBLIC", "2026-07-15T00:00:00.000Z"), false);
}

function testDeleteEligibilityPolicyModel() {
  const eligible = {
    archived: true,
    manualCreateAudit: true,
    currentRiders: 0,
    results: 0,
    stageResults: 0,
    careerSeasons: 0,
    seasonStats: 0,
    sourceLinks: 0,
  };

  assert.equal(isPolicyEligible(eligible), true);
  assert.equal(isPolicyEligible({ ...eligible, archived: false }), false);
  assert.equal(isPolicyEligible({ ...eligible, manualCreateAudit: false }), false);
  assert.equal(isPolicyEligible({ ...eligible, currentRiders: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, results: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, stageResults: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, careerSeasons: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, seasonStats: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, sourceLinks: 1 }), false);
}

function isPublicMotorcycleVisible(
  visibility: "PUBLIC" | "DRAFT" | "PRIVATE",
  archivedAt: string | null,
) {
  return visibility === "PUBLIC" && !archivedAt;
}

function isPolicyEligible(input: {
  archived: boolean;
  manualCreateAudit: boolean;
  currentRiders: number;
  results: number;
  stageResults: number;
  careerSeasons: number;
  seasonStats: number;
  sourceLinks: number;
}) {
  return (
    input.archived &&
    input.manualCreateAudit &&
    input.currentRiders === 0 &&
    input.results === 0 &&
    input.stageResults === 0 &&
    input.careerSeasons === 0 &&
    input.seasonStats === 0 &&
    input.sourceLinks === 0
  );
}
