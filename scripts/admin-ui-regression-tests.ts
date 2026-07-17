import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const headerSource = readFileSync("components/site-header.tsx", "utf8");
const imageUploadSource = readFileSync(
  "components/admin/media/image-upload-field.tsx",
  "utf8",
);

testHeaderResponsiveBreakpoints();
testManufacturerMediaCopyIsNotRiderSpecific();
testAdminCmsListsUseSharedResponsiveTables();
testSharedAdminTableStylesAvoidLargeFixedWidths();
testAdminTablesDoNotUseLegacyFixedWidths();
testClassificationReportingIsReadOnly();

console.log("Admin UI regression tests passed.");

function testHeaderResponsiveBreakpoints() {
  assert.match(
    headerSource,
    /aria-label="Primary navigation"[\s\S]*?lg:flex/,
    "desktop navigation should appear at the standard Tailwind lg breakpoint",
  );
  assert.match(
    headerSource,
    /aria-label="Open navigation menu"[\s\S]*?lg:hidden/,
    "hamburger should hide at the same standard breakpoint where desktop navigation appears",
  );
  assert.doesNotMatch(
    headerSource,
    /min-\[1180px\]/,
    "header should not use the removed custom desktop breakpoint",
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

function testSharedAdminTableStylesAvoidLargeFixedWidths() {
  const tableStyleSource = readFileSync("components/admin/admin-table-styles.ts", "utf8");

  assert.doesNotMatch(
    tableStyleSource,
    /min-w-\[[0-9]+px\]/,
    "shared admin tables should not rely on large fixed min-width values",
  );
  assert.match(
    tableStyleSource,
    /table-fixed/,
    "shared admin tables should use fixed layout so columns adapt inside the card",
  );
  assert.match(
    tableStyleSource,
    /break-words/,
    "shared admin table cells should wrap long content instead of forcing overflow",
  );
  assert.match(
    tableStyleSource,
    /whitespace-nowrap/,
    "shared admin table action cells should remain no-wrap",
  );
}

function testAdminTablesDoNotUseLegacyFixedWidths() {
  for (const file of findTsxFiles("app/admin")) {
    const source = readFileSync(file, "utf8");

    assert.doesNotMatch(
      source,
      /<table className="w-full min-w-\[[0-9]+px\] text-left text-sm">/,
      `${file} should not use legacy fixed-width admin tables`,
    );
  }
}

function testClassificationReportingIsReadOnly() {
  const badgeSource = readFileSync("components/admin/classification-badge.tsx", "utf8");
  const panelSource = readFileSync("components/admin/classification-panel.tsx", "utf8");
  const helperSource = readFileSync("lib/data-quality/record-classification.ts", "utf8");
  const reportingPages = [
    "app/admin/results/page.tsx",
    "app/admin/stage-results/page.tsx",
    "app/admin/result-point-components/page.tsx",
    "app/admin/events/[id]/page.tsx",
    "app/admin/riders/[id]/page.tsx",
    "app/admin/results/[id]/page.tsx",
    "app/admin/stage-results/[id]/page.tsx",
    "app/admin/result-point-components/[id]/page.tsx",
  ];

  for (const state of [
    "VERIFIED_OFFICIAL",
    "SOURCE_MANAGED_UNVERIFIED",
    "AUDITED_MANUAL",
    "MANUAL_PLACEHOLDER",
    "DEMO",
    "SEED",
    "VALIDATION",
    "UNKNOWN",
    "CONFLICTING",
    "ARCHIVED_HISTORY",
    "UNCLASSIFIED",
  ]) {
    assert.match(badgeSource, new RegExp(state));
  }
  assert.match(panelSource, /No evidence attached/);
  assert.match(panelSource, /Classification history/);
  assert.match(panelSource, /proposeRecordClassificationChange/);
  assert.doesNotMatch(panelSource, /recordClassification\.(create|update|delete|upsert)/);

  for (const file of reportingPages) {
    const source = readFileSync(file, "utf8");
    assert.match(
      source,
      /ClassificationBadge|ClassificationPanel|ClassificationSummaryStrip/,
      `${file} should expose classification state in the admin UI`,
    );
  }

  assert.doesNotMatch(
    helperSource,
    /recordClassification\.(create|update|delete|upsert)/,
    "classification reporting helpers must remain read-only",
  );
}

function findTsxFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...findTsxFiles(path));
    } else if (path.endsWith(".tsx")) {
      files.push(path);
    }
  }

  return files;
}
