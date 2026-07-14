import assert from "node:assert/strict";
import {
  canManageRiders,
  canPermanentlyDeleteRiders,
  normalizeRiderSlug,
  validateRiderInput,
} from "@/lib/admin/rider-cms";
import {
  getAdminPagination,
  getAdminTotalPages,
  parseAdminPage,
} from "@/lib/admin/platform";
import {
  adminImageUploadConfig,
  extensionForImageType,
  getAdminImageUploadErrorMessage,
  validateAdminImageUpload,
} from "@/lib/admin/media-upload";

testPermissions();
testSlugGeneration();
testValidation();
testImageUploadValidation();
testPaginationHelpers();
testDeleteEligibilityPolicyModel();

console.log("Admin riders CMS tests passed.");

function testPermissions() {
  assert.equal(canManageRiders("owner"), true);
  assert.equal(canManageRiders("admin"), true);
  assert.equal(canManageRiders("reviewer"), false);
  assert.equal(canPermanentlyDeleteRiders("owner"), true);
  assert.equal(canPermanentlyDeleteRiders("admin"), false);
}

function testSlugGeneration() {
  assert.equal(normalizeRiderSlug("Manuel Lettenbichler"), "manuel-lettenbichler");
  assert.equal(normalizeRiderSlug("  Billy Bolt #57  "), "billy-bolt-57");
}

function testValidation() {
  const valid = {
    firstName: "Manuel",
    lastName: "Lettenbichler",
    slug: "manuel-lettenbichler",
    birthDate: new Date("1998-03-01T00:00:00.000Z"),
    officialUrl: "https://example.com/rider",
    profileImageUrl: "https://example.com/rider.jpg",
    visibility: "PUBLIC" as const,
  };

  assert.equal(validateRiderInput(valid), null);
  assert.equal(validateRiderInput({ ...valid, firstName: "" }), "first-name-required");
  assert.equal(validateRiderInput({ ...valid, lastName: "" }), "last-name-required");
  assert.equal(validateRiderInput({ ...valid, slug: "" }), "slug-required");
  assert.equal(
    validateRiderInput({ ...valid, officialUrl: "javascript:alert(1)" }),
    "invalid-official-url",
  );
  assert.equal(
    validateRiderInput({ ...valid, profileImageUrl: "ftp://example.com/x.jpg" }),
    "invalid-profile-image-url",
  );
}

function testImageUploadValidation() {
  assert.equal(validateAdminImageUpload({ size: 120_000, type: "image/jpeg" }), null);
  assert.equal(validateAdminImageUpload({ size: 0, type: "image/jpeg" }), "missing-file");
  assert.equal(
    validateAdminImageUpload({
      size: adminImageUploadConfig.maxBytes + 1,
      type: "image/jpeg",
    }),
    "file-too-large",
  );
  assert.equal(
    validateAdminImageUpload({ size: 120_000, type: "image/gif" }),
    "unsupported-file-type",
  );
  assert.equal(extensionForImageType("image/webp"), "webp");
  assert.match(getAdminImageUploadErrorMessage("file-too-large"), /5 MB/);
}

function testPaginationHelpers() {
  assert.equal(parseAdminPage("3"), 3);
  assert.equal(parseAdminPage("-1"), 1);
  assert.deepEqual(getAdminPagination({ page: 2, pageSize: 10 }), {
    page: 2,
    pageSize: 10,
    skip: 10,
  });
  assert.equal(getAdminTotalPages(25, 10), 3);
}

function testDeleteEligibilityPolicyModel() {
  const eligible = {
    archived: true,
    manualCreateAudit: true,
    results: 0,
    stageResults: 0,
    standings: 0,
    careerSeasons: 0,
    teamMemberships: 0,
    sourceLinks: 0,
  };

  assert.equal(isPolicyEligible(eligible), true);
  assert.equal(isPolicyEligible({ ...eligible, archived: false }), false);
  assert.equal(isPolicyEligible({ ...eligible, results: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, standings: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, teamMemberships: 1 }), false);
  assert.equal(isPolicyEligible({ ...eligible, manualCreateAudit: false }), false);
}

function isPolicyEligible(input: {
  archived: boolean;
  manualCreateAudit: boolean;
  results: number;
  stageResults: number;
  standings: number;
  careerSeasons: number;
  teamMemberships: number;
  sourceLinks: number;
}) {
  return (
    input.archived &&
    input.manualCreateAudit &&
    input.results === 0 &&
    input.stageResults === 0 &&
    input.standings === 0 &&
    input.careerSeasons === 0 &&
    input.teamMemberships === 0 &&
    input.sourceLinks === 0
  );
}
