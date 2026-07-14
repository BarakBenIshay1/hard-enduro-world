import assert from "node:assert/strict";
import {
  canManageTeams,
  canPermanentlyDeleteTeams,
  normalizeTeamSlug,
  teamStatuses,
  validateTeamInput,
} from "@/lib/admin/team-cms";
import {
  buildAdminMediaObjectPath,
  isAdminMediaUploadRequest,
} from "@/lib/admin/media-upload";

testPermissions();
testSlugGeneration();
testValidation();
testUploadPath();
testDeleteEligibilityPolicyModel();

console.log("Admin teams CMS tests passed.");

function testPermissions() {
  assert.equal(canManageTeams("owner"), true);
  assert.equal(canManageTeams("admin"), true);
  assert.equal(canManageTeams("reviewer"), false);
  assert.equal(canPermanentlyDeleteTeams("owner"), true);
  assert.equal(canPermanentlyDeleteTeams("admin"), false);
}

function testSlugGeneration() {
  assert.equal(
    normalizeTeamSlug("Red Bull KTM Factory Racing"),
    "red-bull-ktm-factory-racing",
  );
}

function testValidation() {
  const valid = {
    name: "Red Bull KTM Factory Racing",
    slug: "red-bull-ktm-factory-racing",
    officialUrl: "https://example.com/team",
    logoUrl: "https://example.com/logo.png",
    galleryImages: ["https://example.com/gallery.jpg"],
    visibility: "PUBLIC" as const,
    status: "ACTIVE" as const,
  };

  assert.equal(validateTeamInput(valid), null);
  assert.equal(validateTeamInput({ ...valid, name: "" }), "name-required");
  assert.equal(validateTeamInput({ ...valid, slug: "" }), "slug-required");
  assert.equal(
    validateTeamInput({ ...valid, officialUrl: "javascript:alert(1)" }),
    "invalid-official-url",
  );
  assert.equal(
    validateTeamInput({ ...valid, logoUrl: "ftp://example.com/logo.png" }),
    "invalid-logo-url",
  );
  assert.equal(
    validateTeamInput({
      ...valid,
      galleryImages: ["https://example.com/one.jpg", "javascript:alert(1)"],
    }),
    "invalid-gallery-image",
  );
  assert.deepEqual(teamStatuses, ["ACTIVE", "HISTORIC", "INACTIVE"]);
}

function testUploadPath() {
  assert.equal(isAdminMediaUploadRequest("POST", "/admin/teams/media"), true);
  assert.equal(
    buildAdminMediaObjectPath({
      entityType: "teams",
      entityId: "clxteam12345",
      slot: "logo",
      fileName: "../Factory Logo.png",
      extension: "png",
      uniqueId: "abc-123",
    }),
    "teams/clxteam12345/logo/factory-logo-abc-123.png",
  );
}

function testDeleteEligibilityPolicyModel() {
  const eligible = {
    archived: true,
    manualCreateAudit: true,
    memberships: 0,
    careerSeasons: 0,
    sourceLinks: 0,
  };

  assert.equal(isPolicyEligible(eligible), true);
  assert.equal(isPolicyEligible({ ...eligible, archived: false }), false);
  assert.equal(isPolicyEligible({ ...eligible, manualCreateAudit: false }), false);
  assert.equal(isPolicyEligible({ ...eligible, memberships: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, careerSeasons: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, sourceLinks: 1 }), false);
}

function isPolicyEligible(input: {
  archived: boolean;
  manualCreateAudit: boolean;
  memberships: number;
  careerSeasons: number;
  sourceLinks: number;
}) {
  return (
    input.archived &&
    input.manualCreateAudit &&
    input.memberships === 0 &&
    input.careerSeasons === 0 &&
    input.sourceLinks === 0
  );
}
