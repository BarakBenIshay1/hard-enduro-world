import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const headerSource = readFileSync("components/site-header.tsx", "utf8");
const imageUploadSource = readFileSync(
  "components/admin/media/image-upload-field.tsx",
  "utf8",
);

testHeaderResponsiveBreakpoints();
testManufacturerMediaCopyIsNotRiderSpecific();
testAdminCmsListsUseSharedResponsiveTables();

console.log("Admin UI regression tests passed.");

function testHeaderResponsiveBreakpoints() {
  assert.match(
    headerSource,
    /aria-label="Primary navigation"[\s\S]*?min-\[1180px\]:flex/,
    "desktop navigation should appear at the shared desktop breakpoint",
  );
  assert.match(
    headerSource,
    /aria-label="Open navigation menu"[\s\S]*?min-\[1180px\]:hidden/,
    "hamburger should hide at the same breakpoint where desktop navigation appears",
  );
}

function testManufacturerMediaCopyIsNotRiderSpecific() {
  assert.doesNotMatch(
    imageUploadSource,
    /Save the rider to keep this profile image/,
    "shared image uploader must not hardcode rider-specific upload copy",
  );

  const manufacturerDetailSource = readFileSync(
    "app/admin/manufacturers/[id]/page.tsx",
    "utf8",
  );
  const manufacturerNewSource = readFileSync(
    "app/admin/manufacturers/new/page.tsx",
    "utf8",
  );

  for (const source of [manufacturerDetailSource, manufacturerNewSource]) {
    assert.match(source, /label="Manufacturer Logo"/);
    assert.match(source, /entityLabel="manufacturer"/);
    assert.match(source, /assetDescription="manufacturer logo"/);
    assert.doesNotMatch(source, /Profile Image|Save Rider|Save the rider/);
  }
}

function testAdminCmsListsUseSharedResponsiveTables() {
  const listPages = [
    "app/admin/events/page.tsx",
    "app/admin/riders/page.tsx",
    "app/admin/teams/page.tsx",
    "app/admin/manufacturers/page.tsx",
  ];

  for (const file of listPages) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /adminTableCardClass/, `${file} should use shared table card`);
    assert.match(
      source,
      /adminTableScrollClass/,
      `${file} should use shared table scroll`,
    );
    assert.match(
      source,
      /adminTableActionCellClass/,
      `${file} should keep actions in a stable no-wrap column`,
    );
    assert.doesNotMatch(
      source,
      /<table className="w-full min-w-\[[0-9]+px\] text-left text-sm">/,
      `${file} should not use one-off fixed table sizing`,
    );
  }
}
